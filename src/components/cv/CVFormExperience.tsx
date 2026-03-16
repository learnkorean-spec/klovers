import { CVData } from "@/types/cv";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  data: CVData;
  onChange: (data: CVData) => void;
}

export function CVFormExperience({ data, onChange }: Props) {
  const add = () => {
    onChange({
      ...data,
      experience: [
        ...data.experience,
        { id: crypto.randomUUID(), company: "", position: "", startDate: "", endDate: "", current: false, description: "" },
      ],
    });
  };

  const remove = (id: string) => {
    onChange({ ...data, experience: data.experience.filter((e) => e.id !== id) });
  };

  const update = (id: string, field: string, value: string | boolean) => {
    onChange({
      ...data,
      experience: data.experience.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-foreground">Work Experience</h3>
        <button onClick={add} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {data.experience.length === 0 && (
        <p className="text-muted-foreground text-sm py-8 text-center">No experience added yet. Click "Add" to get started.</p>
      )}

      {data.experience.map((exp) => (
        <div key={exp.id} className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
          <div className="flex justify-between items-start">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div className="space-y-1">
                <Label>Position</Label>
                <Input value={exp.position} onChange={(e) => update(exp.id, "position", e.target.value)} placeholder="Personal Development Coach" />
              </div>
              <div className="space-y-1">
                <Label>Company</Label>
                <Input value={exp.company} onChange={(e) => update(exp.id, "company", e.target.value)} placeholder="Growth Academy" />
              </div>
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input value={exp.startDate} onChange={(e) => update(exp.id, "startDate", e.target.value)} placeholder="Jan 2022" />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input
                  value={exp.current ? "Present" : exp.endDate}
                  onChange={(e) => update(exp.id, "endDate", e.target.value)}
                  placeholder="Present"
                />
              </div>
            </div>
            <button onClick={() => remove(exp.id)} className="ml-2 p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={exp.description} onChange={(e) => update(exp.id, "description", e.target.value)} placeholder="Coached 50+ clients in building confidence and communication skills..." rows={3} />
          </div>
        </div>
      ))}
    </div>
  );
}
