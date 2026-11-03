/**
 * KLOVERS WORLD CANON
 * ===================
 *
 * Single source of truth for:
 * - story
 * - characters
 * - relationships
 * - progression
 * - worlds
 * - narrative rules
 * - visual identity
 *
 * New product features must follow this canon.
 *
 * See also:
 * - docs/KLOVERS-STORY-BIBLE.md (human-readable version of this file)
 * - CLAUDE.md, "KLOVERS STORY CANON" section (when/how to consult this file)
 */

export const KLOVERS_WORLD = {
  version: "1.2",

  corePromise: {
    internal:
      "Learning Korean gradually opens a living Korean world around the learner.",

    userFeeling:
      "The more Korean I learn, the more of the world I can understand and explore.",

    progressionLoop: [
      "LEARN",
      "PRACTISE",
      "MASTER",
      "WORLD_REACTS",
      "DISCOVER",
      "UNLOCK",
      "CONTINUE",
    ],
  },

  originStory: {
    humans: {
      relationship: "friends_and_study_companions",
      origin: "foreigners_learning_korean",
      romanticRelationship: false,

      objective:
        "Learn Korean while gradually discovering Korean everyday life and culture.",
    },

    discovery: {
      location:
        "A quiet old Korean hanok library or courtyard discovered during their journey.",

      object: "mysterious_clover_egg",

      egg: {
        shellColor: "ivory",
        symbol: "small_green_four_leaf_clover",
        initialState: "dormant",
        reactsTo: "genuine_learning_progress",
      },
    },

    awakeningSequence: [
      {
        id: "first-word",
        trigger: "first_meaningful_korean_word",
        reaction: "small_crack",
      },

      {
        id: "first-sentence",
        trigger: "first_complete_korean_sentence",
        reaction: "soft_klovers_yellow_glow",
      },

      {
        id: "first-conversation",
        trigger: "first_short_conversation_milestone",
        reaction: "egg_hatches",
      },
    ],

    hatching: {
      character: "cluby",
      firstWord: "안녕!",
      meaning: "hello",
    },

    mystery:
      "Cluby does not fully remember where he came from. His memories return gradually as the learners progress.",

    /**
     * The "nobody sees Cluby before the egg hatches" rule, and its one
     * deliberate exception. Re, 25 Sep 2026 — this was previously recorded
     * only in a comment in components/EggTeaser.tsx, which meant the code canon
     * and the shipped behaviour disagreed and the bible (which defers to this
     * file) could not settle it.
     *
     * The rule protects the REVEAL in the logged-in product: /games, the games
     * hub, the leaderboard and the XP celebration show the clover egg instead
     * of Cluby until lib/clubyAwake.ts records a real hatch. That gate is
     * load-bearing and is guarded by scripts/lib/games-free-set.test.mjs.
     *
     * Marketing is different on purpose. The homepage teases, and homepageNarrative
     * puts Cluby in the hero, the games beat, the culture section and the final
     * CTA — to a visitor who has an egg they have never hatched. He is a known
     * quantity there, not a discovery. The egg-teaser beat (slot 8) still
     * excludes him, because THAT is the beat where the mystery is on the table.
     */
    clubyVisibility: {
      /** Where the gate is absolute: no account, no Cluby, egg only. */
      gatedUntilHatch: [
        "games_page",
        "game_worlds_hub",
        "games_leaderboard",
        "xp_celebration",
      ],

      /** Where he may appear before hatching, because the page is a teaser. */
      allowedBeforeHatch: [
        "homepage_hero",
        "homepage_more_than_a_class",
        "homepage_community_band",
        "homepage_final_cta",
        "not_found_pages",
      ],

      /** The rule this exception carves out of. */
      neverOnHatchGate: [
        "the_egg_teaser_beat",
      ],

      source: "Re, 25 Sep 2026",
    },
  },

  characters: {
    cluby: {
      type: "original_klovers_creature",

      name: {
        en: "Cluby",
        ar: "كلوبي",
      },

      roles: [
        "companion",
        "memory_keeper",
        "discovery_guide",
        "motivation",
        "reward_guide",
      ],

      neverUseAs: [
        "pet",
        "all_knowing_teacher",
        "random_decoration",
        "baby_mascot_only",
        "comic_relief_only",
      ],

      personality: [
        "curious",
        "warm",
        "playful",
        "supportive",
        "slightly_mysterious",
      ],

      learningFunctions: [
        "give_hints",
        "celebrate_progress",
        "remember_review_items",
        "reveal_unlocks",
        "introduce_discoveries",
      ],

      visual: {
        body: "mint_green_realistic_cute_3d_plush",
        texture: "soft_felt_fur",
        head: "round",
        horns: "two_short_butter_yellow_horns",
        ears: "pointed_with_pink_inner_ear",
        eyes: "warm_dark_brown",
        cheeks: "soft_rose",
        teeth: "two_small_fangs",
        tail: "short_mint_tail_with_small_spikes",

        defaultOutfit: {
          top: "ivory_mini_hanbok_wrap_top",
          skirt: "klovers_yellow_wrap_skirt",
          emblem: "green_four_leaf_clover",
        },
      },
    },

    /**
     * The two learners' names are Re's decision of 27 Sep 2026, made while
     * planning Book 1 (claude/BOOK_1_PLAN_AND_LESSON1_SAMPLE_2026-09-27.md).
     * Use exactly these spellings in every language.
     */
    maleLearner: {
      type: "foreign_korean_learner",

      name: {
        en: "Adam",
        ar: "آدم",
        ko: "아담",
      },

      roles: [
        "structure",
        "learning_strategy",
        "confidence",
        "progress",
        "explanation",
      ],

      visual: {
        age: "early_20s",
        ethnicityRule: "not_korean_and_not_asian",
        hair: "wavy_dark_brown",

        outfit: [
          "klovers_yellow_tailored_blazer",
          "ivory_tshirt",
          "ivory_trousers",
          "white_sneakers",
        ],
      },
    },

    femaleLearner: {
      type: "foreign_korean_learner",

      name: {
        en: "Lina",
        ar: "لينا",
        ko: "리나",
      },

      roles: [
        "curiosity",
        "culture",
        "real_life_context",
        "stories",
        "emotional_warmth",
      ],

      visual: {
        age: "early_20s",
        ethnicityRule: "not_korean_and_not_asian",
        hair: "long_wavy_auburn_copper",
        features: "light_freckles",

        outfit: [
          "ivory_hanbok_inspired_wrap_top",
          "klovers_yellow_midi_skirt",
          "white_floral_embroidery",
          "yellow_floral_sash",
          "ivory_flats",
        ],
      },
    },

    /**
     * Minsu — a Korean friend and conversation partner of the two learners.
     * He speaks with them in the Book 1 conversations (Re, 27 Sep 2026:
     * "there is a new guy in the pictures"). A native speaker to practise
     * with; never a teacher (real teachers stay real) and never a love
     * interest. Visual follows the Book 1 artwork Re shared on 27 Sep 2026.
     */
    koreanFriend: {
      type: "korean_friend",

      name: {
        en: "Minsu",
        ar: "مين سو",
        ko: "민수",
      },

      roles: [
        "native_speaker_friend",
        "conversation_partner",
        "everyday_korean",
      ],

      neverUseAs: [
        "teacher",
        "romantic_interest",
      ],

      visual: {
        age: "early_20s",
        ethnicityRule: "korean",
        hair: "short_black",
        // From the Book 1 artwork Re shared on 27 Sep 2026.
        outfit: [
          "pale_periwinkle_button_shirt_sleeves_rolled",
          "near_black_trousers",
          "navy_lanyard_with_white_id_card",
        ],
        status: "from_book_1_artwork_2026_09_27",
      },
    },
  },

  /**
   * Supporting Korean cast — new Korean people the learners meet as Book 1's
   * 24 classes move forward in time, not just Minsu over and over. Re's
   * decision, 4 Nov 2026: "the story must be including new people in Korea
   * during time."
   *
   * This follows the exact precedent of `koreanFriend` (Minsu): a native
   * speaker the learners meet, never a teacher, never a romantic interest,
   * always tied to the class's own grammar/vocabulary so the dialogue stays
   * curriculum, not decoration. Every entry here answers the CLAUDE.md
   * six questions (what's learned, why now, who owns the moment, which
   * world, what real progress triggers it, what changes after) via its
   * `classContext` + `neverUseAs` fields.
   *
   * All of them live inside the single world Book 1 occupies —
   * "vocabulary-market" — so this is additive content inside an existing
   * world, not a new world or a change to the trio's core relationships.
   * Full visual direction is intentionally left undecided here (draft
   * approved for NAMES/ROLES only, Re 4 Nov 2026) — pin down `visual` per
   * character before any of them appear in production artwork, not just
   * model-lesson mockups.
   */
  supportingKoreanCast: {
    book1: [
      {
        id: "classmate-jihoon",
        name: { en: "Jihoon", ar: "جي هون", ko: "지훈" },
        role: "passerby_who_gives_directions",
        classContext: "class_3_places_and_direction_verbs",
        neverUseAs: ["teacher", "romantic_interest"],
      },
      {
        id: "market-vendor-park",
        name: { en: "Ms. Park", ar: "الآنسة بارك", ko: "박 아주머니" },
        role: "vocabulary_market_vendor",
        classContext: "classes_7_8_numbers_prices_shopping",
        neverUseAs: ["teacher", "romantic_interest"],
      },
      {
        id: "info-desk-clerk-kim",
        name: { en: "Mr. Kim", ar: "السيد كيم", ko: "김 선생님" },
        role: "information_desk_clerk",
        classContext: "class_9_formal_speech",
        neverUseAs: [
          "teacher",
          "romantic_interest",
          "replacement_for_real_teacher_trust",
        ],
      },
      {
        id: "cafe-barista-yuna",
        name: { en: "Yuna", ar: "يونا", ko: "유나" },
        role: "cafe_barista",
        classContext: "class_10_polite_requests",
        note: "Previews the conversation-cafe world without unlocking it early.",
        neverUseAs: ["teacher", "romantic_interest"],
      },
      {
        id: "classmate-seoyeon",
        name: { en: "Seoyeon", ar: "سيو يون", ko: "서연" },
        role: "classmate_making_plans",
        classContext: "class_16_time_and_date",
        neverUseAs: ["teacher", "romantic_interest"],
      },
      {
        id: "new-friend-taeyang",
        name: { en: "Taeyang", ar: "تايانغ", ko: "태양" },
        role: "friend_proposing_a_weekend_trip",
        classContext: "classes_19_20_21_suggestions_plans_reasons",
        neverUseAs: ["teacher", "romantic_interest"],
      },
      {
        id: "neighbor-hana",
        name: { en: "Hana", ar: "هَنا", ko: "하나" },
        role: "neighbor_or_housemate",
        classContext: "classes_22_23_requests_and_ability",
        neverUseAs: ["teacher", "romantic_interest"],
      },
    ],
    source: "Re, 4 Nov 2026 — claude/klovers-book1-model-lessons-plan.md",
  },

  characterRelationshipRules: {
    trioRelationship: "friends_and_learning_companions",

    forbiddenByDefault: [
      "romantic_touching",
      "kissing",
      "hand_holding",
      "cheek_to_cheek_pose",
      "couple_framing",
      "owner_pet_relationship",
    ],

    coreDynamic: {
      maleLearner:
        "helps_create_structure_and_confidence",

      femaleLearner:
        "connects_learning_to_people_and_culture",

      cluby:
        "turns_learning_into_discovery_and_memory",
    },
  },

  worlds: [
    {
      id: "hangul-village",

      order: 1,

      name: {
        en: "Hangul Village",
        ar: "قرية الهانغول",
      },

      purpose:
        "Learn the Korean writing and sound system.",

      skills: [
        "hangul",
        "sounds",
        "syllables",
        "basic_reading",
      ],

      leadCharacters: [
        "maleLearner",
        "cluby",
      ],

      visualDirection:
        "Quiet Korean village with hanok architecture and signs that gradually become readable.",

      unlockRule:
        "initial_learning_world",

      narrativeEffect:
        "The learner begins reading parts of the world that previously looked unfamiliar.",
    },

    {
      id: "vocabulary-market",

      order: 2,

      name: {
        en: "Vocabulary Market",
        ar: "سوق المفردات",
      },

      purpose:
        "Connect learned Korean vocabulary with visible everyday objects.",

      skills: [
        "vocabulary",
        "food",
        "objects",
        "numbers",
        "daily_life",
      ],

      leadCharacters: [
        "femaleLearner",
        "cluby",
      ],

      visualDirection:
        "Warm Korean market containing objects that correspond to already learned vocabulary.",

      unlockRule:
        "core_hangul_milestone_completed",

      narrativeEffect:
        "Words learned by the student begin appearing as understandable objects inside the world.",
    },

    {
      id: "conversation-cafe",

      order: 3,

      name: {
        en: "Conversation Café",
        ar: "مقهى المحادثة",
      },

      purpose:
        "Transform vocabulary into usable real-life conversation.",

      skills: [
        "speaking",
        "listening",
        "greetings",
        "ordering",
        "short_conversations",
      ],

      leadCharacters: [
        "maleLearner",
        "femaleLearner",
      ],

      supportingCharacter: "cluby",

      visualDirection:
        "Warm Korean café designed around small real-life conversation situations.",

      unlockRule:
        "conversation_readiness_milestone",

      narrativeEffect:
        "The learner begins using Korean instead of only recognising it.",
    },

    {
      id: "memory-garden",

      order: 4,

      name: {
        en: "Cluby's Memory Garden",
        ar: "حديقة ذاكرة كلوبي",
      },

      purpose:
        "Turn review and spaced repetition into a meaningful part of the story.",

      skills: [
        "review",
        "spaced_repetition",
        "mistake_recovery",
        "memory",
      ],

      leadCharacters: [
        "cluby",
      ],

      visualDirection:
        "Quiet green garden where previously learned words and expressions return for review.",

      unlockRule:
        "sufficient_review_data_available",

      narrativeEffect:
        "Cluby remembers things the learner may be starting to forget.",
    },

    {
      id: "culture-street",

      order: 5,

      name: {
        en: "Culture Street",
        ar: "شارع الثقافة",
      },

      purpose:
        "Connect Korean learning with everyday Korean culture.",

      skills: [
        "culture",
        "food",
        "etiquette",
        "traditions",
        "daily_context",
      ],

      leadCharacters: [
        "femaleLearner",
        "cluby",
      ],

      visualDirection:
        "A refined Korean cultural street combining modern Seoul and traditional details.",

      unlockRule:
        "beginner_language_foundation_completed",

      narrativeEffect:
        "Language begins revealing social and cultural meaning.",
    },

    {
      id: "seoul-journey",

      order: 6,

      name: {
        en: "Seoul Journey",
        ar: "رحلة سيول",
      },

      purpose:
        "Use Korean across connected real-life city situations.",

      skills: [
        "transport",
        "directions",
        "shopping",
        "restaurants",
        "social_interactions",
      ],

      leadCharacters: [
        "maleLearner",
        "femaleLearner",
        "cluby",
      ],

      visualDirection:
        "A growing illustrated Seoul with subway, neighbourhoods, cafés and Namsan Tower.",

      unlockRule:
        "intermediate_real_world_readiness",

      narrativeEffect:
        "Separate lessons begin connecting into an understandable Korean environment.",
    },
  ],

  /**
   * How the seven course levels (src/constants/levels.ts) walk through the
   * worlds on the student's journey map. Re's decision, 24 Sep 2026:
   * Cluby's Memory Garden is NOT a level stop — it is a review place beside
   * the journey, unlocked by review data (see its unlockRule).
   */
  levelJourney: {
    hangul: { world: "hangul-village", part: null },
    l1: { world: "vocabulary-market", part: null },
    l2: { world: "conversation-cafe", part: null },
    l3: { world: "culture-street", part: null },
    l4: { world: "seoul-journey", part: 1 },
    l5: { world: "seoul-journey", part: 2 },
    l6: { world: "seoul-journey", part: 3 },
    notALevelStop: ["memory-garden"],
  },

  longTermStory: {
    mysteryName: "The Forgotten Clovers",

    premise:
      "Cluby eventually discovers traces suggesting he may not be the only creature connected to Korean learning memories.",

    revealSpeed: "very_slow",

    rules: [
      "Never explain the complete mystery early.",
      "Mystery must never block learning.",
      "Do not create dozens of collectible characters immediately.",
      "Every discovery must connect to genuine learning progress.",
    ],
  },

  memorySystem: {
    principle:
      "Learned knowledge should remain visible in the world instead of disappearing after lesson completion.",

    examples: [
      {
        learned: "사과",
        world: "vocabulary-market",
        manifestation: "apple",
      },

      {
        learned: "커피",
        world: "conversation-cafe",
        manifestation: "coffee",
      },
    ],

    reviewFraming: {
      forbidden: [
        "failure",
        "bad_answer",
        "you_failed",
      ],

      preferred: [
        "Cluby saved this for you.",
        "Let's revisit this.",
        "We've seen this before.",
      ],
    },
  },

  visualSystem: {
    humans:
      "photorealistic_people_with_natural_skin_and_fabric",

    cluby:
      "realistic_cute_3d_plush_with_soft_felt_fur",

    environments:
      "soft_painterly_korean_storybook_environment",

    interface:
      "clean_premium_professional_web_ui",

    /**
     * Re, 5 Oct 2026 — "the theme is always the real scenes."
     *
     * WHAT THIS SETTLES
     *
     * There is ONE theme and it is photographic. That was arguable before only
     * because the Book A-0 cover art Re supplied is illustrated, which made an
     * illustrated face defensible at icon size — and two of them are live today
     * as the site's trust badges (public/assets/icons/student-boy-thumbsup.webp
     * and student-girl-heart.webp, at 23 call sites). They are defensible no
     * longer.
     *
     * NO SIZE EXCEPTION. A 40px trust badge is the same theme as a 1600px hero,
     * so "too small to matter" is not a carve-out. The same sentence retires the
     * flat 2D Cluby set in public/assets/characters/ — which GameWorldsHub.tsx
     * still renders — and the drawn blog covers.
     *
     * WHAT IT DOES NOT DECIDE. These fields answer the CHARACTER question. An
     * illustrated place, object or historic scene (an era painting, a folk-tale
     * monster) is a different question and is not settled here.
     */
    standingRule: "always_the_real_scenes",

    /** No size carves an exception out of the rule above. */
    illustrationExceptionAtSmallSizes: false,

    forbiddenStyles: [
      "flat_cartoon_everywhere",
      "anime",
      "children_game_interface",
      "oversaturated_ui",
      "random_illustration_styles",
      "generic_saas_visual_identity",
      "illustrated_or_anime_characters_at_any_size",
      "flat_2d_mascot_set",
    ],
  },

  /**
   * The approved brand palette (Re, Sep 2026 — see src/index.css and
   * claude/BRAND_PALETTE_REFERENCE.md; the code is the source of truth).
   * Three brand colours plus one status colour. Retired and not to be used:
   * #FFF000, #25D366, #BEEFCB (mint/soft green), #FFB7A1 (peach).
   * WhatsApp's own green stays only on WhatsApp buttons/icons.
   */
  colors: {
    yellow: "#FFFF00",
    charcoal: "#2E2E2E",
    ivory: "#FFF9EC",
    // Status only (progress / correct / live) — a fill, never text or decoration.
    neonGreen: "#39FF14",
  },

  typography: {
    headings: "Poppins",
    englishUI: "Inter",
    arabicUI: "Cairo",

    clubyHandwriting: {
      // Matches the site's font-script (Caveat). Latin only — Arabic notes stay in Cairo.
      latin: "Caveat",
      arabic: "none_use_cairo",

      allowedOnlyFor: [
        "short_cluby_notes",
        "personal_story_messages",
      ],
    },
  },

  uiRules: {
    characterDensity: {
      maxPrimaryCharactersPerNormalSection: 1,
      trioUse:
        "major_story_moments_only",
    },

    rule:
      "Characters support the product. They never replace clear UX.",
  },

  homepageNarrative: [
    {
      order: 1,
      section: "hero",
      characters: ["cluby"],
      storyFunction: "invitation",
    },

    {
      order: 2,
      section: "live-class-trust",
      characters: [],
      storyFunction:
        "prove_real_teaching",
    },

    {
      order: 3,
      section: "how-klovers-works",
      characters: [
        "maleLearner",
        "femaleLearner",
      ],
      optionalCharacter: "cluby",
      storyFunction:
        "show_learners_like_the_user",
    },

    {
      order: 4,
      section: "learning-journey",
      characters: [
        "maleLearner",
        "cluby",
      ],
      storyFunction: "progression",
    },

    {
      order: 5,
      section: "practice-games",
      characters: ["cluby"],
      storyFunction:
        "practice_and_reward",

      /**
       * This beat has no section of its own, and that is a decision rather
       * than a gap. Re's CRO pass of 23 Sep 2026 replaced four separate
       * homepage sections (culture, eras, games, journal) that told the same
       * story three times; see the header comment in
       * `src/components/MoreThanAClass.tsx`, which replaced them with six
       * doors — one of which is Games and one of which is Cluby himself.
       *
       * So the beat is DELIVERED, by MoreThanAClass at slot 6, and only its
       * own homepage section was retired. `deliveredBy` records that, and
       * src/config/__tests__/kloversWorld.test.ts checks the beat is either
       * rendered by its own component or points at the section that carries
       * it. Restoring a dedicated games section is a CRO question, not a
       * story-canon one; if Re wants it back, add a `section` entry here and
       * render `HomeGamesSection` (already built, still in
       * src/components/HomeGamesSection.tsx) from src/pages/Index.tsx.
       */
      deliveredBy: "culture",
      retiredAsOwnSection: "Re, 23 Sep 2026 CRO pass",
    },

    {
      order: 6,
      section: "culture",
      characters: [
        "femaleLearner",
        "cluby",
      ],
      storyFunction:
        "real_world_korea",
    },

    /**
     * Scholarships in Korea (Re, 4 Oct 2026).
     *
     * The study path the learner is already walking, given a destination: the
     * six scholarship programmes an Arabic speaker in Egypt can actually apply
     * to, each one linked to the funding body's own page.
     *
     * WHO OWNS IT: the male learner. Adam already carries structure, strategy
     * and explanation in this canon, and a scholarship application is exactly
     * that — deadlines, documents, eligibility. Cluby rides along as the
     * supporting character (he is reading, one note, one line), which is the
     * same shape as the culture beat above: one primary character, one
     * companion, never the trio.
     *
     * NO NEW WORLD. This beat is delivered inside Culture Street / Seoul
     * Journey, the two worlds already defined below. Inventing a "university
     * road" world would be new lore for a marketing section, which section 9
     * of the story bible forbids.
     *
     * THE HOMEPAGE TEASES; THE LEVEL EARNS THE ANSWER (Re, 4 Oct 2026). The
     * front page used to render all six programmes in full. It now states that
     * six programmes exist and sends the visitor to the free placement test.
     * Which programmes a visitor's level can reach, and how many months stand
     * between them and each one, are shown against a REAL level —
     * `profiles.course_level_key`, written by the placement test itself —
     * never against a level the visitor claims for himself. That is section
     * 8's rule (progression from real learning data) and section 11's
     * (marketing teases; the logged-in product is where the learner
     * experiences it).
     *
     * The FACTS stay public on /scholarships: what each programme covers, the
     * amounts one official page states, the sources and the verification date.
     * Gating the match is a product decision; gating the facts about other
     * people's money would not be honest, and that page is also the one search
     * engines index.
     */
    {
      order: 7,
      section: "scholarships",
      characters: [
        "maleLearner",
        "cluby",
      ],
      storyFunction:
        "real_world_study_path",
    },

    {
      order: 8,
      section: "egg-teaser",
      characters: [
        "maleLearner",
        "femaleLearner",
      ],
      explicitlyExclude: [
        "cluby",
      ],
      storyFunction:
        "origin_mystery_teaser",
    },

    {
      order: 9,
      section: "final-cta",
      characters: [
        "cluby",
      ],
      storyFunction:
        "invite_user_forward",
    },
  ],

  productNarrative: {
    principle:
      "Marketing teases the story. Logged-in learning lets the user experience it.",

    newStudentFlow: [
      "egg_discovery",
      "egg_reacts",
      "egg_cracks",
      "cluby_hatches",
      "hangul_village",
      "vocabulary_market",
      "conversation_cafe",
    ],

    /**
     * KLOVERS World, first visit (Re, 16 Oct 2026): the egg sleeps in the
     * courtyard as always; its gate leads to Hangul Village, whose street is
     * an exhibition walked like a presentation: six boards, each unrolling
     * as the learner comes near, written in the world itself (no overlay) —
     * who Klovers is, what makes it different, the courses, how we teach,
     * why Korean, how to start. A yellow marker leads from board to board;
     * reading one holds it up close; two posts lead out to the site. The
     * learner is free to play throughout. Its words are the site's own. It adds
     * no lore, opens nothing early and changes no world order or unlock rule;
     * the egg still hatches only on real progress, and Cluby is untouched.
     */
    worldFirstVisitTour: "hangul_village_street_exhibition",

    existingStudentFlow: {
      rule:
        "Never force experienced users to replay beginner progression.",

      catchupMoment:
        "You've already learned enough to wake him.",

      action:
        "unlock_cluby_and_map_story_state_to_existing_learning_progress",
    },
  },

  guards: {
    never: [
      "turn_cluby_into_a_pet",
      "make_the_human_characters_romantic_by_default",
      "introduce_random_magic_unrelated_to_learning",
      "unlock_story_through_random_clicking",
      "invent_learning_progress",
      "make_cluby_know_every_answer",
      "replace_real_teachers_with_story_characters",
      "turn_the_entire_ui_into_a_cartoon",
      "introduce_new_major_lore_without_updating_this_file",
      "change_character_design_without_updating_character_bible",
      "use_random_brand_colors",
    ],

    always: [
      "connect_story_progress_to_learning_progress",
      "keep_learning_primary",
      "keep_cluby_mysterious_but_supportive",
      "preserve_character_roles",
      "preserve_visual_style",
      "preserve_existing_student_progress",
      "use_real_data_for_progress_and_unlocks",
      "keep_arabic_and_english_first_class",
    ],
  },
} as const;

export type StoryFeatureProposal = {
  usesLearningProgress: boolean;
  changesCharacterRelationship: boolean;
  introducesNewMagic: boolean;
  introducesNewMajorLore: boolean;
  replacesRealTeacherTrust: boolean;
  usesApprovedVisualStyle: boolean;
  usesApprovedColors: boolean;
};

export function validateKloversStoryFeature(
  proposal: StoryFeatureProposal
) {
  const violations: string[] = [];

  if (!proposal.usesLearningProgress) {
    violations.push(
      "Story progression must connect to real learning progress."
    );
  }

  if (proposal.changesCharacterRelationship) {
    violations.push(
      "Established character relationships cannot change without updating canon."
    );
  }

  if (proposal.introducesNewMagic) {
    violations.push(
      "Do not introduce unrelated magic. Extraordinary behaviour must remain connected to learning, memory or discovery."
    );
  }

  if (proposal.introducesNewMajorLore) {
    violations.push(
      "Major lore must first be added to KLOVERS_WORLD."
    );
  }

  if (proposal.replacesRealTeacherTrust) {
    violations.push(
      "Story characters must not replace real teacher credibility."
    );
  }

  if (!proposal.usesApprovedVisualStyle) {
    violations.push(
      "Visual execution must follow the approved KLOVERS hybrid style."
    );
  }

  if (!proposal.usesApprovedColors) {
    violations.push(
      "Use the approved KLOVERS colour system."
    );
  }

  return {
    approved: violations.length === 0,
    violations,
  };
}
