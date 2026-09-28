// 29 Sep 2026 — Phase 3 (spec "ADMIN / TEACHER CONTROL": "inspect why a slot
// is recommended"). Everything else the spec's admin list asks for already
// exists and is live (GroupMatcher: forming groups, member counts, manual
// assign/reject; TeacherAvailabilityManager: weekly availability). The one
// gap is visibility into Phase 1's scoring function — this small, read-only
// panel closes it without duplicating either of those. Deliberately no
// write actions here; SlotManager/matching_slots stay a separate, unused
// track (0 rows) — nothing here depends on it.
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Lightbulb, Users } from "lucide-react";
import { LEVEL_SELECT_OPTIONS } from "@/constants/levels";

interface GroupSuggestion {
  day_of_week: number;
  day_name: string;
  start_time: string;
  score: number;
  reasons: string[];
  existing_demand: number;
}

const RecommendedSlotsPanel = () => {
  const [level, setLevel] = useState(LEVEL_SELECT_OPTIONS[0]?.value || "hangul");
  const [suggestions, setSuggestions] = useState<GroupSuggestion[]>([]);
  const [privateOpenCount, setPrivateOpenCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [{ data: groupData, error: groupErr }, { data: privateData }] = await Promise.all([
        supabase.rpc("fn_suggest_group_slots" as any, { p_level: level, p_count: 3 }),
        supabase.rpc("fn_private_slot_options" as any, { p_limit: 300 }),
      ]);
      if (cancelled) return;
      if (groupErr) console.error("fn_suggest_group_slots failed:", groupErr);
      setSuggestions((groupData as any[]) || []);
      setPrivateOpenCount(((privateData as any[]) || []).length);
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [level]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Recommended Times (why)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Live from the scoring engine (Phase 1) — what a new student would be shown right now, and why.
          Weights: <code>app_settings.slot_scoring_config</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LEVEL_SELECT_OPTIONS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {privateOpenCount !== null && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {privateOpenCount} open private slots (all levels)
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="py-6 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
        ) : suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No candidate times right now — check teacher availability for this level.</p>
        ) : (
          <div className="grid gap-2">
            {suggestions.map((s, i) => (
              <div key={`${s.day_of_week}-${s.start_time}`} className="rounded-lg border px-3 py-2 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    {i === 0 ? "★ " : ""}{s.day_name} {s.start_time}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {s.existing_demand > 0 && (
                      <Badge className="text-xs bg-klovers-green text-charcoal">{s.existing_demand} interested</Badge>
                    )}
                    <Badge variant="outline" className="text-xs">score {s.score}</Badge>
                  </div>
                </div>
                <ul className="text-xs text-muted-foreground list-disc ps-4">
                  {s.reasons.map((r, ri) => <li key={ri}>{r}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendedSlotsPanel;
