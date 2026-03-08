// Daily Routine Korean - World/Category structure
export interface DailyRoutineWorld {
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

export const DAILY_ROUTINE_WORLDS: DailyRoutineWorld[] = [
  {
    id: 1,
    key: "morning_routine",
    name: "Morning Routine",
    nameAr: "روتين الصباح",
    emoji: "🌅",
    description: "Wake up, wash, and get ready for the day",
    descriptionAr: "استيقظ واغتسل واستعد ليومك",
    color: "hsl(45 93% 47%)",
    lessonRange: [1, 10],
  },
  {
    id: 2,
    key: "home_life",
    name: "Home Life",
    nameAr: "الحياة المنزلية",
    emoji: "🏠",
    description: "Cooking, eating, cleaning, and laundry",
    descriptionAr: "الطبخ والأكل والتنظيف والغسيل",
    color: "hsl(142 76% 36%)",
    lessonRange: [11, 16],
  },
  {
    id: 3,
    key: "media_leisure",
    name: "Media & Leisure",
    nameAr: "الإعلام والترفيه",
    emoji: "📺",
    description: "Phone, TV, radio, internet, and reading",
    descriptionAr: "الهاتف والتلفزيون والراديو والإنترنت والقراءة",
    color: "hsl(217 91% 60%)",
    lessonRange: [17, 21],
  },
  {
    id: 4,
    key: "body_senses",
    name: "Body & Senses",
    nameAr: "الجسم والحواس",
    emoji: "🧠",
    description: "Sitting, standing, hearing, seeing, tasting, touching, walking",
    descriptionAr: "الجلوس والوقوف والسمع والبصر والتذوق واللمس والمشي",
    color: "hsl(262 83% 58%)",
    lessonRange: [22, 29],
  },
  {
    id: 5,
    key: "life_events",
    name: "Life Events",
    nameAr: "أحداث الحياة",
    emoji: "🎉",
    description: "Marriage, birthday, and moving house",
    descriptionAr: "الزواج وعيد الميلاد والانتقال",
    color: "hsl(340 82% 52%)",
    lessonRange: [30, 32],
  },
];

export function getDailyRoutineWorldForLesson(sortOrder: number): DailyRoutineWorld {
  for (const world of DAILY_ROUTINE_WORLDS) {
    if (sortOrder >= world.lessonRange[0] && sortOrder <= world.lessonRange[1]) {
      return world;
    }
  }
  return DAILY_ROUTINE_WORLDS[0];
}

export function getDailyRoutineWorldProgress(
  world: DailyRoutineWorld,
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
