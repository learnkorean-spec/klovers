import { CVData } from "@/types/cv";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Props {
  data: CVData;
  onChange: (data: CVData) => void;
}

export function CVFormPersonal({ data, onChange }: Props) {
  const update = (field: keyof CVData["personalInfo"], value: string) => {
    onChange({
      ...data,
      personalInfo: { ...data.personalInfo, [field]: value },
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-semibold text-foreground">Personal Information</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Full Name *</Label>
          <Input value={data.personalInfo.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="John Doe" />
        </div>
        <div className="space-y-1.5">
          <Label>Professional Title *</Label>
          <Input value={data.personalInfo.title} onChange={(e) => update("title", e.target.value)} placeholder="Life Coach & Personal Development Specialist" />
        </div>
        <div className="space-y-1.5">
          <Label>Email *</Label>
          <Input type="email" value={data.personalInfo.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input value={data.personalInfo.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 234 567 890" />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input value={data.personalInfo.location} onChange={(e) => update("location", e.target.value)} placeholder="New York, NY" />
        </div>
        <div className="space-y-1.5">
          <Label>LinkedIn</Label>
          <Input value={data.personalInfo.linkedin} onChange={(e) => update("linkedin", e.target.value)} placeholder="linkedin.com/in/johndoe" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Professional Summary</Label>
        <Textarea
          value={data.personalInfo.summary}
          onChange={(e) => update("summary", e.target.value)}
          placeholder="Passionate personal development professional with expertise in confidence building, communication skills, and self-discipline coaching..."
          rows={4}
        />
      </div>
    </div>
  );
}
