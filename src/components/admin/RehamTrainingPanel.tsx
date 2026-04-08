import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Data: Self-Introduction Script (line-by-line) ─── */

interface ScriptLine {
  id: number;
  korean: string;
  english: string;
  section: string;
}

const SELF_INTRO_LINES: ScriptLine[] = [
  { id: 1, section: "Greeting", korean: "안녕하세요, 제 이름은 리함입니다.", english: "Hello, my name is Reham." },
  { id: 2, section: "Summary", korean: "저는 12년 이상의 국제 경험을 가진 Operations 및 Sales Operations 전문가입니다.", english: "I am an Operations and Sales Operations specialist with over 12 years of international experience." },
  { id: 3, section: "Summary", korean: "현재는 웹 개발과 디지털 프로젝트도 함께 진행하고 있습니다.", english: "Currently, I am also working on web development and digital projects." },
  { id: 4, section: "Projects", korean: "특히 Explore-Saudi 프로젝트에서는 웹사이트 구조 설계, SEO 최적화, 그리고 데이터 품질 개선을 직접 담당했습니다.", english: "In the Explore-Saudi project, I was directly responsible for website structure design, SEO optimization, and data quality improvement." },
  { id: 5, section: "Languages", korean: "여러 언어 환경에서 일해왔기 때문에 언어의 정확성과 맥락의 중요성을 잘 이해하고 있습니다.", english: "Having worked in multilingual environments, I understand the importance of language accuracy and context." },
  { id: 6, section: "Motivation", korean: "이 역할에 관심이 있는 이유는 데이터 품질이 AI 시스템의 성능에 직접적인 영향을 준다고 생각하기 때문입니다.", english: "I am interested in this role because I believe data quality directly impacts AI system performance." },
  { id: 7, section: "Motivation", korean: "저는 이전 경험을 통해 정확성과 일관성을 유지하는 것이 얼마나 중요한지 배웠습니다.", english: "Through my previous experience, I learned how important it is to maintain accuracy and consistency." },
  { id: 8, section: "Accenture", korean: "Accenture에서 콘텐츠 모더레이터로 근무하면서 하루 최대 800개의 데이터를 처리하며 95% 이상의 정확도를 유지했습니다.", english: "As a content moderator at Accenture, I processed up to 800 data items per day while maintaining over 95% accuracy." },
  { id: 9, section: "Kerry", korean: "또한 Kerry Logistics에서는 월 1,000건 이상의 주문을 96% 이상의 정확도로 관리했습니다.", english: "At Kerry Logistics, I managed over 1,000 orders per month with over 96% accuracy." },
  { id: 10, section: "Kerry", korean: "이러한 경험을 통해 대량 데이터 속에서도 높은 품질을 유지하는 능력을 갖추게 되었습니다.", english: "Through these experiences, I developed the ability to maintain high quality even with large volumes of data." },
  { id: 11, section: "Web Dev", korean: "또한 웹 개발 프로젝트에서는 SEO와 콘텐츠 구조를 최적화하며 데이터의 일관성과 정확성을 지속적으로 개선했습니다.", english: "In web development projects, I continuously improved data consistency and accuracy by optimizing SEO and content structure." },
  { id: 12, section: "Strengths", korean: "제 강점은 세부 사항에 대한 높은 집중력과 체계적인 분석 능력입니다.", english: "My strengths are a high level of attention to detail and systematic analytical ability." },
  { id: 13, section: "Strengths", korean: "또한 다양한 문화와 언어 환경에서 협업해온 경험을 바탕으로, 맥락을 이해하며 데이터를 평가할 수 있습니다.", english: "With experience collaborating in diverse cultural and linguistic environments, I can evaluate data with contextual understanding." },
  { id: 14, section: "Strengths", korean: "새로운 시스템에도 빠르게 적응하는 편입니다.", english: "I also adapt quickly to new systems." },
  { id: 15, section: "Closing", korean: "이 기회를 주셔서 감사합니다. 제 경험과 언어 능력을 통해 이 역할에 의미 있는 기여를 할 수 있다고 생각합니다. 감사합니다.", english: "Thank you for this opportunity. I believe I can make a meaningful contribution to this role through my experience and language skills. Thank you." },
];

/* ─── Data: Interview Conversation Exchanges ─── */

interface ConversationExchange {
  id: number;
  topic: string;
  interviewer: { korean: string; english: string };
  reham: { korean: string; english: string };
}

const CONVERSATION_DATA: ConversationExchange[] = [
  {
    id: 1,
    topic: "Self Introduction",
    interviewer: { korean: "자기소개를 해 주세요.", english: "Please introduce yourself." },
    reham: {
      korean: "안녕하세요, 제 이름은 리함입니다. 저는 12년 이상의 국제 경험을 가진 Operations 및 Sales Operations 전문가이며, 현재는 웹 개발과 디지털 프로젝트도 함께 진행하고 있습니다.",
      english: "Hello, my name is Reham. I am an Operations and Sales Operations specialist with over 12 years of international experience, and I am currently also working on web development and digital projects.",
    },
  },
  {
    id: 2,
    topic: "Relevant Experience",
    interviewer: { korean: "관련 경험에 대해 말씀해 주세요.", english: "Please tell me about your relevant experience." },
    reham: {
      korean: "여러 언어 환경에서 일해왔기 때문에 언어의 정확성과 맥락의 중요성을 잘 이해하고 있습니다. 특히 Explore-Saudi 프로젝트에서는 웹사이트 구조 설계, SEO 최적화, 그리고 데이터 품질 개선을 직접 담당했습니다.",
      english: "Having worked in multilingual environments, I understand the importance of language accuracy and context. In the Explore-Saudi project, I was directly responsible for website structure design, SEO optimization, and data quality improvement.",
    },
  },
  {
    id: 3,
    topic: "Data Accuracy",
    interviewer: { korean: "데이터 처리 정확도에 대해 말씀해 주세요.", english: "Please tell me about your data handling accuracy." },
    reham: {
      korean: "Accenture에서 콘텐츠 모더레이터로 근무하면서 하루 최대 800개의 데이터를 처리하며 95% 이상의 정확도를 유지했습니다. 또한 Kerry Logistics에서는 월 1,000건 이상의 주문을 96% 이상의 정확도로 관리했습니다.",
      english: "At Accenture, I processed up to 800 data items per day as a content moderator while maintaining over 95% accuracy. At Kerry Logistics, I managed over 1,000 orders per month with over 96% accuracy.",
    },
  },
  {
    id: 4,
    topic: "Strengths",
    interviewer: { korean: "본인의 강점은 무엇입니까?", english: "What are your strengths?" },
    reham: {
      korean: "제 강점은 세부 사항에 대한 높은 집중력과 체계적인 분석 능력입니다. 또한 다양한 문화와 언어 환경에서 협업해온 경험을 바탕으로, 맥락을 이해하며 데이터를 평가할 수 있습니다. 새로운 시스템에도 빠르게 적응하는 편입니다.",
      english: "My strengths are a high level of attention to detail and systematic analytical ability. With experience collaborating across diverse cultural and linguistic environments, I can evaluate data with contextual understanding. I also adapt quickly to new systems.",
    },
  },
  {
    id: 5,
    topic: "Why This Role",
    interviewer: { korean: "왜 이 직무에 관심이 있으신가요?", english: "Why are you interested in this role?" },
    reham: {
      korean: "이 역할에 관심이 있는 이유는 데이터 품질이 AI 시스템의 성능에 직접적인 영향을 준다고 생각하기 때문입니다. 저는 이전 경험을 통해 정확성과 일관성을 유지하는 것이 얼마나 중요한지 배웠습니다.",
      english: "I am interested in this role because I believe data quality directly impacts AI system performance. Through my previous experience, I learned how important it is to maintain accuracy and consistency.",
    },
  },
  {
    id: 6,
    topic: "Web Development",
    interviewer: { korean: "웹 개발 경험에 대해 말씀해 주세요.", english: "Tell me about your web development experience." },
    reham: {
      korean: "Explore-Saudi 프로젝트에서 웹사이트 구조 설계와 SEO 최적화를 담당했습니다. 또한 웹 개발 프로젝트에서는 SEO와 콘텐츠 구조를 최적화하며 데이터의 일관성과 정확성을 지속적으로 개선했습니다.",
      english: "In the Explore-Saudi project, I was responsible for website structure design and SEO optimization. In web development projects, I continuously improved data consistency and accuracy by optimizing SEO and content structure.",
    },
  },
  {
    id: 7,
    topic: "Closing",
    interviewer: { korean: "마지막으로 하고 싶은 말씀이 있으신가요?", english: "Any final words you'd like to share?" },
    reham: {
      korean: "이 기회를 주셔서 감사합니다. 제 경험과 언어 능력을 통해 이 역할에 의미 있는 기여를 할 수 있다고 생각합니다. 감사합니다.",
      english: "Thank you for this opportunity. I believe I can make a meaningful contribution to this role through my experience and language skills. Thank you.",
    },
  },
];

/* ─── Section color map ─── */

const SECTION_COLORS: Record<string, string> = {
  Greeting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
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

/* ─── Play Button Component ─── */

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

/* ─── Main Component ─── */

export default function RehamTrainingPanel() {
  const { speak, speakKorean, speakEnglish, isSpeaking, cancel } = useSpeech();
  const [activeSubTab, setActiveSubTab] = useState("introduction");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

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
          Interview Training — Reham (리함)
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
          </TabsList>

          {/* ── Introduction Script Tab ── */}
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
                      <PlayBtn onClick={() => speakKorean(line.korean)} label="KR" variant="kr" disabled={isSpeaking} />
                      <PlayBtn onClick={() => speakEnglish(line.english)} label="EN" variant="en" disabled={isSpeaking} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ── Practice Mode Tab ── */}
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
                  {/* Topic */}
                  <Badge variant="outline" className="text-xs">{current.topic}</Badge>

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
                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Reham (리함)</span>
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

          {/* ── Recap Tab ── */}
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
                    ? "All questions practiced! Great job, Reham! 🎉"
                    : `${completed.size} of ${CONVERSATION_DATA.length} questions practiced`}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
