import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSpeech } from "@/hooks/useSpeech";
import {
  GraduationCap, BookOpen, Mic, ListChecks, Volume2,
  ChevronLeft, ChevronRight, CheckCircle2, RotateCcw, Play,
  Brain, Timer, FolderOpen, FileText, Languages, Layers,
  Shuffle, Eye, EyeOff, ArrowLeft, Clock, Star, Plus, Trash2, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* âââ Data: Self-Introduction Script (line-by-line) âââ */

interface ScriptLine {
  id: number;
  korean: string;
  english: string;
  section: string;
}

const SELF_INTRO_LINES: ScriptLine[] = [
  { id: 1, section: "Greeting", korean: "ìëíì¸ì, ì  ì´ë¦ì ë¦¬í¨ìëë¤.", english: "Hello, my name is Reham." },
  { id: 2, section: "Education", korean: "ì ë ì´ì§í¸ ì¶ì ì´ë©°, ìì¸ì´ì¤ ëíêµìì íêµ­ì´í ë° íêµ­ë¬¸íì ì ê³µíìµëë¤.", english: "I am from Egypt and majored in Korean Linguistics and Literature at Ain Shams University." },
  { id: 3, section: "Summary", korean: "ì ë 13ë ì´ìì êµ­ì  ê²½íì ê°ì§ Operations ë° Sales Operations ì ë¬¸ê°ìëë¤.", english: "I am an Operations and Sales Operations specialist with over 13 years of international experience." },
  { id: 4, section: "Summary", korean: "ì´ì§í¸, ë§ë ì´ìì, íê°ë¦¬ìì ê·¼ë¬´íë©° ë¤ìí ì°ì ë¶ì¼ìì ê²½ë ¥ì ìììµëë¤.", english: "I have built my career across diverse industries, working in Egypt, Malaysia, and Hungary." },
  { id: 5, section: "Summary", korean: "íì¬ë ì¹ ê°ë°ê³¼ ëì§í¸ íë¡ì í¸ë í¨ê» ì§ííê³  ììµëë¤.", english: "Currently, I am also working on web development and digital projects." },
  { id: 6, section: "Projects", korean: "í¹í Explore-Saudi íë¡ì í¸ììë ì¹ì¬ì´í¸ êµ¬ì¡° ì¤ê³, SEO ìµì í, ê·¸ë¦¬ê³  ë°ì´í° íì§ ê°ì ì ì§ì  ë´ë¹íìµëë¤.", english: "In the Explore-Saudi project, I was directly responsible for website structure design, SEO optimization, and data quality improvement." },
  { id: 7, section: "Languages", korean: "ìëì´, íêµ­ì´, ìì´ë¥¼ í¬í¨íì¬ 6ê° ì¸ì´ë¥¼ êµ¬ì¬í  ì ìì¼ë©°, ì¬ë¬ ì¸ì´ íê²½ìì ì¼í´ìê¸° ëë¬¸ì ì¸ì´ì ì íì±ê³¼ ë§¥ë½ì ì¤ìì±ì ì ì´í´íê³  ììµëë¤.", english: "I speak 6 languages including Arabic, Korean, and English, and having worked in multilingual environments, I understand the importance of language accuracy and context." },
  { id: 8, section: "Motivation", korean: "ì´ ì­í ì ê´ì¬ì´ ìë ì´ì ë ë°ì´í° íì§ì´ AI ìì¤íì ì±ë¥ì ì§ì ì ì¸ ìí¥ì ì¤ë¤ê³  ìê°íê¸° ëë¬¸ìëë¤.", english: "I am interested in this role because I believe data quality directly impacts AI system performance." },
  { id: 9, section: "Motivation", korean: "ì ë ì´ì  ê²½íì íµí´ ì íì±ê³¼ ì¼ê´ì±ì ì ì§íë ê²ì´ ì¼ë§ë ì¤ìíì§ ë°°ì ìµëë¤.", english: "Through my previous experience, I learned how important it is to maintain accuracy and consistency." },
  { id: 10, section: "Accenture", korean: "Accentureìì ì½íì¸  ëª¨ëë ì´í°ë¡ ê·¼ë¬´íë©´ì íë£¨ ìµë 800ê°ì ë°ì´í°ë¥¼ ì²ë¦¬íë©° 95% ì´ìì ì íëë¥¼ ì ì§íìµëë¤.", english: "As a content moderator at Accenture, I processed up to 800 data items per day while maintaining over 95% accuracy." },
  { id: 11, section: "Kerry", korean: "ëí Kerryìì F&B ë¶ì¼ ë¤êµ­ì  ê³ ê°ì¬ì ì£¼ë¬¸ ê´ë¦¬ë¥¼ ë´ë¹íë©° ì 1,000ê±´ ì´ìì ì£¼ë¬¸ì 96% ì´ìì ì íëë¡ ê´ë¦¬íìµëë¤.", english: "At Kerry, I managed order operations for multinational F&B clients, handling over 1,000 orders per month with over 96% accuracy." },
  { id: 12, section: "Kerry", korean: "ì´ë¬í ê²½íì íµí´ ëë ë°ì´í° ìììë ëì íì§ì ì ì§íë ë¥ë ¥ì ê°ì¶ê² ëììµëë¤.", english: "Through these experiences, I developed the ability to maintain high quality even with large volumes of data." },
  { id: 13, section: "Web Dev", korean: "ëí ì¹ ê°ë° íë¡ì í¸ììë SEOì ì½íì¸  êµ¬ì¡°ë¥¼ ìµì ííë©° ë°ì´í°ì ì¼ê´ì±ê³¼ ì íì±ì ì§ìì ì¼ë¡ ê°ì íìµëë¤.", english: "In web development projects, I continuously improved data consistency and accuracy by optimizing SEO and content structure." },
  { id: 14, section: "Strengths", korean: "ì  ê°ì ì ì¸ë¶ ì¬í­ì ëí ëì ì§ì¤ë ¥ê³¼ ì²´ê³ì ì¸ ë¶ì ë¥ë ¥ìëë¤.", english: "My strengths are a high level of attention to detail and systematic analytical ability." },
  { id: 15, section: "Strengths", korean: "ëí ë¤ìí ë¬¸íì ì¸ì´ íê²½ìì íìí´ì¨ ê²½íì ë°íì¼ë¡, ë§¥ë½ì ì´í´íë©° ë°ì´í°ë¥¼ íê°í  ì ììµëë¤.", english: "With experience collaborating in diverse cultural and linguistic environments, I can evaluate data with contextual understanding." },
  { id: 16, section: "Strengths", korean: "ìë¡ì´ ìì¤íìë ë¹ ë¥´ê² ì ìíë í¸ìëë¤.", english: "I also adapt quickly to new systems." },
  { id: 17, section: "Closing", korean: "ì´ ê¸°íë¥¼ ì£¼ìì ê°ì¬í©ëë¤. ì  ê²½íê³¼ ì¸ì´ ë¥ë ¥ì íµí´ ì´ ì­í ì ìë¯¸ ìë ê¸°ì¬ë¥¼ í  ì ìë¤ê³  ìê°í©ëë¤. ê°ì¬í©ëë¤.", english: "Thank you for this opportunity. I believe I can make a meaningful contribution to this role through my experience and language skills. Thank you." },
];

/* âââ Data: Interview Conversation Exchanges âââ */

interface ConversationExchange {
  id: number;
  topic: string;
  interviewer: { korean: string; english: string };
  reham: { korean: string; english: string };
}

const CONVERSATION_DATA: ConversationExchange[] = [
  /* ââ Opening & Introduction ââ */
  {
    id: 1,
    topic: "Self Introduction",
    interviewer: { korean: "ìê¸°ìê°ë¥¼ í´ ì£¼ì¸ì.", english: "Please introduce yourself." },
    reham: {
      korean: "ìëíì¸ì, ì  ì´ë¦ì ë¦¬í¨ìëë¤. ì ë ì´ì§í¸ ì¶ì ì´ë©°, ìì¸ì´ì¤ ëíêµìì íêµ­ì´í ë° íêµ­ë¬¸íì ì ê³µíìµëë¤. 13ë ì´ìì êµ­ì  ê²½íì ê°ì§ Operations ë° Sales Operations ì ë¬¸ê°ì´ë©°, ì´ì§í¸, ë§ë ì´ìì, íê°ë¦¬ìì ê·¼ë¬´í ê²½íì´ ììµëë¤. íì¬ë ì¹ ê°ë°ê³¼ ëì§í¸ íë¡ì í¸ë í¨ê» ì§ííê³  ììµëë¤.",
      english: "Hello, my name is Reham. I am from Egypt and majored in Korean Linguistics and Literature at Ain Shams University. I am an Operations and Sales Operations specialist with over 13 years of international experience, having worked in Egypt, Malaysia, and Hungary. I am currently also working on web development and digital projects.",
    },
  },
  {
    id: 2,
    topic: "Relevant Experience",
    interviewer: { korean: "ê´ë ¨ ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Please tell me about your relevant experience." },
    reham: {
      korean: "ì¬ë¬ ì¸ì´ íê²½ìì ì¼í´ìê¸° ëë¬¸ì ì¸ì´ì ì íì±ê³¼ ë§¥ë½ì ì¤ìì±ì ì ì´í´íê³  ììµëë¤. í¹í Explore-Saudi íë¡ì í¸ììë ì¹ì¬ì´í¸ êµ¬ì¡° ì¤ê³, SEO ìµì í, ê·¸ë¦¬ê³  ë°ì´í° íì§ ê°ì ì ì§ì  ë´ë¹íìµëë¤.",
      english: "Having worked in multilingual environments, I understand the importance of language accuracy and context. In the Explore-Saudi project, I was directly responsible for website structure design, SEO optimization, and data quality improvement.",
    },
  },
  /* ââ Performance & Metrics ââ */
  {
    id: 3,
    topic: "Data Accuracy",
    interviewer: { korean: "ë°ì´í° ì²ë¦¬ ì íëì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Please tell me about your data handling accuracy." },
    reham: {
      korean: "Accentureìì ì½íì¸  ëª¨ëë ì´í°ë¡ ê·¼ë¬´íë©´ì íë£¨ ìµë 800ê°ì ë°ì´í°ë¥¼ ì²ë¦¬íë©° 95% ì´ìì ì íëë¥¼ ì ì§íìµëë¤. ëí Kerryììë ì 1,000ê±´ ì´ìì ì£¼ë¬¸ì 96% ì´ìì ì íëë¡ ê´ë¦¬íìµëë¤.",
      english: "At Accenture, I processed up to 800 data items per day as a content moderator while maintaining over 95% accuracy. At Kerry, I managed over 1,000 orders per month with over 96% accuracy.",
    },
  },
  {
    id: 4,
    topic: "KPI & Targets",
    interviewer: { korean: "ì´ì  ì§ì¥ìì ì´ë¤ KPIë¥¼ ê´ë¦¬íì¼ë©°, ëª©íë¥¼ ì´ë»ê² ë¬ì±íìµëê¹?", english: "What KPIs did you manage at your previous job, and how did you achieve your targets?" },
    reham: {
      korean: "ì£¼ì KPIë ë°ì´í° ì íë, ì¼ì¼ ì²ë¦¬ë, ê·¸ë¦¬ê³  ìëµ ìê°ì´ììµëë¤. ì ë ì²´í¬ë¦¬ì¤í¸ ê¸°ë°ì ê²ì¦ íë¡ì¸ì¤ë¥¼ ëìíì¬ ì¤ë¥ì¨ì 50% ì´ì ì¤ììµëë¤. ëí ì°ì ììë¥¼ ì í´ ê¸´ê¸ ê±´ì ë¨¼ì  ì²ë¦¬íë ìì¤íì ë§ë¤ììµëë¤.",
      english: "Key KPIs were data accuracy, daily throughput, and response time. I introduced a checklist-based verification process that reduced the error rate by over 50%. I also created a prioritization system to handle urgent cases first.",
    },
  },
  /* ââ Strengths & Weaknesses ââ */
  {
    id: 5,
    topic: "Strengths",
    interviewer: { korean: "ë³¸ì¸ì ê°ì ì ë¬´ììëê¹?", english: "What are your strengths?" },
    reham: {
      korean: "ì  ê°ì ì ì¸ë¶ ì¬í­ì ëí ëì ì§ì¤ë ¥ê³¼ ì²´ê³ì ì¸ ë¶ì ë¥ë ¥ìëë¤. ëí ë¤ìí ë¬¸íì ì¸ì´ íê²½ìì íìí´ì¨ ê²½íì ë°íì¼ë¡, ë§¥ë½ì ì´í´íë©° ë°ì´í°ë¥¼ íê°í  ì ììµëë¤. ìë¡ì´ ìì¤íìë ë¹ ë¥´ê² ì ìíë í¸ìëë¤.",
      english: "My strengths are a high level of attention to detail and systematic analytical ability. With experience collaborating across diverse cultural and linguistic environments, I can evaluate data with contextual understanding. I also adapt quickly to new systems.",
    },
  },
  {
    id: 6,
    topic: "Weaknesses",
    interviewer: { korean: "ë³¸ì¸ì ì½ì ì ë¬´ìì´ë¼ê³  ìê°íìëì?", english: "What do you consider your weaknesses?" },
    reham: {
      korean: "ëëë¡ ìë²½ì£¼ìì ì¸ ì±í¥ ëë¬¸ì íëì ììì íì ì´ìì¼ë¡ ìê°ì í¬ìíë ê²½í¥ì´ ìììµëë¤. ì´ë¥¼ ê°ì íê¸° ìí´ íìë°ì± ê¸°ë²ì íì©íê³ , íì§ê³¼ í¨ì¨ì±ì ê· íì ë§ì¶ë ì°ìµì íê³  ììµëë¤.",
      english: "I sometimes tend to spend more time than necessary on a task due to perfectionism. To improve this, I've been using timeboxing techniques and practicing how to balance quality with efficiency.",
    },
  },
  /* ââ Motivation & Company Fit ââ */
  {
    id: 7,
    topic: "Why This Role",
    interviewer: { korean: "ì ì´ ì§ë¬´ì ê´ì¬ì´ ìì¼ì ê°ì?", english: "Why are you interested in this role?" },
    reham: {
      korean: "ì´ ì­í ì ê´ì¬ì´ ìë ì´ì ë ë°ì´í° íì§ì´ AI ìì¤íì ì±ë¥ì ì§ì ì ì¸ ìí¥ì ì¤ë¤ê³  ìê°íê¸° ëë¬¸ìëë¤. ì ë ì´ì  ê²½íì íµí´ ì íì±ê³¼ ì¼ê´ì±ì ì ì§íë ê²ì´ ì¼ë§ë ì¤ìíì§ ë°°ì ìµëë¤.",
      english: "I am interested in this role because I believe data quality directly impacts AI system performance. Through my previous experience, I learned how important it is to maintain accuracy and consistency.",
    },
  },
  {
    id: 8,
    topic: "Why This Company",
    interviewer: { korean: "ì ì í¬ íì¬ì ì§ìíì¨ëì?", english: "Why did you apply to our company?" },
    reham: {
      korean: "ê·ì¬ë AI ê¸°ì  ë¶ì¼ìì íì ì ì¸ ì±ê³¼ë¥¼ ì´ë£¨ê³  ìì¼ë©°, ë°ì´í° íì§ì ëì ê¸°ì¤ì ëê³  ìë¤ê³  ìê³  ììµëë¤. ì ì ë°ì´í° ê´ë¦¬ ê²½íê³¼ ë¤êµ­ì´ ë¥ë ¥ì´ ê·ì¬ì ê¸ë¡ë² íë¡ì í¸ì ê¸°ì¬í  ì ìë¤ê³  íì í©ëë¤.",
      english: "I understand your company is achieving innovative results in AI technology and maintains high standards for data quality. I am confident that my data management experience and multilingual abilities can contribute to your global projects.",
    },
  },
  /* ââ Behavioral Questions (STAR Method) ââ */
  {
    id: 9,
    topic: "Problem Solving",
    interviewer: { korean: "ì´ë ¤ì´ ë¬¸ì ë¥¼ í´ê²°íë ê²½íì ë§ìí´ ì£¼ì¸ì.", english: "Tell me about a time you solved a difficult problem." },
    reham: {
      korean: "Kerryìì ì£¼ë¬¸ ì¤ë¥ì¨ì´ ê°ìê¸° ì¦ê°íì ë, ì ë ë°ì´í°ë¥¼ ë¶ìíì¬ í¹ì  ê³µê¸ìì²´ì ìë ¥ íì ë³ê²½ì´ ìì¸ìì íìíìµëë¤. ì¦ì ê²ì¦ ê·ì¹ì ìë°ì´í¸íê³  íì êµì¡ì ì¤ìíì¬ ì¼ì£¼ì¼ ë´ì ì¤ë¥ì¨ì ì ì ìì¤ì¼ë¡ ë³µìíìµëë¤.",
      english: "When order error rates suddenly increased at Kerry, I analyzed the data and identified that a specific supplier's input format change was the cause. I immediately updated validation rules and trained the team, restoring error rates to normal within a week.",
    },
  },
  {
    id: 10,
    topic: "Teamwork",
    interviewer: { korean: "íìì ê°ë±ì´ ììì ë ì´ë»ê² í´ê²°íì¨ëì?", english: "How did you resolve a conflict within your team?" },
    reham: {
      korean: "Accentureìì íì ê° ìë¬´ ë¶ë°°ì ëí ìê²¬ ì°¨ì´ê° ìììµëë¤. ì ë ê° íìì ê°ì ì íìíì¬ ì­í ì ì¬ì¡°ì íë ë°©ìì ì ìíê³ , ì ê¸° ë¯¸íì íµí´ ì§í ìí©ì ê³µì íë©° í¬ëªí ìíµì ì ì§íìµëë¤. ê²°ê³¼ì ì¼ë¡ í ìì°ì±ì´ 20% í¥ìëììµëë¤.",
      english: "At Accenture, there was a disagreement about task distribution among team members. I proposed reassigning roles based on each member's strengths and maintained transparent communication through regular meetings. As a result, team productivity improved by 20%.",
    },
  },
  {
    id: 11,
    topic: "Handling Pressure",
    interviewer: { korean: "ë§ê° ê¸°íì´ ì´ë°í ìí©ìì ì´ë»ê² ëì²íì¨ëì?", english: "How did you handle a situation with a tight deadline?" },
    reham: {
      korean: "Kerryìì ìë§ ë§ê° ì ì£¼ë¬¸ëì´ íìì ë ë°°ë¡ ì¦ê°í ì ì´ ììµëë¤. ì ë ììì ê¸´ê¸ëë³ë¡ ë¶ë¥íê³ , ë°ë³µ ììì ìëííë ê°ë¨í ííë¦¿ì ë§ë¤ì´ íê³¼ ê³µì íìµëë¤. ì´ë¥¼ íµí´ ë§ê° ê¸°í ë´ì ëª¨ë  ì£¼ë¬¸ì ì ííê² ì²ë¦¬í  ì ìììµëë¤.",
      english: "At Kerry, month-end order volume doubled. I categorized tasks by urgency, created simple templates to automate repetitive work, and shared them with the team. This enabled us to process all orders accurately within the deadline.",
    },
  },
  {
    id: 12,
    topic: "Leadership",
    interviewer: { korean: "ë¦¬ëì­ì ë°ííë ê²½íì ë§ìí´ ì£¼ì¸ì.", english: "Tell me about a time you demonstrated leadership." },
    reham: {
      korean: "Explore-Saudi íë¡ì í¸ìì SEO ìµì í ì ëµì ì£¼ëíìµëë¤. íìë¤ìê² SEO ëª¨ë² ì¬ë¡ë¥¼ êµì¡íê³ , ì£¼ê° ë¦¬ë·° ì¸ìì ëìíì¬ ì½íì¸  íì§ì ì§ìì ì¼ë¡ ê°ì íìµëë¤. 3ê°ì ë§ì ê²ì ìì§ ììê° í¬ê² í¥ìëììµëë¤.",
      english: "I led the SEO optimization strategy for the Explore-Saudi project. I trained team members on SEO best practices and introduced weekly review sessions to continuously improve content quality. Within 3 months, search engine rankings improved significantly.",
    },
  },
  {
    id: 13,
    topic: "Mistake & Learning",
    interviewer: { korean: "ì¤ìë¥¼ íë ê²½íê³¼ ê·¸ê²ìì ë¬´ìì ë°°ì ëì§ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about a mistake you made and what you learned from it." },
    reham: {
      korean: "ì´ê¸°ì ë°ì´í° ê²ì¦ ìì´ ëë ìë¡ëë¥¼ ì§ííì¬ ì¤ë¥ê° ë°ìí ì ì´ ììµëë¤. ì´ ê²½íì íµí´ í­ì ìí ê²ì¦ì ë¨¼ì  ìííë ìµê´ì ê°ê² ëìê³ , ì´íìë ìë¡ë ì  ì²´í¬ë¦¬ì¤í¸ë¥¼ ë§ë¤ì´ í ì ì²´ì ì ì©íìµëë¤.",
      english: "Early on, I made a bulk upload without data validation, which caused errors. This taught me to always perform sample verification first. After that, I created a pre-upload checklist and applied it across the entire team.",
    },
  },
  /* ââ Technical & Skills ââ */
  {
    id: 14,
    topic: "Web Development",
    interviewer: { korean: "ì¹ ê°ë° ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your web development experience." },
    reham: {
      korean: "Explore-Saudi íë¡ì í¸ìì ì¹ì¬ì´í¸ êµ¬ì¡° ì¤ê³ì SEO ìµì íë¥¼ ë´ë¹íìµëë¤. ëí ì¹ ê°ë° íë¡ì í¸ììë SEOì ì½íì¸  êµ¬ì¡°ë¥¼ ìµì ííë©° ë°ì´í°ì ì¼ê´ì±ê³¼ ì íì±ì ì§ìì ì¼ë¡ ê°ì íìµëë¤.",
      english: "In the Explore-Saudi project, I was responsible for website structure design and SEO optimization. In web development projects, I continuously improved data consistency and accuracy by optimizing SEO and content structure.",
    },
  },
  {
    id: 15,
    topic: "Tools & Technology",
    interviewer: { korean: "ì´ë¤ ëêµ¬ì ê¸°ì ì ì¬ì©í´ ë³´ì¨ëì?", english: "What tools and technologies have you used?" },
    reham: {
      korean: "Excelê³¼ Google Sheetsë¥¼ íì©í ë°ì´í° ë¶ì, CRM ìì¤í ê´ë¦¬, SEO ëêµ¬ (Google Analytics, Search Console), ê·¸ë¦¬ê³  ì¹ ê°ë°ììë React, TypeScript, Supabaseë¥¼ ì¬ì©í´ ë³´ììµëë¤. ëí AI ëêµ¬ë¥¼ íì©í ì½íì¸  ìì±ê³¼ ë°ì´í° ì²ë¦¬ ê²½íë ììµëë¤.",
      english: "I have experience with data analysis using Excel and Google Sheets, CRM system management, SEO tools (Google Analytics, Search Console), and React, TypeScript, and Supabase for web development. I also have experience using AI tools for content generation and data processing.",
    },
  },
  {
    id: 16,
    topic: "Multilingual Skills",
    interviewer: { korean: "ë¤êµ­ì´ ë¥ë ¥ì´ ìë¬´ì ì´ë»ê² ëìì´ ëìëì?", english: "How have your multilingual skills helped in your work?" },
    reham: {
      korean: "ìëì´, ìì´, íêµ­ì´ë¥¼ êµ¬ì¬í  ì ìì´ ë¤êµ­ì  íê³¼ì ìíµì´ ìííìµëë¤. í¹í ì½íì¸  ëª¨ëë ì´ì ìë¬´ìì ìëì´ ì½íì¸ ì ë§¥ë½ê³¼ ëìì¤ë¥¼ ì ííê² íë¨í  ì ììê³ , ì´ë ë°ì´í° íì§ í¥ìì ì§ì ì ì¼ë¡ ê¸°ì¬íìµëë¤.",
      english: "Being able to speak Arabic, English, and Korean enabled smooth communication with multinational teams. Especially in content moderation, I could accurately judge the context and nuances of Arabic content, which directly contributed to improving data quality.",
    },
  },
  /* ââ Situational & Future ââ */
  {
    id: 17,
    topic: "Adaptability",
    interviewer: { korean: "ìë¡ì´ íê²½ì´ë ìì¤íì ì´ë»ê² ì ìíìëì?", english: "How do you adapt to new environments or systems?" },
    reham: {
      korean: "ì ë ë¨¼ì  ìì¤íì ë¬¸ìì ê°ì´ëë¥¼ ê¼¼ê¼¼í ì½ê³ , ì¤ì ë¡ ì¬ì©í´ ë³´ë©´ì ì´í´ë¥¼ ì¬íí©ëë¤. ëª¨ë¥´ë ë¶ë¶ì ëë£ìê² ì ê·¹ì ì¼ë¡ ì§ë¬¸íê³ , ë°°ì´ ë´ì©ì ì ë¦¬íì¬ ëë§ì ì°¸ê³  ìë£ë¥¼ ë§ë­ëë¤. ì´ ë°©ë²ì¼ë¡ ëë¶ë¶ì ì ìì¤íì 1~2ì£¼ ë´ì ë¥ìí´ì§ ì ìììµëë¤.",
      english: "I first thoroughly read system documentation and guides, then deepen my understanding through hands-on use. I actively ask colleagues about things I don't know and organize what I learn into personal reference materials. This approach has allowed me to become proficient in most new systems within 1-2 weeks.",
    },
  },
  {
    id: 18,
    topic: "Career Goals",
    interviewer: { korean: "5ë íì ì»¤ë¦¬ì´ ëª©íë ë¬´ìì¸ê°ì?", english: "What are your career goals in 5 years?" },
    reham: {
      korean: "5ë íìë AI ë°ì´í° íì§ ë¶ì¼ìì ì ë¬¸ê°ë¡ ì±ì¥íê³  ì¶ìµëë¤. íì ë¦¬ëíë©° ë°ì´í° íì§ íì¤ì ìë¦½íê³ , ìëíë ê²ì¦ íë¡ì¸ì¤ë¥¼ ê°ë°íì¬ ì¡°ì§ì AI ìì¤í ì±ë¥ í¥ìì ê¸°ì¬íê³  ì¶ìµëë¤.",
      english: "In 5 years, I want to grow as an expert in AI data quality. I aim to lead a team, establish data quality standards, and develop automated verification processes to contribute to improving the organization's AI system performance.",
    },
  },
  {
    id: 19,
    topic: "Salary Expectations",
    interviewer: { korean: "í¬ë§íìë ê¸ì¬ ìì¤ì´ ìì¼ì ê°ì?", english: "Do you have salary expectations?" },
    reham: {
      korean: "ìì¥ ì¡°ì¬ë¥¼ íµí´ ì´ ì§ë¬´ì íê·  ê¸ì¬ ë²ìë¥¼ íìíê³  ììµëë¤. ì ì ê²½íê³¼ ê¸°ì  ìì¤ì ê³ ë ¤íì ë, í©ë¦¬ì ì¸ ë²ì ë´ìì ì ì°íê² ë¼ìí  ì ììµëë¤. ë¬´ìë³´ë¤ ì±ì¥ ê¸°íì ìë¬´ íê²½ì´ ì¤ìíë¤ê³  ìê°í©ëë¤.",
      english: "I've researched the average salary range for this position. Considering my experience and skill level, I'm flexible to discuss within a reasonable range. Most importantly, I value growth opportunities and the work environment.",
    },
  },
  /* ââ SAP & Operations Deep Dive ââ */
  {
    id: 20,
    topic: "SAP ERP Experience",
    interviewer: { korean: "SAP ERP ìì¤í ì¬ì© ê²½íì ëí´ ìì¸í ë§ìí´ ì£¼ì¸ì.", english: "Please tell me in detail about your SAP ERP experience." },
    reham: {
      korean: "Kerryìì SAP ERPì Order-to-Cash ëª¨ëì 3ë ì´ì ì¬ì©íìµëë¤. ì£¼ë¬¸ ìë ¥, ë°°ì¡ ì²ë¦¬, ì¡ì¥ ë°íê¹ì§ ì ì²´ íë¡ì¸ì¤ë¥¼ ê´ë¦¬íì¼ë©°, ë¤êµ­ê° í¬í¸í´ë¦¬ì¤ìì Oil & Energy, F&B ì°ìì ë³µì¡í ìí¬íë¡ì°ë¥¼ ì²ë¦¬íìµëë¤. ëí ì ì íì 10~15ëªìê² SAP ìì¤í êµì¡ì ì§ì  ì§ííìµëë¤.",
      english: "At Kerry, I used SAP ERP's Order-to-Cash module for over 3 years. I managed the entire process from order entry, shipment processing, to invoicing, handling complex workflows across multi-country portfolios in Oil & Energy and F&B industries. I also personally trained 10-15 new team members on SAP systems.",
    },
  },
  {
    id: 21,
    topic: "Order-to-Cash Process",
    interviewer: { korean: "Order-to-Cash íë¡ì¸ì¤ë¥¼ ì²ìë¶í° ëê¹ì§ ì¤ëªí´ ì£¼ìê² ì´ì?", english: "Can you walk me through the Order-to-Cash process from start to finish?" },
    reham: {
      korean: "Order-to-Cash íë¡ì¸ì¤ë ê³ ê° ì£¼ë¬¸ ì ìë¶í° ììë©ëë¤. ë¨¼ì  ì£¼ë¬¸ì SAPì ìë ¥íê³  ì¬ê³  íì¸ ë° ê°ê²© ê²ì¦ì í©ëë¤. ê·¸ ë¤ì ë°°ì¡ ì¼ì ì ì¡°ì¨íê³ , ì¶í í ì¡ì¥ì ë°íí©ëë¤. ë§ì§ë§ì¼ë¡ ëê¸ ìê¸ê¹ì§ ì¶ì í©ëë¤. Kerryìì ì 1,000ê±´ ì´ìì ì£¼ë¬¸ì ì´ íë¡ì¸ì¤ë¡ 96% ì´ìì ì íëë¡ ê´ë¦¬íìµëë¤.",
      english: "The Order-to-Cash process starts with receiving customer orders. First, I enter orders into SAP and verify inventory and pricing. Then I coordinate shipping schedules, issue invoices after shipment, and finally track payment collection. At Kerry, I managed over 1,000 orders monthly through this process with 96%+ accuracy.",
    },
  },
  {
    id: 22,
    topic: "Process Optimization",
    interviewer: { korean: "ì´ì íë¡ì¸ì¤ë¥¼ ê°ì íë êµ¬ì²´ì ì¸ ì¬ë¡ë¥¼ ë§ìí´ ì£¼ì¸ì.", english: "Give me a specific example of how you improved an operational process." },
    reham: {
      korean: "Kerryìì ì£¼ë¬¸ ì²ë¦¬ ì ë°ë³µëë ììì ì¤ë¥ë¥¼ ë°ê²¬íìµëë¤. íì¤íë ê²ì¦ ì²´í¬ë¦¬ì¤í¸ë¥¼ ë§ë¤ê³ , ìì£¼ ì¬ì©íë ì£¼ë¬¸ ì íì ëí ííë¦¿ì ëìíìµëë¤. ì´ë¥¼ íµí´ ì²ë¦¬ ìê°ì 30% ë¨ì¶íê³  ì¤ë¥ì¨ì í¬ê² ì¤ììµëë¤. ì´ ì²´í¬ë¦¬ì¤í¸ë ì´í í ì ì²´ì íì¤ ì ì°¨ê° ëììµëë¤.",
      english: "At Kerry, I identified recurring manual errors in order processing. I created a standardized verification checklist and introduced templates for frequently used order types. This reduced processing time by 30% and significantly lowered error rates. The checklist later became the standard procedure for the entire team.",
    },
  },
  /* ââ Kerry (F&B) Specific ââ */
  {
    id: 23,
    topic: "Client Management",
    interviewer: { korean: "50ê° ì´ìì ê³ ê°ì¬ë¥¼ ì´ë»ê² ê´ë¦¬íì¨ëì?", english: "How did you manage relationships with 50+ clients?" },
    reham: {
      korean: "ê³ ê°ì ì°ì ììë³ë¡ ë¶ë¥íê³ , ê° ê³ ê°ì í¹ì ìêµ¬ì¬í­ì ë¬¸ìííìµëë¤. ì£¼ì ê³ ê°ì ëí´ìë ì ê¸°ì ì¸ ìí ìë°ì´í¸ë¥¼ ì ê³µíê³ , ë¬¸ì  ë°ì ì ì ì ì ì¼ë¡ ìíµíìµëë¤. CRM ìì¤íì íì©íì¬ ëª¨ë  ìí¸ìì©ì ê¸°ë¡íê³ , 100% ì ì ë°°ì¡ ì±ê³¼ë¥¼ ì ì§íìµëë¤.",
      english: "I categorized clients by priority and documented each client's special requirements. For key accounts, I provided regular status updates and communicated proactively when issues arose. Using CRM systems, I logged all interactions and maintained 100% on-time delivery performance.",
    },
  },
  {
    id: 24,
    topic: "Customer Escalation",
    interviewer: { korean: "ê³ ê°ì¹ ê³ ê°ì ë¶ë§ì ì´ë»ê² ì²ë¦¬íì¨ëì?", english: "How did you handle a high-value customer complaint?" },
    reham: {
      korean: "Kerryìì ì£¼ì ê³ ê°ì ëë ì£¼ë¬¸ì ë°°ì¡ ì§ì°ì´ ë°ìí ì ì´ ììµëë¤. ì¦ì ê³ ê°ìê² ì°ë½íì¬ ìí©ì í¬ëªíê² ê³µì íê³ , ëìì ì¸ ë°°ì¡ ê²½ë¡ë¥¼ ì°¾ì ì ìíìµëë¤. ëìì ë´ë¶ íê³¼ íë ¥íì¬ ê·¼ë³¸ ìì¸ì íìíê³  ì¬ë° ë°©ì§ ì¡°ì¹ë¥¼ ìë¦½íìµëë¤. ê³ ê°ì ì ìí ëìì ë§ì¡±íì¬ ê±°ë ê´ê³ê° ì¤íë ¤ ê°íëììµëë¤.",
      english: "At Kerry, a major client experienced a shipping delay on a large order. I immediately contacted the client to transparently share the situation and found an alternative shipping route. Simultaneously, I worked with internal teams to identify the root cause and establish preventive measures. The client was satisfied with the quick response, which actually strengthened the business relationship.",
    },
  },
  /* ââ Accenture & Content Moderation ââ */
  {
    id: 25,
    topic: "Content Moderation",
    interviewer: { korean: "ì½íì¸  ëª¨ëë ì´ì ìë¬´ìì ì´ë¤ ì¢ë¥ì ì½íì¸ ë¥¼ ì²ë¦¬íì¨ëì?", english: "What types of content did you handle in content moderation?" },
    reham: {
      korean: "Accentureìì 3ë ì´ì ë¤ìí í´ë¼ì´ì¸í¸ íë¡ì í¸ì ì½íì¸ ë¥¼ ê²í íìµëë¤. ì ì± ìë° ì½íì¸ ë¥¼ ìë³íê³ , ë¬¸íì  ë§¥ë½ì ê³ ë ¤í íë¨ì ë´ë ¸ìµëë¤. í¹í ìëì´ ì½íì¸ ì ëìì¤ì ë¬¸íì  ë¯¼ê°ì±ì ì ííê² íê°í  ì ììê³ , íë£¨ 300~800ê±´ì 95% ì´ìì íì§ ì íëë¡ ì²ë¦¬íìµëë¤.",
      english: "At Accenture, I reviewed content across multiple client projects for over 3 years. I identified policy-violating content and made judgments considering cultural context. I could accurately assess the nuances and cultural sensitivity of Arabic content, processing 300-800 items daily with 95%+ quality accuracy.",
    },
  },
  {
    id: 26,
    topic: "Quality Under Volume",
    interviewer: { korean: "ëëì ìë¬´ë¥¼ ì²ë¦¬íë©´ì íì§ì ì´ë»ê² ì ì§íì¨ëì?", english: "How did you maintain quality while handling high volumes?" },
    reham: {
      korean: "ì¸ ê°ì§ ì ëµì ì¬ì©íìµëë¤. ì²«ì§¸, ììì ìê° ë¸ë¡ì¼ë¡ ëëì´ ì§ì¤ë ¥ì ì ì§íìµëë¤. ëì§¸, ìì£¼ ë°ìíë ì íì ëí ê°ì¸ ì°¸ê³  ê°ì´ëë¥¼ ë§ë¤ì´ íë¨ ìëë¥¼ ëììµëë¤. ìì§¸, ì ê¸°ì ì¼ë¡ ìê° íì§ ê²ì¬ë¥¼ ì¤ìíì¬ ì¼ê´ì±ì íì¸íìµëë¤. ì´ ë°©ë²ì¼ë¡ ìëì ì íì±ì ëª¨ë ì ì§í  ì ìììµëë¤.",
      english: "I used three strategies. First, I divided work into time blocks to maintain focus. Second, I created personal reference guides for frequently occurring types to speed up decision-making. Third, I conducted regular self-quality checks to verify consistency. This approach allowed me to maintain both speed and accuracy.",
    },
  },
  /* ââ Klivvr & Fintech ââ */
  {
    id: 27,
    topic: "Fintech Experience",
    interviewer: { korean: "ííí¬ íê²½ììì ê³ ê° ìë¹ì¤ ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your customer service experience in a fintech environment." },
    reham: {
      korean: "Klivvrìì íë£¨ 50~100ê±´ ì´ìì ê³ ê° ìí¸ìì©ì ì²ë¦¬íìµëë¤. ííí¬ íê²½ì´ê¸° ëë¬¸ì ê¸ìµ ë°ì´í° ê¸°ë° ì ì§ê° ë§¤ì° ì¤ìíìµëë¤. ìê²©í ì»´íë¼ì´ì¸ì¤ ê¸°ì¤ì ì¤ìíë©´ì ê³ ê° ë¬¸ì ë¥¼ ì ìíê² í´ê²°íê³ , CRM ìì¤íì íì©íì¬ ëª¨ë  ìí¸ìì©ì ì²´ê³ì ì¼ë¡ ê´ë¦¬íìµëë¤.",
      english: "At Klivvr, I handled 50-100+ customer interactions daily. Since it was a fintech environment, maintaining financial data confidentiality was critical. I resolved customer issues quickly while adhering to strict compliance standards, and systematically managed all interactions using CRM systems.",
    },
  },
  {
    id: 28,
    topic: "Data Confidentiality",
    interviewer: { korean: "ë¯¼ê°í ë°ì´í°ë¥¼ ë¤ë£° ë ì´ë»ê² ë³´ìì ì ì§íì¨ëì?", english: "How did you maintain security when handling sensitive data?" },
    reham: {
      korean: "í­ì íì¬ì ë°ì´í° ë³´ì ì ì±ì ì² ì í ë°ëìµëë¤. ê³ ê° ì ë³´ë ì¹ì¸ë ìì¤íì íµí´ìë§ ì ê·¼íê³ , ìì ìë£ í ë¯¼ê°í ë°ì´í°ë¥¼ íë©´ì ë¨ê¸°ì§ ìììµëë¤. ëí ìì¬ì¤ë¬ì´ íëì´ ë°ê²¬ëë©´ ì¦ì ë³´ì íì ë³´ê³ íë ì ì°¨ë¥¼ ë°ëìµëë¤. ííí¬ììì ê²½íì íµí´ ë°ì´í° ë³´ìì ì¤ìì±ì ê¹ì´ ì´í´íê² ëììµëë¤.",
      english: "I always strictly followed the company's data security policies. I accessed customer information only through authorized systems and never left sensitive data visible on screen after completing tasks. I also followed procedures to immediately report suspicious activities to the security team. My fintech experience deepened my understanding of data security importance.",
    },
  },
  /* ââ Klovers & Entrepreneurship ââ */
  {
    id: 29,
    topic: "Entrepreneurship",
    interviewer: { korean: "Klovers ì»¤ë®¤ëí°ë¥¼ ì¤ë¦½íê³  ì´ìí ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about founding and running the Klovers community." },
    reham: {
      korean: "2013ëì Kloversë¥¼ ì¤ë¦½íì¬ íì¬ê¹ì§ 13ëê° ì´ìíê³  ììµëë¤. 15ê°êµ­ ì´ììì 1,000ëª ì´ìì íìë¤ìê² íêµ­ì´ë¥¼ ê°ë¥´ì¹ê³  ììµëë¤. ë¤ìí ìì¤ì ì»¤ë¦¬íë¼ì ê°ë°íê³ , ê¸ë¡ë² íìµìë¥¼ ìí ë§ì¶¤í íìµ ê²½ë¡ë¥¼ ì¤ê³íìµëë¤. ì´ ê²½íì íµí´ í ê´ë¦¬, ì»¤ë¦¬íë¼ ê°ë°, ê·¸ë¦¬ê³  ì§ì ê°ë¥í ë¹ì¦ëì¤ ì±ì¥ì ëí´ ê¹ì´ ë°°ì ìµëë¤.",
      english: "I founded Klovers in 2013 and have been running it for 13 years. I teach Korean to over 1,000 students across 15+ countries. I developed multi-level curricula and designed customized learning paths for global learners. This experience taught me deeply about team management, curriculum development, and sustainable business growth.",
    },
  },
  {
    id: 30,
    topic: "Training & Development",
    interviewer: { korean: "íì êµì¡ ë° ì­ë ê°ë° ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your experience in training and developing team members." },
    reham: {
      korean: "Kerryìì ì ì íì 10~15ëªìê² SAP ìì¤íê³¼ ì´ì ì ì°¨ë¥¼ êµì¡íìµëë¤. êµì¡ ìë£ë¥¼ ì§ì  ë§ë¤ê³ , ë¨ê³ë³ íìµ íë¡ê·¸ë¨ì ì¤ê³íìµëë¤. ëí Kloversìì 13ëê° ë¤ìí ìì¤ì íìë¤ì ê°ë¥´ì¹ë©° ê°ì¸ë³ ë§ì¶¤ êµì¡ ë°©ë²ì ê°ë°íìµëë¤. ì¬ëë§ë¤ íìµ ì¤íì¼ì´ ë¤ë¥´ê¸° ëë¬¸ì ë¤ìí ì ê·¼ë²ì ì¬ì©í©ëë¤.",
      english: "At Kerry, I trained 10-15 new team members on SAP systems and operational procedures. I created training materials and designed step-by-step learning programs. Additionally, at Klovers I've taught diverse-level students for 13 years, developing personalized teaching methods. Since everyone has different learning styles, I use various approaches.",
    },
  },
  /* ââ Explore-Saudi & Digital ââ */
  {
    id: 31,
    topic: "Digital Project Leadership",
    interviewer: { korean: "Explore-Saudi íë¡ì í¸ììì ë¦¬ëì­ ì­í ì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your leadership role in the Explore-Saudi project." },
    reham: {
      korean: "Explore-Saudi íë¡ì í¸ìì íë¦¬ëì¤ ë¦¬ëë¡ì ë­ìë¦¬ ì¬í íë«í¼ì ëì§í¸ ë¸ëë©ê³¼ ì¹ì¬ì´í¸ ê°ë°ì ì´ê´íìµëë¤. HTML, CSS, Reactë¥¼ ì¬ì©íì¬ ì¹ì¬ì´í¸ ìí¤íì²ë¥¼ ì¤ê³íê³  êµ¬ì¶íì¼ë©°, SEO ìµì í, GA4 ë¶ì êµ¬í, CMS ê´ë¦¬ë¥¼ ë´ë¹íìµëë¤. AI ëêµ¬ë¥¼ íì©í ê³ íì§ ëì§í¸ ì½íì¸ ë ì ìíìµëë¤.",
      english: "As Freelance Lead for the Explore-Saudi project, I oversaw digital branding and website development for a luxury travel platform. I designed and built the website architecture using HTML, CSS, and React, and managed SEO optimization, GA4 analytics implementation, and CMS administration. I also created high-quality digital content using AI tools.",
    },
  },
  {
    id: 32,
    topic: "SEO & Analytics",
    interviewer: { korean: "SEO ìµì íì Google Analytics ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your SEO optimization and Google Analytics experience." },
    reham: {
      korean: "Explore-Saudi íë¡ì í¸ìì SEO ì ëµì ìë¦½íê³  ì¤ííìµëë¤. í¤ìë ë¦¬ìì¹, ë©í íê·¸ ìµì í, ì½íì¸  êµ¬ì¡° ê°ì ì íµí´ ê²ì ìì§ ììë¥¼ í¥ììì¼°ìµëë¤. GA4ë¥¼ êµ¬ííì¬ ì¬ì©ì íëì ë¶ìíê³ , ë°ì´í° ê¸°ë°ì¼ë¡ ì½íì¸  ì ëµì ì¡°ì íìµëë¤. ëí Klovers ì¹ì¬ì´í¸ììë ì§ìì ì¼ë¡ SEOì ì½íì¸  íì§ì ê°ì íê³  ììµëë¤.",
      english: "I developed and executed SEO strategies for the Explore-Saudi project. I improved search engine rankings through keyword research, meta tag optimization, and content structure improvements. I implemented GA4 to analyze user behavior and adjusted content strategy based on data. I also continuously improve SEO and content quality on the Klovers website.",
    },
  },
  /* ââ Team Lead / Manager Target Role ââ */
  {
    id: 33,
    topic: "Management Style",
    interviewer: { korean: "íì ê´ë¦¬í  ë ì´ë¤ ë¦¬ëì­ ì¤íì¼ì ì¬ì©íìëì?", english: "What leadership style do you use when managing a team?" },
    reham: {
      korean: "ì ë ìë²í¸ ë¦¬ëì­ê³¼ ê²°ê³¼ ì¤ì¬ ë¦¬ëì­ì ê²°í©í©ëë¤. íìë¤ì´ íìí ììê³¼ êµì¡ì ì ê³µíë©´ì, ëªíí ëª©íì ê¸°ëì¹ë¥¼ ì¤ì í©ëë¤. ì ê¸°ì ì¸ ì¼ëì¼ ë¯¸íì íµí´ ê°ì¸ì ì±ì¥ì ì§ìíê³ , í ì ì²´ì ì±ê³¼ë¥¼ í¬ëªíê² ê³µì í©ëë¤. Kerryìì íì êµì¡ì ë´ë¹íë©° ì´ ì¤íì¼ì´ í¨ê³¼ì ìì íì¸íìµëë¤.",
      english: "I combine servant leadership with results-oriented leadership. I provide team members with necessary resources and training while setting clear goals and expectations. Through regular one-on-one meetings, I support individual growth and transparently share overall team performance. While training team members at Kerry, I confirmed this style was effective.",
    },
  },
  {
    id: 34,
    topic: "Remote Team Management",
    interviewer: { korean: "ìê²© íì ê´ë¦¬í ê²½íì´ ìì¼ì ê°ì?", english: "Do you have experience managing remote teams?" },
    reham: {
      korean: "ë¤, Kloversë¥¼ íµí´ 13ëê° 15ê°êµ­ ì´ìì íìë¤ê³¼ ìê²©ì¼ë¡ ììí´ììµëë¤. ëí Explore-Saudi íë¡ì í¸ë ìì  ìê²©ì¼ë¡ ì§ííìµëë¤. ìê°ë ì°¨ì´ë¥¼ ê´ë¦¬íê³ , ë¹ëê¸° ì»¤ë®¤ëì¼ì´ì ëêµ¬ë¥¼ í¨ê³¼ì ì¼ë¡ íì©íë©°, ëªíí ë¬¸ìíë¥¼ íµí´ ëª¨ë  íìì´ ê°ì ë°©í¥ì¼ë¡ ì¼í  ì ìëë¡ íìµëë¤.",
      english: "Yes, through Klovers I've worked remotely with students across 15+ countries for 13 years. The Explore-Saudi project was also fully remote. I managed timezone differences, effectively used asynchronous communication tools, and ensured all team members worked in the same direction through clear documentation.",
    },
  },
  {
    id: 35,
    topic: "Cross-Cultural Communication",
    interviewer: { korean: "ë¤ë¬¸í íê²½ììì íì ê²½íì ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your experience collaborating in multicultural environments." },
    reham: {
      korean: "ë§ë ì´ìì, ì´ì§í¸, íê°ë¦¬ìì ê·¼ë¬´íë©° ë¤ìí ë¬¸íê¶ì ëë£ë¤ê³¼ íìíìµëë¤. 6ê° ì¸ì´ë¥¼ êµ¬ì¬í  ì ìì´ ì¸ì´ ì¥ë²½ì ì¤ì´ê³ , ë¬¸íì  ì°¨ì´ë¥¼ ì´í´íë©° ìíµí  ì ìììµëë¤. Kerryììë ë¤êµ­ì  ê³ ê°ì¬ìì ìíµì, Accentureììë ë¤êµ­ì´ ì½íì¸ ì ë¬¸íì  ë§¥ë½ì ì íí íë¨íë ì­í ì ìííìµëë¤.",
      english: "Working in Malaysia, Egypt, and Hungary, I've collaborated with colleagues from diverse cultural backgrounds. Speaking 6 languages, I could reduce language barriers and communicate with cultural understanding. At Kerry, I communicated with multinational clients, and at Accenture, I accurately assessed the cultural context of multilingual content.",
    },
  },
  /* ââ Situational - Target Roles ââ */
  {
    id: 36,
    topic: "Prioritization",
    interviewer: { korean: "ì¬ë¬ ê¸´ê¸í ìë¬´ê° ëìì ë¤ì´ì¤ë©´ ì´ë»ê² ì°ì ììë¥¼ ì íìëì?", english: "How do you prioritize when multiple urgent tasks come in at the same time?" },
    reham: {
      korean: "ë¨¼ì  ê° ìë¬´ì ìí¥ëì ê¸´ê¸ì±ì íê°í©ëë¤. ê³ ê° ìí¥ì´ í° ê±´ê³¼ ë§ê°ì´ ìë°í ê±´ì ìµì°ì ì¼ë¡ ì²ë¦¬í©ëë¤. Kerryìì ìë§ ëë ì£¼ë¬¸ ì ì´ ë°©ë²ì ìì£¼ ì¬ì©íìµëë¤. íìí ê²½ì° íììê² ìë¬´ë¥¼ ììíê³ , ì§í ìí©ì ì¤ìê°ì¼ë¡ ê´ë¦¬ììê² ë³´ê³ í©ëë¤.",
      english: "First, I assess each task's impact and urgency. I prioritize tasks with high customer impact and imminent deadlines. I frequently used this method during month-end high-volume periods at Kerry. When necessary, I delegate tasks to team members and report progress to managers in real-time.",
    },
  },
  {
    id: 37,
    topic: "Handling Ambiguity",
    interviewer: { korean: "ëªíí ì§ì¹¨ì´ ìë ìí©ìì ì´ë»ê² ìë¬´ë¥¼ ì§ííìëì?", english: "How do you proceed when there are no clear guidelines?" },
    reham: {
      korean: "ë¨¼ì  ì ì¬í ì¬ë¡ë ê¸°ì¡´ ì ì±ì ì°¸ê³ í©ëë¤. ê·¸ëë ë¶ëªííë©´ ê´ë ¨ ì´í´ê´ê³ììê² íì¸ì ìì²­í©ëë¤. Accentureìì ìë¡ì´ ì íì ì½íì¸ ë¥¼ ì²ë¦¬í  ë ì´ë° ìí©ì´ ìì£¼ ììëë°, í ë¦¬ëì ììíì¬ ìë¡ì´ ê°ì´ëë¼ì¸ì ìë¦½íë ë° ê¸°ì¬íìµëë¤. ëª¨í¸í ìí©ììë ìµì ì íë¨ì ë´ë¦¬ë, í­ì ë¬¸ìííì¬ í ì ì²´ì ê³µì í©ëë¤.",
      english: "First, I reference similar cases or existing policies. If still unclear, I reach out to relevant stakeholders for clarification. At Accenture, this happened often when handling new content types â I contributed to establishing new guidelines by consulting with team leads. Even in ambiguous situations, I make the best judgment possible while always documenting and sharing with the team.",
    },
  },
  {
    id: 38,
    topic: "Continuous Improvement",
    interviewer: { korean: "ìê¸° ê°ë°ì ìí´ ì´ë¤ ë¸ë ¥ì íê³  ê³ìëì?", english: "What efforts are you making for self-development?" },
    reham: {
      korean: "ì§ìì ì¼ë¡ ìë¡ì´ ê¸°ì ì ë°°ì°ê³  ììµëë¤. ìµê·¼ìë Reactì TypeScriptë¥¼ íì©í ì¹ ê°ë° ì­ëì ê°ííê³ , Vibe Coding Gold ì¸ì¦ì ì·¨ëíìµëë¤. ëí AI ëêµ¬ íì© ë¥ë ¥ë ê°ë°íê³  ììµëë¤. Kloversë¥¼ íµí´ ê°ë¥´ì¹ë©´ì ëìì ë°°ì°ë ê²ì´ ê°ì¥ í¨ê³¼ì ì¸ íìµ ë°©ë²ì´ë¼ê³  ë¯¿ìµëë¤.",
      english: "I continuously learn new skills. Recently, I've strengthened my web development capabilities with React and TypeScript, and obtained the Vibe Coding Gold certification. I'm also developing AI tool proficiency. Through Klovers, I believe teaching while learning simultaneously is the most effective learning method.",
    },
  },
  {
    id: 39,
    topic: "Why Should We Hire You",
    interviewer: { korean: "ì í¬ê° ì ë¹ì ì ì±ì©í´ì¼ íëì?", english: "Why should we hire you?" },
    reham: {
      korean: "ì ë 13ë ì´ìì êµ­ì  ì´ì ê²½í, 6ê° ì¸ì´ êµ¬ì¬ ë¥ë ¥, ê·¸ë¦¬ê³  ê²ì¦ë ë°ì´í° ì²ë¦¬ ì íëë¥¼ ê°ì¶ê³  ììµëë¤. Kerryìì 96% ì´ìì ì£¼ë¬¸ ì íë, Accentureìì 95% ì´ìì íì§ ì íëë¥¼ ë¬ì±íìµëë¤. SAP ERP ì ë¬¸ì±, ì¹ ê°ë° ì­ë, ê·¸ë¦¬ê³  13ëê°ì ì»¤ë®¤ëí° ë¦¬ëì­ ê²½íê¹ì§ ê²°í©íë©´, ë¤ìí ì­í ìì ì¦ì ê°ì¹ë¥¼ ì ê³µí  ì ììµëë¤.",
      english: "I bring 13+ years of international operations experience, fluency in 6 languages, and proven data processing accuracy. I achieved 96%+ order accuracy at Kerry and 95%+ quality accuracy at Accenture. Combined with SAP ERP expertise, web development skills, and 13 years of community leadership, I can deliver immediate value across diverse roles.",
    },
  },
  /* ââ Closing ââ */
  {
    id: 40,
    topic: "Questions for Interviewer",
    interviewer: { korean: "ì í¬ìê² ê¶ê¸í ì ì´ ìì¼ì ê°ì?", english: "Do you have any questions for us?" },
    reham: {
      korean: "ë¤, ë ê°ì§ ì§ë¬¸ì´ ììµëë¤. ì²«ì§¸, ì´ íì ì¼ë°ì ì¸ íë£¨ ìë¬´ íë¦ì ì´ë»ê² ëëì? ëì§¸, ìì¬ í ì²« 3ê°ì ëì ê¸°ëíìë ì±ê³¼ë ë¬´ìì¸ê°ì? ì´ ì­í ìì ë¹ ë¥´ê² ê¸°ì¬íê³  ì¶ìµëë¤.",
      english: "Yes, I have two questions. First, what does a typical day look like for this team? Second, what outcomes do you expect in the first 3 months? I want to contribute quickly in this role.",
    },
  },
  {
    id: 41,
    topic: "Closing",
    interviewer: { korean: "ë§ì§ë§ì¼ë¡ íê³  ì¶ì ë§ìì´ ìì¼ì ê°ì?", english: "Any final words you'd like to share?" },
    reham: {
      korean: "ì´ ê¸°íë¥¼ ì£¼ìì ê°ì¬í©ëë¤. ì  ê²½íê³¼ ì¸ì´ ë¥ë ¥ì íµí´ ì´ ì­í ì ìë¯¸ ìë ê¸°ì¬ë¥¼ í  ì ìë¤ê³  ìê°í©ëë¤. ë°ì´í° íì§ì ëí ì´ì ê³¼ 13ë ì´ìì ì´ì ê²½íì ë°íì¼ë¡ íì ê°ì¹ë¥¼ ëí  ì ìë¤ê³  íì í©ëë¤. ê°ì¬í©ëë¤.",
      english: "Thank you for this opportunity. I believe I can make a meaningful contribution through my experience and language skills. I am confident I can add value to the team with my passion for data quality and over 13 years of operational experience. Thank you.",
    },
  },
  /* ââ El Zenouki / Interpretation ââ */
  {
    id: 42,
    topic: "Interpretation Experience",
    interviewer: { korean: "íµì­ ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Please tell me about your interpretation experience." },
    reham: {
      korean: "El Zenouki Groupìì íµì­ ìë¹ì¤ ì½ëë¤ì´í°ë¡ ê·¼ë¬´íë©° ìëì´, íêµ­ì´, ìì´ ê°ì ì ë¬¸ íµì­ì ë´ë¹íìµëë¤. êµ­ì  ë¹ì¦ëì¤ ë¯¸íê³¼ ê¸°ì  íììì ì£¼ì ìíµ ì­í ì ìííì¼ë©°, ë¤êµ­ì´ ìì  ê´ë¦¬ì êµ­ì  íë¡ì í¸ ì¡°ì¨ì íµí´ ìíí íìì ë³´ì¥íìµëë¤.",
      english: "At El Zenouki Group, I served as Interpreter Services Coordinator, providing professional interpretation between Arabic, Korean, and English. I was the primary communication link for international business meetings and technical discussions, managing multilingual correspondence and international project coordination.",
    },
  },
  /* ââ Golden Dragon / International Trade ââ */
  {
    id: 43,
    topic: "International Trade",
    interviewer: { korean: "ìì¶ ë° ë¬´ì­ ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Please tell me about your export and trade experience." },
    reham: {
      korean: "Golden Dragonìì ë¦¬íì¼ ì´ê´ ë§¤ëì ë¡ ì¥ì´ ë° ìì°ë¬¼ì êµ­ì  ìì¶ ì´ìì ê´ë¦¬íìµëë¤. êµ­ì  ë¬´ì­ ê·ì ê³¼ ìì ê¸°ì¤ì ì² ì í ì¤ìíë©´ì ê¸ë¡ë² ë¬¼ë¥ì ì ì ì ì¡°ì¨íìµëë¤. ëí ë¤êµ­ì´ë¡ ê³ì½ íìê³¼ ê³µê¸ìì²´ ê´ë¦¬ë¥¼ ìííì¬ ì´ì í¨ì¨ì±ì ìµì ííìµëë¤.",
      english: "At Golden Dragon, as Retail General Manager, I managed international export operations for eels and seafood products. I ensured strict compliance with international trade regulations and health standards while coordinating global logistics and shipments. I also led contract negotiations and supplier management in multiple languages.",
    },
  },
  /* ââ ERC / Large Team Administration ââ */
  {
    id: 44,
    topic: "Large Team Management",
    interviewer: { korean: "50ëª ê·ëª¨ì íì ê´ë¦¬í ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your experience managing a team of 50 people." },
    reham: {
      korean: "Egyptian Refining Company(ERC)ìì DAEAH E&Cì íë ¥íì¬ 50ëª ê·ëª¨ì íì  ë¶ìë¥¼ ì´ê´íìµëë¤. íë¡ì í¸ì ì£¼ì ì°ë½ ì°½êµ¬ë¡ì íì í, ê²½ìì§, ì¸ë¶ ì´í´ê´ê³ì ê°ì ìíµì ì¤ì ì§ì¤ííìµëë¤. ëª¨ë  ì¬ë¬´ ìë¹ì¤ ê°ë, ì¡°ë¬ ê´ë¦¬, ë²¤ë ì²­êµ¬ ê´ë¦¬ë¥¼ ë´ë¹íë©° ê³ ìì ì¸ ì°ì íê²½ìì ì´ì ìì ì±ì ì ì§íìµëë¤.",
      english: "At ERC, collaborating with DAEAH E&C, I led an administrative department of 50 on-site personnel for a major Oil & Energy project. As the primary contact point, I centralized communication between the admin team, executive leadership, and external stakeholders. I supervised all office services, managed procurement and vendor billing, maintaining operational stability in a high-pressure industrial environment.",
    },
  },
  /* ââ Teaching Abroad ââ */
  {
    id: 45,
    topic: "Teaching Abroad",
    interviewer: { korean: "í´ì¸ìì ìëì´ë¥¼ ê°ë¥´ì¹ ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your experience teaching Arabic abroad." },
    reham: {
      korean: "íê°ë¦¬ ë¶ë¤íì¤í¸ì Nur Schoolìì ìì´ ë° íê°ë¦¬ì´ë¥¼ ì¬ì©íë ì±ì¸ë¤ìê² ì§ì¤ì ì¸ ìëì´ êµì¡ì ì§ííìµëë¤. ì½ê¸°, ì°ê¸°, ë§íê¸°, ë£ê¸°ë¥¼ í¬í¨í ë§ì¶¤í ì»¤ë¦¬íë¼ì ê°ë°íì¬ ë¬¸íì , ì¸ì´ì  ì°¨ì´ë¥¼ ê·¹ë³µíìµëë¤. ì´ ê²½íì íµí´ ë¤ìí êµ­ì  íê²½ììì ì ìë ¥ê³¼ êµì¡ ë¦¬ëì­ì ê¸°ë¥¼ ì ìììµëë¤.",
      english: "At Nur School in Budapest, Hungary, I facilitated intensive Arabic language training for English and Hungarian-speaking adults. I developed customized curriculum covering reading, writing, speaking, and listening to bridge cultural and linguistic gaps. This experience demonstrated my adaptability and instructional leadership in a diverse international setting.",
    },
  },
  /* ââ GLC Europe / Conference Sales ââ */
  {
    id: 46,
    topic: "B2B Sales",
    interviewer: { korean: "B2B ìì ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your B2B sales experience." },
    reham: {
      korean: "GLC Europeìì ì ë½ ìì¥ì ëìì¼ë¡ ê³ ê¸ ê¸°ì ì»¨í¼ë°ì¤ ë° ì ë¬¸ êµì¡ íë¡ê·¸ë¨ì íë³´ì ììì ë´ë¹íìµëë¤. ì£¼ì ìê³ ë¦¬ë ë° ìì¬ê²°ì ìë¥¼ ë°êµ´íê³  êµ­ì  íì¬ì ëí ë±ë¡ê³¼ íí¸ëì­ì ì ëíìµëë¤. ê°í ì¤ëë ¥ ìë ì»¤ë®¤ëì¼ì´ì ë¥ë ¥ê³¼ ìì¥ ì¡°ì¬ ì­ëì´ ìêµ¬ëë ì­í ì´ììµëë¤.",
      english: "At GLC Europe, I managed the promotion and sales of high-end corporate conferences and professional training programs across the European market. I identified and engaged key industry leaders and decision-makers to drive registrations and partnerships for international events. This role required strong persuasive communication and market research skills.",
    },
  },
  /* ââ Korean Cultural Centre ââ */
  {
    id: 47,
    topic: "Cultural Events & Interpretation",
    interviewer: { korean: "íêµ­ë¬¸íìììì íµì­ ë° íì¬ ê¸°í ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your interpretation and event planning experience at the Korean Cultural Centre." },
    reham: {
      korean: "ì¹´ì´ë¡ íêµ­ë¬¸íììì 2ë 8ê°ìê° ëê·ëª¨ ë¬¸í ì¶ì , ì ìí, ê¸°ì ì¼ì¼ì´ì¤ì íµì­ê³¼ íì¬ ê¸°íì ë´ë¹íìµëë¤. êµ­ì  ê³µì°ì, ê¸°ì í, VIP ìëì ìí ì£¼ì íµì­ì¬ë¡ íëíë©° ëê·ëª¨ ê³µê³µ íì¬ì ìíí ì´ìì ë³´ì¥íìµëë¤. ë¤êµ­ì´ íì¬ íë¡ê·¸ëë°ê³¼ ë¬¸í êµë¥ ì´ì§ì íµí´ êµ­ì  ë¬¸í ì¸ìì ëì´ë ë° ê¸°ì¬íìµëë¤.",
      english: "At the Korean Cultural Centre in Cairo, I managed interpretation and event planning for cultural festivals, exhibitions, and corporate showcases for over 2.5 years. I served as the primary interpreter for international performers, technical teams, and VIP guests, ensuring seamless operations during large public events. I facilitated multilingual event programming and cross-cultural exchanges to promote international cultural awareness.",
    },
  },
  /* ââ Education Background ââ */
  {
    id: 48,
    topic: "Education",
    interviewer: { korean: "íë ¥ì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Please tell me about your educational background." },
    reham: {
      korean: "ì ë ì´ì§í¸ ìì¸ì´ì¤ ëíêµìì íêµ­ì´í ë° íêµ­ë¬¸íì ì ê³µíìµëë¤. ëíìì íêµ­ì´ ì¸ì´íê³¼ ë¬¸íì ì²´ê³ì ì¼ë¡ ê³µë¶íë©° íêµ­ì´ì ëí ê¹ì ì´í´ë¥¼ ê°ì¶ê² ëììµëë¤. ì´ íë¬¸ì  ë°°ê²½ì´ 13ë ì´ìì íêµ­ì´ êµì¡ê³¼ íµì­ ê²½ë ¥ì ê¸°ì´ê° ëììµëë¤.",
      english: "I studied Korean Linguistics and Literature at Ain Shams University in Egypt. Through systematic study of Korean linguistics and literature at university, I developed a deep understanding of the Korean language. This academic background became the foundation for my 13+ years of Korean language teaching and interpretation career.",
    },
  },
  /* ââ Why Korea / Korean Language ââ */
  {
    id: 49,
    topic: "Why Korean",
    interviewer: { korean: "ì íêµ­ì´ë¥¼ ê³µë¶íê² ëì¨ëì?", english: "Why did you start studying Korean?" },
    reham: {
      korean: "ì´ë¦´ ëë¶í° íêµ­ ë¬¸íì ê´ì¬ì´ ë§ìê³ , ì´ ê´ì¬ì´ ìì¸ì´ì¤ ëíêµìì íêµ­ì´ë¥¼ ì ê³µíë ê³ê¸°ê° ëììµëë¤. ì¡¸ì íìë íêµ­ë¬¸íììì íµì­ì¬ë¡ íëíë©° ì¤ë¬´ ê²½íì ììê³ , 2013ëì Kloversë¥¼ ì¤ë¦½íì¬ ì  ì¸ê³ íìë¤ìê² íêµ­ì´ë¥¼ ê°ë¥´ì¹ê³  ììµëë¤. íêµ­ì´ë ì  ì»¤ë¦¬ì´ì íµì¬ì´ë©°, ì¸ì´ë¥¼ íµí´ ë¬¸íì  ë¤ë¦¬ ì­í ì íë ê²ì í° ë³´ëì ëëëë¤.",
      english: "I had a strong interest in Korean culture from a young age, which led me to major in Korean at Ain Shams University. After graduation, I gained practical experience as an interpreter at the Korean Cultural Centre, and in 2013 I founded Klovers to teach Korean to students worldwide. Korean is at the core of my career, and I find great fulfillment in serving as a cultural bridge through language.",
    },
  },
  /* ââ International Mobility ââ */
  {
    id: 50,
    topic: "International Experience",
    interviewer: { korean: "ì¬ë¬ ëë¼ìì ê·¼ë¬´í ê²½íì ëí´ ë§ìí´ ì£¼ì¸ì.", english: "Tell me about your experience working in multiple countries." },
    reham: {
      korean: "ì´ì§í¸, ë§ë ì´ìì, íê°ë¦¬ ì¸ ëë¼ìì ê·¼ë¬´í ê²½íì´ ììµëë¤. ì´ì§í¸ììë íµì­, ë¬´ì­, íì  ê´ë¦¬ ë¶ì¼ìì ì¼íê³ , ë§ë ì´ììììë Accentureì Kerryìì ë¤êµ­ì  íê²½ì ì½íì¸  ê´ë¦¬ì ì£¼ë¬¸ ì´ìì ë´ë¹íìµëë¤. íê°ë¦¬ììë ìëì´ ê°ì¬ì ì»¨í¼ë°ì¤ ììì ê²½ííìµëë¤. ê° êµ­ê°ìì ë¤ë¥¸ ìë¬´ ë¬¸íë¥¼ ê²½ííë©° ì ì°ì±ê³¼ ë¬¸íì  ì ìë ¥ì ê¸°ë¥¼ ì ìììµëë¤.",
      english: "I have worked in three countries: Egypt, Malaysia, and Hungary. In Egypt, I worked in interpretation, trade, and administration. In Malaysia, I handled multilingual content management at Accenture and order operations at Kerry. In Hungary, I taught Arabic and managed conference sales. Working across different work cultures in each country helped me develop flexibility and cultural adaptability.",
    },
  },
];

/* âââ Section color map âââ */

const SECTION_COLORS: Record<string, string> = {
  Greeting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Education: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  Summary: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Projects: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Languages: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Motivation: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  Accenture: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Kerry: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  "Web Dev": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  Strengths: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Closing: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

/* âââ Data: Categories mapping âââ */

const CATEGORIES: { name: string; icon: string; ids: number[] }[] = [
  { name: "Self-Introduction", icon: "ð", ids: [1, 48, 49] },
  { name: "Work Experience", icon: "ð¼", ids: [2, 4, 50] },
  { name: "Accenture", icon: "ð¢", ids: [10, 25, 26] },
  { name: "Kerry (F&B)", icon: "ð¦", ids: [3, 20, 21, 22, 23, 24] },
  { name: "Klivvr / Fintech", icon: "ð³", ids: [27, 28] },
  { name: "Klovers", icon: "ð", ids: [29, 30] },
  { name: "El Zenouki / Interpretation", icon: "ð£ï¸", ids: [42, 47] },
  { name: "ERC / Administration", icon: "ðï¸", ids: [44] },
  { name: "International Trade", icon: "ð¢", ids: [43] },
  { name: "Teaching Abroad", icon: "ð", ids: [45, 47, 49] },
  { name: "Education & Background", icon: "ð", ids: [48, 49, 50] },
  { name: "Data Processing", icon: "ð", ids: [3, 4, 26] },
  { name: "Strengths & Weaknesses", icon: "ðª", ids: [5, 6] },
  { name: "Motivation & Fit", icon: "ð¯", ids: [7, 8] },
  { name: "Web Development", icon: "ð", ids: [14, 31, 32] },
  { name: "Problem Solving", icon: "ð§©", ids: [9, 11, 13, 36, 37] },
  { name: "Teamwork & Leadership", icon: "ð¥", ids: [10, 12, 33, 34, 44] },
  { name: "B2B Sales", icon: "ð¼", ids: [46] },
  { name: "Career & Self-Dev", icon: "ð", ids: [18, 38, 39] },
  { name: "Cross-Cultural", icon: "ð", ids: [35, 42, 45, 50] },
  { name: "Closing", icon: "ð¤", ids: [40, 41] },
];

/* âââ Data: Key Metrics âââ */

const KEY_METRICS: { label: string; korean: string; english: string }[] = [
  { label: "Accenture Daily Volume", korean: "íë£¨ ìµë 800ê±´ ì²ë¦¬", english: "Processed up to 800 items daily" },
  { label: "Accenture Accuracy", korean: "ì íë 95% ì´ì ë¬ì±", english: "Achieved 95%+ accuracy" },
  { label: "Kerry Monthly Volume", korean: "ì 1,000ê±´ ì´ì ì£¼ë¬¸ ê´ë¦¬", english: "Managed 1,000+ orders monthly" },
  { label: "Kerry Accuracy", korean: "ì íë 96% ì´ì ì ì§", english: "Maintained 96%+ accuracy" },
  { label: "Kerry Error Reduction", korean: "ì¤ë¥ì¨ 50% ì´ì ê°ì", english: "Reduced error rate by 50%+" },
  { label: "Kerry Process Time", korean: "ì²ë¦¬ ìê° 30% ë¨ì¶", english: "Reduced processing time by 30%" },
  { label: "Kerry Clients", korean: "50ê° ì´ìì ê³ ê°ì¬ ê´ë¦¬", english: "Managed 50+ client accounts" },
  { label: "Kerry SAP Experience", korean: "SAP ERP 3ë ì´ì ì¬ì©", english: "3+ years SAP ERP experience" },
  { label: "Kerry Team Training", korean: "ì ì 10~15ëª SAP êµì¡", english: "Trained 10-15 new hires on SAP" },
  { label: "Klivvr Daily Interactions", korean: "íë£¨ 50~100ê±´ ê³ ê° ìí¸ìì©", english: "50-100+ daily customer interactions" },
  { label: "International Experience", korean: "13ë ì´ìì êµ­ì  ê²½í", english: "13+ years international experience" },
  { label: "Languages", korean: "6ê° ì¸ì´ êµ¬ì¬", english: "Fluent in 6 languages" },
  { label: "Klovers Community", korean: "15ê°êµ­ 1,000ëª ì´ì íì", english: "1,000+ students across 15+ countries" },
  { label: "Klovers Duration", korean: "13ëê° ì´ì", english: "Running for 13 years" },
  { label: "Team Productivity", korean: "í ìì°ì± 20% í¥ì", english: "Improved team productivity by 20%" },
  { label: "System Onboarding", korean: "1~2ì£¼ ë´ ì ìì¤í ìë ¨", english: "Proficient in new systems within 1-2 weeks" },
  { label: "ERC Team Size", korean: "50ëª ê·ëª¨ì íì ë¶ì ê´ë¦¬", english: "Managed administrative dept of 50 personnel" },
  { label: "Education", korean: "ìì¸ì´ì¤ ëíêµ íêµ­ì´ê³¼ ì¡¸ì", english: "Ain Shams University Korean dept graduate" },
  { label: "Countries Worked", korean: "3ê°êµ­ ê·¼ë¬´ ê²½í (ì´ì§í¸, ë§ë ì´ìì, íê°ë¦¬)", english: "Worked in 3 countries (Egypt, Malaysia, Hungary)" },
  { label: "Korean Teaching", korean: "13ë ì´ìì íêµ­ì´ êµì¡ ê²½í", english: "13+ years Korean language teaching" },
  { label: "Cultural Events", korean: "ëê·ëª¨ ë¬¸í íì¬ íµì­ ë´ë¹", english: "Lead interpreter for large cultural events" },
  { label: "Korean Cultural Centre", korean: "íêµ­ë¬¸íì 2ë 8ê°ì ê·¼ë¬´", english: "2 years 8 months at Korean Cultural Centre" },
];

/* âââ Data: Power Phrases âââ */

const POWER_PHRASES: { korean: string; romanization: string; english: string }[] = [
  { korean: "ê°ì¬í©ëë¤", romanization: "gamsahamnida", english: "Thank you" },
  { korean: "ìµì ì ë¤íê² ìµëë¤", romanization: "choeseon-eul dahagesseumnida", english: "I will do my best" },
  { korean: "ê²½íì ë°íì¼ë¡", romanization: "gyeongheom-eul batang-euro", english: "Based on my experience" },
  { korean: "ê¸°ì¬í  ì ìë¤ê³  íì í©ëë¤", romanization: "giyeohal su itdago hwaksinhamnida", english: "I am confident I can contribute" },
  { korean: "ì²´ê³ì ì¼ë¡ ì ê·¼í©ëë¤", romanization: "chegyejeogeuro jeopgeunhamnida", english: "I approach systematically" },
  { korean: "ë°ì´í° íì§ì ëí ì´ì ", romanization: "deiteo pumjire daehan yeoljeong", english: "Passion for data quality" },
  { korean: "ë¹ ë¥´ê² ì ìíë í¸ìëë¤", romanization: "ppareuge jeogeunghaneun pyeonimnida", english: "I adapt quickly" },
  { korean: "íì ê°ì¹ë¥¼ ëí  ì ììµëë¤", romanization: "time gachireul deohal su isseumnida", english: "I can add value to the team" },
  { korean: "ì§ìì ì¼ë¡ ê°ì íê³  ììµëë¤", romanization: "jisogjeogeuro gaeseonhago isseumnida", english: "I am continuously improving" },
  { korean: "ì¦ì ê°ì¹ë¥¼ ì ê³µí  ì ììµëë¤", romanization: "jeuksi gachireul jegonghal su isseumnida", english: "I can deliver immediate value" },
  { korean: "ì´ì§í¸ ì¶ì ìëë¤", romanization: "ijipteu chulshinimnida", english: "I am from Egypt" },
  { korean: "íêµ­ì´íì ì ê³µíìµëë¤", romanization: "hangugeohageul jeonggonghaesseumnida", english: "I majored in Korean Linguistics" },
  { korean: "ë¤ìí êµ­ê°ìì ê·¼ë¬´í ê²½íì´ ììµëë¤", romanization: "dayanghan gugaeseo geunmuhan gyeongheomi isseumnida", english: "I have experience working in various countries" },
];

/* âââ Data: Company Summaries âââ */

const COMPANY_SUMMARIES: { name: string; korean: string; english: string }[] = [
  { name: "Kerry", korean: "F&B ë¶ì¼ ë¤êµ­ì  ê³ ê°ì¬ì ì£¼ë¬¸ ê´ë¦¬ ë´ë¹ (3ë 5ê°ì, ì¿ ìë¼ë£¸í¸ë¥´)", english: "Order Management Representative for multinational F&B clients (3yr 5mo, KL Malaysia)" },
  { name: "Accenture", korean: "ê¸ë¡ë² IT ë° ì»¨ì¤í íì¬ìì ë¤êµ­ì´ ì½íì¸  ëª¨ëë ì´í°ë¡ 3ë ì´ì ê·¼ë¬´ (ì¿ ìë¼ë£¸í¸ë¥´)", english: "3+ years as multilingual content moderator at global IT & consulting firm (KL Malaysia)" },
  { name: "Explore-Saudi", korean: "ë­ìë¦¬ ì¬í íë«í¼ì ëì§í¸ ë¸ëë© ë° ì¹ ê°ë° ë¦¬ë (ìê²©)", english: "Digital branding & web development lead for luxury travel platform (remote)" },
  { name: "Klivvr", korean: "ì´ì§í¸ ííí¬ ì¤íí¸ììì ê³ ê° ìë¹ì¤ ì ë¬¸ê° (ì¹´ì´ë¡)", english: "Customer Service Specialist at Egyptian fintech startup (Cairo)" },
  { name: "El Zenouki Group", korean: "ì ì¡° ê¸°ì íµì­ ìë¹ì¤ ì½ëë¤ì´í° â ìëì´/íêµ­ì´/ìì´ (ì¹´ì´ë¡)", english: "Interpreter Services Coordinator at manufacturing corp â Arabic/Korean/English (Cairo)" },
  { name: "Golden Dragon", korean: "ìì°ë¬¼ êµ­ì  ìì¶ ë¦¬íì¼ ì´ê´ ë§¤ëì  (ì¹´ì´ë¡)", english: "Retail General Manager for international eel & seafood export (Cairo)" },
  { name: "ERC (DAEAH E&C)", korean: "ìì  ë° ìëì§ íë¡ì í¸ íì  ê´ë¦¬ì â 50ëª ê´ë¦¬ (ì¹´ì´ë¡)", english: "Administration Manager for Oil & Energy project â 50 personnel (Cairo)" },
  { name: "Korean Cultural Centre", korean: "ë¬¸í íì¬ íµì­ ë° ê¸°í ë´ë¹ (ì¹´ì´ë¡, 2ë 8ê°ì)", english: "Cultural event interpreter & planner (Cairo, 2yr 8mo)" },
  { name: "GLC Europe", korean: "ì ë½ ìì¥ ê¸°ì ì»¨í¼ë°ì¤ ìì ë´ë¹ (ë¶ë¤íì¤í¸)", english: "Conference sales executive for European market (Budapest)" },
  { name: "Nur School", korean: "íê°ë¦¬ìì ìëì´ ê°ì¬ë¡ ì±ì¸ ëì êµì¡ (ë¶ë¤íì¤í¸)", english: "Arabic instructor for adults in Hungary (Budapest)" },
];

/* âââ Data: Vocabulary Groups âââ */

const VOCAB_GROUPS: { name: string; words: { korean: string; romanization: string; english: string }[] }[] = [
  {
    name: "Greetings & Politeness",
    words: [
      { korean: "ìëíì¸ì", romanization: "annyeonghaseyo", english: "Hello (formal)" },
      { korean: "ê°ì¬í©ëë¤", romanization: "gamsahamnida", english: "Thank you (formal)" },
      { korean: "ì¤ë¡í©ëë¤", romanization: "sillyehamnida", english: "Excuse me" },
      { korean: "ë¤, ìê² ìµëë¤", romanization: "ne, algesseumnida", english: "Yes, I understand" },
      { korean: "ì£ì¡í©ëë¤", romanization: "joesonghamnida", english: "I'm sorry (formal)" },
      { korean: "ë§ëì ë°ê°ìµëë¤", romanization: "mannaseo bangapseumnida", english: "Nice to meet you" },
      { korean: "ì ë¶íëë¦½ëë¤", romanization: "jal butakdeurimnida", english: "Please take care of me / I look forward to working with you" },
    ],
  },
  {
    name: "Transitions & Connectors",
    words: [
      { korean: "ê·¸ë¦¬ê³ ", romanization: "geurigo", english: "And / Also" },
      { korean: "ëí", romanization: "ttohan", english: "Furthermore" },
      { korean: "ê·¸ëì", romanization: "geuraeseo", english: "Therefore / So" },
      { korean: "í¹í", romanization: "teukhi", english: "Especially" },
      { korean: "ì´ë¥¼ íµí´", romanization: "ireul tonghae", english: "Through this" },
      { korean: "ë¿ë§ ìëë¼", romanization: "ppunman anira", english: "Not only ... but also" },
      { korean: "ê²°ê³¼ì ì¼ë¡", romanization: "gyeolgwajeogeuro", english: "As a result" },
      { korean: "ë¨¼ì ", romanization: "meonjeo", english: "First" },
      { korean: "ë§ì§ë§ì¼ë¡", romanization: "majimageuro", english: "Finally / Lastly" },
    ],
  },
  {
    name: "Action Verbs (Work)",
    words: [
      { korean: "ì²ë¦¬íë¤", romanization: "cheorihada", english: "To process / handle" },
      { korean: "ê´ë¦¬íë¤", romanization: "gwallihada", english: "To manage" },
      { korean: "ë¶ìíë¤", romanization: "bunseokada", english: "To analyze" },
      { korean: "ê°ë°íë¤", romanization: "gaebalhada", english: "To develop" },
      { korean: "ê°ì íë¤", romanization: "gaeseonhada", english: "To improve" },
      { korean: "êµì¡íë¤", romanization: "gyoyukada", english: "To train / educate" },
      { korean: "ë¬ì±íë¤", romanization: "dalseonghada", english: "To achieve" },
      { korean: "ì ì§íë¤", romanization: "yujihada", english: "To maintain" },
      { korean: "íìíë¤", romanization: "hyeopeopada", english: "To collaborate" },
      { korean: "ëìíë¤", romanization: "doipada", english: "To introduce / implement" },
    ],
  },
  {
    name: "Numbers & Quantities",
    words: [
      { korean: "ê±´ (ä»¶)", romanization: "geon", english: "Item / case (counter)" },
      { korean: "í¼ì¼í¸ (%)", romanization: "peosenteu", english: "Percent" },
      { korean: "ê°ì", romanization: "gaewol", english: "Months" },
      { korean: "ë", romanization: "nyeon", english: "Year(s)" },
      { korean: "ëª", romanization: "myeong", english: "People (counter)" },
      { korean: "ë°± (100)", romanization: "baek", english: "Hundred" },
      { korean: "ì² (1,000)", romanization: "cheon", english: "Thousand" },
      { korean: "ë§ (10,000)", romanization: "man", english: "Ten thousand" },
      { korean: "ì´ì", romanization: "isang", english: "More than / above" },
      { korean: "ìµë", romanization: "choedae", english: "Maximum / up to" },
    ],
  },
  {
    name: "Education & Background",
    words: [
      { korean: "ëíêµ", romanization: "daehakgyo", english: "University" },
      { korean: "ì ê³µ", romanization: "jeongong", english: "Major / Specialization" },
      { korean: "ì¡¸ì", romanization: "joreop", english: "Graduation" },
      { korean: "ë¬¸í", romanization: "munhak", english: "Literature" },
      { korean: "ì¸ì´í", romanization: "eoneohak", english: "Linguistics" },
      { korean: "íµì­", romanization: "tongyeok", english: "Interpretation" },
      { korean: "ë²ì­", romanization: "beonyeok", english: "Translation" },
      { korean: "ë¬´ì­", romanization: "muyeok", english: "Trade" },
      { korean: "ìì¶", romanization: "suchul", english: "Export" },
      { korean: "íì ", romanization: "haengjeong", english: "Administration" },
      { korean: "ì¶ì ", romanization: "chulsin", english: "Origin / From" },
    ],
  },
  {
    name: "Closing & Follow-up",
    words: [
      { korean: "ê¸°íë¥¼ ì£¼ìì ê°ì¬í©ëë¤", romanization: "gihoereul jusyeoseo gamsahamnida", english: "Thank you for the opportunity" },
      { korean: "ì°ë½ ì£¼ì¸ì", romanization: "yeollak juseyo", english: "Please contact me" },
      { korean: "ê¸°íë¥¼ ì£¼ìë©´", romanization: "gihoereul jusimyeon", english: "If you give me the opportunity" },
      { korean: "ë¹ ë¥´ê² ê¸°ì¬íê³  ì¶ìµëë¤", romanization: "ppareuge giyeohago sipseumnida", english: "I want to contribute quickly" },
      { korean: "ìë¯¸ ìë ê¸°ì¬", romanization: "uimi inneun giyeo", english: "Meaningful contribution" },
      { korean: "íì ê°ì¹ë¥¼ ëíë¤", romanization: "time gachireul deohada", english: "To add value to the team" },
    ],
  },
];

/* âââ Data: TOPIK 2ê¸â6ê¸ Flash Cards âââ */

interface FlashCardWord {
  korean: string;
  romanization: string;
  english: string;
  sentence_kr: string;
  sentence_en: string;
}

type TopikLevel = 2 | 3 | 4 | 5 | 6;

const FLASHCARD_DATA: { level: TopikLevel; category: string; words: FlashCardWord[] }[] = [
  /* ââââââââââââââââââ TOPIK 2ê¸ ââââââââââââââââââ */
  {
    level: 2, category: "Business & Work (ë¹ì¦ëì¤)",
    words: [
      { korean: "íì", romanization: "hoeui", english: "Meeting", sentence_kr: "ì¤ë ì¤íì ì¤ìí íìê° ììµëë¤.", sentence_en: "There is an important meeting this afternoon." },
      { korean: "ë³´ê³ ì", romanization: "bogoseo", english: "Report", sentence_kr: "ë´ì¼ê¹ì§ ë³´ê³ ìë¥¼ ì ì¶í´ì¼ í©ëë¤.", sentence_en: "I have to submit the report by tomorrow." },
      { korean: "ì¶ì¥", romanization: "chuljang", english: "Business trip", sentence_kr: "ë¤ì ì£¼ì ë§ë ì´ììë¡ ì¶ì¥ì ê°ëë¤.", sentence_en: "I'm going on a business trip to Malaysia next week." },
      { korean: "ê±°ëì²", romanization: "georaecheo", english: "Client company", sentence_kr: "ê±°ëì²ì ì¢ì ê´ê³ë¥¼ ì ì§íë ê²ì´ ì¤ìí©ëë¤.", sentence_en: "It is important to maintain good relationships with clients." },
      { korean: "ì¤ì ", romanization: "siljeok", english: "Performance results", sentence_kr: "ì´ë² ë¶ê¸° ì¤ì ì´ ë§¤ì° ì¢ììµëë¤.", sentence_en: "This quarter's performance was very good." },
      { korean: "ì¹ì§", romanization: "seungjin", english: "Promotion", sentence_kr: "ì´ì¬í ì¼í´ì ì¹ì§í  ì ìììµëë¤.", sentence_en: "I was able to get promoted by working hard." },
      { korean: "ê³ì½", romanization: "gyeyak", english: "Contract", sentence_kr: "ìë¡ì´ ê³ ê°ê³¼ ê³ì½ì ì²´ê²°íìµëë¤.", sentence_en: "We signed a contract with a new customer." },
      { korean: "ë§ê°", romanization: "magam", english: "Deadline", sentence_kr: "ë§ê° ê¸°íì ê¼­ ì§ì¼ ì£¼ì¸ì.", sentence_en: "Please make sure to meet the deadline." },
    ],
  },
  {
    level: 2, category: "Communication (ìíµ)",
    words: [
      { korean: "ìê²¬", romanization: "uigyeon", english: "Opinion", sentence_kr: "ë¤ë¥¸ ìê²¬ì´ ìì¼ìë©´ ë§ìí´ ì£¼ì¸ì.", sentence_en: "Please share if you have a different opinion." },
      { korean: "ì ì", romanization: "jean", english: "Suggestion / proposal", sentence_kr: "ìë¡ì´ íë¡ì í¸ì ëí ì ìì ì¤ë¹íìµëë¤.", sentence_en: "I prepared a proposal for the new project." },
      { korean: "ì¤ëª", romanization: "seolmyeong", english: "Explanation", sentence_kr: "ìì¸í ì¤ëªì ë¶íëë¦½ëë¤.", sentence_en: "Could you please give a detailed explanation?" },
      { korean: "íì¸", romanization: "hwaghin", english: "Confirmation", sentence_kr: "ì´ë©ì¼ì íì¸íì¨ëì?", sentence_en: "Did you check the email?" },
      { korean: "ì°ë½", romanization: "yeollak", english: "Contact", sentence_kr: "ê²°ê³¼ê° ëì¤ë©´ ë°ë¡ ì°ë½ëë¦¬ê² ìµëë¤.", sentence_en: "I will contact you as soon as the results are out." },
      { korean: "ìì", romanization: "sangui", english: "Consultation", sentence_kr: "íì¥ëê³¼ ììí íì ê²°ì íê² ìµëë¤.", sentence_en: "I will decide after discussing with the team leader." },
      { korean: "ì ë¬", romanization: "jeondal", english: "Passing on info", sentence_kr: "ì´ ë´ì©ì íìë¤ìê² ì ë¬í´ ì£¼ì¸ì.", sentence_en: "Please pass this information on to the team members." },
      { korean: "ì°¸ì", romanization: "chamseok", english: "Attendance", sentence_kr: "ë´ì¼ íìì ì°¸ìí  ì ìì¼ì ê°ì?", sentence_en: "Can you attend tomorrow's meeting?" },
    ],
  },
  {
    level: 2, category: "Daily & Goals (ì¼ì)",
    words: [
      { korean: "ì½ì", romanization: "yaksok", english: "Appointment / promise", sentence_kr: "ë´ì¼ ì ì¬ì ì½ìì´ ììµëë¤.", sentence_en: "I have an appointment at lunch tomorrow." },
      { korean: "ì¤ë¹", romanization: "junbi", english: "Preparation", sentence_kr: "ë©´ì  ì¤ë¹ë¥¼ ì² ì í íìµëë¤.", sentence_en: "I thoroughly prepared for the interview." },
      { korean: "ê³í", romanization: "gyehoek", english: "Plan", sentence_kr: "ì¬í´ì ê³íì ì¸ì ìµëë¤.", sentence_en: "I made plans for this year." },
      { korean: "ê²°ê³¼", romanization: "gyeolgwa", english: "Result", sentence_kr: "ë¸ë ¥ì ê²°ê³¼ê° ì¢ììµëë¤.", sentence_en: "The results of my efforts were good." },
      { korean: "ê¸°í", romanization: "gihoe", english: "Opportunity", sentence_kr: "ì´ë² ê¸°íë¥¼ ëì¹ê³  ì¶ì§ ììµëë¤.", sentence_en: "I don't want to miss this opportunity." },
      { korean: "ëª©í", romanization: "mokpyo", english: "Goal / target", sentence_kr: "ì¬í´ì ëª©íë TOPIK 4ê¸ í©ê²©ìëë¤.", sentence_en: "My goal this year is to pass TOPIK Level 4." },
      { korean: "ë¸ë ¥", romanization: "noryeok", english: "Effort", sentence_kr: "ë§¤ì¼ ê¾¸ì¤í ë¸ë ¥íê³  ììµëë¤.", sentence_en: "I make consistent effort every day." },
      { korean: "ìµê´", romanization: "seupgwan", english: "Habit", sentence_kr: "ì¢ì ìµê´ì ë§ëë ê²ì´ ì¤ìí©ëë¤.", sentence_en: "It is important to build good habits." },
    ],
  },
  {
    level: 2, category: "Interview Basics (ë©´ì )",
    words: [
      { korean: "ì§ìíë¤", romanization: "jiwonhada", english: "To apply", sentence_kr: "ì´ íì¬ì ì§ìí ì´ì ë ì±ì¥ ê°ë¥ì± ëë¬¸ìëë¤.", sentence_en: "The reason I applied to this company is its growth potential." },
      { korean: "ì±ì©", romanization: "chaeyong", english: "Hiring", sentence_kr: "ì±ì© ê³µê³ ë¥¼ ë³´ê³  ì§ìíìµëë¤.", sentence_en: "I applied after seeing the job posting." },
      { korean: "ë©´ì ê´", romanization: "myeonjeobgwan", english: "Interviewer", sentence_kr: "ë©´ì ê´ì ì§ë¬¸ì ì ííê² ëµë³íìµëë¤.", sentence_en: "I answered the interviewer's questions accurately." },
      { korean: "ì´ë ¥ì", romanization: "iryeokseo", english: "Resume / CV", sentence_kr: "ì´ë ¥ìë¥¼ ìµì  ìíë¡ ìë°ì´í¸íìµëë¤.", sentence_en: "I updated my resume to the latest version." },
      { korean: "í¬ë¶", romanization: "pobu", english: "Ambition", sentence_kr: "ì´ ë¶ì¼ì ì ë¬¸ê°ê° ëë ê²ì´ ì  í¬ë¶ìëë¤.", sentence_en: "My ambition is to become an expert in this field." },
      { korean: "ê¸°ì¬íë¤", romanization: "giyeohada", english: "To contribute", sentence_kr: "íì ì±ê³¼ì ê¸°ì¬íê³  ì¶ìµëë¤.", sentence_en: "I want to contribute to the team's performance." },
      { korean: "ëê¸°", romanization: "donggi", english: "Motivation", sentence_kr: "ì§ì ëê¸°ë¥¼ ë§ìí´ ì£¼ì¸ì.", sentence_en: "Please tell me your motivation for applying." },
      { korean: "ìì¬", romanization: "ipsa", english: "Joining a company", sentence_kr: "ìì¬ í ì²« 3ê°ì ìì ë¹ ë¥´ê² ì ìíê² ìµëë¤.", sentence_en: "I will adapt quickly within the first 3 months after joining." },
    ],
  },
  /* ââââââââââââââââââ TOPIK 3ê¸ ââââââââââââââââââ */
  {
    level: 3, category: "Workplace (ì§ì¥ìí)",
    words: [
      { korean: "ìë¬´", romanization: "eopmu", english: "Work / duties", sentence_kr: "ìë¡ì´ ìë¬´ë¥¼ ë§¡ê² ëììµëë¤.", sentence_en: "I have been assigned new duties." },
      { korean: "ë´ë¹", romanization: "damdang", english: "In charge of", sentence_kr: "ì´ íë¡ì í¸ì ë´ë¹ìê° ëêµ¬ìëê¹?", sentence_en: "Who is in charge of this project?" },
      { korean: "ë¶ì", romanization: "buseo", english: "Department", sentence_kr: "ë¤ë¥¸ ë¶ìì íë ¥íì¬ ì¼í©ëë¤.", sentence_en: "I work in cooperation with other departments." },
      { korean: "ê·¼ë¬´", romanization: "geunmu", english: "Work / service", sentence_kr: "í´ì¸ìì 3ëê° ê·¼ë¬´íìµëë¤.", sentence_en: "I worked overseas for 3 years." },
      { korean: "ì¼ê·¼", romanization: "yageun", english: "Overtime", sentence_kr: "ë§ê° ì ì ì¼ê·¼ì í´ì¼ íìµëë¤.", sentence_en: "I had to work overtime before the deadline." },
      { korean: "ìê¸", romanization: "wolgeup", english: "Monthly salary", sentence_kr: "ìê¸ì ê²½ë ¥ì ë°ë¼ ë¤ë¦ëë¤.", sentence_en: "The salary varies depending on experience." },
      { korean: "í´ê·¼", romanization: "toegeun", english: "Leaving work", sentence_kr: "ë³´íµ 7ìì í´ê·¼í©ëë¤.", sentence_en: "I usually leave work at 7." },
      { korean: "ì¶ê·¼", romanization: "chulgeun", english: "Going to work", sentence_kr: "ë§¤ì¼ ìì¹¨ 8ìì ì¶ê·¼í©ëë¤.", sentence_en: "I go to work at 8 every morning." },
    ],
  },
  {
    level: 3, category: "Skills & Traits (ì­ë)",
    words: [
      { korean: "ê²½í", romanization: "gyeongheom", english: "Experience", sentence_kr: "ë¤ìí ë¶ì¼ìì ê²½íì ìììµëë¤.", sentence_en: "I have gained experience in various fields." },
      { korean: "ë¥ë ¥", romanization: "neungnyeok", english: "Ability", sentence_kr: "ë¬¸ì  í´ê²° ë¥ë ¥ì´ ë°ì´ë©ëë¤.", sentence_en: "My problem-solving ability is excellent." },
      { korean: "ìì ê°", romanization: "jasingam", english: "Confidence", sentence_kr: "ë©´ì ìì ìì ê°ì ë³´ì¬ ì£¼ë ê²ì´ ì¤ìí©ëë¤.", sentence_en: "It is important to show confidence in an interview." },
      { korean: "ì±ìê°", romanization: "chaegimgam", english: "Responsibility", sentence_kr: "ê°í ì±ìê°ì ê°ì§ê³  ì¼í©ëë¤.", sentence_en: "I work with a strong sense of responsibility." },
      { korean: "ì±ì¤íë¤", romanization: "seongsilhada", english: "Diligent", sentence_kr: "í­ì ì±ì¤íê² ì¼íë ¤ê³  ë¸ë ¥í©ëë¤.", sentence_en: "I always try to work diligently." },
      { korean: "ê¼¼ê¼¼íë¤", romanization: "kkomkkomhada", english: "Meticulous", sentence_kr: "ì ë ìë¬´ë¥¼ ê¼¼ê¼¼íê² ì²ë¦¬í©ëë¤.", sentence_en: "I handle my work meticulously." },
      { korean: "ì ê·¹ì ", romanization: "jeokgeukjeok", english: "Proactive", sentence_kr: "ìë¡ì´ íë¡ì í¸ì ì ê·¹ì ì¼ë¡ ì°¸ì¬í©ëë¤.", sentence_en: "I actively participate in new projects." },
      { korean: "ì ì°íë¤", romanization: "yuyeonhada", english: "Flexible", sentence_kr: "ì ì°í ì¬ê³ ë¡ ë¬¸ì ë¥¼ í´ê²°í©ëë¤.", sentence_en: "I solve problems with flexible thinking." },
    ],
  },
  {
    level: 3, category: "Social & Relations (ê´ê³)",
    words: [
      { korean: "ì¸ì¬", romanization: "insa", english: "Greeting / HR", sentence_kr: "ì¸ì¬ ë´ë¹ììê² ì°ë½í´ ì£¼ì¸ì.", sentence_en: "Please contact the HR manager." },
      { korean: "ìê°", romanization: "sogae", english: "Introduction", sentence_kr: "ìê¸°ìê°ë¥¼ í´ ì£¼ì¸ì.", sentence_en: "Please introduce yourself." },
      { korean: "ì¡´ê²½", romanization: "jongyeong", english: "Respect", sentence_kr: "ì ë°°ëì ì¡´ê²½í©ëë¤.", sentence_en: "I respect my senior." },
      { korean: "ì ë¢°", romanization: "silloe", english: "Trust", sentence_kr: "íì ê°ì ì ë¢°ê° ì¤ìí©ëë¤.", sentence_en: "Trust between team members is important." },
      { korean: "ë°°ë ¤", romanization: "baeryeo", english: "Consideration", sentence_kr: "ëë£ì ëí ë°°ë ¤ê° íìí©ëë¤.", sentence_en: "Consideration for colleagues is needed." },
      { korean: "ê°ë±", romanization: "galdeung", english: "Conflict", sentence_kr: "ê°ë±ì ì í´ê²°íë ê²ì´ ì¤ìí©ëë¤.", sentence_en: "It is important to resolve conflicts well." },
      { korean: "íì¡°", romanization: "hyeopjo", english: "Cooperation", sentence_kr: "íì¡°í´ ì£¼ìì ê°ì¬í©ëë¤.", sentence_en: "Thank you for your cooperation." },
      { korean: "ëë£", romanization: "dongnyo", english: "Colleague", sentence_kr: "ëë£ë¤ê³¼ ì¢ì ê´ê³ë¥¼ ì ì§íê³  ììµëë¤.", sentence_en: "I maintain good relationships with colleagues." },
    ],
  },
  /* ââââââââââââââââââ TOPIK 4ê¸ ââââââââââââââââââ */
  {
    level: 4, category: "Professional (ì ë¬¸ ì©ì´)",
    words: [
      { korean: "ì ëµ", romanization: "jeollyak", english: "Strategy", sentence_kr: "ìë¡ì´ ë§ì¼í ì ëµì ìë¦½íìµëë¤.", sentence_en: "We established a new marketing strategy." },
      { korean: "í¨ì¨", romanization: "hyoyul", english: "Efficiency", sentence_kr: "ìë¬´ í¨ì¨ì ëì´ê¸° ìí´ íë¡ì¸ì¤ë¥¼ ê°ì íìµëë¤.", sentence_en: "I improved processes to increase work efficiency." },
      { korean: "ë¶ì", romanization: "bunseok", english: "Analysis", sentence_kr: "ë°ì´í°ë¥¼ ë¶ìíì¬ ë¬¸ì ì ìì¸ì íìíìµëë¤.", sentence_en: "I analyzed data to identify the cause of the problem." },
      { korean: "íê°", romanization: "pyeongga", english: "Evaluation", sentence_kr: "ì±ê³¼ íê°ìì ëì ì ìë¥¼ ë°ììµëë¤.", sentence_en: "I received a high score in the performance evaluation." },
      { korean: "ê°ì ", romanization: "gaeseon", english: "Improvement", sentence_kr: "ìë¹ì¤ íì§ì ì§ìì ì¼ë¡ ê°ì íê³  ììµëë¤.", sentence_en: "We are continuously improving service quality." },
      { korean: "íì ", romanization: "hyeoksin", english: "Innovation", sentence_kr: "íì ì ì¸ ìì´ëì´ë¡ ë¬¸ì ë¥¼ í´ê²°íìµëë¤.", sentence_en: "I solved the problem with an innovative idea." },
      { korean: "ì±ì·¨", romanization: "seongchwi", english: "Achievement", sentence_kr: "í° ì±ì·¨ê°ì ëê¼ìµëë¤.", sentence_en: "I felt a great sense of achievement." },
      { korean: "ìí", romanization: "suhaeng", english: "Execution", sentence_kr: "íë¡ì í¸ë¥¼ ì±ê³µì ì¼ë¡ ìííìµëë¤.", sentence_en: "I successfully executed the project." },
    ],
  },
  {
    level: 4, category: "Management (ê´ë¦¬)",
    words: [
      { korean: "ìì°", romanization: "yesan", english: "Budget", sentence_kr: "íë¡ì í¸ ìì°ì í¨ì¨ì ì¼ë¡ ê´ë¦¬íìµëë¤.", sentence_en: "I managed the project budget efficiently." },
      { korean: "ì¼ì ", romanization: "iljeong", english: "Schedule", sentence_kr: "ì¼ì ì ì¡°ì¨íì¬ íìë¥¼ ì¡ê² ìµëë¤.", sentence_en: "I will coordinate the schedule to set up a meeting." },
      { korean: "ì ì°¨", romanization: "jeolcha", english: "Procedure", sentence_kr: "ì í´ì§ ì ì°¨ì ë°ë¼ ìë¬´ë¥¼ ì²ë¦¬í©ëë¤.", sentence_en: "I handle tasks according to the established procedures." },
      { korean: "ê¸°ì¤", romanization: "gijun", english: "Standard / criteria", sentence_kr: "ëì íì§ ê¸°ì¤ì ì ì§í©ëë¤.", sentence_en: "I maintain high quality standards." },
      { korean: "ì¡°ì¨", romanization: "joyul", english: "Coordination", sentence_kr: "ì¬ë¬ ë¶ì ê°ì ì¡°ì¨ì´ íìí©ëë¤.", sentence_en: "Coordination between multiple departments is needed." },
      { korean: "ìì", romanization: "wiim", english: "Delegation", sentence_kr: "ì ì í ìë¬´ ììì´ í¨ì¨ì±ì ëìëë¤.", sentence_en: "Proper task delegation increases efficiency." },
      { korean: "ê°ë", romanization: "gamdok", english: "Supervision", sentence_kr: "íë¡ì í¸ ì§íì ê°ëí©ëë¤.", sentence_en: "I supervise the project progress." },
      { korean: "ë³´ì", romanization: "bowan", english: "Supplementation", sentence_kr: "ë¶ì¡±í ë¶ë¶ì ë³´ìíê² ìµëë¤.", sentence_en: "I will supplement the lacking areas." },
    ],
  },
  {
    level: 4, category: "Problem Solving (ë¬¸ì  í´ê²°)",
    words: [
      { korean: "ìì¸", romanization: "wonin", english: "Cause", sentence_kr: "ë¬¸ì ì ê·¼ë³¸ ìì¸ì íìíìµëë¤.", sentence_en: "I identified the root cause of the problem." },
      { korean: "í´ê²°ì±", romanization: "haegyeolchaek", english: "Solution", sentence_kr: "í¨ê³¼ì ì¸ í´ê²°ì±ì ì ìíìµëë¤.", sentence_en: "I presented an effective solution." },
      { korean: "ëì", romanization: "daean", english: "Alternative", sentence_kr: "ì¬ë¬ ëìì ê²í í í ê²°ì íìµëë¤.", sentence_en: "I decided after reviewing several alternatives." },
      { korean: "ìê¸°", romanization: "wigi", english: "Crisis", sentence_kr: "ìê¸° ìí©ìì ì¹¨ì°©íê² ëìíìµëë¤.", sentence_en: "I responded calmly in a crisis situation." },
      { korean: "ì¡°ì¹", romanization: "jochi", english: "Measure / action", sentence_kr: "ì¦ì ì ì í ì¡°ì¹ë¥¼ ì·¨íìµëë¤.", sentence_en: "I took appropriate measures immediately." },
      { korean: "íë¨", romanization: "pandan", english: "Judgment", sentence_kr: "ì ìíê³  ì íí íë¨ì´ ì¤ìí©ëë¤.", sentence_en: "Quick and accurate judgment is important." },
      { korean: "ìë°©", romanization: "yebang", english: "Prevention", sentence_kr: "ì¬ë° ë°©ì§ë¥¼ ìí ìë°© ì¡°ì¹ë¥¼ ìë¦½íìµëë¤.", sentence_en: "I established preventive measures to prevent recurrence." },
      { korean: "í¼ëë°±", romanization: "pideubaek", english: "Feedback", sentence_kr: "ê³ ê°ì í¼ëë°±ì ë°ìíì¬ ê°ì íìµëë¤.", sentence_en: "I improved by reflecting customer feedback." },
    ],
  },
  /* ââââââââââââââââââ TOPIK 5ê¸ ââââââââââââââââââ */
  {
    level: 5, category: "Leadership (ë¦¬ëì­)",
    words: [
      { korean: "ì£¼ëíë¤", romanization: "judohada", english: "To lead / take initiative", sentence_kr: "íë¡ì í¸ë¥¼ ì£¼ëíì¬ ì±ê³µì ì¼ë¡ ìë£íìµëë¤.", sentence_en: "I led the project and completed it successfully." },
      { korean: "íµìë ¥", romanization: "tongsollyeok", english: "Leadership ability", sentence_kr: "ê°í íµìë ¥ì¼ë¡ íì ì´ëììµëë¤.", sentence_en: "I led the team with strong leadership ability." },
      { korean: "ìì¬ê²°ì ", romanization: "uisagyeoljeong", english: "Decision-making", sentence_kr: "ì ìí ìì¬ê²°ì ì´ íë¡ì í¸ ì±ê³µì íµì¬ì´ììµëë¤.", sentence_en: "Quick decision-making was key to the project's success." },
      { korean: "ëê¸°ë¶ì¬", romanization: "donggibuyeo", english: "Motivation (giving)", sentence_kr: "íìë¤ìê² ëê¸°ë¶ì¬ë¥¼ íë ê²ì ì¤ìíê² ìê°í©ëë¤.", sentence_en: "I value motivating team members." },
      { korean: "ì­ë", romanization: "yeokryang", english: "Competency", sentence_kr: "íµì¬ ì­ëì ê°ííê¸° ìí´ ë¸ë ¥í©ëë¤.", sentence_en: "I strive to strengthen core competencies." },
      { korean: "ë¹ì ", romanization: "bijeon", english: "Vision", sentence_kr: "ëªíí ë¹ì ì ê°ì§ê³  íì ì´ëëë¤.", sentence_en: "I lead the team with a clear vision." },
      { korean: "ê¶í", romanization: "gwonhan", english: "Authority", sentence_kr: "íììê² ì ì í ê¶íì ë¶ì¬í©ëë¤.", sentence_en: "I grant appropriate authority to team members." },
      { korean: "ìì¨ì±", romanization: "jayulseong", english: "Autonomy", sentence_kr: "ìì¨ì±ì ì¡´ì¤íë©´ìë ë°©í¥ì ì ìí©ëë¤.", sentence_en: "I provide direction while respecting autonomy." },
    ],
  },
  {
    level: 5, category: "Advanced Business (ê³ ê¸ ë¹ì¦ëì¤)",
    words: [
      { korean: "ììµ", romanization: "suik", english: "Profit / revenue", sentence_kr: "ì ë ëë¹ ììµì´ 20% ì¦ê°íìµëë¤.", sentence_en: "Revenue increased by 20% compared to last year." },
      { korean: "í¬ì", romanization: "tuja", english: "Investment", sentence_kr: "ì ê¸°ì ì ëí í¬ìê° íìí©ëë¤.", sentence_en: "Investment in new technology is needed." },
      { korean: "ìì¥", romanization: "sijang", english: "Market", sentence_kr: "ìë¡ì´ ìì¥ì ì§ì¶í  ê³íìëë¤.", sentence_en: "We plan to enter a new market." },
      { korean: "ê²½ìë ¥", romanization: "gyeongjaengnyeok", english: "Competitiveness", sentence_kr: "ê²½ìë ¥ì ê°ì¶ê¸° ìí´ ëììì´ íì í©ëë¤.", sentence_en: "We constantly innovate to maintain competitiveness." },
      { korean: "ë¸ëë", romanization: "beuraendeu", english: "Brand", sentence_kr: "ë¸ëë ê°ì¹ë¥¼ ëì´ë ë° ê¸°ì¬íìµëë¤.", sentence_en: "I contributed to enhancing brand value." },
      { korean: "ë§¤ì¶", romanization: "maechul", english: "Sales revenue", sentence_kr: "ë§¤ì¶ ëª©íë¥¼ ì´ê³¼ ë¬ì±íìµëë¤.", sentence_en: "I exceeded the sales target." },
      { korean: "ê·ëª¨", romanization: "gyumo", english: "Scale / size", sentence_kr: "50ëª ê·ëª¨ì ë¶ìë¥¼ ê´ë¦¬íìµëë¤.", sentence_en: "I managed a department of 50 people." },
      { korean: "ë©ê¸°", romanization: "napgi", english: "Delivery date", sentence_kr: "ë©ê¸°ë¥¼ ì¤ìíê¸° ìí´ ì¼ì ì ê´ë¦¬í©ëë¤.", sentence_en: "I manage the schedule to meet delivery dates." },
    ],
  },
  {
    level: 5, category: "Negotiations (íì)",
    words: [
      { korean: "íì", romanization: "hyeopsang", english: "Negotiation", sentence_kr: "ì ë¦¬í ì¡°ê±´ì¼ë¡ íìì ë§ë¬´ë¦¬íìµëë¤.", sentence_en: "I concluded the negotiation on favorable terms." },
      { korean: "íí", romanization: "tahyeop", english: "Compromise", sentence_kr: "ìì¸¡ì´ ííì ì ì°¾ììµëë¤.", sentence_en: "Both sides found a point of compromise." },
      { korean: "ì ìíë¤", romanization: "jesihada", english: "To present / propose", sentence_kr: "ìë¡ì´ ì¡°ê±´ì ì ìíìµëë¤.", sentence_en: "I presented new conditions." },
      { korean: "ìì©íë¤", romanization: "suyonghada", english: "To accept", sentence_kr: "ê³ ê°ì ìì²­ì ìì©íìµëë¤.", sentence_en: "I accepted the customer's request." },
      { korean: "ê±°ì íë¤", romanization: "geojeolhada", english: "To refuse", sentence_kr: "ë¶í©ë¦¬í ì¡°ê±´ì ì ì¤íê² ê±°ì íìµëë¤.", sentence_en: "I politely refused unreasonable conditions." },
      { korean: "ìë³´", romanization: "yangbo", english: "Concession", sentence_kr: "ìí¸ ìë³´ë¥¼ íµí´ í©ìì ëë¬íìµëë¤.", sentence_en: "We reached an agreement through mutual concessions." },
      { korean: "í©ì", romanization: "habui", english: "Agreement", sentence_kr: "ìµì¢ í©ìì ì±ê³µì ì¼ë¡ ëë¬íìµëë¤.", sentence_en: "We successfully reached a final agreement." },
      { korean: "ì¡°ê±´", romanization: "jogeon", english: "Condition / terms", sentence_kr: "ê³ì½ ì¡°ê±´ì ê¼¼ê¼¼í ê²í íìµëë¤.", sentence_en: "I carefully reviewed the contract terms." },
    ],
  },
  /* ââââââââââââââââââ TOPIK 6ê¸ ââââââââââââââââââ */
  {
    level: 6, category: "Corporate Strategy (ê²½ì ì ëµ)",
    words: [
      { korean: "êµ¬ì¡°ì¡°ì ", romanization: "gujojojeong", english: "Restructuring", sentence_kr: "í¨ì¨ì ì¸ êµ¬ì¡°ì¡°ì ì íµí´ ì¡°ì§ì ê°í¸íìµëë¤.", sentence_en: "We reorganized the structure through efficient restructuring." },
      { korean: "ì¸ìí©ë³", romanization: "insuhapbyeong", english: "Mergers & acquisitions", sentence_kr: "ì¸ìí©ë³ì íµí´ ìì¥ ì ì ì¨ì ëììµëë¤.", sentence_en: "We increased market share through mergers and acquisitions." },
      { korean: "ì§ìê°ë¥ì±", romanization: "jisokganeungseong", english: "Sustainability", sentence_kr: "ì§ìê°ë¥í ì±ì¥ì ìí ì ëµì ìë¦½íìµëë¤.", sentence_en: "We established a strategy for sustainable growth." },
      { korean: "ê±°ë²ëì¤", romanization: "geobeoneonseu", english: "Governance", sentence_kr: "í¬ëªí ê±°ë²ëì¤ ì²´ê³ë¥¼ êµ¬ì¶íìµëë¤.", sentence_en: "We built a transparent governance system." },
      { korean: "ì´í´ê´ê³ì", romanization: "ihaegwangyeja", english: "Stakeholder", sentence_kr: "ì´í´ê´ê³ìì ìêµ¬ë¥¼ ê· í ìê² ë°ìí©ëë¤.", sentence_en: "I reflect stakeholder needs in a balanced way." },
      { korean: "ìëì§", romanization: "sineoji", english: "Synergy", sentence_kr: "ë¶ì ê° ìëì§ë¥¼ ê·¹ëíí©ëë¤.", sentence_en: "I maximize synergy between departments." },
      { korean: "í¨ë¬ë¤ì", romanization: "paereodaim", english: "Paradigm", sentence_kr: "ìë¡ì´ í¨ë¬ë¤ìì ì ìí´ì¼ í©ëë¤.", sentence_en: "We must adapt to the new paradigm." },
      { korean: "ë²¤ì¹ë§í¹", romanization: "benchimaking", english: "Benchmarking", sentence_kr: "ê¸ë¡ë² ê¸°ìì ë²¤ì¹ë§í¹íì¬ íë¡ì¸ì¤ë¥¼ ê°ì íìµëë¤.", sentence_en: "I improved processes by benchmarking global companies." },
    ],
  },
  {
    level: 6, category: "Critical Thinking (ë¹íì  ì¬ê³ )",
    words: [
      { korean: "ë¼ë¦¬ì ", romanization: "nollijeok", english: "Logical", sentence_kr: "ë¼ë¦¬ì ì¸ ê·¼ê±°ë¥¼ ë°íì¼ë¡ ì£¼ì¥í©ëë¤.", sentence_en: "I argue based on logical grounds." },
      { korean: "ê°ê´ì ", romanization: "gaekgwanjeok", english: "Objective", sentence_kr: "ê°ê´ì ì¸ ë°ì´í°ë¡ ìì¬ê²°ì ì í©ëë¤.", sentence_en: "I make decisions based on objective data." },
      { korean: "íë¹ì±", romanization: "tadangseong", english: "Validity", sentence_kr: "ì ìì íë¹ì±ì ê²ì¦íìµëë¤.", sentence_en: "I verified the validity of the proposal." },
      { korean: "ëª¨ì", romanization: "mosun", english: "Contradiction", sentence_kr: "ë³´ê³ ììì ëª¨ìëë ë¶ë¶ì ë°ê²¬íìµëë¤.", sentence_en: "I found contradictory parts in the report." },
      { korean: "ê·¼ê±°", romanization: "geungeo", english: "Basis / evidence", sentence_kr: "ì¶©ë¶í ê·¼ê±°ë¥¼ ê°ì§ê³  ê²°ì ì ë´ë ¸ìµëë¤.", sentence_en: "I made the decision with sufficient evidence." },
      { korean: "íµì°°ë ¥", romanization: "tongchallyeok", english: "Insight", sentence_kr: "ê¹ì íµì°°ë ¥ì¼ë¡ ìì¥ ë³íë¥¼ ìì¸¡íìµëë¤.", sentence_en: "I predicted market changes with deep insight." },
      { korean: "ê´ì ", romanization: "gwanjeom", english: "Perspective", sentence_kr: "ë¤ìí ê´ì ìì ë¬¸ì ë¥¼ ë°ë¼ë´ëë¤.", sentence_en: "I look at problems from various perspectives." },
      { korean: "í¨ì", romanization: "hamui", english: "Implication", sentence_kr: "ì´ ê²°ê³¼ì í¨ìë¥¼ ë¶ìíìµëë¤.", sentence_en: "I analyzed the implications of these results." },
    ],
  },
  {
    level: 6, category: "Formal Expressions (ê²©ì íí)",
    words: [
      { korean: "ê²¬í´", romanization: "gyeonhae", english: "View / opinion (formal)", sentence_kr: "ì´ ë¬¸ì ì ëí ê²¬í´ë¥¼ ë§ìí´ ì£¼ì­ìì¤.", sentence_en: "Please share your view on this matter." },
      { korean: "ìë¦½íë¤", romanization: "suriphada", english: "To establish (formal)", sentence_kr: "ì¥ê¸°ì ì¸ ê³íì ìë¦½íìµëë¤.", sentence_en: "I established a long-term plan." },
      { korean: "ëëª¨íë¤", romanization: "domohada", english: "To pursue / promote", sentence_kr: "ìí¸ ë°ì ì ëëª¨íê³ ì í©ëë¤.", sentence_en: "I wish to pursue mutual development." },
      { korean: "ìë§íë¤", romanization: "yomanghada", english: "To desire / request", sentence_kr: "ì ê·¹ì ì¸ íì¡°ë¥¼ ìë§í©ëë¤.", sentence_en: "Active cooperation is requested." },
      { korean: "ì·¨ì§", romanization: "chwiji", english: "Purpose / intent", sentence_kr: "ì´ ì ì±ì ì·¨ì§ë¥¼ ì¤ëªíê² ìµëë¤.", sentence_en: "I will explain the purpose of this policy." },
      { korean: "ì¼í", romanization: "ilhwan", english: "Part of / as part of", sentence_kr: "íì ì ì¼íì¼ë¡ ìì¤íì ê°í¸íìµëë¤.", sentence_en: "We revamped the system as part of the innovation effort." },
      { korean: "ì¬ì§", romanization: "yeoji", english: "Room / possibility", sentence_kr: "ê°ì ì ì¬ì§ê° ì¶©ë¶í©ëë¤.", sentence_en: "There is plenty of room for improvement." },
      { korean: "ìì ", romanization: "sosin", english: "Conviction / belief", sentence_kr: "ìì ì ê°ì§ê³  ìê²¬ì ë§í©ëë¤.", sentence_en: "I speak my opinion with conviction." },
    ],
  },
];

/* âââ Play Button Component âââ */

function PlayBtn({ onClick, label, variant = "kr", disabled }: {
  onClick: () => void; label?: string; variant?: "kr" | "en" | "slow"; disabled?: boolean;
}) {
  const colors = {
    kr: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
    en: "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50",
    slow: "text-orange-600 hover:text-orange-800 hover:bg-orange-50",
  };
  return (
    <Button
      size="sm"
      variant="ghost"
      className={cn("h-8 gap-1 text-xs", colors[variant])}
      onClick={onClick}
      disabled={disabled}
    >
      <Volume2 className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

/* âââ Main Component âââ */

/* âââ Shuffle helper âââ */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RehamTrainingPanel() {
  const { speak, speakKorean, speakEnglish, isSpeaking, cancel } = useSpeech();
  const [activeSubTab, setActiveSubTab] = useState("introduction");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  /* Quiz Mode state */
  const [quizShuffle, setQuizShuffle] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [confidence, setConfidence] = useState<Map<number, 1 | 2 | 3>>(new Map());
  const quizOrder = useMemo(
    () => (quizShuffle ? shuffleArray(CONVERSATION_DATA) : CONVERSATION_DATA),
    [quizShuffle],
  );

  /* Mock Interview state */
  const [mockPhase, setMockPhase] = useState<"setup" | "question" | "thinking" | "answer" | "done">("setup");
  const [mockCount, setMockCount] = useState(5);
  const [mockQuestions, setMockQuestions] = useState<ConversationExchange[]>([]);
  const [mockCurrent, setMockCurrent] = useState(0);
  const [thinkingTime, setThinkingTime] = useState(30);
  const [mockStartTime, setMockStartTime] = useState(0);
  const [mockEndTime, setMockEndTime] = useState(0);

  /* Category Practice state */
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [catIndex, setCatIndex] = useState(0);

  /* Vocabulary state */
  const [learnedVocab, setLearnedVocab] = useState<Set<string>>(new Set());

  /* Starred & Collections state */
  interface StarredCollection {
    id: string;
    name: string;
    questionIds: number[];
    introIds: number[];
  }
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [collections, setCollections] = useState<StarredCollection[]>([]);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Load starred items and collections from localStorage on mount
  useEffect(() => {
    try {
      const savedStarred = localStorage.getItem("reham-training-starred");
      const savedCollections = localStorage.getItem("reham-training-collections");
      if (savedStarred) setStarred(new Set(JSON.parse(savedStarred)));
      if (savedCollections) {
        const parsed = JSON.parse(savedCollections);
        setCollections(parsed);
        if (parsed.length > 0 && !selectedCollectionId) {
          setSelectedCollectionId(parsed[0].id);
        }
      } else {
        // Initialize with default collection
        const defaultCollection: StarredCollection = { id: "default", name: "My Favorites", questionIds: [], introIds: [] };
        setCollections([defaultCollection]);
        setSelectedCollectionId("default");
      }
    } catch {
      // Fallback: create default collection if localStorage fails
      const defaultCollection: StarredCollection = { id: "default", name: "My Favorites", questionIds: [], introIds: [] };
      setCollections([defaultCollection]);
      setSelectedCollectionId("default");
    }
  }, []);

  // Save starred items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("reham-training-starred", JSON.stringify([...starred]));
  }, [starred]);

  // Save collections to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("reham-training-collections", JSON.stringify(collections));
  }, [collections]);

  // Helper functions for starred items
  const toggleStar = (id: number) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleStarInCollection = (id: number, isIntroLine: boolean) => {
    const collectionId = selectedCollectionId;
    if (!collectionId) return;

    setCollections((prev) =>
      prev.map((col) => {
        if (col.id !== collectionId) return col;
        const next = { ...col };
        if (isIntroLine) {
          if (next.introIds.includes(id)) {
            next.introIds = next.introIds.filter((i) => i !== id);
          } else {
            next.introIds.push(id);
          }
        } else {
          if (next.questionIds.includes(id)) {
            next.questionIds = next.questionIds.filter((i) => i !== id);
          } else {
            next.questionIds.push(id);
          }
        }
        return next;
      })
    );
  };

  const addCollection = () => {
    const newId = `col-${Date.now()}`;
    const newCollection: StarredCollection = { id: newId, name: "New Collection", questionIds: [], introIds: [] };
    setCollections((prev) => [...prev, newCollection]);
    setSelectedCollectionId(newId);
  };

  const renameCollection = (id: string, newName: string) => {
    setCollections((prev) =>
      prev.map((col) => (col.id === id ? { ...col, name: newName } : col))
    );
  };

  const deleteCollection = (id: string) => {
    setCollections((prev) => prev.filter((col) => col.id !== id));
    if (selectedCollectionId === id) {
      const remaining = collections.filter((col) => col.id !== id);
      if (remaining.length > 0) {
        setSelectedCollectionId(remaining[0].id);
      }
    }
  };

  /* Flash Card state */
  const [fcLevel, setFcLevel] = useState<TopikLevel | 0>(0); // 0 = all levels
  const [fcCategoryIdx, setFcCategoryIdx] = useState(0);
  const [fcCardIdx, setFcCardIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [fcShuffle, setFcShuffle] = useState(false);
  const [fcMastered, setFcMastered] = useState<Set<string>>(new Set());
  const [fcSeen, setFcSeen] = useState<Set<string>>(new Set());
  const fcFiltered = useMemo(
    () => fcLevel === 0 ? FLASHCARD_DATA : FLASHCARD_DATA.filter((c) => c.level === fcLevel),
    [fcLevel],
  );
  const fcCategory = fcFiltered[fcCategoryIdx] || fcFiltered[0];
  const fcWords = useMemo(
    () => fcCategory ? (fcShuffle ? shuffleArray(fcCategory.words) : fcCategory.words) : [],
    [fcCategory, fcShuffle],
  );
  const fcCurrent = fcWords[fcCardIdx] || fcWords[0];

  // Mark current card as seen whenever it changes
  useEffect(() => {
    if (fcCurrent) {
      setFcSeen((prev) => {
        if (prev.has(fcCurrent.korean)) return prev;
        const next = new Set(prev);
        next.add(fcCurrent.korean);
        return next;
      });
    }
  }, [fcCurrent]);

  // Find next unmastered card index
  const fcNextUnlearned = useMemo(() => {
    for (let i = fcCardIdx + 1; i < fcWords.length; i++) {
      if (!fcMastered.has(fcWords[i].korean)) return i;
    }
    for (let i = 0; i < fcCardIdx; i++) {
      if (!fcMastered.has(fcWords[i].korean)) return i;
    }
    return -1; // all mastered
  }, [fcCardIdx, fcWords, fcMastered]);

  // Stats for current category
  const fcStats = useMemo(() => {
    const total = fcWords.length;
    const mastered = fcWords.filter((w) => fcMastered.has(w.korean)).length;
    const seen = fcWords.filter((w) => fcSeen.has(w.korean) && !fcMastered.has(w.korean)).length;
    const unseen = total - mastered - seen;
    return { total, mastered, seen, unseen };
  }, [fcWords, fcMastered, fcSeen]);

  /* Mock Interview timer */
  useEffect(() => {
    if (mockPhase !== "thinking") return;
    if (thinkingTime <= 0) {
      setMockPhase("answer");
      return;
    }
    const t = setTimeout(() => setThinkingTime((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [mockPhase, thinkingTime]);

  const startMock = useCallback(() => {
    const shuffled = shuffleArray(CONVERSATION_DATA);
    const count = mockCount === 0 ? CONVERSATION_DATA.length : mockCount;
    setMockQuestions(shuffled.slice(0, count));
    setMockCurrent(0);
    setMockStartTime(Date.now());
    setThinkingTime(30);
    setMockPhase("question");
  }, [mockCount]);

  const mockNext = useCallback(() => {
    if (mockCurrent + 1 >= mockQuestions.length) {
      setMockEndTime(Date.now());
      setMockPhase("done");
    } else {
      setMockCurrent((p) => p + 1);
      setThinkingTime(30);
      setMockPhase("question");
    }
  }, [mockCurrent, mockQuestions.length]);

  const current = CONVERSATION_DATA[currentIndex];
  const progress = ((currentIndex + 1) / CONVERSATION_DATA.length) * 100;

  const markComplete = () => {
    setCompleted((prev) => new Set(prev).add(current.id));
  };

  const goTo = (i: number) => {
    cancel();
    setCurrentIndex(i);
  };

  const jumpToPractice = (i: number) => {
    setCurrentIndex(i);
    setActiveSubTab("practice");
  };

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Interview Training â Reham (ë¦¬í¨)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Practice your Korean interview responses with text-to-speech. Listen, repeat, and master each answer.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="introduction" className="gap-1 text-xs">
              <BookOpen className="h-3.5 w-3.5" /> Script
            </TabsTrigger>
            <TabsTrigger value="practice" className="gap-1 text-xs">
              <Mic className="h-3.5 w-3.5" /> Practice
            </TabsTrigger>
            <TabsTrigger value="recap" className="gap-1 text-xs">
              <ListChecks className="h-3.5 w-3.5" /> Recap
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1 text-xs">
              <Brain className="h-3.5 w-3.5" /> Quiz
            </TabsTrigger>
            <TabsTrigger value="mock" className="gap-1 text-xs">
              <Timer className="h-3.5 w-3.5" /> Mock
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1 text-xs">
              <FolderOpen className="h-3.5 w-3.5" /> Categories
            </TabsTrigger>
            <TabsTrigger value="cheatsheet" className="gap-1 text-xs">
              <FileText className="h-3.5 w-3.5" /> Cheat Sheet
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="gap-1 text-xs">
              <Languages className="h-3.5 w-3.5" /> Vocab
            </TabsTrigger>
            <TabsTrigger value="flashcards" className="gap-1 text-xs">
              <Layers className="h-3.5 w-3.5" /> Flash Cards
            </TabsTrigger>
            <TabsTrigger value="starred" className="gap-1 text-xs">
              <Star className="h-3.5 w-3.5" /> Starred
            </TabsTrigger>
          </TabsList>

          {/* ââ Introduction Script Tab ââ */}
          <TabsContent value="introduction">
            <ScrollArea className="h-[600px] pr-3">
              <div className="space-y-3">
                {SELF_INTRO_LINES.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <Badge
                      variant="secondary"
                      className={cn(
                        "mt-1 shrink-0 text-[10px] font-medium",
                        SECTION_COLORS[line.section] ?? "",
                      )}
                    >
                      {line.section}
                    </Badge>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium leading-relaxed">{line.korean}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{line.english}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleStar(line.id)}
                      >
                        <Star
                          className={cn("h-4 w-4", starred.has(line.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                        />
                      </Button>
                      <PlayBtn onClick={() => speakKorean(line.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(line.english)} label="EN" variant="en" disabled={isSpeaking} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ââ Practice Mode Tab ââ */}
          <TabsContent value="practice">
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Question {currentIndex + 1} of {CONVERSATION_DATA.length}</span>
                  <span>{completed.size} / {CONVERSATION_DATA.length} practiced</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Exchange Card */}
              <Card className="rounded-xl border-2">
                <CardContent className="p-5 space-y-5">
                  {/* Topic with Star */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{current.topic}</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => toggleStar(current.id)}
                    >
                      <Star
                        className={cn("h-4 w-4", starred.has(current.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                      />
                    </Button>
                  </div>

                  {/* Interviewer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Interviewer</span>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                      <p className="text-sm font-medium">{current.interviewer.korean}</p>
                      <p className="text-xs text-muted-foreground">{current.interviewer.english}</p>
                    </div>
                    <div className="flex gap-1">
                      <PlayBtn onClick={() => speakKorean(current.interviewer.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(current.interviewer.english)} label="EN" variant="en" disabled={isSpeaking} />
                    </div>
                  </div>

                  <div className="w-full h-px bg-border" />

                  {/* Reham's Answer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Reham (ë¦¬í¨)</span>
                      {completed.has(current.id) && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 space-y-1">
                      <p className="text-sm font-medium leading-relaxed">{current.reham.korean}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{current.reham.english}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <PlayBtn onClick={() => speakKorean(current.reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(current.reham.english)} label="EN" variant="en" disabled={isSpeaking} />
                      <PlayBtn
                        onClick={() => speak(current.reham.korean, { language: "ko-KR", rate: 0.75 })}
                        label="Slow (repeat)"
                        variant="slow"
                        disabled={isSpeaking}
                      />
                    </div>
                  </div>

                  {/* Repeat After Me Section */}
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <RotateCcw className="h-4 w-4 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">Repeat After Me</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Click play to hear the answer slowly, then repeat out loud. Practice until it feels natural.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                      onClick={() => speak(current.reham.korean, { language: "ko-KR", rate: 0.65 })}
                      disabled={isSpeaking}
                    >
                      <Play className="h-3.5 w-3.5" />
                      {isSpeaking ? "Speaking..." : "Play Slowly & Repeat"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>

                <Button
                  size="sm"
                  variant={completed.has(current.id) ? "secondary" : "default"}
                  onClick={markComplete}
                  className="gap-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completed.has(current.id) ? "Practiced" : "Mark as Practiced"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => goTo(currentIndex + 1)}
                  disabled={currentIndex === CONVERSATION_DATA.length - 1}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ââ Recap Tab ââ */}
          <TabsContent value="recap">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                All interview questions at a glance. Click play to hear, or jump to practice mode.
              </p>
              {CONVERSATION_DATA.map((ex, i) => (
                <div
                  key={ex.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    completed.has(ex.id)
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                      : "bg-card hover:bg-accent/30",
                  )}
                >
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ex.interviewer.korean}</p>
                    <p className="text-xs text-muted-foreground truncate">{ex.interviewer.english}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{ex.topic}</Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {completed.has(ex.id) && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleStar(ex.id)}
                    >
                      <Star
                        className={cn("h-4 w-4", starred.has(ex.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                      />
                    </Button>
                    <PlayBtn
                      onClick={() => speakKorean(ex.interviewer.korean)}
                      label="KR"
                      variant="kr"
                      disabled={isSpeaking}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs gap-1"
                      onClick={() => jumpToPractice(i)}
                    >
                      <Play className="h-3 w-3" /> Practice
                    </Button>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-sm font-medium">
                  {completed.size === CONVERSATION_DATA.length
                    ? "All questions practiced! Great job, Reham! ð"
                    : `${completed.size} of ${CONVERSATION_DATA.length} questions practiced`}
                </p>
              </div>
            </div>
          </TabsContent>
          {/* ââ Quiz Mode Tab ââ */}
          <TabsContent value="quiz">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Test your recall â reveal answers and rate your confidence.
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={quizShuffle ? "default" : "outline"}
                    className="gap-1 text-xs h-8"
                    onClick={() => {
                      setQuizShuffle(!quizShuffle);
                      setRevealedAnswers(new Set());
                      setConfidence(new Map());
                    }}
                  >
                    <Shuffle className="h-3.5 w-3.5" /> {quizShuffle ? "Shuffled" : "Sequential"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs h-8"
                    onClick={() => {
                      setRevealedAnswers(new Set());
                      setConfidence(new Map());
                    }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                </div>
              </div>

              {/* Score Summary */}
              {confidence.size > 0 && (
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs font-medium">{[...confidence.values()].filter((v) => v === 3).length} Confident</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-xs font-medium">{[...confidence.values()].filter((v) => v === 2).length} Getting there</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs font-medium">{[...confidence.values()].filter((v) => v === 1).length} Need practice</span>
                  </div>
                </div>
              )}

              <ScrollArea className="h-[520px] pr-3">
                <div className="space-y-3">
                  {quizOrder.map((ex) => (
                    <Card key={ex.id} className="rounded-xl">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-[10px]">{ex.topic}</Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleStar(ex.id)}
                              >
                                <Star
                                  className={cn("h-3.5 w-3.5", starred.has(ex.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")}
                                />
                              </Button>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                              <p className="text-sm font-medium">{ex.interviewer.korean}</p>
                              <p className="text-xs text-muted-foreground">{ex.interviewer.english}</p>
                            </div>
                            <div className="flex gap-1 mt-1">
                              <PlayBtn onClick={() => speakKorean(ex.interviewer.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                            </div>
                          </div>
                        </div>

                        {revealedAnswers.has(ex.id) ? (
                          <>
                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 space-y-1">
                              <p className="text-sm font-medium leading-relaxed">{ex.reham.korean}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{ex.reham.english}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              <PlayBtn onClick={() => speakKorean(ex.reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                              <PlayBtn onClick={() => speak(ex.reham.korean, { language: "ko-KR", rate: 0.75 })} label="Slow" variant="slow" disabled={isSpeaking} />
                            </div>
                            {/* Confidence rating */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Rate:</span>
                              {([1, 2, 3] as const).map((level) => {
                                const colors = { 1: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100", 2: "border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100", 3: "border-green-300 bg-green-50 text-green-700 hover:bg-green-100" };
                                const labels = { 1: "Need practice", 2: "Getting there", 3: "Confident" };
                                return (
                                  <Button
                                    key={level}
                                    size="sm"
                                    variant="outline"
                                    className={cn("h-7 text-xs", confidence.get(ex.id) === level ? colors[level] : "")}
                                    onClick={() => setConfidence((prev) => new Map(prev).set(ex.id, level))}
                                  >
                                    {labels[level]}
                                  </Button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 w-full"
                            onClick={() => setRevealedAnswers((prev) => new Set(prev).add(ex.id))}
                          >
                            <Eye className="h-3.5 w-3.5" /> Show Answer
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          {/* ââ Mock Interview Tab ââ */}
          <TabsContent value="mock">
            <div className="space-y-4">
              {mockPhase === "setup" && (
                <Card className="rounded-xl">
                  <CardContent className="p-6 space-y-4 text-center">
                    <Timer className="h-10 w-10 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Mock Interview Simulation</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Simulate a real interview. You'll see each question, have 30 seconds to think, then review the answer.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-sm">Questions:</span>
                      {[5, 10, 15, 0].map((n) => (
                        <Button
                          key={n}
                          size="sm"
                          variant={mockCount === n ? "default" : "outline"}
                          onClick={() => setMockCount(n)}
                          className="text-xs"
                        >
                          {n === 0 ? "All" : n}
                        </Button>
                      ))}
                    </div>
                    <Button onClick={startMock} className="gap-2">
                      <Play className="h-4 w-4" /> Start Interview
                    </Button>
                  </CardContent>
                </Card>
              )}

              {mockPhase === "question" && mockQuestions[mockCurrent] && (
                <Card className="rounded-xl border-2 border-blue-200">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Question {mockCurrent + 1} of {mockQuestions.length}</span>
                      <Badge variant="outline">{mockQuestions[mockCurrent].topic}</Badge>
                    </div>
                    <Progress value={((mockCurrent + 1) / mockQuestions.length) * 100} className="h-2" />
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-2">
                      <p className="text-base font-medium">{mockQuestions[mockCurrent].interviewer.korean}</p>
                      <p className="text-sm text-muted-foreground">{mockQuestions[mockCurrent].interviewer.english}</p>
                    </div>
                    <div className="flex gap-1">
                      <PlayBtn onClick={() => speakKorean(mockQuestions[mockCurrent].interviewer.korean)} label="Listen KR" variant="kr" disabled={isSpeaking} />
                    </div>
                    <Button
                      onClick={() => { setThinkingTime(30); setMockPhase("thinking"); }}
                      className="w-full gap-2"
                    >
                      <Clock className="h-4 w-4" /> Start Thinking Timer (30s)
                    </Button>
                  </CardContent>
                </Card>
              )}

              {mockPhase === "thinking" && mockQuestions[mockCurrent] && (
                <Card className="rounded-xl border-2 border-orange-200">
                  <CardContent className="p-5 space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">Think about your answer...</p>
                    <div className="text-5xl font-bold tabular-nums text-orange-600">{thinkingTime}</div>
                    <Progress value={(thinkingTime / 30) * 100} className="h-3" />
                    <p className="text-sm font-medium">{mockQuestions[mockCurrent].interviewer.korean}</p>
                    <Button
                      onClick={() => setMockPhase("answer")}
                      variant="outline"
                      className="gap-2"
                    >
                      I'm Ready â Show Answer
                    </Button>
                  </CardContent>
                </Card>
              )}

              {mockPhase === "answer" && mockQuestions[mockCurrent] && (
                <Card className="rounded-xl border-2 border-emerald-200">
                  <CardContent className="p-5 space-y-4">
                    <Badge variant="outline" className="text-xs">{mockQuestions[mockCurrent].topic}</Badge>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                      <p className="text-sm font-medium">{mockQuestions[mockCurrent].interviewer.korean}</p>
                      <p className="text-xs text-muted-foreground">{mockQuestions[mockCurrent].interviewer.english}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 space-y-1">
                      <p className="text-sm font-medium leading-relaxed">{mockQuestions[mockCurrent].reham.korean}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{mockQuestions[mockCurrent].reham.english}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <PlayBtn onClick={() => speakKorean(mockQuestions[mockCurrent].reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speak(mockQuestions[mockCurrent].reham.korean, { language: "ko-KR", rate: 0.75 })} label="Slow" variant="slow" disabled={isSpeaking} />
                    </div>
                    <Button onClick={mockNext} className="w-full gap-2">
                      {mockCurrent + 1 >= mockQuestions.length ? "Finish Interview" : "Next Question"} <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {mockPhase === "done" && (
                <Card className="rounded-xl">
                  <CardContent className="p-6 space-y-4 text-center">
                    <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
                    <h3 className="text-lg font-semibold">Interview Complete!</h3>
                    <div className="flex justify-center gap-6 text-sm">
                      <div>
                        <div className="text-2xl font-bold">{mockQuestions.length}</div>
                        <div className="text-muted-foreground text-xs">Questions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{Math.round((mockEndTime - mockStartTime) / 1000)}s</div>
                        <div className="text-muted-foreground text-xs">Total Time</div>
                      </div>
                    </div>
                    <ScrollArea className="h-[300px] text-left">
                      <div className="space-y-2">
                        {mockQuestions.map((q, i) => (
                          <div key={q.id} className="flex items-center gap-2 p-2 rounded-lg border text-xs">
                            <span className="font-bold w-5 text-center text-muted-foreground">{i + 1}</span>
                            <span className="flex-1 truncate">{q.interviewer.korean}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs gap-1"
                              onClick={() => {
                                const idx = CONVERSATION_DATA.findIndex((c) => c.id === q.id);
                                if (idx >= 0) jumpToPractice(idx);
                              }}
                            >
                              <Play className="h-3 w-3" /> Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Button onClick={() => setMockPhase("setup")} variant="outline" className="gap-2">
                      <RotateCcw className="h-4 w-4" /> New Interview
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ââ Category Practice Tab ââ */}
          <TabsContent value="categories">
            {selectedCategory === null ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Practice by topic. Click a category to drill into its questions.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => {
                    const catCompleted = cat.ids.filter((id) => completed.has(id)).length;
                    const pct = Math.round((catCompleted / cat.ids.length) * 100);
                    return (
                      <Card
                        key={cat.name}
                        className="rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => { setSelectedCategory(cat.name); setCatIndex(0); }}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{cat.ids.length} questions</span>
                            <span>{catCompleted}/{cat.ids.length}</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (() => {
              const cat = CATEGORIES.find((c) => c.name === selectedCategory)!;
              const catExchanges = cat.ids
                .map((id) => CONVERSATION_DATA.find((c) => c.id === id))
                .filter(Boolean) as ConversationExchange[];
              const ex = catExchanges[catIndex];
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="gap-1 h-8" onClick={() => setSelectedCategory(null)}>
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-sm font-semibold">{cat.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {catIndex + 1} / {catExchanges.length}
                    </span>
                  </div>
                  <Progress value={((catIndex + 1) / catExchanges.length) * 100} className="h-2" />

                  {ex && (
                    <Card className="rounded-xl border-2">
                      <CardContent className="p-5 space-y-4">
                        <Badge variant="outline" className="text-xs">{ex.topic}</Badge>
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                          <p className="text-sm font-medium">{ex.interviewer.korean}</p>
                          <p className="text-xs text-muted-foreground">{ex.interviewer.english}</p>
                        </div>
                        <div className="flex gap-1">
                          <PlayBtn onClick={() => speakKorean(ex.interviewer.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                          <PlayBtn onClick={() => speakEnglish(ex.interviewer.english)} label="EN" variant="en" disabled={isSpeaking} />
                        </div>
                        <div className="w-full h-px bg-border" />
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 space-y-1">
                          <p className="text-sm font-medium leading-relaxed">{ex.reham.korean}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{ex.reham.english}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <PlayBtn onClick={() => speakKorean(ex.reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                          <PlayBtn onClick={() => speakEnglish(ex.reham.english)} label="EN" variant="en" disabled={isSpeaking} />
                          <PlayBtn onClick={() => speak(ex.reham.korean, { language: "ko-KR", rate: 0.75 })} label="Slow" variant="slow" disabled={isSpeaking} />
                        </div>
                        <Button
                          size="sm"
                          variant={completed.has(ex.id) ? "secondary" : "default"}
                          onClick={() => setCompleted((prev) => new Set(prev).add(ex.id))}
                          className="gap-1"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {completed.has(ex.id) ? "Practiced" : "Mark as Practiced"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex items-center justify-between">
                    <Button size="sm" variant="outline" onClick={() => setCatIndex((p) => p - 1)} disabled={catIndex === 0} className="gap-1">
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setCatIndex((p) => p + 1)} disabled={catIndex >= catExchanges.length - 1} className="gap-1">
                      Next <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })()}
          </TabsContent>

          {/* ââ Cheat Sheet Tab ââ */}
          <TabsContent value="cheatsheet">
            <ScrollArea className="h-[600px] pr-3">
              <div className="space-y-6">
                {/* Key Metrics */}
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">ð Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      {KEY_METRICS.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/30 transition-colors">
                          <Badge variant="secondary" className="text-[10px] shrink-0 w-40 justify-center">{m.label}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{m.korean}</p>
                            <p className="text-xs text-muted-foreground">{m.english}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <PlayBtn onClick={() => speakKorean(m.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Power Phrases */}
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">ð¬ Power Phrases</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      {POWER_PHRASES.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-accent/30 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{p.korean}</p>
                            <p className="text-xs text-muted-foreground italic">{p.romanization}</p>
                            <p className="text-xs text-muted-foreground">{p.english}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <PlayBtn onClick={() => speakKorean(p.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                            <PlayBtn onClick={() => speak(p.korean, { language: "ko-KR", rate: 0.75 })} label="Slow" variant="slow" disabled={isSpeaking} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Company Summaries */}
                <Card className="rounded-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">ð¢ Company Summaries</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-2">
                      {COMPANY_SUMMARIES.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                          <Badge variant="outline" className="text-xs shrink-0 w-28 justify-center">{c.name}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{c.korean}</p>
                            <p className="text-xs text-muted-foreground">{c.english}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <PlayBtn onClick={() => speakKorean(c.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ââ Vocabulary Tab ââ */}
          <TabsContent value="vocabulary">
            <ScrollArea className="h-[600px] pr-3">
              <div className="space-y-6">
                {VOCAB_GROUPS.map((group) => {
                  const learned = group.words.filter((w) => learnedVocab.has(w.korean)).length;
                  const pct = Math.round((learned / group.words.length) * 100);
                  return (
                    <Card key={group.name} className="rounded-xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{group.name}</CardTitle>
                          <span className="text-xs text-muted-foreground">{learned}/{group.words.length} learned</span>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {group.words.map((w) => (
                            <div
                              key={w.korean}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border transition-colors",
                                learnedVocab.has(w.korean)
                                  ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                  : "hover:bg-accent/30",
                              )}
                            >
                              <button
                                className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                  learnedVocab.has(w.korean)
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-muted-foreground/30 hover:border-green-400",
                                )}
                                onClick={() => {
                                  setLearnedVocab((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(w.korean)) next.delete(w.korean);
                                    else next.add(w.korean);
                                    return next;
                                  });
                                }}
                              >
                                {learnedVocab.has(w.korean) && <CheckCircle2 className="h-3 w-3" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{w.korean}</p>
                                <p className="text-[10px] text-muted-foreground italic">{w.romanization}</p>
                                <p className="text-xs text-muted-foreground">{w.english}</p>
                              </div>
                              <PlayBtn onClick={() => speakKorean(w.korean)} variant="kr" disabled={isSpeaking} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
          {/* ââ Flash Cards Tab (TOPIK 2ê¸â6ê¸) ââ */}
          <TabsContent value="flashcards">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">TOPIK 2â6ê¸</Badge>
                    Flash Cards
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fcMastered.size} / {fcFiltered.reduce((s, c) => s + c.words.length, 0)} words mastered
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={fcShuffle ? "default" : "outline"}
                  className="gap-1 text-xs h-8"
                  onClick={() => { setFcShuffle(!fcShuffle); setFcCardIdx(0); setFcFlipped(false); }}
                >
                  <Shuffle className="h-3.5 w-3.5" /> {fcShuffle ? "Shuffled" : "In Order"}
                </Button>
              </div>

              {/* Level Selector */}
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-muted-foreground font-medium">Level:</span>
                {([0, 2, 3, 4, 5, 6] as const).map((lv) => {
                  const lvColors: Record<number, string> = {
                    0: "", 2: "bg-green-100 text-green-800 border-green-300", 3: "bg-blue-100 text-blue-800 border-blue-300",
                    4: "bg-purple-100 text-purple-800 border-purple-300", 5: "bg-orange-100 text-orange-800 border-orange-300",
                    6: "bg-red-100 text-red-800 border-red-300",
                  };
                  return (
                    <Button
                      key={lv}
                      size="sm"
                      variant={fcLevel === lv ? "default" : "outline"}
                      className={cn("text-xs h-7 px-2.5", fcLevel === lv && lv !== 0 && lvColors[lv])}
                      onClick={() => { setFcLevel(lv as TopikLevel | 0); setFcCategoryIdx(0); setFcCardIdx(0); setFcFlipped(false); }}
                    >
                      {lv === 0 ? "All" : `${lv}ê¸`}
                    </Button>
                  );
                })}
              </div>

              {/* Category Selector */}
              <div className="flex gap-2 flex-wrap">
                {fcFiltered.map((cat, i) => (
                  <Button
                    key={`${cat.level}-${cat.category}`}
                    size="sm"
                    variant={fcCategoryIdx === i ? "default" : "outline"}
                    className="text-xs h-7"
                    onClick={() => { setFcCategoryIdx(i); setFcCardIdx(0); setFcFlipped(false); }}
                  >
                    {fcLevel === 0 && <span className="mr-1 opacity-60">{cat.level}ê¸</span>}
                    {cat.category.split("(")[0].trim()}
                    <Badge variant="secondary" className="ml-1 text-[10px] h-4">
                      {cat.words.filter((w) => fcMastered.has(w.korean)).length}/{cat.words.length}
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <span className="text-muted-foreground">Unseen {fcStats.unseen}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-muted-foreground">Seen {fcStats.seen}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Mastered {fcStats.mastered}</span>
                </div>
                <span className="ml-auto font-medium">{Math.round((fcStats.mastered / fcStats.total) * 100)}%</span>
              </div>

              {/* Progress */}
              <Progress value={((fcCardIdx + 1) / fcWords.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Card {fcCardIdx + 1} of {fcWords.length} â {fcCategory.category}
              </p>

              {/* Flash Card */}
              <div
                className={cn(
                  "relative min-h-[320px] rounded-2xl border-2 cursor-pointer transition-all duration-300",
                  fcFlipped
                    ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-emerald-300"
                    : "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-300",
                  fcMastered.has(fcCurrent.korean) && "ring-2 ring-green-400",
                )}
                onClick={() => setFcFlipped(!fcFlipped)}
              >
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", fcMastered.has(fcCurrent.korean)
                      ? "bg-green-100 text-green-700 border-green-300"
                      : fcSeen.has(fcCurrent.korean)
                        ? "bg-amber-100 text-amber-700 border-amber-300"
                        : "bg-gray-100 text-gray-600 border-gray-300")}
                  >
                    {fcMastered.has(fcCurrent.korean) ? "â Mastered" : fcSeen.has(fcCurrent.korean) ? "Seen" : "New"}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="text-[10px]">
                    {fcFlipped ? "Click to flip back" : "Click to reveal"}
                  </Badge>
                </div>

                {!fcFlipped ? (
                  /* Front: Korean word */
                  <div className="flex flex-col items-center justify-center h-full min-h-[320px] p-6 text-center">
                    <p className="text-4xl font-bold mb-3">{fcCurrent.korean}</p>
                    <p className="text-sm text-muted-foreground italic mb-6">{fcCurrent.romanization}</p>
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <PlayBtn onClick={() => speakKorean(fcCurrent.korean)} label="Listen" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speak(fcCurrent.korean, { language: "ko-KR", rate: 0.7 })} label="Slow" variant="slow" disabled={isSpeaking} />
                    </div>
                  </div>
                ) : (
                  /* Back: English + example sentence */
                  <div className="flex flex-col items-center justify-center h-full min-h-[320px] p-6 text-center space-y-4">
                    <p className="text-2xl font-bold">{fcCurrent.korean}</p>
                    <p className="text-lg text-emerald-700 dark:text-emerald-300 font-semibold">{fcCurrent.english}</p>
                    <div className="w-full max-w-md p-4 rounded-xl bg-white/60 dark:bg-black/20 border space-y-2">
                      <p className="text-sm font-medium">{fcCurrent.sentence_kr}</p>
                      <p className="text-xs text-muted-foreground">{fcCurrent.sentence_en}</p>
                    </div>
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <PlayBtn onClick={() => speakKorean(fcCurrent.sentence_kr)} label="Sentence KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(fcCurrent.sentence_en)} label="Sentence EN" variant="en" disabled={isSpeaking} />
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setFcCardIdx(Math.max(0, fcCardIdx - 1)); setFcFlipped(false); }}
                  disabled={fcCardIdx === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>

                <Button
                  size="sm"
                  variant={fcMastered.has(fcCurrent.korean) ? "secondary" : "default"}
                  className="gap-1"
                  onClick={() => {
                    const wasMastered = fcMastered.has(fcCurrent.korean);
                    setFcMastered((prev) => {
                      const next = new Set(prev);
                      if (next.has(fcCurrent.korean)) next.delete(fcCurrent.korean);
                      else next.add(fcCurrent.korean);
                      return next;
                    });
                    // Auto-advance to next unlearned card after marking mastered
                    if (!wasMastered && fcNextUnlearned !== -1) {
                      setTimeout(() => { setFcCardIdx(fcNextUnlearned); setFcFlipped(false); }, 300);
                    }
                  }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {fcMastered.has(fcCurrent.korean) ? "Undo" : "Mastered"}
                </Button>

                {fcNextUnlearned !== -1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                    onClick={() => { setFcCardIdx(fcNextUnlearned); setFcFlipped(false); }}
                  >
                    Next Unlearned
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setFcCardIdx(Math.min(fcWords.length - 1, fcCardIdx + 1)); setFcFlipped(false); }}
                  disabled={fcCardIdx === fcWords.length - 1}
                  className="gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Word Grid Overview */}
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-2">All words in this category:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {fcWords.map((w, i) => {
                    const isMastered = fcMastered.has(w.korean);
                    const isSeen = fcSeen.has(w.korean);
                    return (
                      <button
                        key={w.korean}
                        className={cn(
                          "text-left p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5",
                          fcCardIdx === i && "ring-2 ring-blue-400",
                          isMastered
                            ? "bg-green-50 dark:bg-green-950/20 border-green-300"
                            : isSeen
                              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200"
                              : "border-gray-200 hover:bg-accent/30",
                        )}
                        onClick={() => { setFcCardIdx(i); setFcFlipped(false); }}
                      >
                        <span className={cn(
                          "inline-block w-2 h-2 rounded-full shrink-0",
                          isMastered ? "bg-green-500" : isSeen ? "bg-amber-400" : "bg-gray-300",
                        )} />
                        <span className="font-medium">{w.korean}</span>
                        <span className="text-muted-foreground truncate">{w.english}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Starred Items Tab ── */}
          <TabsContent value="starred">
            <div className="space-y-4">
              {/* Collections Sidebar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Collections</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 h-7 text-xs"
                    onClick={addCollection}
                  >
                    <Plus className="h-3 w-3" /> Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {collections.map((col) => (
                    <div
                      key={col.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                        selectedCollectionId === col.id
                          ? "bg-blue-50 border-blue-300 dark:bg-blue-950/20"
                          : "bg-card hover:bg-accent/30",
                      )}
                    >
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => setSelectedCollectionId(col.id)}
                      >
                        {editingCollectionId === col.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={editingCollectionName}
                            onChange={(e) => setEditingCollectionName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                renameCollection(col.id, editingCollectionName);
                                setEditingCollectionId(null);
                              } else if (e.key === "Escape") {
                                setEditingCollectionId(null);
                              }
                            }}
                            onBlur={() => {
                              if (editingCollectionName.trim()) {
                                renameCollection(col.id, editingCollectionName);
                              }
                              setEditingCollectionId(null);
                            }}
                            className="w-full px-2 py-1 text-xs border rounded bg-white dark:bg-gray-900"
                          />
                        ) : (
                          <p className="text-sm font-medium truncate">
                            {col.name} <span className="text-xs text-muted-foreground">({col.questionIds.length + col.introIds.length})</span>
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setEditingCollectionId(col.id);
                          setEditingCollectionName(col.name);
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={() => deleteCollection(col.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Starred Items in Selected Collection */}
              {selectedCollectionId && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold">
                    Starred Questions ({(collections.find((c) => c.id === selectedCollectionId)?.questionIds.length || 0) + (collections.find((c) => c.id === selectedCollectionId)?.introIds.length || 0)})
                  </h3>

                  <ScrollArea className="h-[500px] pr-3">
                    <div className="space-y-2">
                      {/* Intro Lines */}
                      {collections
                        .find((c) => c.id === selectedCollectionId)
                        ?.introIds.map((lineId) => {
                          const line = SELF_INTRO_LINES.find((l) => l.id === lineId);
                          return line ? (
                            <div
                              key={`intro-${lineId}`}
                              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                            >
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "mt-1 shrink-0 text-[10px] font-medium",
                                  SECTION_COLORS[line.section] ?? "",
                                )}
                              >
                                {line.section}
                              </Badge>
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-sm font-medium leading-relaxed">{line.korean}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{line.english}</p>
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => toggleStarInCollection(lineId, true)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                                <PlayBtn onClick={() => speakKorean(line.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                                <PlayBtn onClick={() => speakEnglish(line.english)} label="EN" variant="en" disabled={isSpeaking} />
                              </div>
                            </div>
                          ) : null;
                        })}

                      {/* Conversation Questions */}
                      {collections
                        .find((c) => c.id === selectedCollectionId)
                        ?.questionIds.map((qId) => {
                          const ex = CONVERSATION_DATA.find((c) => c.id === qId);
                          return ex ? (
                            <Card key={`q-${qId}`} className="rounded-lg">
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <Badge variant="outline" className="text-[10px] mb-1">{ex.topic}</Badge>
                                    <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 space-y-1">
                                      <p className="text-xs font-medium">{ex.interviewer.korean}</p>
                                      <p className="text-xs text-muted-foreground">{ex.interviewer.english}</p>
                                    </div>
                                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 space-y-1 mt-1">
                                      <p className="text-xs font-medium">{ex.reham.korean}</p>
                                      <p className="text-xs text-muted-foreground">{ex.reham.english}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => toggleStarInCollection(qId, false)}
                                  >
                                    <Trash2 className="h-3 w-3" /> Remove
                                  </Button>
                                  <PlayBtn onClick={() => speakKorean(ex.reham.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                                  <PlayBtn onClick={() => speakEnglish(ex.reham.english)} label="EN" variant="en" disabled={isSpeaking} />
                                </div>
                              </CardContent>
                            </Card>
                          ) : null;
                        })}

                      {((collections.find((c) => c.id === selectedCollectionId)?.questionIds.length || 0) +
                        (collections.find((c) => c.id === selectedCollectionId)?.introIds.length || 0) ===
                        0) && (
                        <div className="text-center py-8">
                          <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No starred items in this collection yet. Star items from the tabs above to add them here.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
