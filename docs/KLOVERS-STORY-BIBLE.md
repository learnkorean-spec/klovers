# KLOVERS Story Bible

This is the human-readable version of the canon. The code version — the one
that features are actually checked against — lives at
`src/config/klovers-world.ts`. If the two ever disagree, the `.ts` file wins;
fix this document to match it, not the other way around.

Do not add lore here that isn't in `klovers-world.ts`. This file documents the
canon; it doesn't extend it.

## 1. Story summary

Two foreign learners come to Korea to learn Korean. They're friends and study
companions — not a couple. During their journey they find a mysterious ivory
egg marked with a small green four-leaf clover, in a quiet hanok library or
courtyard. The egg is dormant, but it reacts to genuine Korean learning:

- Their first meaningful Korean word → a small crack appears.
- Their first complete Korean sentence → the egg glows a soft KLOVERS yellow.
- Their first short conversation milestone → the egg hatches.

Cluby is inside. His first word is **안녕!** ("hello").

The core feeling the product is built around:

> "The more Korean I learn, the more of this world I can understand and
> explore."

The underlying loop: **LEARN → PRACTISE → MASTER → WORLD REACTS → DISCOVER →
UNLOCK → CONTINUE.**

## 2. Origin of Cluby

Cluby is not a pet. He's the learners' third friend and companion, and he's
tied to learning, memory, discovery, progress, rewards, and Korean places and
culture.

He doesn't remember where he came from. As the learners make real progress,
pieces of his memory gradually return — this is a slow-burn mystery
(**"The Forgotten Clovers"**), never a fast reveal, and it must never block or
distract from actual learning. Cluby is also never written as knowing every
answer — he's a companion and a memory-keeper, not an oracle.

### When a visitor may see Cluby before the egg hatches

The rule is that nobody sees Cluby until his egg hatches. It is absolute in the
**logged-in product**, and relaxed on **marketing pages** — deliberately, by
Re's decision of 25 Sep 2026. This was previously written only in a comment in
`EggTeaser.tsx`; it now also lives in `KLOVERS_WORLD.originStory.clubyVisibility`.

**Gated until hatch (no account, no Cluby — the egg stands in):** `/games`, the
game-worlds hub, the games leaderboard, and the XP celebration. This protects
the reveal: the hatch has to be earned from real learning.

**Allowed before hatch (the page is a teaser, not the reveal):** the homepage
hero, "More than a class", the community band, the final CTA, and the 404
pages. To a stranger he is a known quantity, not a discovery.

**Never on the egg-teaser beat.** That beat is where the mystery is on the
table, so Cluby stays in the egg there — this is homepage narrative slot 8's
`explicitlyExclude`, and the exception above does not touch it.

## 3. Human character relationship

The two learners are **friends and study companions**. This is the default and
it stays the default — no romantic framing, touching, hand-holding, or
couple-style posing unless the canon is deliberately updated first.

- **Adam** (آدم / 아담), the male learner — brings structure, learning
  strategy, confidence, explanation.
- **Lina** (لينا / 리나), the female learner — brings curiosity, culture,
  real-life context, stories, emotional warmth.
- **Cluby** — turns learning into discovery and memory.
- **Minsu** (مين سو / 민수) — a Korean friend and conversation partner of the
  two learners, from the Book 1 conversations (Re, 27 Sep 2026). A native
  speaker to practise with: never a teacher, never a love interest. His look
  follows the Book 1 artwork (27 Sep 2026): short black hair, pale periwinkle
  shirt with rolled sleeves, near-black trousers, navy lanyard with a white card.

The learners' names are Re's decision of 27 Sep 2026 (`characters.maleLearner.name`
and `characters.femaleLearner.name` in the code canon). Use exactly these
spellings in every language.

## 4. Role of each character

| Character | Roles | Never used as |
|---|---|---|
| Cluby | companion, memory keeper, discovery guide, motivation, reward guide | a pet, an all-knowing teacher, random decoration, "baby mascot" only, comic relief only |
| Adam (male learner) | structure, learning strategy, confidence, progress, explanation | — |
| Lina (female learner) | curiosity, culture, real-life context, stories, emotional warmth | — |
| Minsu (Korean friend) | native-speaker friend, conversation partner, everyday Korean | a teacher, a romantic interest |

### New Korean people over time (Book 1)

Re's decision, 4 Nov 2026: the story must keep introducing new Korean people
as Book 1's 24 classes move forward, not just Minsu repeated every lesson.
Each one follows the exact Minsu precedent — a native speaker tied to that
class's own grammar/vocabulary, never a teacher, never a romantic interest —
and all of them live inside Book 1's one world, Vocabulary Market, so this is
additive content, not a new world or a change to the trio's relationships.
Names/roles are approved as a draft (`supportingKoreanCast.book1` in the code
canon); full visual direction is still undecided and must be pinned down
before any of them appear in production artwork, not just model-lesson
mockups.

| Class | New character | Role |
|---|---|---|
| 3 — places & direction verbs | Jihoon (지훈) | passerby who gives directions |
| 7–8 — numbers, prices, shopping | Ms. Park (박 아주머니) | Vocabulary Market vendor |
| 9 — formal speech | Mr. Kim (김 선생님) | information-desk clerk (never a teacher) |
| 10 — polite requests | Yuna (유나) | café barista (previews Conversation Café without unlocking it early) |
| 16 — time & date | Seoyeon (서연) | classmate making plans |
| 19–21 — suggestions, plans, reasons | Taeyang (태양) | friend proposing a weekend trip |
| 22–23 — requests, ability | Hana (하나) | neighbor / housemate |

Full detail: `claude/klovers-book1-model-lessons-plan.md` (Claude Project docs).

## 5. Current worlds (in unlock order)

1. **Hangul Village** — the Korean writing/sound system. Lead: male learner +
   Cluby. Unlocks as the initial learning world.
2. **Vocabulary Market** — connects learned vocabulary to visible everyday
   objects (food, objects, numbers, daily life). Lead: female learner +
   Cluby. Unlocks after the core Hangul milestone.
3. **Conversation Café** — turns vocabulary into real usable conversation
   (greetings, ordering, short exchanges). Lead: both learners, Cluby
   supporting. Unlocks at the conversation-readiness milestone.
4. **Cluby's Memory Garden** (حديقة ذاكرة كلوبي) — spaced repetition and
   review, reframed as Cluby holding onto things the learner might be
   starting to forget. Lead: Cluby alone. Unlocks once there's enough review
   data. It is **not a level stop** on the journey map (see below).
5. **Culture Street** — everyday Korean culture, etiquette, traditions. Lead:
   female learner + Cluby. Unlocks after the beginner language foundation is
   complete.
6. **Seoul Journey** — transport, directions, shopping, restaurants, social
   situations, all connected. Lead: all three. Unlocks at intermediate
   real-world readiness.

Each world's `unlockRule` and `narrativeEffect` are defined precisely in the
code file — nothing here should be treated as looser than that.

### Course levels on the journey map (`levelJourney`)

Re's decision, 24 Sep 2026. The seven course levels walk through the worlds
in order; the Memory Garden sits beside the journey as a review place.

| Course level | World |
|---|---|
| Hangul | Hangul Village |
| Level 1 | Vocabulary Market |
| Level 2 | Conversation Café |
| Level 3 | Culture Street |
| Level 4 | Seoul Journey · Part 1 |
| Level 5 | Seoul Journey · Part 2 |
| Level 6 | Seoul Journey · Part 3 |

Cluby's name: **Cluby** / **كلوبي** (Arabic spelling everywhere).

## 6. Future mystery

**"The Forgotten Clovers"** — Cluby eventually finds traces suggesting he may
not be the only creature connected to Korean-learning memories. Reveal speed
is deliberately very slow. Rules:

- Never explain the full mystery early.
- The mystery must never block learning.
- Don't introduce dozens of collectible characters at once.
- Every discovery must connect to genuine learning progress — nothing is
  unlocked by random clicking or invented progress.

## 7. Visual style

- **Humans — marketing imagery** (site photos, hero images, icons, trust
  badges): photorealistic, natural skin and fabric. This is the rule the
  "Standing rule: the theme is always the real scenes" section below is
  about.
- **Humans — in-game 3D character** (World1/World2's walkable Adam/Lina
  rig): stylized low-poly, matching the "Environments: soft painterly
  storybook" look below — a real-time browser game can't run a true
  photorealistic human, so this is the game's own separate visual
  language, not an exception being quietly allowed. (Settled 5 Nov 2026,
  after this silently contradicted the shipped game for a while — see
  `src/config/klovers-world.ts`'s `visualSystem.humans`.)
- **Cluby**: realistic-cute 3D plush — mint-green, soft felt/fur texture,
  round head, two short butter-yellow horns, pointed ears with pink inner
  ear, warm dark-brown eyes, soft rosy cheeks, two tiny fangs, short mint
  tail with small spikes. Default outfit: ivory mini hanbok top, KLOVERS
  yellow wrap skirt, green four-leaf clover emblem.
- **Environments**: soft, painterly Korean storybook style.
- **Interface**: clean, premium, professional, minimal.
- **Never**: anime, flat-cartoon-everywhere, generic children's-game UI,
  oversaturated environments, random mascot variants, random colours outside
  the palette below.

### Standing rule: the theme is always the real scenes

**Re, 5 Oct 2026.** There is one theme, and it is photographic. The rule carries
**no size exception** — a 40px trust badge is the same theme as a 1600px hero —
so an illustrated or anime face is out even where it is small enough to read as
decoration.

That retires:

- the two illustrated trust icons, `student-boy-thumbsup` and
  `student-girl-heart`, used at 23 call sites including the homepage;
- the flat 2D Cluby set in `public/assets/characters/`, which
  `GameWorldsHub.tsx` still renders next to its own correctly-defined
  `CLUBY_3D`;
- the drawn blog covers, and the illustrated character art left in
  `src/assets/band/*.ts`, `src/assets/characters.ts` and
  `public/assets/illustrations/`.

The Book A-0 cover art being illustrated does **not** license an illustrated
style in the product; it is source material for the characters, not a style.

What the rule does not decide: an illustrated *place, object or historic scene*
— an era painting, a folk-tale monster — is a different question.

`src/config/klovers-world.ts` (`visualSystem.standingRule`) is the source of
truth and wins if the two ever disagree.

**See also:** `docs/IMAGE-STYLE-AUDIT-AR.md` — the picture-by-picture audit
behind this rule, with the exact files and the order to fix them, and
`docs/CHATGPT-PROMPTS-REAL-CHARACTERS-AR.md` for the prompts that produce the
replacements.

### Brand colours

Three brand colours plus one status colour (Re, Sep 2026; `src/index.css`
is the source of truth).

| Name | Hex | Use |
|---|---|---|
| KLOVERS Yellow | `#FFFF00` | brand ground, primary buttons |
| Charcoal | `#2E2E2E` | text and every dark surface |
| Ivory | `#FFF9EC` | calm surface |
| Neon green | `#39FF14` | status only (progress, correct, live), a fill, never text or decoration |

Retired, do not use: `#FFF000`, `#25D366`, `#BEEFCB` (soft green / mint),
`#FFB7A1` (peach). WhatsApp's own green stays only on WhatsApp buttons.

### Typography

| Use | Font |
|---|---|
| Headings | Poppins |
| English UI | Inter |
| Arabic UI | Cairo |
| Cluby's handwritten notes only | Caveat (Latin only; Arabic notes stay in Cairo) |

Handwriting is for short Cluby notes and personal story messages only — never
for buttons, navigation, metrics, or long copy.

## 8. Progression philosophy

Story progress is driven by **real learning data**, never invented or
simulated. A new feature should be able to answer all six of these before it
gets built:

1. What does the learner learn?
2. Why does this event happen now?
3. Which existing character owns this moment?
4. Which existing world does it belong to?
5. What real learner data triggers it?
6. What changes in the world afterward?

If it can't answer all six, it doesn't ship as a story feature yet.

Review/spaced-repetition is never framed as failure. Preferred framing:
"Cluby saved this for you," "let's revisit this," "we've seen this before" —
never "you failed" or "bad answer."

## 9. Forbidden story directions

- Turning Cluby into a pet.
- Making the two human learners a romantic couple by default.
- Introducing magic unrelated to learning, memory, or discovery.
- Unlocking story content through random clicking rather than real progress.
- Inventing or faking learning progress to trigger story beats.
- Writing Cluby as knowing every answer.
- Letting story characters replace real-teacher credibility (the actual
  live-class teacher stays the trust anchor, not Cluby or the learners).
- Turning the entire product UI into a cartoon.
- Adding major new lore without updating `klovers-world.ts` first.
- Changing a character's established design without updating this bible and
  the code canon together.
- Using colours outside the approved palette.

## 10. Homepage narrative (section by section)

| Order | Section | Characters | Story function |
|---|---|---|---|
| 1 | Hero | Cluby | Invitation |
| 2 | Live-class trust | (none) | Prove real teaching |
| 3 | How Klovers works | male + female learner (Cluby optional) | Show learners like the visitor |
| 4 | Learning journey | male learner + Cluby | Progression |
| 5 | Practice / games | Cluby | Practice and reward |
| 6 | Culture | female learner + Cluby | Real-world Korea |
| 7 | Scholarships | male learner + Cluby (supporting) | Real-world study path |
| 8 | Egg teaser | male + female learner (Cluby explicitly excluded) | Origin-mystery teaser |
| 9 | Final CTA | Cluby | Invite the visitor forward |

Rule of thumb: at most one primary character per ordinary section; using all
three together is reserved for major story moments.

Slot 7 (**Scholarships**, Re, 4 Oct 2026) gives the study path a destination:
the six programmes an Arabic speaker in Egypt can apply to, each linked to the
funding body's own page. The male learner owns it because this canon already
gives him structure, strategy and explanation, and an application deadline is
exactly that. It reuses **Culture Street / Seoul Journey** — no new world was
invented for it.

**The homepage teases; a real level earns the answer.** The front page says six
programmes exist and sends the visitor to the free placement test. Which
programmes that visitor's level can reach — and how many months stand between
them and each one — are shown against `profiles.course_level_key`, the level
the test itself wrote, never against a level the visitor claims. The facts
themselves stay public on `/scholarships`, in both languages, with their
sources: gating the match is a product decision, gating the facts about other
people's money would not be honest.

## 11. Logged-in product narrative

Marketing (the homepage) **teases** the story. The logged-in product is where
the learner actually **experiences** it.

**New student flow:** egg discovery → egg reacts → egg cracks → Cluby
hatches → Hangul Village → Vocabulary Market → Conversation Café.

**KLOVERS World, first visit:** the egg sleeps in the courtyard; its gate
leads to Hangul Village, whose street is an exhibition walked like a
presentation — six boards that unroll as the learner comes near, written
in the world itself: who Klovers is, what makes it different, the courses,
how we teach, why Korean, how to start. A yellow marker leads from board
to board; the learner is free to play throughout. Site's own words; no new lore;
no world order or unlock changes; the egg still hatches only on real
progress, and Cluby is untouched.

**Existing student flow:** never force a learner who already has real
progress to replay the beginner discovery sequence. Instead: "You've already
learned enough to wake him" — unlock Cluby directly and map the story state
onto their existing learning progress.
