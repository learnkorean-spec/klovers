import { useState, useCallback, useRef } from "react";
import { cvSupabase as supabase } from "@/integrations/supabase/cvClient";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import type { AnalysisResult, ImprovementQuestion, AdvisorResult, InterviewQuestion } from "@/types/analysis";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function extractTextFromPdfServer({
  arrayBuffer,
  pageImages,
}: {
  arrayBuffer: ArrayBuffer;
  pageImages: string[];
}): Promise<string> {
  toast.info("Using AI-powered OCR for scanned PDF...");
  const pdfBase64 = arrayBufferToBase64(arrayBuffer);
  const { data, error } = await supabase.functions.invoke("extract-pdf-text", {
    body: { pdfBase64, pageImages },
  });
  if (error) throw error;
  return data?.text || "";
}

async function readPdf(arrayBuffer: ArrayBuffer, disableWorker = false): Promise<string> {
  const dataCopy = new Uint8Array(arrayBuffer.slice(0));
  const loadingTask = pdfjsLib.getDocument({
    data: dataCopy,
    useSystemFonts: true,
    disableWorker,
  } as any);

  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .filter((item: any) => item.str)
      .map((item: any) => item.str)
      .join(" ");
    if (text.trim()) pages.push(text);
  }

  return pages.join("\n\n");
}

async function renderPdfPagesToImages(arrayBuffer: ArrayBuffer, maxPages = 6): Promise<string[]> {
  const dataCopy = new Uint8Array(arrayBuffer.slice(0));
  const loadingTask = pdfjsLib.getDocument({
    data: dataCopy,
    useSystemFonts: true,
    disableWorker: true,
  } as any);

  const pdf = await loadingTask.promise;
  const pagesToProcess = Math.min(pdf.numPages, maxPages);
  const images: string[] = [];

  for (let i = 1; i <= pagesToProcess; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.8 });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL("image/png"));
  }

  return images;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  let text = "";
  try {
    text = await readPdf(arrayBuffer, false);
  } catch {
    try {
      text = await readPdf(arrayBuffer, true);
    } catch {
      console.warn("Client-side PDF parsing failed entirely");
    }
  }

  if (!text.trim()) {
    try {
      const pageImages = await renderPdfPagesToImages(arrayBuffer, 6);
      text = await extractTextFromPdfServer({ arrayBuffer, pageImages });
    } catch (e) {
      console.error("Server-side PDF extraction also failed:", e);
    }
  }

  return text;
}

function extractText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function useCVReview() {
  const [cvText, setCvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [questions, setQuestions] = useState<ImprovementQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [improvising, setImprovising] = useState(false);
  const [improvedResult, setImprovedResult] = useState<AnalysisResult | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorResult, setAdvisorResult] = useState<AdvisorResult | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    try {
      if (file.type === "application/pdf" || ext === "pdf") {
        toast.info("Extracting text from PDF...");
        const text = await extractTextFromPdf(file);
        if (!text.trim()) { toast.error("Could not extract text from this PDF."); return; }
        setCvText(text);
        setFileName(file.name);
      } else if (
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.type === "application/msword" || ext === "docx" || ext === "doc"
      ) {
        toast.info("Extracting text from Word document...");
        const arrayBuffer = await file.arrayBuffer();
        const r = await mammoth.extractRawText({ arrayBuffer });
        if (!r.value.trim()) { toast.error("Could not extract text from this document."); return; }
        setCvText(r.value);
        setFileName(file.name);
      } else if (file.type.startsWith("text/") || ext === "txt" || ext === "md" || ext === "csv") {
        const text = await extractText(file);
        setCvText(text);
        setFileName(file.name);
      } else {
        toast.error("Please upload a PDF, Word (.docx), .txt, or .md file.");
      }
    } catch (err) {
      console.error("File parsing error:", err);
      toast.error("Failed to read the file.");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }, [handleFile]);

  const analyze = async () => {
    if (!cvText.trim()) { toast.error("Please upload or paste your CV first."); return; }
    setAnalyzing(true);
    setResult(null);
    setQuestions([]);
    setImprovedResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-cv", { body: { cvText } });
      if (error) throw error;
      setResult(data);

      if (data.overallScore < 100) {
        setLoadingQuestions(true);
        try {
          const { data: qData, error: qError } = await supabase.functions.invoke("generate-cv-questions", {
            body: { cvText, analysisResult: data },
          });
          if (qError) throw qError;
          setQuestions(qData.questions || []);
        } catch (qe) {
          console.error("Questions error:", qe);
        } finally {
          setLoadingQuestions(false);
        }
      }
    } catch (e: any) {
      console.error("Analysis error:", e);
      toast.error(e.message || "Failed to analyze CV.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitAnswers = async (answers: Record<string, string>) => {
    setImprovising(true);
    try {
      const { data, error } = await supabase.functions.invoke("improve-cv", {
        body: { cvText, previousAnalysis: result, answers },
      });
      if (error) throw error;
      setImprovedResult(data);
      toast.success(`Score improved to ${data.overallScore}/100! 🎉`);
    } catch (e: any) {
      console.error("Improve error:", e);
      toast.error(e.message || "Failed to re-analyze.");
    } finally {
      setImprovising(false);
    }
  };

  const handleGoalSelect = async (goal: "job" | "travel") => {
    setAdvisorLoading(true);
    setAdvisorResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("career-advisor", {
        body: { cvText, analysisResult: result, goal },
      });
      if (error) throw error;
      setAdvisorResult(data);
    } catch (e: any) {
      console.error("Advisor error:", e);
      toast.error(e.message || "Failed to get advice.");
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handleStartInterview = async () => {
    setInterviewStarted(true);
    setInterviewLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-interview-questions", {
        body: { cvText, analysisResult: result },
      });
      if (error) throw error;
      setInterviewQuestions(data.questions || []);
    } catch (e: any) {
      console.error("Interview error:", e);
      toast.error(e.message || "Failed to generate interview questions.");
    } finally {
      setInterviewLoading(false);
    }
  };

  return {
    cvText, setCvText, fileName, analyzing, result, dragOver, setDragOver,
    questions, loadingQuestions, improvising, improvedResult, advisorLoading,
    advisorResult, interviewQuestions, interviewLoading, interviewStarted,
    fileInputRef, handleDrop, handleFileInput, analyze, handleSubmitAnswers,
    handleGoalSelect, handleStartInterview,
    displayResult: improvedResult || result,
  };
}
