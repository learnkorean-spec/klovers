import { CVData } from "@/types/cv";
import { Mail, Phone, MapPin, Linkedin, Globe, Award } from "lucide-react";
import { forwardRef } from "react";

interface Props {
  data: CVData;
}

export const CVPreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const { personalInfo, experience, education, skills, certifications } = data;
  const hasContent = personalInfo.fullName || experience.length || education.length || skills.length;

  if (!hasContent) {
    return (
      <div ref={ref} className="flex items-center justify-center h-full min-h-[600px] text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-lg font-display">Your CV preview will appear here</p>
          <p className="text-sm">Start filling in your details on the left</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="bg-white text-gray-900 p-8 min-h-[842px] w-full max-w-[595px] mx-auto shadow-lg" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div className="border-b-2 border-orange-500 pb-4 mb-5">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          {personalInfo.fullName || "Your Name"}
        </h1>
        {personalInfo.title && (
          <p className="text-orange-600 font-medium mt-0.5">{personalInfo.title}</p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-600">
          {personalInfo.email && (
            <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{personalInfo.email}</span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{personalInfo.phone}</span>
          )}
          {personalInfo.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{personalInfo.location}</span>
          )}
          {personalInfo.linkedin && (
            <span className="flex items-center gap-1"><Linkedin className="w-3 h-3" />{personalInfo.linkedin}</span>
          )}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1.5">Professional Summary</h2>
          <p className="text-xs leading-relaxed text-gray-700">{personalInfo.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Experience</h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-semibold">{exp.position}</h3>
                <span className="text-xs text-gray-500">{exp.startDate} — {exp.endDate || "Present"}</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">{exp.company}</p>
              {exp.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-semibold">{edu.degree} {edu.field && `in ${edu.field}`}</h3>
                <span className="text-xs text-gray-500">{edu.endDate}</span>
              </div>
              <p className="text-xs text-gray-600">{edu.institution}</p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span key={skill} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1">
            <Award className="w-3 h-3" /> Certifications
          </h2>
          {certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between text-xs mb-1">
              <span className="font-medium">{cert.name} <span className="text-gray-500">— {cert.issuer}</span></span>
              <span className="text-gray-500">{cert.date}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

CVPreview.displayName = "CVPreview";
