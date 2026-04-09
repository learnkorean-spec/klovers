// Grammar Mastery Book — 8 worlds organized by grammar category across TOPIK levels 1–6

export interface GrammarMasteryWorld {
  id: number;
  key: string;
  name: string;
  nameAr: string;
  nameKo: string;
  emoji: string;
  description: string;
  descriptionAr: string;
  color: string;
  lessonRange: [number, number];
  topikLevel: 1 | 2 | 3 | 4 | 5 | 6;
}

export const GRAMMAR_MASTERY_WORLDS: GrammarMasteryWorld[] = [
  {
    id: 1,
    key: "particle_palace",
    name: "Particle Palace",
    nameAr: "قصر الجسيمات",
    nameKo: "조사 궁전",
    emoji: "🏛️",
    description: "Master Korean particles — the glue of every sentence (TOPIK 1/A1)",
    descriptionAr: "أتقن الجسيمات الكورية — لاصق كل جملة (TOPIK 1/A1)",
    color: "#D6E8FF",
    lessonRange: [1, 8],
    topikLevel: 1,
  },
  {
    id: 2,
    key: "verb_village",
    name: "Verb Village",
    nameAr: "قرية الأفعال",
    nameKo: "동사 마을",
    emoji: "🏘️",
    description: "Conjugate verbs in present, past and future — action unlocked (TOPIK 1/A1)",
    descriptionAr: "تصريف الأفعال في المضارع والماضي والمستقبل (TOPIK 1/A1)",
    color: "#CFF7D3",
    lessonRange: [9, 16],
    topikLevel: 1,
  },
  {
    id: 3,
    key: "connector_crossroads",
    name: "Connector Crossroads",
    nameAr: "مفترق الروابط",
    nameKo: "연결어미 교차로",
    emoji: "🔗",
    description: "Link ideas with -아서/어서, -(으)면, -지만 and more (TOPIK 2/A2)",
    descriptionAr: "ربط الأفكار بـ -아서/어서، -(으)면، -지만 والمزيد (TOPIK 2/A2)",
    color: "#FFE5CC",
    lessonRange: [17, 24],
    topikLevel: 2,
  },
  {
    id: 4,
    key: "honorific_heights",
    name: "Honorific Heights",
    nameAr: "قمم التبجيل",
    nameKo: "존댓말 고지",
    emoji: "🎩",
    description: "Navigate formal, polite, and informal speech levels (TOPIK 2–3/A2–B1)",
    descriptionAr: "التنقل بين مستويات الكلام الرسمية والمهذبة وغير الرسمية (TOPIK 2–3/A2–B1)",
    color: "#EFE6FF",
    lessonRange: [25, 32],
    topikLevel: 2,
  },
  {
    id: 5,
    key: "aspect_arena",
    name: "Aspect Arena",
    nameAr: "حلبة الأنماط الفعلية",
    nameKo: "상 표현 경기장",
    emoji: "⚡",
    description: "Passive, causative, progressive and resultative patterns (TOPIK 3/B1)",
    descriptionAr: "أنماط المبني للمجهول والمسبِّب والمستمر والناتج (TOPIK 3/B1)",
    color: "#FFD9E6",
    lessonRange: [33, 40],
    topikLevel: 3,
  },
  {
    id: 6,
    key: "modality_mountain",
    name: "Modality Mountain",
    nameAr: "جبل الأساليب",
    nameKo: "양태 표현 산",
    emoji: "⛰️",
    description: "Express probability, obligation, permission and desire (TOPIK 4/B2)",
    descriptionAr: "التعبير عن الاحتمال والوجوب والإذن والرغبة (TOPIK 4/B2)",
    color: "#D7F7F7",
    lessonRange: [41, 46],
    topikLevel: 4,
  },
  {
    id: 7,
    key: "rhetoric_ridge",
    name: "Rhetoric Ridge",
    nameAr: "حافة البلاغة",
    nameKo: "수사법 능선",
    emoji: "🎭",
    description: "Idiomatic expressions, proverbs and rhetorical structures (TOPIK 5/C1)",
    descriptionAr: "التعبيرات الاصطلاحية والأمثال والتراكيب البلاغية (TOPIK 5/C1)",
    color: "#EFE6FF",
    lessonRange: [47, 52],
    topikLevel: 5,
  },
  {
    id: 8,
    key: "mastery_summit",
    name: "Mastery Summit",
    nameAr: "قمة الإتقان",
    nameKo: "마스터리 정상",
    emoji: "🌟",
    description: "Classical Korean grammar, literary style and near-native nuance (TOPIK 6/C2)",
    descriptionAr: "القواعد الكورية الكلاسيكية والأسلوب الأدبي والدقة شبه الأصلية (TOPIK 6/C2)",
    color: "#DFFFE6",
    lessonRange: [53, 57],
    topikLevel: 6,
  },
];

export function getGrammarMasteryWorldForLesson(sortOrder: number): GrammarMasteryWorld {
  for (const world of GRAMMAR_MASTERY_WORLDS) {
    if (sortOrder >= world.lessonRange[0] && sortOrder <= world.lessonRange[1]) {
      return world;
    }
  }
  return GRAMMAR_MASTERY_WORLDS[0];
}

export function getGrammarMasteryWorldProgress(
  world: GrammarMasteryWorld,
  lessonProgress: Record<number, { chapter_completed: boolean }>,
  lessons: { id: number; sort_order: number }[]
): { completed: number; total: number; percent: number } {
  const worldLessons = lessons.filter(
    (l) => l.sort_order >= world.lessonRange[0] && l.sort_order <= world.lessonRange[1]
  );
  const completed = worldLessons.filter((l) => lessonProgress[l.id]?.chapter_completed).length;
  const total = worldLessons.length;
  return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
}
