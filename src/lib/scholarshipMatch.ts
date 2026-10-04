/**
 * Scholarship matching — which of the six programmes a learner's REAL level can
 * reach, and how far the language is from being the thing that stops them.
 *
 * WHY A PURE MODULE
 *
 * Same reason as dashboardProgress.ts: every rule here is a claim about someone
 * else's money and about how long a learner must study, so it has to be
 * testable without a browser, a session or a database. The caller supplies the
 * level that the placement test already wrote (`profiles.course_level_key`) and
 * gets a decision back. Nothing is fetched, nothing is guessed.
 *
 * THE HONEST PART, WHICH IS MOST OF THE DESIGN
 *
 * The obvious build is "months until your Korean is good enough to apply". That
 * build is wrong for five of the six programmes, because most of them do not
 * require Korean at application at all:
 *
 *   - GKS (undergraduate and graduate) requires NO TOPIK at application and
 *     includes a full year of Korean language training inside the award. The
 *     real gates are age (25 / 40), an 80% average and the documents.
 *   - KAIST teaches in English.
 *   - KOICA runs in English and needs a government nomination; whether Egypt is
 *     on KOICA's annual country list could not be confirmed from KOICA's own
 *     pages, so it is stated as a caveat rather than assumed.
 *   - GKS Exchange sets the language requirement with the host university.
 *   - The Korea Foundation language fellowship is the ONE programme that asks
 *     for Korean at application ("basic-level Korean"): for a beginner that
 *     gap is real, and it is the only place this module returns a non-zero
 *     `monthsToLanguage`.
 *
 * So the module answers two separate questions and never blends them:
 *   1. How far is the language from the application bar?  -> monthsToLanguage
 *   2. What else stands in the way?                       -> blockers[]
 *
 * MONTHS COME FROM levels.ts, NOT FROM THIS FILE
 *
 * A Klovers level is a number of 60-minute classes: Hangul is 4 and every
 * rung of the ladder is 24 (`LEVELS` in src/constants/levels.ts, asserted by
 * `validateLevels`). The published pace is one class a week and a 24-class
 * bundle is sold as six months, so four classes are one month and this module
 * divides by four rather than hardcoding six. Change the class count in
 * levels.ts and the months move with it.
 *
 * WHAT THIS MODULE MUST NEVER DO: equate a Klovers level with a TOPIK grade.
 * `validateLevels` throws on that claim in the level copy, and the same rule
 * applies here — a level PREPARES a learner toward a band, it is not one.
 */

import { LEVELS, getLevelByKey, normalizeLevel } from "@/constants/levels";
import { KOREA_SCHOLARSHIPS } from "@/constants/koreaScholarships";

/** Classes in one month at the published pace: 24 classes = 6 months. */
const CLASSES_PER_MONTH = 4;

export type MatchStatus = "ready" | "needs" | "not_for_you";
/** What the person holds or is enrolled in, which several rules turn on. */
export type DegreeIntent = "school" | "bachelor" | "master" | "enrolled";

export interface MatchInput {
  /** `profiles.course_level_key`, or the level a fresh placement test awarded. */
  levelKey: string | null | undefined;
  degree: DegreeIntent;
  /** Optional: GKS has an upper age limit, and it is per track. */
  age?: number | null;
}

export interface MatchRow {
  /** Matches an id in KOREA_SCHOLARSHIPS, so the card and the page agree. */
  id: string;
  status: MatchStatus;
  /**
   * Whole months of Klovers study until the level this programme asks for AT
   * APPLICATION. 0 when it asks for no Korean (see the header: that is most of
   * them). `null` when there is no level to measure from yet.
   */
  monthsToLanguage: number | null;
  /** The level this programme asks for at application, or null for "none". */
  targetLevelKey: string | null;
  /** Why that number is what it is — one line, so the figure is not bare. */
  languageReason: { ar: string; en: string };
  /**
   * Every line the card prints, in the order it should print them: what
   * disqualifies, then what to obtain, then the rules every applicant faces.
   * What drives `status` is only the first two groups.
   */
  blockers: { ar: string[]; en: string[] };
}

/** Position on the ladder: Hangul is 0, Level 1 is 1 … Level 6 is 6. */
function ladderIndex(levelKey: string): number {
  const level = getLevelByKey(levelKey);
  return level ? LEVELS.indexOf(level) : -1;
}

/**
 * Whole months of study to move from one level to another, at the published
 * pace. Counts the levels still to be COMPLETED, so moving from Level 1 to
 * Level 3 is two levels (12 months), not one.
 *
 * Returns 0 when the learner is already at or past the target, and null when
 * either end is unknown — an unknown level is not "0 months", it is "we do not
 * know yet", and the caller shows the placement test instead of a figure.
 */
export function monthsBetween(fromLevelKey: string | null | undefined, toLevelKey: string): number | null {
  const from = normalizeLevel(String(fromLevelKey ?? ""));
  const to = normalizeLevel(toLevelKey);
  const fromIdx = ladderIndex(from);
  const toIdx = ladderIndex(to);
  if (fromIdx < 0 || toIdx < 0) return null;
  if (toIdx <= fromIdx) return 0;

  let classes = 0;
  for (let i = fromIdx + 1; i <= toIdx; i += 1) classes += LEVELS[i].sessions;
  return Math.round(classes / CLASSES_PER_MONTH);
}

/**
 * The language bar at application, per programme, and the sentence that
 * explains it. `null` target = this programme asks for no Korean to apply.
 *
 * The note is not decoration: "0 months" without it reads as a bug or as a
 * promise, and the reason it is zero is the most useful thing on the card.
 */
const APPLICATION_LANGUAGE: Record<string, { targetLevelKey: string | null; reason: { ar: string; en: string } }> = {
  "gks-undergraduate": {
    targetLevelKey: null,
    reason: {
      ar: "لا يُطلب أي مستوى في TOPIK عند التقديم، والمنحة نفسها تشمل سنة كاملة لتدريس اللغة الكورية.",
      en: "No TOPIK level is required to apply, and the award itself includes a full year of Korean language training.",
    },
  },
  "gks-graduate": {
    targetLevelKey: null,
    reason: {
      ar: "لا يُطلب TOPIK عند التقديم، والمنحة تشمل سنة لغة كورية. ومسار «الشبكة العالمية» يُدرَّس بالإنجليزية.",
      en: "No TOPIK is required to apply and the award includes a Korean language year. The Global Network track is taught in English.",
    },
  },
  kaist: {
    targetLevelKey: null,
    reason: {
      ar: "الدراسة والتواصل بالإنجليزية في هذه الجامعة، ولا يُشترط TOPIK.",
      en: "Instruction and communication at this university are in English, and no TOPIK level is required.",
    },
  },
  "kf-language": {
    // The only programme on the list that asks for Korean at application.
    targetLevelKey: "l1",
    reason: {
      ar: "هذه الزمالة تطلب فهم الكورية الأساسية والتحدث بها عند التقديم — وهي المنحة الوحيدة في القائمة التي تطلب كورية مسبقًا.",
      en: "This fellowship asks applicants to understand and speak basic Korean — the only programme on this list that requires Korean up front.",
    },
  },
  koica: {
    targetLevelKey: null,
    reason: {
      ar: "الإنجليزية شرط التقديم والدراسة، وتُضاف دروس في اللغة الكورية، ولا يُشترط TOPIK.",
      en: "English is required to apply and to study; Korean classes are added, and no TOPIK level is required.",
    },
  },
  "gks-exchange": {
    targetLevelKey: null,
    reason: {
      ar: "لا يُعلن شرط لغوي في صفحة البرنامج، ويُحدَّد مع الجامعة الكورية المضيفة.",
      en: "No language requirement is published on the programme page; it is set with the Korean host university.",
    },
  },
};

/** Which degree each programme is open to, as the funding body states it. */
const DEGREES: Record<string, DegreeIntent[]> = {
  // High-school leavers only: holding a bachelor's disqualifies the applicant.
  "gks-undergraduate": ["school"],
  // A COMPLETED bachelor's (or master's for the doctoral track) is required.
  "gks-graduate": ["bachelor", "master"],
  kaist: ["school"],
  "kf-language": ["enrolled", "bachelor", "master"],
  koica: ["bachelor", "master"],
  "gks-exchange": ["enrolled"],
};

const AGE_LIMIT: Record<string, number> = {
  "gks-undergraduate": 25,
  "gks-graduate": 40,
};

/**
 * When the stage does not fit, say what the programme actually wants. The first
 * version of this shared one generic sentence between all six and got two of
 * them backwards — a graduate applying to the undergraduate GKS was told "this
 * programme is for a different stage than the one you have finished", which is
 * true of nothing. Each programme names its own bar now.
 */
const STAGE_REQUIREMENT: Record<string, { ar: string; en: string }> = {
  "gks-undergraduate": {
    ar: "هذا المسار لطلاب الثانوية: من يحمل شهادة جامعية غير مؤهل له.",
    en: "This track is for high-school leavers: holding a university degree makes an applicant ineligible.",
  },
  "gks-graduate": {
    ar: "هذا المسار يحتاج شهادة بكالوريوس مكتملة، أو ماجستير لمسار الدكتوراه.",
    en: "This track needs a completed bachelor's degree, or a master's for the doctoral path.",
  },
  kaist: {
    ar: "المنحة لطلاب الثانوية المتقدمين لدرجة البكالوريوس في العلوم والهندسة.",
    en: "The scholarship is for high-school leavers applying to an undergraduate science or engineering degree.",
  },
  koica: {
    ar: "البرنامج للموظفين الحكوميين من حملة البكالوريوس.",
    en: "The programme is for government officials who hold a bachelor's degree.",
  },
  "kf-language": {
    ar: "الزمالة لطلاب أو باحثي الدراسات الكورية أو اللغة الكورية.",
    en: "The fellowship is for students or researchers in Korean studies or the Korean language.",
  },
  "gks-exchange": {
    ar: "التبادل للطلاب المسجّلين حاليًا في جامعة شريكة.",
    en: "The exchange is for students currently enrolled at a partner university.",
  },
};

/**
 * Two different kinds of line, and the distinction decides the status:
 *
 *   - `obligations` — what every applicant in this programme must produce or
 *     face (a transcript, a file, a deadline, a competitive admission). Real,
 *     worth printing, but they do not make the programme "not yet reachable":
 *     they are the programme's rules, not the learner's gap.
 *   - `conditions` — something the learner must OBTAIN or already be, and may
 *     not have: a government nomination, a partner-university agreement, a
 *     Korean-studies enrolment. These are what make the answer "not yet".
 *
 * Keeping them apart is what lets `ready` mean something. While both lived in
 * one list, every programme carried at least one line and the status was
 * permanently `needs`, which is a status that tells nobody anything.
 */
function blockersFor(id: string, input: MatchInput): {
  obligations: { ar: string[]; en: string[] };
  conditions: { ar: string[]; en: string[] };
} {
  const obligations = { ar: [] as string[], en: [] as string[] };
  const conditions = { ar: [] as string[], en: [] as string[] };

  const obligation = (a: string, e: string) => {
    obligations.ar.push(a);
    obligations.en.push(e);
  };
  const condition = (a: string, e: string) => {
    conditions.ar.push(a);
    conditions.en.push(e);
  };

  if (id === "gks-undergraduate" || id === "gks-graduate") {
    obligation(
      "معدل ٨٠٪ أو ضمن أفضل ٢٠٪ من الدفعة — إثباته من كشف الدرجات.",
      "An 80% average or a top-20% class rank, evidenced by the transcript.",
    );
    obligation(
      "الملف كامل: شهادات مصدّقة، خطابات توصية، خطة دراسة، وترجمة معتمدة.",
      "A complete file: apostilled certificates, recommendation letters, a study plan and certified translations.",
    );
    obligation(
      "مسار السفارة ومسار الجامعة بمواعيد مختلفة، ونافذة السفارة هي الأقصر.",
      "The embassy track and the university track run on different deadlines, and the embassy window is the shorter one.",
    );
  }

  if (id === "koica") {
    condition(
      "البرنامج للموظفين الحكوميين، والترشيح الرسمي من جهتك إلزامي — التقديم الفردي غير مقبول.",
      "The programme is for government officials, and official nomination by your employer is mandatory; a personal application is not accepted.",
    );
    obligation(
      "قائمة الدول المؤهلة تُعلن سنويًا من KOICA، ولم تكن مصر مؤكدة على صفحاتها — تُراجَع من مكتب KOICA أو السفارة في القاهرة.",
      "KOICA re-issues the eligible-country list every year, and Egypt was not confirmed on its pages — check with the KOICA office or the embassy in Cairo.",
    );
  }

  if (id === "kf-language") {
    condition(
      "مطلوب أن يكون المتقدم طالبًا أو باحثًا في الدراسات الكورية أو اللغة الكورية.",
      "The applicant must be a student or researcher in Korean studies or the Korean language.",
    );
    condition(
      "زمالة لغة وليست درجة علمية: من يخطط للالتحاق ببرنامج درجة في كوريا غير مؤهل لها.",
      "A language fellowship, not a degree: anyone planning to enrol in a degree programme in Korea is not eligible.",
    );
  }

  if (id === "gks-exchange") {
    condition(
      "جامعتك الأم يجب أن يكون لها اتفاق مع إحدى الجامعات الكورية المعتمدة، وهي التي ترشّحك — لا تقديم مباشر.",
      "Your home university must hold an agreement with a designated Korean university, and it nominates you — there is no direct application.",
    );
  }

  if (id === "kaist") {
    obligation(
      "قبول تنافسي في تخصصات العلوم والهندسة، والقبول هو الذي يمنح المنحة تلقائيًا.",
      "Competitive admission in science and engineering; admission is what grants the scholarship automatically.",
    );
  }

  return { obligations, conditions };
}

/**
 * The whole decision, one row per programme, in the order the site lists them.
 *
 * A note on `ready`: it means "nothing in this programme's own rules is
 * stopping you at this level" — not "you will be accepted". Every programme
 * still needs a file, and two of them are competitive. The card says so.
 */
export function matchScholarships(input: MatchInput): MatchRow[] {
  return KOREA_SCHOLARSHIPS.map((programme) => {
    const id = programme.id;
    const rule = APPLICATION_LANGUAGE[id];
    if (!rule) {
      // A new programme with no language rule must fail loudly here rather than
      // silently claim "no Korean required".
      throw new Error(`scholarshipMatch: no application-language rule for "${id}"`);
    }

    const allowed = DEGREES[id];
    if (!allowed) throw new Error(`scholarshipMatch: no degree rule for "${id}"`);

    const monthsToLanguage =
      rule.targetLevelKey === null ? 0 : monthsBetween(input.levelKey, rule.targetLevelKey);

    const hardBlockers: { ar: string[]; en: string[] } = { ar: [], en: [] };
    if (!allowed.includes(input.degree)) {
      const stage = STAGE_REQUIREMENT[id];
      if (!stage) throw new Error(`scholarshipMatch: no stage wording for "${id}"`);
      hardBlockers.ar.push(stage.ar);
      hardBlockers.en.push(stage.en);
    }

    const limit = AGE_LIMIT[id];
    if (limit && input.age != null && input.age >= limit) {
      hardBlockers.ar.push(`السن المطلوب أقل من ${limit} سنة، وأنت خارج هذا الحد.`);
      hardBlockers.en.push(`The age limit is under ${limit}, and you are past it.`);
    }

    const { obligations, conditions } = blockersFor(id, input);
    // Order matters on the card: what disqualifies you, then what you must go
    // and obtain, then the rules every applicant faces.
    const blockers = {
      ar: [...hardBlockers.ar, ...conditions.ar, ...obligations.ar],
      en: [...hardBlockers.en, ...conditions.en, ...obligations.en],
    };

    const unknownLevel = monthsToLanguage === null;
    const status: MatchStatus =
      hardBlockers.ar.length > 0
        ? "not_for_you"
        : unknownLevel || (monthsToLanguage ?? 0) > 0 || conditions.ar.length > 0
          ? "needs"
          : "ready";

    return {
      id,
      status,
      monthsToLanguage,
      targetLevelKey: rule.targetLevelKey,
      languageReason: rule.reason,
      blockers,
    };
  });
}

/** How many programmes are open to this person, for the locked box's count. */
export function countReachable(rows: MatchRow[]): number {
  return rows.filter((r) => r.status !== "not_for_you").length;
}
