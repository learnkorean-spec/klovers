import { useState } from "react";
import { CVData } from "@/types/cv";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Award, Trash2 } from "lucide-react";

interface Props {
  data: CVData;
  onChange: (data: CVData) => void;
}

const suggestedSkills = [
  "Confidence Building", "Communication", "Self-Discipline", "Life Coaching",
  "Public Speaking", "Emotional Intelligence", "Mindfulness", "Goal Setting",
  "Leadership", "Time Management", "Conflict Resolution", "Active Listening",
  "Motivational Speaking", "NLP", "CBT Techniques", "Team Building",
];

export function CVFormSkills({ data, onChange }: Props) {
  const [newSkill, setNewSkill] = useState("");

  const addSkill = (skill: string) => {
    if (skill.trim() && !data.skills.includes(skill.trim())) {
      onChange({ ...data, skills: [...data.skills, skill.trim()] });
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    onChange({ ...data, skills: data.skills.filter((s) => s !== skill) });
  };

  const addCert = () => {
    onChange({
      ...data,
      certifications: [...data.certifications, { id: crypto.randomUUID(), name: "", issuer: "", date: "" }],
    });
  };

  const removeCert = (id: string) => {
    onChange({ ...data, certifications: data.certifications.filter((c) => c.id !== id) });
  };

  const updateCert = (id: string, field: string, value: string) => {
    onChange({
      ...data,
      certifications: data.certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    });
  };

  return (
    <div className="space-y-6">
      {/* Skills */}
      <div className="space-y-3">
        <h3 className="text-lg font-display font-semibold text-foreground">Skills</h3>
        <div className="flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSkill(newSkill)}
            placeholder="Type a skill and press Enter"
            className="flex-1"
          />
          <button onClick={() => addSkill(newSkill)} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Suggested */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Suggested for Personal Development:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedSkills.filter((s) => !data.skills.includes(s)).slice(0, 8).map((skill) => (
              <button
                key={skill}
                onClick={() => addSkill(skill)}
                className="px-2.5 py-1 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Selected */}
        <div className="flex flex-wrap gap-2">
          {data.skills.map((skill) => (
            <span key={skill} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {skill}
              <button onClick={() => removeSkill(skill)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5" /> Certifications
          </h3>
          <button onClick={addCert} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {data.certifications.map((cert) => (
          <div key={cert.id} className="flex gap-3 items-start p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
              <Input value={cert.name} onChange={(e) => updateCert(cert.id, "name", e.target.value)} placeholder="ICF Certified Coach" />
              <Input value={cert.issuer} onChange={(e) => updateCert(cert.id, "issuer", e.target.value)} placeholder="ICF" />
              <Input value={cert.date} onChange={(e) => updateCert(cert.id, "date", e.target.value)} placeholder="2023" />
            </div>
            <button onClick={() => removeCert(cert.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
