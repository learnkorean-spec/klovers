import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { formatTime } from '@/lib/admin-utils';

/**
 * The same three keys AddTrialClassDialog invalidates after it inserts a slot.
 * Approving a proposal inserts a slot too, so anything less would leave the new
 * session missing from the schedule table until the next manual refresh.
 */
const KEYS = {
  upcomingSlots: ['trial-admin', 'upcoming-slots'] as const,
  slotsRaw: ['trial-admin', 'slots-raw'] as const,
  suggestions: ['trial-admin', 'suggestions'] as const,
  proposals: ['trial-admin', 'slot-proposals'] as const,
};

/**
 * Every sentence this panel can say, in both languages.
 *
 * The admin screens are not wired to LanguageContext — they are one person's
 * screens and they render English — but the sentences that matter here are the
 * ones that appear when something has gone wrong and a decision has to be made
 * about a class, so each is written twice and both are shown.
 */
interface Bilingual {
  en: string;
  ar: string;
}

interface Proposal {
  id: string;
  class_language: string;
  trial_date: string;
  start_time: string;
  day_of_week: number;
  duration_min: number;
  timezone: string;
  capacity: number;
  min_to_run: number | null;
  reason: string;
  status: string;
  created_at: string;
}

/**
 * Turn what the RPC raised into something readable.
 *
 * Postgres prefixes a raised message with "…: " by the time PostgREST hands it
 * over, so these are matched anywhere in the string rather than at the start.
 * An unrecognised message is shown exactly as it arrived: a raw Postgres error
 * tells whoever reads it what actually happened, and a friendly apology in its
 * place tells them nothing at all.
 */
function explainError(raw: string): Bilingual {
  const conflict = raw.match(/trial_slot_conflict:\s*(.+)/);
  if (conflict) {
    const detail = conflict[1].trim();
    return {
      en: `This time now clashes with something already booked: ${detail}. Nothing was opened. Decline this suggestion and the next hourly check will propose a different date.`,
      ar: `الميعاد ده بقى متعارض مع حاجة محجوزة خلاص: ${detail}. مفيش حصة اتفتحت. ارفضي الاقتراح ده والفحص اللي بيجري كل ساعة هيقترح تاريخ تاني.`,
    };
  }
  if (raw.includes('meeting_url_required')) {
    return {
      en: 'There is no permanent trial room for this day and language. Nothing was opened. Add one to trial_rooms first.',
      ar: 'مفيش غرفة ثابتة لليوم واللغة دول. مفيش حصة اتفتحت. لازم تتضاف غرفة في trial_rooms الأول.',
    };
  }
  if (raw.includes('proposal_already_decided')) {
    return {
      en: 'This suggestion was already approved or declined. Refresh to see where it ended up.',
      ar: 'الاقتراح ده اتقبل أو اترفض قبل كده. اعملي تحديث للصفحة عشان تشوفي هو خلص على إيه.',
    };
  }
  if (raw.includes('proposal_not_found')) {
    return {
      en: 'This suggestion is no longer waiting for a decision. Refresh the page.',
      ar: 'الاقتراح ده مبقاش مستني قرار. اعملي تحديث للصفحة.',
    };
  }
  if (raw.includes('not authorised')) {
    return {
      en: 'Your account is not an admin, so it cannot open a trial session.',
      ar: 'حسابك مش أدمن، فمش هيقدر يفتح حصة تجريبية.',
    };
  }
  return { en: raw, ar: raw };
}

/** English on top, Arabic under it, each reading in its own direction. */
function BilingualText({ text, tone = 'muted' }: { text: Bilingual; tone?: 'muted' | 'destructive' }) {
  const colour = tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground';
  return (
    <div className={`space-y-1 text-xs ${colour}`}>
      <p dir="ltr">{text.en}</p>
      <p lang="ar" dir="rtl" className="text-right">{text.ar}</p>
    </div>
  );
}

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** trial_slots stores "HH:MM" but a row read back may carry seconds. */
const formatStart = (t: string) => formatTime((t ?? '').slice(0, 5));

/**
 * Suggestions waiting for the owner to open, or not.
 *
 * The hourly job writes a row here and mails her; nothing it does creates a
 * class. This panel is the only place in the system where a proposal turns into
 * a real trial session, which is the whole point — the email is a notification
 * and not a button, so a forwarded message or a link scanner cannot open a
 * class on her behalf.
 *
 * The Meet link is no longer typed here: the database gives every session the
 * permanent room for its weekday and language (public.trial_rooms).
 */
export default function TrialSlotProposals() {
  const qc = useQueryClient();
  const [approving, setApproving] = useState<Proposal | null>(null);
  const [dialogError, setDialogError] = useState<Bilingual | null>(null);
  const [listError, setListError] = useState<Bilingual | null>(null);

  // The table and the two functions arrive with a migration that may not have
  // been applied yet, so the generated types do not know them. Casting at the
  // call site is what the rest of the codebase does rather than hand-editing
  // src/integrations/supabase/types.ts, which is regenerated.
  const proposalsQ = useQuery({
    queryKey: KEYS.proposals,
    queryFn: async (): Promise<Proposal[]> => {
      const { data, error } = await (supabase as any)
        .from('trial_slot_proposals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Proposal[];
    },
  });

  const refreshTrialViews = () => {
    qc.invalidateQueries({ queryKey: KEYS.proposals });
    qc.invalidateQueries({ queryKey: KEYS.upcomingSlots });
    qc.invalidateQueries({ queryKey: KEYS.slotsRaw });
    qc.invalidateQueries({ queryKey: KEYS.suggestions });
  };

  const approve = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await (supabase as any).rpc('fn_approve_trial_slot_proposal', {
        p_id: id,
        p_meeting_url: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Trial session opened · اتفتحت الحصة التجريبية',
        description: 'It is on the public booking page now, in its permanent room.',
      });
      setApproving(null);
      setDialogError(null);
      refreshTrialViews();
    },
    onError: (e: any) => setDialogError(explainError(e?.message ?? String(e))),
  });

  const decline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc('fn_decline_trial_slot_proposal', { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Suggestion declined · اترفض الاقتراح',
        description: 'The next hourly check may suggest a different date.',
      });
      setListError(null);
      refreshTrialViews();
    },
    onError: (e: any) => setListError(explainError(e?.message ?? String(e))),
  });

  const proposals = proposalsQ.data ?? [];

  // Nothing pending is the normal state for almost the whole year, and a card
  // saying so would sit at the top of this screen every day earning nothing. A
  // failed query is silent here for the same reason: the panel is an extra, and
  // it must not put an error banner above the bookings table on a deployment
  // where the migration has not run yet.
  if (proposals.length === 0) return null;

  return (
    <>
      <Card className="border-primary/40">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" />
            Suggested new trial sessions ({proposals.length})
          </CardTitle>
          <BilingualText
            text={{
              en: 'Every session of these languages is full. Nothing has been opened — a session appears only when you open it here.',
              ar: 'كل الحصص بتاعة اللغات دي كاملة. مفيش حاجة اتفتحت — الحصة مش بتتفتح غير لما تفتحيها من هنا.',
            }}
          />
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {listError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
              <BilingualText text={listError} tone="destructive" />
            </div>
          )}
          {proposals.map((p) => (
            <div key={p.id} className="rounded-md border bg-card px-3 py-3 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-sm font-semibold capitalize text-foreground">{p.class_language}</span>
                <span className="text-sm text-foreground">{formatDate(p.trial_date)}</span>
                <span className="text-sm font-mono text-foreground">
                  {formatStart(p.start_time)} ({p.timezone.replace(/_/g, ' ')})
                </span>
                <span className="text-xs text-muted-foreground">
                  {p.duration_min} min · capacity {p.capacity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{p.reason}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setApproving(p);
                    setDialogError(null);
                  }}
                >
                  Open this session · افتحي الحصة
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={decline.isPending}
                  onClick={() => decline.mutate(p.id)}
                >
                  {decline.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Not now · مش دلوقتي
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        open={!!approving}
        onOpenChange={(o) => {
          if (!o) {
            setApproving(null);
            setDialogError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Open this trial session</DialogTitle>
            <DialogDescription>
              This creates the session and puts it on the public booking page.
            </DialogDescription>
          </DialogHeader>

          {approving && (
            <div className="space-y-4 py-1">
              <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm space-y-0.5">
                <p className="font-medium capitalize text-foreground">{approving.class_language}</p>
                <p className="text-foreground">{formatDate(approving.trial_date)}</p>
                <p className="font-mono text-foreground">
                  {formatStart(approving.start_time)} ({approving.timezone.replace(/_/g, ' ')})
                </p>
                <p className="text-xs text-muted-foreground">
                  {approving.duration_min} min · capacity {approving.capacity}
                </p>
                <p className="text-xs text-muted-foreground">{approving.reason}</p>
              </div>

              <BilingualText
                text={{
                  en: 'The Google Meet link is added for you: the permanent trial room for this day and language.',
                  ar: 'لينك الجوجل ميت بيتحط لوحده: الغرفة الثابتة لليوم واللغة دول.',
                }}
              />

              {dialogError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
                  <BilingualText text={dialogError} tone="destructive" />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setApproving(null);
                setDialogError(null);
              }}
              disabled={approve.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={approve.isPending || !approving}
              onClick={() => approving && approve.mutate({ id: approving.id })}
              className="gap-1.5"
            >
              {approve.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Open the session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
