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
  version: "1.1",

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

    maleLearner: {
      type: "foreign_korean_learner",

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

    forbiddenStyles: [
      "flat_cartoon_everywhere",
      "anime",
      "children_game_interface",
      "oversaturated_ui",
      "random_illustration_styles",
      "generic_saas_visual_identity",
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

    {
      order: 7,
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
      order: 8,
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
