import { CVData } from "@/types/cv";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  data: CVData;
  onChange: (data: CVData) => void;
}

export function CVFormEducation({ data, onChange }: Props) {
  const add = () => {
    onChange({
      ...data,
      education: [
        ...data.education,
        { id: crypto.randomUUID(), institution: "", degree: "", field: "", startDate: "", endDate: "", description: "" },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ ...data, education: data.education.filter((e) => e.id !== id) });
  };

  const update = (id: string, field: string, value: string) => {
    onChange({
      ...data,
      education: data.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-foreground">Education</h3>
        <button onClick={add} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {data.education.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">No education added yet. Click "Add" to get started.</p>
      )}

      {data.education.map((edu) => (
        <div key={edu.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
          <div className="flex justify-between items-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div className="space-y-1">
                <Label>Institution</Label>
                <Input value={edu.institution} onChange={(e) => update(edu.id, "institution", e.target.value)} placeholder="University of Growth" />
              </div>
              <div className="space-y-1">
                <Label>Degree</Label>
                <Input value={edu.degree} onChange={(e) => update(edu.id, "degree", e.target.value)} placeholder="Bachelor's" />
              </div>
              <div className="space-y-1">
                <Label>Field of Study</Label>
                <Input value={edu.field} onChange={(e) => update(edu.id, "field", e.target.value)} placeholder="Psychology" />
              </div>
              <div className="space-y-1">
                <Label>Year</Label>
                <Input value={edu.endDate} onChange={(e) => update(edu.id, "endDate", e.target.value)} placeholder="2020" />
              </div>
            </div>
            <button onClick={() => remove(edu.id)} className="ml-2 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
