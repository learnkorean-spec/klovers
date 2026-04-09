// Picture Vocabulary - World/Category structure
export interface PictureVocabWorld {
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

export const PICTURE_VOCAB_WORLDS: PictureVocabWorld[] = [
  {
    id: 1,
    key: "at_home",
    name: "At Home",
    nameAr: "في البيت",
    emoji: "🏠",
    description: "Bedroom, bathroom, kitchen, living room & clothes",
    descriptionAr: "غرفة النوم، الحمام، المطبخ، غرفة المعيشة والملابس",
    color: "#D6E8FF",
    lessonRange: [1, 5],
  },
  {
    id: 2,
    key: "out_in_city",
    name: "Out in the City",
    nameAr: "في المدينة",
    emoji: "🌆",
    description: "Supermarket, restaurant, café, transport & hospital",
    descriptionAr: "سوبرماركت، مطعم، كافيه، مواصلات ومستشفى",
    color: "#CFF7D3",
    lessonRange: [6, 10],
  },
  {
    id: 3,
    key: "world_around_us",
    name: "World Around Us",
    nameAr: "العالم من حولنا",
    emoji: "🌿",
    description: "Park, weather, body, emotions & celebrations",
    descriptionAr: "الحديقة، الطقس، الجسم، المشاعر والاحتفالات",
    color: "#FFD9E6",
    lessonRange: [11, 15],
  },
];

export function getPictureVocabWorldForLesson(sortOrder: number): PictureVocabWorld {
  for (const world of PICTURE_VOCAB_WORLDS) {
    if (sortOrder >= world.lessonRange[0] && sortOrder <= world.lessonRange[1]) {
      return world;
    }
  }
  return PICTURE_VOCAB_WORLDS[0];
}

export function getPictureVocabWorldProgress(
  world: PictureVocabWorld,
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
