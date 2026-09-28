/**
 * The five stations of the "journey through Korea's time".
 *
 * One source of truth for two consumers: the era pages at /journey/:eraId
 * (EraPage.tsx) and the Discover strip on the blog journey
 * (components/journal/StageBlocks.tsx). Adding a sixth era is one more
 * object here.
 *
 * Content rules, agreed with Re on 2026-09-22:
 *  - Korea was never "a Chinese place". The honest frame is: Han China ruled
 *    part of the north for about four centuries (108 BCE - 313 CE) and Chinese
 *    influence on writing, religion and ideas was deep, while Koreans kept
 *    their language, customs and states. Keep that wording if you edit it.
 *  - Dates that come from legend (Dangun, 2333 BCE) are labelled as legend.
 *  - Related articles are ONLY posts already verified live in `blog_posts`
 *    (the same set CultureHeritageSection.tsx uses). Do not add a slug here
 *    that has not been checked against the database in both EN and AR.
 *  - Images are files already used elsewhere on the site, with one exception:
 *    "before-korea" uses an original illustration
 *    (/assets/eras/gojoseon.svg: Mount Paektu at dawn and a dolmen), because
 *    its local candidate (dangun-myth.jpg) is unvetted, see the 18 Sep
 *    hero/culture handover.
 *
 * Sources for the facts: Wikipedia pages Gojoseon, Four Commanderies of Han,
 * Three Kingdoms of Korea, Silla, Joseon, Hanok, Korean wave (opened
 * 2026-09-22). The Parasite Oscars year, Hangul Day date and the shoes-off
 * custom are general knowledge, not from those pages.
 */

export type EraId =
  | "before-korea"
  | "ancient-korea"
  | "joseon"
  | "traditional-life"
  | "modern-korea";

export interface EraWord {
  ko: string;
  /** Latin romanization, shown in English mode. */
  rom: string;
  /** Arabic-script transliteration, shown in Arabic mode. */
  romAr: string;
  en: string;
  ar: string;
}

export interface EraMilestone {
  topEn: string;
  topAr: string;
  textEn: string;
  textAr: string;
}

export interface EraPost {
  image: string;
  slugEn: string;
  slugAr: string;
  titleEn: string;
  titleAr: string;
  blurbEn: string;
  blurbAr: string;
  altEn: string;
  altAr: string;
}

export interface Era {
  id: EraId;
  /** Local image already used on the site. Omit for a typographic tile. */
  image?: string;
  /** Shown big on the tile when there is no image. */
  glyph?: string;
  altEn: string;
  altAr: string;
  titleEn: string;
  titleAr: string;
  datesEn: string;
  datesAr: string;
  lineEn: string;
  lineAr: string;
  introEn: string;
  introAr: string;
  metaDescEn: string;
  metaDescAr: string;
  milestones: EraMilestone[];
  storyEn: string[];
  storyAr: string[];
  words: EraWord[];
  posts: EraPost[];
}

const POSTS: Record<
  "hangul" | "honorifics" | "hanbok" | "holidays" | "wedding" | "zodiac" | "kpop" | "streetFood",
  EraPost
> = {
  hangul: {
    image: "/assets/blog/hangul-science.jpg",
    slugEn: "learn-korean-alphabet-hangul-guide",
    slugAr: "learn-korean-alphabet-hangul-guide-ar",
    titleEn: "Hangul: Built to Be Learned in a Day",
    titleAr: "الهانغول: أبجدية صُممت لتُتعلّم في يوم",
    blurbEn: "King Sejong commissioned it so ordinary people, not just scholars, could read and write.",
    blurbAr: "أمر بها الملك سيجونغ ليتمكّن عامة الناس، لا العلماء وحدهم، من القراءة والكتابة.",
    altEn: "Korean Hangul characters written on paper",
    altAr: "حروف الهانغول مكتوبة على ورقة",
  },
  honorifics: {
    image: "/assets/blog/korean-honorifics.jpg",
    slugEn: "korean-speech-levels-honorifics-guide",
    slugAr: "korean-speech-levels-honorifics-guide-ar",
    titleEn: "Why Korean Has 7 Speech Levels",
    titleAr: "لماذا للكورية ٧ مستويات كلام؟",
    blurbEn: "Formal, polite, casual — how the language itself encodes who you're speaking to.",
    blurbAr: "الرسمي والمهذب والعادي: كيف تعكس اللغة نفسها علاقتك بمن تتحدث معه.",
    altEn: "Korean business professionals bowing respectfully showing formal speech level usage",
    altAr: "محترفون كوريون ينحنون باحترام يظهرون مستويات الكلام الرسمي",
  },
  hanbok: {
    image: "/assets/blog/hanbok-fashion.jpg",
    slugEn: "hanbok-korean-traditional-clothing",
    slugAr: "hanbok-korean-traditional-clothing-ar",
    titleEn: "Hanbok, Korea's Traditional Dress",
    titleAr: "الهانبوك: الزي الكوري التقليدي",
    blurbEn: "How it went from everyday wear to the outfit worn at every major celebration today.",
    blurbAr: "قصة تحوّله من لباس يومي إلى الزي الذي يُلبس في كل مناسبة كبرى.",
    altEn: "Traditional Korean Hanbok dress",
    altAr: "الزي التقليدي الكوري الهانبوك",
  },
  holidays: {
    image: "/assets/blog/seollal-new-year.jpg",
    slugEn: "korean-traditional-holidays-chuseok-seollal",
    slugAr: "korean-traditional-holidays-chuseok-seollal-ar",
    titleEn: "Seollal & Chuseok",
    titleAr: "سولال وتشوسوك",
    blurbEn: "Korea's two biggest holidays — the rituals, the foods, and the words every learner should know.",
    blurbAr: "أهم عيدين في الثقافة الكورية: طقوسهما وأطباقهما الخاصة.",
    altEn: "Colorful Korean traditional Chuseok harvest festival table with rice cakes and fruit",
    altAr: "مائدة عيد تشوسوك الكوري التقليدي مع كعك الأرز والفواكه الملونة",
  },
  wedding: {
    image: "/assets/blog/korean-wedding.jpg",
    slugEn: "korean-wedding-traditions-guide",
    slugAr: "korean-wedding-traditions-guide-ar",
    titleEn: "Inside a Korean Wedding",
    titleAr: "داخل حفل زفاف كوري",
    blurbEn: "From the modern Western-style ceremony to the traditional Pyebaek ritual.",
    blurbAr: "من الحفل الحديث بالطراز الغربي إلى طقس البييباك التقليدي.",
    altEn: "Traditional Korean wedding hanbok and pyebaek ceremony setting",
    altAr: "هانبوك زفاف كوري تقليدي وطقس البييباك",
  },
  zodiac: {
    image: "/assets/blog/korean-superstitions.jpg",
    slugEn: "korean-zodiac-fortune-telling-guide",
    slugAr: "korean-zodiac-fortune-telling-guide-ar",
    titleEn: "Korean Zodiac & Fortune-Telling",
    titleAr: "الأبراج والتنجيم الكوري",
    blurbEn: "Saju, the 12 animal signs, and gunghap compatibility readings — still very much alive today.",
    blurbAr: "الساجو، والحيوانات الاثني عشرية، وقراءات التوافق — تقليد ما زال حاضرًا اليوم.",
    altEn: "Traditional Korean zodiac animal illustrations representing fortune telling",
    altAr: "رسوم حيوانات الأبراج الكورية التقليدية ترمز للتنجيم",
  },
  kpop: {
    image: "/assets/blog/korean-music.jpg",
    slugEn: "learn-korean-through-kpop-bts-blackpink",
    slugAr: "learn-korean-through-kpop-bts-blackpink-ar",
    titleEn: "Learning Korean Through K-Pop",
    titleAr: "تعلّم الكورية عبر الكيبوب",
    blurbEn: "Millions of fans are already absorbing Korean by accident — how to turn that into real fluency.",
    blurbAr: "ملايين المعجبين يتعلّمون الكورية دون أن يشعروا، فكيف يتحوّل ذلك إلى طلاقة حقيقية؟",
    altEn: "Concert stage with colorful lights and a massive crowd of fans",
    altAr: "ميكروفون على مسرح حفل موسيقى كيبوب مع أضواء ملونة",
  },
  streetFood: {
    image: "/assets/blog/tteokbokki.jpg",
    slugEn: "korean-street-food-guide",
    slugAr: "korean-street-food-guide-ar",
    titleEn: "A Taste of Korean Street Food",
    titleAr: "طعم أكل الشارع الكوري",
    blurbEn: "From tteokbokki to hotteok — the dishes, the carts, and the words to order with confidence.",
    blurbAr: "من التوكبوكي إلى الهوتوك: الأطباق والمفردات اللازمة للطلب بثقة.",
    altEn: "Korean street food",
    altAr: "أكل الشارع الكوري",
  },
};

export const ERAS: Era[] = [
  {
    id: "before-korea",
    image: "/assets/eras/gojoseon.svg",
    glyph: "고조선",
    altEn: "Mount Paektu at dawn, with an ancient stone dolmen in the foreground",
    altAr: "جبل بايكدو عند الفجر، وأمامه دولمن حجري قديم",
    titleEn: "Before Korea",
    titleAr: "قبل كوريا",
    datesEn: "Legend, to the 4th century CE",
    datesAr: "من الأسطورة حتى القرن الرابع الميلادي",
    lineEn: "Legend, China, and the first kingdoms",
    lineAr: "أسطورة، والصين، وأولى الممالك",
    introEn:
      "Every country tells a story about where it came from. Korea's begins on a mountain, with a bear who wanted to become a woman.",
    introAr:
      "لكل بلد حكاية عن أصله. وحكاية كوريا تبدأ على جبل، مع دبّة تمنّت أن تصير امرأة.",
    metaDescEn:
      "The legend of Dangun, the first kingdom of Gojoseon, four centuries of Chinese rule in the north, and the Three Kingdoms: where Korea's story begins.",
    metaDescAr:
      "أسطورة دانغون، ومملكة غوجوسون الأولى، وأربعة قرون من الحكم الصيني في الشمال، وعصر الممالك الثلاث: من هنا تبدأ قصة كوريا.",
    milestones: [
      {
        topEn: "2333 BCE",
        topAr: "٢٣٣٣ ق.م",
        textEn: "Dangun founds Gojoseon, in the legend",
        textAr: "دانغون يؤسس غوجوسون، بحسب الأسطورة",
      },
      {
        topEn: "108 BCE",
        topAr: "١٠٨ ق.م",
        textEn: "Han China conquers Wiman Joseon",
        textAr: "أسرة هان تغزو ويمان جوسون",
      },
      {
        topEn: "313 CE",
        topAr: "٣١٣ م",
        textEn: "Goguryeo conquers Lelang",
        textAr: "غوغوريو تُخضع لولانغ",
      },
    ],
    storyEn: [
      "According to the Samguk Yusa, legends written down in the 13th century, a bear and a tiger asked Hwanung, a son of the Lord of Heaven, to make them human. The tiger gave up. The bear endured a hundred days away from the sun, became a woman, and gave birth to Dangun, who founded Gojoseon in 2333 BCE. Historians treat that date as legend, not documented fact.",
      "What is documented: a state called Joseon existed in the north of the peninsula by the 4th century BCE. In 194 BCE Wi Man, a refugee from the Chinese state of Yan, took its throne. In 108 BCE the Han emperor Wu conquered it and set up four commanderies in the north.",
      "For about four centuries, part of the north was governed from China. The largest commandery, Lelang, lasted until 313 CE, when the Korean kingdom of Goguryeo conquered it. Beside it, new kingdoms had grown up: Goguryeo in the north, Baekje in the southwest and Silla in the southeast. This is the Three Kingdoms period.",
      "Korea borrowed heavily from China. Buddhism arrived in Goguryeo in 372 CE, in Baekje in 384 and in Silla in 528. Chinese characters, Hanja, became the language of government, and Confucian ideas shaped how people thought about family and study. A large share of Korean vocabulary is still Sino-Korean. But Koreans kept their spoken language, their customs and their own states, and roughly a thousand years later gave Korean its own alphabet.",
    ],
    storyAr: [
      "تروي مجموعة الأساطير المكتوبة في القرن الثالث عشر، سامغوك يوسا، أن دبّة ونمراً طلبا من هوانونغ، ابن إله السماء، أن يجعلهما بشراً. استسلم النمر، وصبرت الدبّة مئة يوم بعيداً عن الشمس فصارت امرأة، وولدت دانغون الذي أسّس غوجوسون عام ٢٣٣٣ ق.م. لكن المؤرخين يعتبرون هذا التاريخ أسطورياً لا واقعة موثّقة.",
      "الثابت أن دولة اسمها جوسون كانت موجودة في شمال شبه الجزيرة بحلول القرن الرابع ق.م. وفي عام ١٩٤ ق.م استولى وي مان، وهو لاجئ من دولة يان الصينية، على عرشها. وفي عام ١٠٨ ق.م غزاها إمبراطور هان وو وأقام في الشمال أربع مقاطعات.",
      "لنحو أربعة قرون حُكم جزء من الشمال من الصين. وبقيت أكبر المقاطعات، لولانغ، حتى عام ٣١٣ م حين أخضعتها مملكة غوغوريو الكورية. وإلى جانبها نمت ممالك جديدة: غوغوريو في الشمال، وبيكجي في الجنوب الغربي، وسيلا في الجنوب الشرقي. وهذه هي حقبة الممالك الثلاث.",
      "استعارت كوريا كثيراً من الصين. وصلت البوذية إلى غوغوريو عام ٣٧٢ م، وإلى بيكجي عام ٣٨٤، وإلى سيلا عام ٥٢٨. وصارت الحروف الصينية، هانجا، لغة الحكم، ورسمت الكونفوشيوسية نظرة الناس إلى الأسرة والدراسة. وما زالت حصة كبيرة من المفردات الكورية ذات جذور صينية. لكن الكوريين حافظوا على لغتهم المنطوقة وعاداتهم ودولهم، وبعد نحو ألف عام منحوا لغتهم أبجديتها الخاصة.",
    ],
    words: [
      { ko: "곰", rom: "gom", romAr: "غوم", en: "bear", ar: "دبّة" },
      { ko: "호랑이", rom: "horangi", romAr: "هورانغي", en: "tiger", ar: "نمر" },
      { ko: "단군", rom: "Dangun", romAr: "دانغون", en: "the legendary founder", ar: "المؤسس الأسطوري" },
      { ko: "고조선", rom: "Gojoseon", romAr: "غوجوسون", en: "Old Joseon, the first kingdom", ar: "جوسون القديمة، أول مملكة" },
      { ko: "한자", rom: "Hanja", romAr: "هانجا", en: "Chinese characters", ar: "الحروف الصينية" },
      { ko: "중국", rom: "Jungguk", romAr: "جونغغوك", en: "China", ar: "الصين" },
    ],
    posts: [],
  },
  {
    id: "ancient-korea",
    image: "/assets/blog/buddhist-temple.jpg",
    altEn: "A Korean Buddhist temple among trees",
    altAr: "معبد بوذي كوري وسط الأشجار",
    titleEn: "Ancient Korea",
    titleAr: "كوريا القديمة",
    datesEn: "Silla · 57 BCE – 935 CE",
    datesAr: "مملكة سيلا · ٥٧ ق.م – ٩٣٥ م",
    lineEn: "Temples and invention",
    lineAr: "معابد وابتكار",
    introEn:
      "In the southeast of the peninsula, a kingdom grew around a city called Seorabeol, which we now know as Gyeongju.",
    introAr:
      "في جنوب شبه الجزيرة الشرقي نمت مملكة حول مدينة اسمها سيورابول، ونعرفها اليوم باسم غيونغجو.",
    metaDescEn:
      "Silla, the kingdom of gold crowns, star-watching towers and Buddhist temples that lasted almost a thousand years, from 57 BCE to 935 CE.",
    metaDescAr:
      "سيلا، مملكة التيجان الذهبية وأبراج رصد النجوم والمعابد البوذية، التي استمرت نحو ألف عام من ٥٧ ق.م إلى ٩٣٥ م.",
    milestones: [
      {
        topEn: "57 BCE",
        topAr: "٥٧ ق.م",
        textEn: "Silla is founded, by Korean records",
        textAr: "تأسيس سيلا بحسب السجلات الكورية",
      },
      {
        topEn: "528 CE",
        topAr: "٥٢٨ م",
        textEn: "Buddhism becomes the state religion",
        textAr: "البوذية تصبح دين الدولة",
      },
      {
        topEn: "935 CE",
        topAr: "٩٣٥ م",
        textEn: "The last king submits to Goryeo",
        textAr: "آخر ملوكها يستسلم لمملكة غوريو",
      },
    ],
    storyEn: [
      "Korean records date the founding of Silla to 57 BCE, and it lasted until 935 CE, nearly a thousand years. Its tombs have given us elaborate gold crowns and jewelry, and its capital had an astronomical observatory, Cheomseongdae, a stone tower built to watch the stars.",
      "In 528 CE Silla adopted Buddhism as its state religion, and temples became part of the landscape. That is why this station is called temples and invention.",
      "Silla also had the Hwarang, elite young men. They began as a social group for aristocratic youth, but constant wars turned many of them into soldiers and commanders, and they helped in the campaigns that brought down Goguryeo.",
      "Silla won its wars with its neighbors and with its former ally Tang China, and unified most of the peninsula. The Silla-Tang War ran from 670 to 676. In 935 the last king, Gyeongsun, submitted to Goryeo, and Silla came to an end.",
    ],
    storyAr: [
      "تؤرّخ السجلات الكورية تأسيس سيلا بعام ٥٧ ق.م، واستمرت حتى عام ٩٣٥ م، أي نحو ألف عام. أعطتنا مقابرها تيجاناً ومجوهرات ذهبية مزخرفة، وكان في عاصمتها مرصد فلكي هو تشومسونغداي، برج حجري بُني لمراقبة النجوم.",
      "في عام ٥٢٨ م تبنّت سيلا البوذية ديناً رسمياً للدولة، وصارت المعابد جزءاً من المشهد. ولهذا تحمل هذه المحطة عنوان معابد وابتكار.",
      "وكان في سيلا الهوارانغ، شبان من النخبة. بدأوا كتجمّع اجتماعي لأبناء الأرستقراطية، لكن الحروب المتواصلة حوّلت كثيرين منهم إلى جنود وقادة، وساهموا في الحملات التي أسقطت غوغوريو.",
      "انتصرت سيلا في حروبها مع جيرانها ومع حليفتها السابقة أسرة تانغ الصينية، ووحّدت معظم شبه الجزيرة. استمرت حرب سيلا وتانغ من عام ٦٧٠ إلى ٦٧٦. وفي عام ٩٣٥ استسلم آخر ملوكها، غيونغسون، لمملكة غوريو، وانتهت سيلا.",
    ],
    words: [
      { ko: "신라", rom: "Silla", romAr: "سيلا", en: "the kingdom of Silla", ar: "مملكة سيلا" },
      { ko: "금", rom: "geum", romAr: "غوم", en: "gold", ar: "ذهب" },
      { ko: "왕관", rom: "wanggwan", romAr: "وانغغوان", en: "crown", ar: "تاج" },
      { ko: "절", rom: "jeol", romAr: "جول", en: "temple", ar: "معبد" },
      { ko: "별", rom: "byeol", romAr: "بيول", en: "star", ar: "نجمة" },
      { ko: "화랑", rom: "Hwarang", romAr: "هوارانغ", en: "young aristocratic warriors", ar: "شبان محاربون من النخبة" },
    ],
    posts: [],
  },
  {
    id: "joseon",
    image: "/assets/blog/joseon-dynasty.jpg",
    altEn: "A Joseon-era palace courtyard",
    altAr: "فناء قصر من عصر جوسون",
    titleEn: "The Joseon Era",
    titleAr: "عصر جوسون",
    datesEn: "1392 – 1897",
    datesAr: "١٣٩٢ – ١٨٩٧",
    lineEn: "Royal culture, and Hangul",
    lineAr: "ثقافة ملكية، ومولد الهانغول",
    introEn:
      "In 1392 a general named Yi Seong-gye took power and founded the Joseon dynasty, which would rule for more than five centuries.",
    introAr:
      "في عام ١٣٩٢ استولى جنرال اسمه يي سونغ غيه على السلطة وأسّس أسرة جوسون التي حكمت أكثر من خمسة قرون.",
    metaDescEn:
      "The Joseon dynasty, 1392 to 1897: kings, Confucian scholars, the yangban class, and King Sejong's invention of Hangul.",
    metaDescAr:
      "أسرة جوسون من ١٣٩٢ إلى ١٨٩٧: ملوك وعلماء كونفوشيوسيون وطبقة اليانغبان، واختراع الملك سيجونغ للهانغول.",
    milestones: [
      {
        topEn: "1392",
        topAr: "١٣٩٢",
        textEn: "Joseon is founded",
        textAr: "تأسيس أسرة جوسون",
      },
      {
        topEn: "1446",
        topAr: "١٤٤٦",
        textEn: "Hangul is promulgated on October 9",
        textAr: "إعلان الهانغول رسمياً في ٩ أكتوبر",
      },
      {
        topEn: "1897",
        topAr: "١٨٩٧",
        textEn: "The Korean Empire is proclaimed",
        textAr: "إعلان الإمبراطورية الكورية",
      },
    ],
    storyEn: [
      "In 1394 the capital moved to Hanseong, which is modern Seoul. The state ran on Neo-Confucian ideas. Government jobs went to men who passed the gwageo, exams on Confucian learning, and the educated elite who held those jobs were called the yangban. By 1800 the yangban may have made up as much as 30 percent of the population. Buddhism, which had thrived in Silla, was discouraged.",
      "The most famous king, Sejong, oversaw the creation of Hangul. Before it, writing meant Chinese characters, which took years to learn. Hangul was made to be learned quickly. It was promulgated on October 9, 1446, a date Koreans still celebrate as Hangul Day. But the scholarly elite rejected it at the time, and it took centuries to become the everyday script.",
      "In 1897 the Korean Empire was proclaimed, which formally ended the Joseon period. The dynasty continued to rule until Japan annexed Korea in 1910.",
    ],
    storyAr: [
      "في عام ١٣٩٤ انتقلت العاصمة إلى هانسونغ، وهي سيول الحديثة. قامت الدولة على الكونفوشيوسية الجديدة. وذهبت وظائف الحكم إلى من ينجحون في امتحان غواغو الذي يختبر المعرفة الكونفوشيوسية، وسُمّي أبناء النخبة المتعلمة الذين شغلوا هذه الوظائف يانغبان. وبحلول عام ١٨٠٠ ربما بلغ عددهم ثلاثين في المئة من السكان. أما البوذية التي ازدهرت في سيلا فقُيِّدت.",
      "أشهر ملوك جوسون هو سيجونغ الذي أشرف على إنشاء الهانغول. قبلها كانت الكتابة تعني الحروف الصينية التي يستغرق تعلمها سنوات، أما الهانغول فصُمم ليُتعلم بسرعة. أُعلن رسمياً في ٩ أكتوبر ١٤٤٦، وما زال الكوريون يحتفلون بهذا اليوم باسم يوم الهانغول. لكن نخبة العلماء رفضته في وقته، واحتاج قروناً ليصبح الخط اليومي.",
      "في عام ١٨٩٧ أُعلنت الإمبراطورية الكورية، وبها انتهت حقبة جوسون رسمياً. لكن الأسرة ظلت حاكمة حتى ضمّت اليابان كوريا عام ١٩١٠.",
    ],
    words: [
      { ko: "조선", rom: "Joseon", romAr: "جوسون", en: "the Joseon dynasty", ar: "أسرة جوسون" },
      { ko: "한글", rom: "Hangul", romAr: "هانغول", en: "the Korean alphabet", ar: "الأبجدية الكورية" },
      { ko: "궁", rom: "gung", romAr: "غونغ", en: "palace", ar: "قصر" },
      { ko: "양반", rom: "yangban", romAr: "يانغبان", en: "the educated noble class", ar: "طبقة النبلاء المتعلمة" },
      { ko: "시험", rom: "siheom", romAr: "سيهوم", en: "exam", ar: "امتحان" },
      { ko: "학자", rom: "hakja", romAr: "هاكجا", en: "scholar", ar: "عالِم" },
    ],
    posts: [POSTS.hangul, POSTS.honorifics],
  },
  {
    id: "traditional-life",
    image: "/assets/blog/korean-tea.jpg",
    altEn: "A traditional Korean tea setting",
    altAr: "طقم شاي كوري تقليدي",
    titleEn: "Traditional Life",
    titleAr: "الحياة التقليدية",
    datesEn: "Hanok villages",
    datesAr: "قرى الهانوك",
    lineEn: "Tea, manners, timeless beauty",
    lineAr: "شاي، آداب، وجمال لا يقدم",
    introEn:
      "A hanok is a traditional Korean house that listens to the land: where you build it matters as much as how.",
    introAr:
      "الهانوك بيت كوري تقليدي يُصغي إلى الأرض: مكان بنائه لا يقل أهمية عن طريقة بنائه.",
    metaDescEn:
      "Inside the hanok, the traditional Korean house: mountain-and-river placement, ondol floor heating, the cool maru hall, and clay tile roofs.",
    metaDescAr:
      "داخل الهانوك، البيت الكوري التقليدي: موقعه بين الجبل والنهر، وتدفئة الأوندول، وقاعة المارو الباردة، وأسقف القرميد.",
    milestones: [
      {
        topEn: "Baesanimsu",
        topAr: "بيسانيمسو",
        textEn: "A mountain behind, a river in front",
        textAr: "جبل في الخلف ونهر في الأمام",
      },
      {
        topEn: "Ondol",
        topAr: "أوندول",
        textEn: "Heat under the floor for cold winters",
        textAr: "تدفئة تحت الأرضية لشتاء بارد",
      },
      {
        topEn: "Maru",
        topAr: "مارو",
        textEn: "A cool wooden hall for summer",
        textAr: "قاعة خشبية باردة للصيف",
      },
    ],
    storyEn: [
      "A hanok is a traditional Korean house. Its roots go back to pit houses from around 6,000 BCE, and its classic form was completed in the late Joseon period. The ideal site is baesanimsu: a mountain behind the house and a river in front, with the land and seasons in mind.",
      "It is built for comfort in both extremes. For winter there is ondol, an under-floor heating system devised long ago to help Koreans survive the cold, still used in many homes today. For summer there is the maru, a cool wooden-floor hall that blocks the summer sun and lets air move through.",
      "Hanok are built from timber for beams and posts, clay roof tiles called giwa, and stone foundations. Windows and doors use hanji, Korean paper treated with bean oil so it resists water. Northern hanok are square to keep heat in, southern ones are open and L-shaped for ventilation, and central regions combine both.",
      "You can still walk through them in Bukchon Hanok Village in central Seoul. As in most Korean homes, shoes come off at the door.",
    ],
    storyAr: [
      "الهانوك هو البيت الكوري التقليدي. تمتد جذوره إلى بيوت حفرية من نحو عام ٦٠٠٠ ق.م، واكتمل شكله الكلاسيكي في أواخر حقبة جوسون. والموقع المثالي هو بيسانيمسو: جبل خلف البيت ونهر أمامه، مع مراعاة الأرض والفصول.",
      "يُبنى لتحقيق الراحة في الحر والبرد معاً. فللشتاء أوندول، نظام تدفئة تحت الأرضية ابتُكر منذ زمن بعيد ليساعد الكوريين على احتمال البرد، وما زال مستخدماً في بيوت كثيرة. وللصيف مارو، قاعة بأرضية خشبية باردة تحجب شمس الصيف وتسمح للهواء بالدوران.",
      "يُبنى الهانوك من الخشب للعوارض والأعمدة، ومن قرميد الطين المحروق للسقف واسمه غيوا، ومن أساسات حجرية. وتُصنع النوافذ والأبواب من هانجي، الورق الكوري المعالج بزيت الفول ليقاوم الماء. هانوك الشمال مربع ليحتفظ بالدفء، وهانوك الجنوب مفتوح على شكل حرف إل للتهوية، وفي الوسط يجمعون بين النمطين.",
      "وما زالت هذه البيوت مفتوحة للزوار اليوم في قرية بوكتشون للهانوك في وسط سيول. وكما في معظم البيوت الكورية، تُخلع الأحذية عند الباب.",
    ],
    words: [
      { ko: "한옥", rom: "hanok", romAr: "هانوك", en: "traditional Korean house", ar: "البيت الكوري التقليدي" },
      { ko: "온돌", rom: "ondol", romAr: "أوندول", en: "under-floor heating", ar: "تدفئة تحت الأرضية" },
      { ko: "마루", rom: "maru", romAr: "مارو", en: "wooden-floor hall", ar: "قاعة بأرضية خشبية" },
      { ko: "기와", rom: "giwa", romAr: "غيوا", en: "clay roof tile", ar: "قرميد طين للسقف" },
      { ko: "한지", rom: "hanji", romAr: "هانجي", en: "Korean paper", ar: "الورق الكوري" },
      { ko: "마을", rom: "maeul", romAr: "ماول", en: "village", ar: "قرية" },
    ],
    posts: [POSTS.hanbok, POSTS.holidays, POSTS.wedding, POSTS.zodiac],
  },
  {
    id: "modern-korea",
    image: "/assets/blog/hallyu-wave.jpg",
    altEn: "Modern Korean pop culture",
    altAr: "ثقافة كورية معاصرة",
    titleEn: "Modern Korea",
    titleAr: "كوريا الحديثة",
    datesEn: "1950s – today",
    datesAr: "الخمسينيات – اليوم",
    lineEn: "A dynamic tomorrow",
    lineAr: "غدٌ متجدد",
    introEn:
      "For a long time Korean culture was mostly something Koreans shared with each other. Then, in the 1990s, it began to travel.",
    introAr:
      "لفترة طويلة كانت الثقافة الكورية شيئاً يتشاركه الكوريون فيما بينهم. ثم بدأت في التسعينيات تسافر.",
    metaDescEn:
      "Hallyu, the Korean wave: from the 1990s to Winter Sonata, Gangnam Style, Parasite and Squid Game, and why so many people now learn Korean.",
    metaDescAr:
      "هاليو، الموجة الكورية: من التسعينيات إلى سوناتا الشتاء وغانغنام ستايل وطفيلي ولعبة الحبار، ولماذا يتعلم الكثيرون الكورية اليوم.",
    milestones: [
      {
        topEn: "1999",
        topAr: "١٩٩٩",
        textEn: "Chinese journalists coin the term Hallyu",
        textAr: "صحفيون صينيون يبتكرون مصطلح هاليو",
      },
      {
        topEn: "2012",
        topAr: "٢٠١٢",
        textEn: "Gangnam Style hits one billion YouTube views",
        textAr: "غانغنام ستايل تبلغ مليار مشاهدة على يوتيوب",
      },
      {
        topEn: "2020",
        topAr: "٢٠٢٠",
        textEn: "Parasite wins Best Picture at the Oscars",
        textAr: "فيلم طفيلي يفوز بأفضل فيلم في الأوسكار",
      },
    ],
    storyEn: [
      "The word for this is Hallyu, the Korean wave. It joins han, meaning Korean, and ryu, meaning flow or wave. Two things helped it start: the end of military censorship over the entertainment industry, and the recovery from the 1997 Asian financial crisis. Chinese journalists began using the term in 1999.",
      "In 2003 and 2004 the romance drama Winter Sonata became a huge hit, especially in Japan, and boosted tourism to Korea. In 2012 Psy's Gangnam Style became the first YouTube video to reach one billion views. BTS and Blackpink then found audiences around the world.",
      "In 2020 the film Parasite won Best Picture at the Academy Awards, the first non-English-language film to do so. In 2021 Netflix released Squid Game, and the Oxford English Dictionary added both hallyu and Korean wave.",
      "This is why so many people begin learning Korean today: they hear a song or watch a drama and want to understand it without subtitles.",
    ],
    storyAr: [
      "الكلمة المعبّرة عن هذا هي هاليو، أي الموجة الكورية. وهي تجمع هان بمعنى كوري، وريو بمعنى تدفق أو موجة. ساعد على بدايتها أمران: إنهاء الرقابة العسكرية على صناعة الترفيه، والتعافي من الأزمة المالية الآسيوية عام ١٩٩٧. وبدأ صحفيون صينيون يستخدمون المصطلح عام ١٩٩٩.",
      "في عامي ٢٠٠٣ و٢٠٠٤ حقق المسلسل الرومانسي سوناتا الشتاء نجاحاً كبيراً، خاصة في اليابان، وزاد السياحة إلى كوريا. وفي عام ٢٠١٢ أصبحت أغنية غانغنام ستايل للمغني ساي أول فيديو على يوتيوب يبلغ مليار مشاهدة. ثم وجدت فرقتا بي تي إس وبلاك بينك جمهوراً في أنحاء العالم.",
      "وفي عام ٢٠٢٠ فاز فيلم طفيلي بجائزة أفضل فيلم في الأوسكار، وهو أول فيلم بغير اللغة الإنجليزية يفوز بها. وفي عام ٢٠٢١ طرحت نتفليكس مسلسل لعبة الحبار، وأضاف قاموس أكسفورد الإنجليزي كلمتي هاليو والموجة الكورية.",
      "ولهذا يبدأ كثيرون اليوم بتعلم الكورية: يسمعون أغنية أو يشاهدون مسلسلاً ويريدون فهمه دون ترجمة.",
    ],
    words: [
      { ko: "한류", rom: "hallyu", romAr: "هاليو", en: "the Korean wave", ar: "الموجة الكورية" },
      { ko: "서울", rom: "Seoul", romAr: "سوول", en: "Seoul, the capital", ar: "سيول، العاصمة" },
      { ko: "드라마", rom: "deurama", romAr: "دراما", en: "drama", ar: "مسلسل درامي" },
      { ko: "영화", rom: "yeonghwa", romAr: "يونغهوا", en: "movie", ar: "فيلم" },
      { ko: "노래", rom: "norae", romAr: "نوريه", en: "song", ar: "أغنية" },
      { ko: "팬", rom: "paen", romAr: "بان", en: "fan", ar: "معجب" },
    ],
    posts: [POSTS.kpop, POSTS.streetFood],
  },
];

export const getEra = (id: string | undefined): Era | undefined =>
  ERAS.find((era) => era.id === id);
