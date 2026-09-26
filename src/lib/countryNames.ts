/** Arabic names for the countries the site lists, so Arabic pages stay in one language. */
export const COUNTRY_AR: Record<string, string> = {
  Algeria: "الجزائر", Argentina: "الأرجنتين", Australia: "أستراليا", Bahrain: "البحرين", Brazil: "البرازيل",
  Canada: "كندا", China: "الصين", Colombia: "كولومبيا", Egypt: "مصر", France: "فرنسا", Germany: "ألمانيا",
  India: "الهند", Indonesia: "إندونيسيا", Iraq: "العراق", Japan: "اليابان", Jordan: "الأردن", Kuwait: "الكويت",
  Lebanon: "لبنان", Libya: "ليبيا", Malaysia: "ماليزيا", Mexico: "المكسيك", Morocco: "المغرب", Oman: "عُمان",
  Pakistan: "باكستان", Philippines: "الفلبين", Qatar: "قطر", "Saudi Arabia": "السعودية", "South Korea": "كوريا الجنوبية",
  Sudan: "السودان", Syria: "سوريا", Thailand: "تايلاند", Tunisia: "تونس", Turkey: "تركيا", UAE: "الإمارات",
  "United Kingdom": "المملكة المتحدة", "United States": "الولايات المتحدة", Vietnam: "فيتنام", Yemen: "اليمن",
};

export const countryLabel = (country: string, isAr: boolean): string => (isAr ? COUNTRY_AR[country] ?? country : country);
