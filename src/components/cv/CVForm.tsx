import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CVData, defaultCVData } from "@/types/cv";
import { CVFormPersonal } from "./CVFormPersonal";
import { CVFormExperience } from "./CVFormExperience";
import { CVFormEducation } from "./CVFormEducation";
import { CVFormSkills } from "./CVFormSkills";
import { User, Briefcase, GraduationCap, Sparkles } from "lucide-react";

const steps = [
  { id: 0, label: "Personal", icon: User },
  { id: 1, label: "Experience", icon: Briefcase },
  { id: 2, label: "Education", icon: GraduationCap },
  { id: 3, label: "Skills", icon: Sparkles },
];

interface CVFormProps {
  data: CVData;
  onChange: (data: CVData) => void;
}

export function CVForm({ data, onChange }: CVFormProps) {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setStep(s.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                step === s.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && <CVFormPersonal data={data} onChange={onChange} />}
          {step === 1 && <CVFormExperience data={data} onChange={onChange} />}
          {step === 2 && <CVFormEducation data={data} onChange={onChange} />}
          {step === 3 && <CVFormSkills data={data} onChange={onChange} />}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-6 py-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-40 hover:bg-secondary/80 transition-colors font-medium"
        >
          Back
        </button>
        <button
          onClick={() => setStep(Math.min(3, step + 1))}
          disabled={step === 3}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}
