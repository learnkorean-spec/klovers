import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Loader2, Briefcase, AlertTriangle, CheckCircle2,
  Download, Edit3, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface TailoredCVData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    linkedin: string;
    website: string;
  };
  experience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  skills: string[];
  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];
}

interface TailorResult {
  matchPercentage: number;
  gaps: string[];
  suggestions: string[];
  tailoredCV: TailoredCVData;
}

interface CVJobTailorProps {
  cvText: string;
  improvementAnswers?: Record<string, string>;
  analysisResult?: any;
}

export function CVJobTailor({ cvText, improvementAnswers, analysisResult }: CVJobTailorProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResult | null>(null);
  const [editableCV, setEditableCV] = useState<TailoredCVData | null>(null);
  const [showGaps, setShowGaps] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const handleTailor = async () => {
    if (!jobTitle.trim()) { toast.error("Please enter a job title."); return; }
    setLoading(true);
    setResult(null);
    setEditableCV(null);
    try {
      const { data, error } = await supabase.functions.invoke("tailor-cv", {
        body: { cvText, jobTitle, jobDescription, improvementAnswers, analysisResult },
      });
      if (error) throw error;
      setResult(data);
      setEditableCV(data.tailoredCV);
      toast.success(`Match analysis complete: ${data.matchPercentage}%`);
    } catch (e: any) {
      toast.error(e.message || "Failed to tailor CV.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!editableCV) return;
    const doc = new jsPDF();
    const margin = 20;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 20;

    const checkPage = (needed: number) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 20; }
    };

    // Name
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(editableCV.personalInfo.fullName || "Your Name", margin, y);
    y += 8;

    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    doc.text(editableCV.personalInfo.title || "", margin, y);
    y += 6;

    // Contact
    doc.setFontSize(9);
    const contactParts = [
      editableCV.personalInfo.email,
      editableCV.personalInfo.phone,
      editableCV.personalInfo.location,
    ].filter(Boolean);
    if (contactParts.length) {
      doc.text(contactParts.join("  •  "), margin, y);
      y += 5;
    }
    const linkParts = [editableCV.personalInfo.linkedin, editableCV.personalInfo.website].filter(Boolean);
    if (linkParts.length) {
      doc.text(linkParts.join("  •  "), margin, y);
      y += 5;
    }
    doc.setTextColor(0);
    y += 4;

    // Summary
    if (editableCV.personalInfo.summary) {
      checkPage(20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("PROFESSIONAL SUMMARY", margin, y);
      y += 2;
      doc.setDrawColor(60);
      doc.line(margin, y, margin + maxWidth, y);
      y += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(editableCV.personalInfo.summary, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 6;
    }

    // Experience
    if (editableCV.experience?.length) {
      checkPage(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("WORK EXPERIENCE", margin, y);
      y += 2;
      doc.setDrawColor(60);
      doc.line(margin, y, margin + maxWidth, y);
      y += 6;

      editableCV.experience.forEach((exp) => {
        checkPage(25);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(exp.position, margin, y);
        y += 5;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(`${exp.company}  |  ${exp.startDate} – ${exp.current ? "Present" : exp.endDate}`, margin, y);
        doc.setTextColor(0);
        y += 6;
        if (exp.description) {
          const descLines = doc.splitTextToSize(exp.description, maxWidth);
          doc.text(descLines, margin, y);
          y += descLines.length * 5 + 4;
        }
      });
      y += 2;
    }

    // Education
    if (editableCV.education?.length) {
      checkPage(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("EDUCATION", margin, y);
      y += 2;
      doc.setDrawColor(60);
      doc.line(margin, y, margin + maxWidth, y);
      y += 6;

      editableCV.education.forEach((edu) => {
        checkPage(20);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${edu.degree} in ${edu.field}`, margin, y);
        y += 5;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(`${edu.institution}  |  ${edu.startDate} – ${edu.endDate}`, margin, y);
        doc.setTextColor(0);
        y += 6;
        if (edu.description) {
          const lines = doc.splitTextToSize(edu.description, maxWidth);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 4;
        }
      });
      y += 2;
    }

    // Skills
    if (editableCV.skills?.length) {
      checkPage(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("SKILLS", margin, y);
      y += 2;
      doc.setDrawColor(60);
      doc.line(margin, y, margin + maxWidth, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const skillsText = doc.splitTextToSize(editableCV.skills.join("  •  "), maxWidth);
      doc.text(skillsText, margin, y);
      y += skillsText.length * 5 + 4;
    }

    // Certifications
    if (editableCV.certifications?.length) {
      checkPage(15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIFICATIONS", margin, y);
      y += 2;
      doc.setDrawColor(60);
      doc.line(margin, y, margin + maxWidth, y);
      y += 6;

      editableCV.certifications.forEach((cert) => {
        checkPage(10);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${cert.name}`, margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80);
        doc.text(`${cert.issuer}${cert.date ? ` — ${cert.date}` : ""}`, margin, y);
        doc.setTextColor(0);
        y += 6;
      });
    }

    doc.save(`${editableCV.personalInfo.fullName || "Tailored"}-CV.pdf`);
    toast.success("CV downloaded as PDF!");
  };

  const matchColor = (pct: number) => {
    if (pct >= 80) return "text-accent";
    if (pct >= 50) return "text-primary";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Job-Tailored CV</h2>
            <p className="text-sm text-muted-foreground">Generate a CV perfectly matched to your target job</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Job Title *</label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Product Manager"
              className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Job Description (optional but recommended)</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here for better matching..."
              rows={4}
              className="w-full rounded-xl border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>
          <button
            onClick={handleTailor}
            disabled={loading || !jobTitle.trim()}
            className="btn-premium w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing & Tailoring...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Match & Generate Tailored CV</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && editableCV && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Match Score */}
            <div className="glass-card rounded-2xl p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground mb-2">Job Match Score</p>
              <p className={`font-display text-6xl font-extrabold ${matchColor(result.matchPercentage)}`}>
                {result.matchPercentage}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {result.matchPercentage >= 80 ? "Great match! Minor tweaks applied." :
                 result.matchPercentage >= 50 ? "Good foundation. CV has been optimized." :
                 "Significant gaps found. CV has been restructured."}
              </p>
            </div>

            {/* Gaps & Suggestions */}
            {(result.gaps?.length > 0 || result.suggestions?.length > 0) && (
              <div className="glass-card rounded-2xl p-6">
                <button
                  onClick={() => setShowGaps(!showGaps)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    <span className="font-display font-bold text-foreground">Gaps & Suggestions</span>
                  </div>
                  {showGaps ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {showGaps && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      {result.gaps?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-destructive mb-2">Gaps Found:</p>
                          <ul className="space-y-1.5">
                            {result.gaps.map((gap, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-destructive mt-0.5">✗</span> {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.suggestions?.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-accent mb-2">How We Fixed It:</p>
                          <ul className="space-y-1.5">
                            {result.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" /> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Editable Tailored CV */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-primary" />
                  <span className="font-display font-bold text-foreground">Your Tailored CV</span>
                  <span className="text-xs text-muted-foreground">(click any field to edit)</span>
                </div>
                <button onClick={downloadPDF} className="btn-premium text-sm !py-2 !px-4">
                  <Download className="w-4 h-4" /> Download PDF
                </button>
              </div>

              {/* Personal Info */}
              <div className="mb-6 border-b border-border pb-6">
                <EditableField
                  value={editableCV.personalInfo.fullName}
                  onChange={(v) => setEditableCV({ ...editableCV, personalInfo: { ...editableCV.personalInfo, fullName: v } })}
                  className="font-display text-2xl font-bold text-foreground"
                  placeholder="Full Name"
                />
                <EditableField
                  value={editableCV.personalInfo.title}
                  onChange={(v) => setEditableCV({ ...editableCV, personalInfo: { ...editableCV.personalInfo, title: v } })}
                  className="text-primary font-medium"
                  placeholder="Professional Title"
                />
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <EditableField
                    value={editableCV.personalInfo.email}
                    onChange={(v) => setEditableCV({ ...editableCV, personalInfo: { ...editableCV.personalInfo, email: v } })}
                    placeholder="Email"
                  />
                  <span>•</span>
                  <EditableField
                    value={editableCV.personalInfo.phone}
                    onChange={(v) => setEditableCV({ ...editableCV, personalInfo: { ...editableCV.personalInfo, phone: v } })}
                    placeholder="Phone"
                  />
                  <span>•</span>
                  <EditableField
                    value={editableCV.personalInfo.location}
                    onChange={(v) => setEditableCV({ ...editableCV, personalInfo: { ...editableCV.personalInfo, location: v } })}
                    placeholder="Location"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Professional Summary</h3>
                <EditableTextArea
                  value={editableCV.personalInfo.summary}
                  onChange={(v) => setEditableCV({ ...editableCV, personalInfo: { ...editableCV.personalInfo, summary: v } })}
                  placeholder="Professional summary..."
                />
              </div>

              {/* Experience */}
              {editableCV.experience?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Work Experience</h3>
                  <div className="space-y-4">
                    {editableCV.experience.map((exp, i) => (
                      <div key={i} className="border-l-2 border-primary/30 pl-4">
                        <EditableField
                          value={exp.position}
                          onChange={(v) => {
                            const updated = [...editableCV.experience];
                            updated[i] = { ...updated[i], position: v };
                            setEditableCV({ ...editableCV, experience: updated });
                          }}
                          className="font-semibold text-foreground"
                          placeholder="Position"
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <EditableField
                            value={exp.company}
                            onChange={(v) => {
                              const updated = [...editableCV.experience];
                              updated[i] = { ...updated[i], company: v };
                              setEditableCV({ ...editableCV, experience: updated });
                            }}
                            placeholder="Company"
                          />
                          <span>|</span>
                          <span>{exp.startDate} – {exp.current ? "Present" : exp.endDate}</span>
                        </div>
                        <EditableTextArea
                          value={exp.description}
                          onChange={(v) => {
                            const updated = [...editableCV.experience];
                            updated[i] = { ...updated[i], description: v };
                            setEditableCV({ ...editableCV, experience: updated });
                          }}
                          placeholder="Description..."
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {editableCV.education?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Education</h3>
                  <div className="space-y-3">
                    {editableCV.education.map((edu, i) => (
                      <div key={i} className="border-l-2 border-accent/30 pl-4">
                        <p className="font-semibold text-foreground">{edu.degree} in {edu.field}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution} | {edu.startDate} – {edu.endDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {editableCV.skills?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {editableCV.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {editableCV.certifications?.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Certifications</h3>
                  <div className="space-y-2">
                    {editableCV.certifications.map((cert, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="font-medium text-foreground">{cert.name}</span>
                        <span className="text-muted-foreground">— {cert.issuer}{cert.date ? `, ${cert.date}` : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline editable field
function EditableField({
  value, onChange, className = "", placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
        className={`bg-transparent border-b border-primary outline-none w-full ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-primary/5 rounded px-1 -mx-1 transition-colors ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-muted-foreground italic">{placeholder}</span>}
    </span>
  );
}

// Inline editable textarea
function EditableTextArea({
  value, onChange, className = "", placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        rows={4}
        className={`w-full bg-transparent border border-primary/30 rounded-lg p-2 text-sm text-foreground outline-none resize-y ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className={`text-sm text-muted-foreground cursor-pointer hover:bg-primary/5 rounded p-1 -m-1 transition-colors whitespace-pre-wrap ${className}`}
      title="Click to edit"
    >
      {value || <span className="italic">{placeholder}</span>}
    </p>
  );
}
