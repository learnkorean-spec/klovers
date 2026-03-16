export interface CVData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    title: string;
    summary: string;
    linkedin: string;
    website: string;
  };
  experience: {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  skills: string[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
  }[];
}

export const defaultCVData: CVData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    title: "",
    summary: "",
    linkedin: "",
    website: "",
  },
  experience: [],
  education: [],
  skills: [],
  certifications: [],
};
