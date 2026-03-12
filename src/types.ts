export type AppTab = 'start' | 'cv' | 'plan' | 'profil';

export type IngestionSource = 'pdf' | 'docx' | 'image' | 'text';

export interface UploadedAsset {
  name: string;
  mimeType: string;
  base64: string;
  size?: number;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  location?: string;
  links: string[];
}

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  endDate?: string;
}

export interface NormalizedCvSchema {
  language: string;
  fullName: string;
  headline: string;
  summary: string;
  contact: ContactInfo;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: string[];
}

export interface IngestionResult {
  source: IngestionSource;
  rawText: string;
  normalizedCv: NormalizedCvSchema;
  confidence: number;
  warnings: string[];
}

export interface StructuredCvSection {
  title: string;
  items: string[];
}

export interface StructuredCvDocument {
  fullName: string;
  targetRole: string;
  summary: string;
  contactLine: string;
  sections: StructuredCvSection[];
  atsKeywords: string[];
}

export type RoadmapVariant = 'conservative' | 'ambitious' | 'pivot';

export interface CareerRoadmap {
  id: string;
  variant: RoadmapVariant;
  targetRole: string;
  reasoning: string;
  timeline: string;
  riskLevel: 'low' | 'medium' | 'high';
  nextActions: string[];
}

export interface CareerAnalysis {
  id: string;
  estimatedCurrentRole: string;
  seniorityLevel: string;
  strongestSkills: string[];
  missingSkills: string[];
  profileClarity: number;
  growthPotential: number;
  readinessScore: number;
  roadmaps: CareerRoadmap[];
}

export interface CareerProfile {
  id: string;
  fullName: string;
  currentRole: string;
  seniorityLevel: string;
  strongestSkills: string[];
  missingSkills: string[];
  lastUpdatedAt: string;
}

export interface GeneratedCvVersion {
  id: string;
  profileId: string;
  createdAt: string;
  source: IngestionSource;
  structuredCv: StructuredCvDocument;
  analysis: CareerAnalysis;
  ingestion: IngestionResult;
}

export interface PersistedWorkspace {
  profile: CareerProfile | null;
  latestVersionId: string | null;
  analyses: CareerAnalysis[];
  roadmaps: CareerRoadmap[];
  versions: GeneratedCvVersion[];
}

export interface Step1Submission {
  sourceFile: UploadedAsset | null;
  rawText: string;
  additionalContext: string;
}

export interface BuildArtifacts {
  pdfBytes: Uint8Array | null;
}

export interface WorkflowResult {
  profile: CareerProfile;
  ingestion: IngestionResult;
  structuredCv: StructuredCvDocument;
  analysis: CareerAnalysis;
  roadmaps: CareerRoadmap[];
  version: GeneratedCvVersion;
  artifacts: BuildArtifacts;
}
