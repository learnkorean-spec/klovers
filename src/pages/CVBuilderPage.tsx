import { useRef, useState } from "react";
import { CVData, defaultCVData } from "@/types/cv";
import { CVForm } from "@/components/cv/CVForm";
import { CVPreview } from "@/components/cv/CVPreview";
import { CVDownloadButton } from "@/components/cv/CVDownloadButton";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Edit3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CVBuilder() {
  const [cvData, setCvData] = useState<CVData>(defaultCVData);
  const [showPreview, setShowPreview] = useState(false);
  const cvRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/cv" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-display font-semibold text-foreground">GrowthCV</span>
          </Link>

          <div className="flex items-center gap-3">
            {/* Mobile toggle */}
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium"
            >
              {showPreview ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Edit" : "Preview"}
            </button>
            <CVDownloadButton cvRef={cvRef} fileName={cvData.personalInfo.fullName || "my-cv"} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${showPreview ? "hidden lg:block" : ""}`}
          >
            <div className="card-elevated bg-card rounded-xl p-6 border border-border">
              <CVForm data={cvData} onChange={setCvData} />
            </div>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${!showPreview ? "hidden lg:block" : ""}`}
          >
            <div className="card-elevated bg-card rounded-xl p-4 border border-border overflow-auto max-h-[calc(100vh-120px)] sticky top-20">
              <CVPreview ref={cvRef} data={cvData} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
