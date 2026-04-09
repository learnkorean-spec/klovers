// K-Drama Korean - World/Category structure

export interface KDramaWorld {
  id: number;
  key: string;
  name: string;
  nameAr: string;
  emoji: string;
  description: string;
  descriptionAr: string;
  color: string;
  lessonRange: [number, number];
}

export const KDRAMA_WORLDS: KDramaWorld[] = [
  {
    id: 1,
    key: "first_meeting",
    name: "First Meeting",
    nameAr: "اللقاء الأول",
    emoji: "👋",
    description: "Greetings, introductions & small talk from K-Dramas",
    descriptionAr: "التحيات والتعارف والمحادثات القصيرة من الدراما الكورية",
    color: "#D6E8FF",
    lessonRange: [1, 5],
  },
  {
    id: 2,
    key: "romance",
    name: "Romance & Confessions",
    nameAr: "الرومانسية والاعترافات",
    emoji: "💕",
    description: "Love confessions, dating & relationship expressions",
    descriptionAr: "اعترافات الحب والمواعدة وتعبيرات العلاقات",
    color: "#FFD9E6",
    lessonRange: [6, 10],
  },
  {
    id: 3,
    key: "family_drama",
    name: "Family Drama",
    nameAr: "دراما العائلة",
    emoji: "👨‍👩‍👧‍👦",
    description: "Family conflicts, honorifics & generational speech",
    descriptionAr: "صراعات العائلة والتشريفات وأساليب الخطاب بين الأجيال",
    color: "#FFE5CC",
    lessonRange: [11, 15],
  },
  {
    id: 4,
    key: "workplace",
    name: "Office & Workplace",
    nameAr: "المكتب والعمل",
    emoji: "💼",
    description: "Corporate Korean, meetings & office culture",
    descriptionAr: "الكورية في الشركات والاجتماعات وثقافة المكتب",
    color: "#D6E8FF",
    lessonRange: [16, 20],
  },
  {
    id: 5,
    key: "action_thriller",
    name: "Action & Thriller",
    nameAr: "الأكشن والإثارة",
    emoji: "🔥",
    description: "Intense scenes, commands & dramatic expressions",
    descriptionAr: "المشاهد المكثفة والأوامر والتعبيرات الدرامية",
    color: "#FFD9E6",
    lessonRange: [21, 25],
  },
  {
    id: 6,
    key: "food_scenes",
    name: "Food & Eating Scenes",
    nameAr: "مشاهد الطعام",
    emoji: "🍜",
    description: "Restaurant orders, food reactions & dining culture",
    descriptionAr: "طلبات المطاعم وردود فعل الطعام وثقافة تناول الطعام",
    color: "#FFE5CC",
    lessonRange: [26, 30],
  },
];

export function getKDramaWorldForLesson(sortOrder: number): KDramaWorld {
  for (const world of KDRAMA_WORLDS) {
    if (sortOrder >= world.lessonRange[0] && sortOrder <= world.lessonRange[1]) {
      return world;
    }
  }
  return KDRAMA_WORLDS[0];
}

export function getKDramaWorldProgress(
  world: KDramaWorld,
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
