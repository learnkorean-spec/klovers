export interface AnalysisCategory {
  name: string;
  score: number;
  status: "good" | "warning" | "critical";
  feedback: string;
  fixes: string[];
}

export interface AnalysisResult {
  overallScore: number;
  summary: string;
  categories: AnalysisCategory[];
  topFixes: string[];
  strengths: string[];
  modernTips: string[];
  improvements?: string[];
}

export interface ImprovementQuestion {
  id: string;
  question: string;
  hint: string;
  category: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: "behavioral" | "technical" | "personality" | "situational" | "motivation";
  difficulty: "easy" | "medium" | "hard";
  hint: string;
  sampleAnswer: string;
}

export interface Country {
  country: string;
  flag: string;
  reason: string;
  avgSalary?: string;
  costOfLiving?: string;
  searchPlatforms: string[];
  searchUrls: string[];
  visaInfo: string;
}

export interface Decision {
  question: string;
  pros: string[];
  cons: string[];
  verdict: string;
}

export interface AdvisorResult {
  pathAdvice: string;
  topCountries: Country[];
  actionSteps: string[];
  skillsToLearn: string[];
  decisions: Decision[];
}
