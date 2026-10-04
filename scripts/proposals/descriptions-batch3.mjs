#!/usr/bin/env node
/**
 * descriptions-batch3.mjs - Gate 2 Step 5, batch 3: the remainder.
 *
 * Batch 2 took every description ending in an ellipsis or running past 160
 * characters. These 29 are what was left: rows whose ONLY defect is a prefix
 * repeating the article's own title. All 29 are Arabic.
 *
 *   defective descriptions, 200 published articles, measured 2026-09-04
 *     before batch 1   75
 *     after batch 1    52   (23 Latin-script rows)
 *     after batch 2    29   (46 rows)
 *     after this        0
 *
 * Precondition is stillDefective() from batch 2, imported rather than copied:
 * a row is edited only if it still has the defect, so a description someone has
 * already rewritten is skipped and reported, never overwritten.
 *
 * Machine translations corrected here:
 *   "مقاهي القطط والجمل"       camel cafes. Korea's are 양 카페 - sheep.
 *   "احتل محادثاتك"            "occupy your conversations", from "own your ...".
 *   "الموضوع مقابل الموضوع"    "topic vs topic" - subject and topic collapsed.
 *   "الجسيمات" / "جوسا"        조사 as physics particles, or left untranslated.
 * Brand and exam tokens stay Latin (K-Drama, K-Pop, TOPIK) per the batch-2 rule.
 *
 * Dropped from korean-skincare-kbeauty-routine-guide-ar: a claim about which
 * nationality of women has the best skin. Not something to put under a search
 * result; replaced with what the routine actually is.
 *
 * HARD CONSTRAINT: description only. Never title, slug, keywords or content.
 */
import { pathToFileURL } from "node:url";
import { writeProposal } from "../lib/content-edit.mjs";
import { createReadOnlyStore } from "../lib/content-edit-supabase-store.mjs";
import { stillDefective, BOILERPLATE } from "./descriptions-batch2.mjs";

export const EDITS = [
  { slug: "ar-korean-cafe-culture", lang: "ar", after: "اكتشف عالم المقاهي الكورية: من مقاهي القطط والحيوانات إلى فن اللاتيه، ودليل عملي لثقافة القهوة التي غيّرت شكل المدينة في كوريا." },
  { slug: "ar-korean-daily-greetings", lang: "ar", after: "أهم ٤٠ تحية وعبارة يومية بالكورية مع النطق الصحيح وأمثلة عملية على كل واحدة، مناسبة للمبتدئين الناطقين بالعربية." },
  { slug: "ar-korean-grammar-particles", lang: "ar", after: "أهم أدوات الربط في الكورية (조사): أداة الفاعل والمفعول والموضوع والمكان، مع أمثلة عملية للناطقين بالعربية." },
  { slug: "ar-korean-numbers-guide", lang: "ar", after: "نظاما الأرقام في الكورية: الأرقام الكورية الأصيلة والأرقام الصينية-الكورية، ومتى تستخدم كل نظام، مع أمثلة على العدّ اليومي." },
  { slug: "ar-learn-korean-alphabet-hangul", lang: "ar", after: "تعلّم الأبجدية الكورية هانغول في يوم واحد: دليل خطوة بخطوة لكل الحروف والنطق، مكتوب للناطقين بالعربية." },
  { slug: "ar-study-korean-kdramas-method", lang: "ar", after: "كيف تتعلّم الكورية أثناء مشاهدة K-Drama: طريقة مجرّبة تحوّل وقت المشاهدة إلى تحسّن حقيقي في الاستماع والمفردات والنطق." },
  { slug: "ar-topik-exam-guide", lang: "ar", after: "دليل شامل لاختبار TOPIK الكوري: الفرق بين TOPIK I وTOPIK II، وكيفية التسجيل، ونصائح الدراسة ومصادر التحضير للناطقين بالعربية." },
  { slug: "best-free-resources-learn-korean-online-2026-ar", lang: "ar", after: "قائمة شاملة بأفضل التطبيقات والمواقع والقنوات المجانية لتعلّم الكورية في ٢٠٢٦، مرتّبة حسب المستوى حتى تختار الأنسب لك." },
  { slug: "best-kdrama-learn-korean-difficulty-ranked-ar", lang: "ar", after: "١٥ دراما كورية شهيرة مرتّبة حسب صعوبة التعلّم، من المبتدئ إلى المتقدم، مع مفردات كل دراما ونصائح للمشاهدة." },
  { slug: "how-to-learn-korean-faster-ar", lang: "ar", after: "١٠ استراتيجيات مدعومة بالأبحاث لتعلّم الكورية أسرع، للمبتدئين والمستوى المتوسط، مع تحدٍّ من ٣٠ يومًا وروتين مذاكرة يومي." },
  { slug: "jeoseung-saja-korean-grim-reaper-symbolism-ar", lang: "ar", after: "حاصد الأرواح الكوري جيوسيونغ ساجا: أصله وواجباته ورمزيته في الفولكلور الكوري، وحضوره الدائم في الدراما الكورية." },
  { slug: "kdrama-korean-phrases-beginners-ar", lang: "ar", after: "٣٠ عبارة كورية شائعة في الدراما مع معناها الحقيقي وكيفية استخدامها في الحياة اليومية، مناسبة للمبتدئين." },
  { slug: "korean-cafe-coffee-culture-ar", lang: "ar", after: "عالم المقاهي الكورية: من مقاهي القطط إلى مقاهي الرسم والكتب، وكيف صارت ثقافة القهوة جزءًا أساسيًا من الحياة في كوريا." },
  { slug: "korean-daily-greetings-ar", lang: "ar", after: "٤٠ تحية وعبارة كورية يومية مع النطق والاستخدام الصحيح، من الصباح حتى المساء، لتبدأ محادثاتك بالكورية بثقة." },
  { slug: "korean-easier-than-japanese-chinese-ar", lang: "ar", after: "مقارنة بين الكورية واليابانية والصينية من منظور متعلّم عربي: ما الأسهل فعلًا، وأين تبدأ الصعوبة في كل لغة." },
  { slug: "korean-for-arabic-speakers-difficulty-guide-ar", lang: "ar", after: "مقارنة لغوية بين العربية والكورية: ما الصعوبات الحقيقية التي تواجه الناطق بالعربية، وما المفاجآت الإيجابية التي سيجدها." },
  { slug: "korean-ghost-stories-chilling-legends-ar", lang: "ar", after: "سبع قصص أشباح كورية شهيرة: أشباح العذارى وأرواح الماء وأساطير الغويشين التي ألهمت أفلام الرعب والدراما الكورية." },
  { slug: "korean-job-interview-phrases-ar", lang: "ar", after: "تحضّر لمقابلة عمل بالكورية؟ مفردات المقابلة الأساسية والأسئلة الشائعة وإجاباتها وآداب السلوك المهني في كوريا." },
  { slug: "korean-question-words-guide-ar", lang: "ar", after: "أتقن كلمات السؤال الكورية: من وماذا وأين ومتى ولماذا وكيف، مع أكثر من ٥٠ جملة حقيقية وأمثلة من الدراما الكورية." },
  { slug: "korean-restaurant-ordering-phrases-guide-ar", lang: "ar", after: "أكثر من ٦٠ عبارة أساسية للمطاعم الكورية: كيف تطلب الطعام وتطلب الحساب وتتعامل مع الأطباق الحارة في سيول بثقة." },
  { slug: "korean-sentence-structure-word-order-guide-ar", lang: "ar", after: "بنية الجملة الكورية بوضوح: ترتيب فاعل-مفعول-فعل، والفرق بين الفاعل والموضوع، والأدوات، مع أكثر من ٢٠ مثالًا للمبتدئين." },
  { slug: "korean-skincare-kbeauty-routine-guide-ar", lang: "ar", after: "روتين العناية بالبشرة الكوري المكوّن من ١٠ خطوات: ماذا تفعل كل خطوة، وأي المنتجات تهمّ فعلًا، والفلسفة الكامنة وراءه." },
  { slug: "korean-slang-words-ar", lang: "ar", after: "أشهر الكلمات العامية الكورية المستخدمة في الدراما ووسائل التواصل، مع معناها الحقيقي ودرجة رسميتها وكيفية استخدامها." },
  { slug: "korean-songs-to-learn-korean-2026-ar", lang: "ar", after: "قائمة منتقاة من أفضل الأغاني الكورية لتعلّم اللغة: نطق واضح ومفردات يومية وكلمات بسيطة يمكن متابعتها من أول استماع." },
  { slug: "korean-speech-levels-honorifics-guide-ar", lang: "ar", after: "مستويات الكلام السبعة في الكورية وكيفية استخدامها: متى تتكلّم بشكل رسمي ومتى تكون عاديًا في المجتمع الكوري." },
  { slug: "korean-workplace-business-culture-ar", lang: "ar", after: "دليل شامل لثقافة العمل في كوريا الجنوبية: التسلسل الهرمي وعلاقات الزملاء وعادات بيئة العمل وما يُتوقّع من الموظف الجديد." },
  { slug: "learn-korean-through-kpop-bts-blackpink-ar", lang: "ar", after: "كيف تستخدم موسيقى K-Pop كأداة فعّالة لتعلّم الكورية: طرق عملية تحوّل حبّك للأغاني إلى كفاءة لغوية حقيقية." },
  { slug: "seoul-travel-korean-phrases-ar", lang: "ar", after: "أهم العبارات الكورية التي تحتاجها في رحلتك إلى سيول: من المطار والفندق إلى المطاعم والمترو، مع النطق لكل عبارة." },
  { slug: "study-korean-kdramas-method-ar", lang: "ar", after: "الطريقة العملية لتعلّم الكورية من الدراما الكورية: خطوات محدّدة تحوّل وقت المشاهدة إلى جلسات تعلّم فعّالة." },
];

export function validateEdits(edits) {
  const seen = new Set();
  for (const e of edits) {
    if (seen.has(e.slug)) throw new Error(`descriptions-batch3: duplicate edit for ${e.slug}`);
    seen.add(e.slug);
    const n = Array.from(e.after).length;
    if (n > 160) throw new Error(`descriptions-batch3: ${e.slug} is ${n} chars, over the 160 limit`);
    if (n < 70) throw new Error(`descriptions-batch3: ${e.slug} is ${n} chars, too short to be useful`);
    if (/(\.\.\.|…)\s*$/.test(e.after.trim())) throw new Error(`descriptions-batch3: ${e.slug} still ends in an ellipsis`);
    if (e.after.includes(BOILERPLATE)) throw new Error(`descriptions-batch3: ${e.slug} still carries the boilerplate tail`);
    if (/^.{1,45}? — /.test(e.after)) throw new Error(`descriptions-batch3: ${e.slug} still opens with a dash-separated prefix`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateEdits(EDITS);
  const store = createReadOnlyStore();
  const edits = [];
  const skipped = [];
  for (const e of EDITS) {
    const live = await store.readRow(e.slug);
    if (!live) { skipped.push(`${e.slug}: no such published row`); continue; }
    const current = live.description || "";
    if (!stillDefective(current, live.title)) { skipped.push(`${e.slug}: live description is no longer defective - not overwriting`); continue; }
    if (current === e.after) { skipped.push(`${e.slug}: already has this exact value`); continue; }
    edits.push({ slug: e.slug, lang: e.lang, column: "description", before: current, after: e.after });
  }
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} of ${EDITS.length}:`);
    for (const s of skipped) console.log(`  ${s}`);
    console.log("");
  }
  if (edits.length === 0) {
    console.log("Nothing to propose - every description in this batch has already been repaired.");
    process.exit(0);
  }
  const { batchId, jsonPath, mdPath, proposal } = await writeProposal({
    source: "scripts/proposals/descriptions-batch3.mjs",
    description: `Gate 2 Step 5 batch 3 - repair the last ${edits.length} defective meta descriptions. These are the rows whose only defect is a stuffed keyword prefix repeating the article's own title, so batch 2 (ellipsis and over-160) did not reach them. All are Arabic. Measured 2026-09-04 across 200 published articles: 75 defective before batch 1, 52 after it, 29 after batch 2, 0 after this. Replacements are hand-written, 102-127 characters, complete sentences, and correct four machine-translation errors including camel cafes for sheep cafes and "topic vs topic" for subject vs topic. Brand and exam tokens stay in Latin script. description column only; title, slug, keywords and content untouched.`,
    edits,
  }, store);
  console.log(`Proposal ${batchId}: ${proposal.editCount} edits (${proposal.staleCount} stale).`);
  console.log(`  ${jsonPath}`);
  console.log(`  ${mdPath}`);
  console.log(`Nothing has been written to the database.`);
}
