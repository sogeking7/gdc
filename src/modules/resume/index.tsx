"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/hooks";
import { updateContactInfo, selectTemplate } from "@/lib/features/resumeSlice";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Download,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Sparkles,
  AlertCircle,
  Plus,
  X,
  CheckCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define interfaces for multi-entry sections
type EducationEntry = {
  id: string;
  university: string;
  degree: string;
  major: string;
  graduationYear: string;
  gpa: string;
};

type ExperienceEntry = {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
};

export const ResumePage = () => {
  const resume = useAppSelector((state) => state.resume);
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [hasPreFilled, setHasPreFilled] = useState(false);

  // Education fields (now an array)
  const [educations, setEducations] = useState<EducationEntry[]>([]);

  // Skills (pre-populated from onboarding)
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  // Summary
  const [summary, setSummary] = useState("");
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Experience (now an array with a defined type)
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);

  // Certifications
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState("");

  // Pre-fill resume with user data from onboarding
  useEffect(() => {
    if (!hasPreFilled && user.name) {
      // Contact info
      dispatch(
        updateContactInfo({
          fullName: user.name || "",
          email: user.email || "",
          phone: resume.contactInfo.phone || "",
          linkedin: resume.contactInfo.linkedin || "",
        })
      );

      // Education (set as an array with one entry)
      setEducations([
        {
          id: crypto.randomUUID(),
          university: user.university || "",
          degree: "Bachelor of Science",
          major: user.major || "",
          graduationYear: user.graduationYear || "",
          gpa: user.gpa || "",
        },
      ]);

      // Skills
      const userSkills =
        user.skills ||
        user.skillsText?.split(",").map((s: string) => s.trim()) ||
        [];
      setSkills(userSkills.filter((s) => s));

      // Note: Experiences are not pre-filled in the original logic
      // Certifications are not pre-filled

      setHasPreFilled(true);
    }
  }, [
    user,
    hasPreFilled,
    dispatch,
    resume.contactInfo.phone,
    resume.contactInfo.linkedin,
  ]);

  const handleInputChange = (field: string, value: string) => {
    dispatch(updateContactInfo({ [field]: value }));
  };

  const handleTemplateSelect = (templateId: number) => {
    dispatch(selectTemplate(templateId));
  };

  // --- Education Handlers ---
  const handleAddEducation = () => {
    setEducations([
      ...educations,
      {
        id: crypto.randomUUID(),
        university: "",
        degree: "",
        major: "",
        graduationYear: "",
        gpa: "",
      },
    ]);
  };

  const handleUpdateEducation = (
    id: string,
    field: keyof EducationEntry,
    value: string
  ) => {
    setEducations(
      educations.map((edu) =>
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    );
  };

  const handleRemoveEducation = (id: string) => {
    setEducations(educations.filter((edu) => edu.id !== id));
  };

  // --- Experience Handlers ---
  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      {
        id: crypto.randomUUID(),
        jobTitle: "",
        company: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ]);
  };

  const handleUpdateExperience = (
    id: string,
    field: keyof ExperienceEntry,
    value: string
  ) => {
    setExperiences(
      experiences.map((exp) =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    );
  };

  const handleRemoveExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  // --- Skill Handlers ---
  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // --- Certification Handlers ---
  const handleAddCertification = () => {
    if (
      newCertification.trim() &&
      !certifications.includes(newCertification.trim())
    ) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification("");
    }
  };

  const handleRemoveCertification = (certToRemove: string) => {
    setCertifications(certifications.filter((c) => c !== certToRemove));
  };

  // --- AI Summary ---
  const generateAISummary = async () => {
    if (!user.major && !user.role) {
      setSummary(
        "Motivated professional seeking to leverage skills and experience in a dynamic role."
      );
      return;
    }

    setGeneratingSummary(true);
    try {
      const prompt = `Write a professional 2-sentence resume summary (max 50 words) for:
- Major: ${user.major || "general studies"}
- Target Role: ${user.role || "entry-level position"}
- Key Skills: ${skills.slice(0, 5).join(", ") || "various skills"}
- Experience: ${
        experiences.length > 0
          ? experiences.map((e) => e.jobTitle).join(", ")
          : user.experience || "student"
      }
- Goals: ${user.careerGoals || "career growth"}

Return ONLY the summary text, no JSON, no quotes, just the summary.`;

      const response = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        let summaryText = data.text || data.response || "";

        // Clean up the response (remove quotes, JSON markers, etc.)
        summaryText = summaryText
          .replace(/^["']|["']$/g, "")
          .replace(/^```json\s*|\s*```$/g, "")
          .replace(/^\{.*?"summary":\s*"|"\s*\}$/g, "")
          .trim();

        if (summaryText && summaryText.length > 20) {
          setSummary(summaryText);
        } else {
          // Fallback summary
          setSummary(
            `${user.major || "Recent"} graduate with expertise in ${skills
              .slice(0, 3)
              .join(", ")}. Seeking ${
              user.role?.replace("Aspiring ", "") || "entry-level"
            } role to apply technical skills and drive impact.`
          );
        }
      } else {
        throw new Error("Failed to generate summary");
      }
    } catch (error) {
      console.error("Summary generation error:", error);
      // Fallback summary
      setSummary(
        `${user.major || "Recent"} graduate with strong foundation in ${skills
          .slice(0, 3)
          .join(", ")}. Seeking opportunities to contribute and grow in ${
          user.role?.replace("Aspiring ", "") || "a professional environment"
        }.`
      );
    } finally {
      setGeneratingSummary(false);
    }
  };

  // --- AI Feedback ---
  const handleGetAIFeedback = async () => {
    setLoadingAI(true);
    setAiFeedback(null);

    // Build education string
    const educationString = educations
      .map(
        (edu) =>
          `${edu.degree} in ${edu.major} from ${edu.university} (${
            edu.graduationYear
          })${edu.gpa ? `, GPA: ${edu.gpa}` : ""}`
      )
      .join("\n");

    // Build experience string
    const experienceString = experiences
      .map(
        (exp) =>
          `${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${
            exp.endDate || "Present"
          })\n${exp.description}`
      )
      .join("\n\n");

    try {
      const resumeContent = `
Name: ${resume.contactInfo.fullName}
Email: ${resume.contactInfo.email}
Phone: ${resume.contactInfo.phone}
LinkedIn: ${resume.contactInfo.linkedin}

Professional Summary:
${summary || "Not provided"}

Education:
${educationString || "Not provided"}

Work Experience:
${experienceString || "Not provided"}

Skills:
${skills.join(", ") || "Not provided"}

Certifications:
${certifications.join(", ") || "Not provided"}

Projects:
${user.projects || "Not provided"}

Target Role: ${user.role || "Not specified"}
Career Goals: ${user.careerGoals || "Not specified"}
      `;

      const response = await fetch("/api/ai/resume-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeContent,
          userProfile: {
            major: user.major,
            targetRole: user.role,
            role: user.role,
            experience: user.experience,
            skills:
              user.skills ||
              user.skillsText?.split(",").map((s: string) => s.trim()),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI feedback");
      }

      const data = await response.json();
      setAiFeedback(data.feedback);
    } catch (error) {
      console.error("AI Feedback Error:", error);
      setAiFeedback({
        overallScore: 75,
        strengths: ["Clear contact information", "Professional formatting"],
        improvements: [
          "Add more detail to work experience",
          "Include quantifiable achievements",
        ],
        atsScore: 70,
      });
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <main className="flex flex-1 min-h-screen">
      {/* Left Panel: Form */}
      <div className="w-2/5 max-w-2xl border-r border-border p-8 overflow-y-auto animate-fade-in">
        <div className="flex flex-col gap-8">
          {/* Page Heading */}
          <div>
            <p className="text-3xl font-bold leading-tight tracking-tight">
              Build Your Resume, {user.name?.split(" ")[0] || "there"}!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {user.major
                ? `Create your professional ${user.major} resume`
                : "Complete the sections below to create your professional resume"}
            </p>
            {user.name && hasPreFilled && (
              <div className="mt-3 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xs text-green-700 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  We've pre-filled your information from onboarding!
                </p>
              </div>
            )}
          </div>

          {/* Form Sections (Accordion) */}
          <Accordion
            type="multiple"
            defaultValue={["contact"]}
            className="space-y-4"
          >
            {/* Contact Information Section */}
            <AccordionItem
              value="contact"
              className="bg-white border rounded-xl px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">Contact Information</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g., Jane Doe"
                    value={resume.contactInfo.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="e.g., jane.doe@email.com"
                      value={resume.contactInfo.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., (123) 456-7890"
                      value={resume.contactInfo.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    placeholder="e.g., linkedin.com/in/janedoe"
                    value={resume.contactInfo.linkedin}
                    onChange={(e) =>
                      handleInputChange("linkedin", e.target.value)
                    }
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleGetAIFeedback}
                    disabled={loadingAI}
                  >
                    {loadingAI ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Feedback
                      </>
                    )}
                  </Button>
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                {aiFeedback && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-2xl font-bold text-primary">
                        {aiFeedback.overallScore}/100
                      </span>
                    </div>

                    {aiFeedback.atsScore && (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <span className="text-sm font-medium">ATS Score</span>
                        <span className="text-lg font-bold text-green-600">
                          {aiFeedback.atsScore}/100
                        </span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-500" />
                        Strengths:
                      </p>
                      <ul className="text-xs space-y-1 list-disc pl-5 text-muted-foreground">
                        {aiFeedback.strengths?.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        Improvements:
                      </p>
                      <ul className="text-xs space-y-1 list-disc pl-5 text-muted-foreground">
                        {aiFeedback.improvements?.map(
                          (i: string, idx: number) => (
                            <li key={idx}>{i}</li>
                          )
                        )}
                      </ul>
                    </div>

                    {aiFeedback.keywordSuggestions && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">
                          Suggested Keywords:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {aiFeedback.keywordSuggestions.map(
                            (keyword: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs bg-primary/20 px-2 py-1 rounded"
                              >
                                {keyword}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Professional Summary Section */}
            <AccordionItem
              value="summary"
              className="bg-white border rounded-xl px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">
                    Professional Summary
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="summary">Professional Summary</Label>
                  <textarea
                    id="summary"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    rows={4}
                    placeholder="A brief summary highlighting your background, skills, and career objectives..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={generateAISummary}
                  disabled={generatingSummary}
                  className="w-full"
                >
                  {generatingSummary ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Education Section (Refactored for multiple) */}
            <AccordionItem
              value="education"
              className="bg-white border rounded-xl px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">Education</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-4">
                {educations.map((edu, index) => (
                  <div
                    key={edu.id}
                    className="space-y-4 p-4 border rounded-lg relative"
                  >
                    {educations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveEducation(edu.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`university-${edu.id}`}>
                        University/Institution
                      </Label>
                      <Input
                        id={`university-${edu.id}`}
                        placeholder="e.g., Stanford University"
                        value={edu.university}
                        onChange={(e) =>
                          handleUpdateEducation(
                            edu.id,
                            "university",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`degree-${edu.id}`}>Degree</Label>
                        <Input
                          id={`degree-${edu.id}`}
                          placeholder="e.g., Bachelor of Science"
                          value={edu.degree}
                          onChange={(e) =>
                            handleUpdateEducation(
                              edu.id,
                              "degree",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`major-${edu.id}`}>
                          Major/Field of Study
                        </Label>
                        <Input
                          id={`major-${edu.id}`}
                          placeholder="e.g., Computer Science"
                          value={edu.major}
                          onChange={(e) =>
                            handleUpdateEducation(
                              edu.id,
                              "major",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`graduationYear-${edu.id}`}>
                          Graduation Year
                        </Label>
                        <Input
                          id={`graduationYear-${edu.id}`}
                          placeholder="e.g., 2025"
                          value={edu.graduationYear}
                          onChange={(e) =>
                            handleUpdateEducation(
                              edu.id,
                              "graduationYear",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`gpa-${edu.id}`}>GPA (optional)</Label>
                        <Input
                          id={`gpa-${edu.id}`}
                          placeholder="e.g., 3.8"
                          value={edu.gpa}
                          onChange={(e) =>
                            handleUpdateEducation(edu.id, "gpa", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {user.university && hasPreFilled && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-xs text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Education details auto-filled from your onboarding
                      profile!
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddEducation}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Education
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Work Experience Section (Refactored for multiple) */}
            <AccordionItem
              value="experience"
              className="bg-white border rounded-xl px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">
                    Work Experience & Projects
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pb-4">
                {experiences.map((exp, index) => (
                  <div
                    key={exp.id}
                    className="space-y-4 p-4 border rounded-lg relative"
                  >
                    {experiences.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveExperience(exp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`jobTitle-${exp.id}`}>
                        Position Title
                      </Label>
                      <Input
                        id={`jobTitle-${exp.id}`}
                        placeholder="e.g., Software Engineering Intern"
                        value={exp.jobTitle}
                        onChange={(e) =>
                          handleUpdateExperience(
                            exp.id,
                            "jobTitle",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`company-${exp.id}`}>
                        Company/Organization
                      </Label>
                      <Input
                        id={`company-${exp.id}`}
                        placeholder="e.g., Google"
                        value={exp.company}
                        onChange={(e) =>
                          handleUpdateExperience(
                            exp.id,
                            "company",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`startDate-${exp.id}`}>
                          Start Date
                        </Label>
                        <Input
                          id={`startDate-${exp.id}`}
                          type="month"
                          value={exp.startDate}
                          onChange={(e) =>
                            handleUpdateExperience(
                              exp.id,
                              "startDate",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`endDate-${exp.id}`}>End Date</Label>
                        <Input
                          id={`endDate-${exp.id}`}
                          type="month"
                          placeholder="Present"
                          value={exp.endDate}
                          onChange={(e) =>
                            handleUpdateExperience(
                              exp.id,
                              "endDate",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`description-${exp.id}`}>
                        Description & Achievements
                      </Label>
                      <textarea
                        id={`description-${exp.id}`}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        rows={4}
                        placeholder={
                          "• Led development of new feature\n• Improved performance by 30%\n• Collaborated with cross-functional team"
                        }
                        value={exp.description}
                        onChange={(e) =>
                          handleUpdateExperience(
                            exp.id,
                            "description",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}

                {user.projects && (
                  <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-xs font-medium text-blue-700 mb-1">
                      From Your Onboarding (Projects):
                    </p>
                    <p className="text-xs text-blue-600">{user.projects}</p>
                    <p className="text-xs text-blue-700 mt-2">
                      Consider adding this as a 'Project' entry above.
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleAddExperience}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Position
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Skills Section */}
            <AccordionItem
              value="skills"
              className="bg-white border rounded-xl px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">Skills</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Your Skills</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-background rounded-lg min-h-[80px] border border-border">
                    {skills.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No skills added yet. Add some below!
                      </p>
                    ) : (
                      skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:text-primary/70 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newSkill">Add New Skill</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newSkill"
                      placeholder="e.g., Python, Leadership, Data Analysis"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddSkill}
                      disabled={!newSkill.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {user.skills && user.skills.length > 0 && hasPreFilled && (
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-xs text-purple-700 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {skills.length} skills loaded from your onboarding
                      profile!
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Certifications Section */}
            <AccordionItem
              value="certifications"
              className="bg-white border rounded-xl px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">
                    Certifications & Courses
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Your Certifications</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-background rounded-lg min-h-[60px] border border-border">
                    {certifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No certifications added yet
                      </p>
                    ) : (
                      certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium"
                        >
                          {cert}
                          <button
                            onClick={() => handleRemoveCertification(cert)}
                            className="hover:text-green-600 ml-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newCertification">Add Certification</Label>
                  <div className="flex gap-2">
                    <Input
                      id="newCertification"
                      placeholder="e.g., AWS Certified Developer, Google Analytics Certified"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCertification();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddCertification}
                      disabled={!newCertification.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Right Panel: Resume Preview */}
      <div className="w-3/5 flex-1 p-8 bg-muted/50 flex flex-col items-center overflow-y-auto animate-fade-in">
        {/* Template Selector */}
        <div className="w-full max-w-4xl mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Template
          </p>
          <div className="flex items-center gap-4">
            {/* Template 0: Modern */}
            <button
              onClick={() => handleTemplateSelect(0)}
              className={cn(
                "w-28 h-40 rounded-lg border-2 cursor-pointer flex-shrink-0 transition-all hover:scale-105 overflow-hidden",
                resume.selectedTemplate === 0
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="h-full flex flex-col bg-background">
                <div className="h-1/4 bg-gradient-to-r from-primary to-blue-500"></div>
                <div className="flex-1 p-2 space-y-1">
                  <div className="h-2 bg-primary/20 rounded w-3/4 mx-auto"></div>
                  <div className="h-1 bg-muted-foreground/20 rounded w-1/2 mx-auto"></div>
                  <div className="space-y-0.5 mt-2">
                    <div className="h-1 bg-muted-foreground/10 rounded"></div>
                    <div className="h-1 bg-muted-foreground/10 rounded w-5/6"></div>
                  </div>
                </div>
                <p className="text-xs font-bold text-primary py-1">Modern</p>
              </div>
            </button>

            {/* Template 1: Classic */}
            <button
              onClick={() => handleTemplateSelect(1)}
              className={cn(
                "w-28 h-40 rounded-lg border-2 cursor-pointer flex-shrink-0 transition-all hover:scale-105 overflow-hidden",
                resume.selectedTemplate === 1
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
                <div className="h-1/5 border-b-2 border-primary p-2">
                  <div className="h-2 bg-foreground/30 rounded w-2/3"></div>
                </div>
                <div className="flex-1 p-2 space-y-1">
                  <div className="h-1 bg-primary rounded-sm w-1/3"></div>
                  <div className="h-1 bg-muted-foreground/10 rounded w-full"></div>
                  <div className="h-1 bg-muted-foreground/10 rounded w-5/6"></div>
                </div>
                <p className="text-xs font-bold text-primary py-1">Classic</p>
              </div>
            </button>

            {/* Template 2: Creative */}
            <button
              onClick={() => handleTemplateSelect(2)}
              className={cn(
                "w-28 h-40 rounded-lg border-2 cursor-pointer flex-shrink-0 transition-all hover:scale-105 overflow-hidden",
                resume.selectedTemplate === 2
                  ? "border-primary shadow-lg ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/20">
                <div className="h-1/4 bg-gradient-to-r from-primary/20 to-purple-500/20 p-2 flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                </div>
                <div className="flex-1 p-2 space-y-1">
                  <div className="h-1 bg-gradient-to-r from-primary/30 to-purple-500/30 rounded w-1/2"></div>
                  <div className="space-y-0.5">
                    <div className="h-1 bg-muted-foreground/10 rounded"></div>
                    <div className="h-1 bg-muted-foreground/10 rounded w-4/5"></div>
                  </div>
                </div>
                <p className="text-xs font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent py-1">
                  Creative
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Resume Preview Paper */}
        <Card className="w-full max-w-4xl aspect-[8.5/11] shadow-2xl overflow-hidden">
          <div
            className={cn(
              "p-12 text-foreground bg-background h-full overflow-y-auto",
              resume.selectedTemplate === 0 && "bg-background",
              resume.selectedTemplate === 1 && "bg-slate-50 dark:bg-slate-950",
              resume.selectedTemplate === 2 &&
                "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/20"
            )}
          >
            {/* Resume Header - Different styles per template */}
            <div
              className={cn(
                "pb-6 mb-6",
                resume.selectedTemplate === 0 &&
                  "text-center border-b border-border",
                resume.selectedTemplate === 1 &&
                  "text-left border-b-2 border-primary",
                resume.selectedTemplate === 2 &&
                  "text-center bg-gradient-to-r from-primary/10 to-purple-500/10 -m-12 mb-6 p-8"
              )}
            >
              <h1
                className={cn(
                  "font-bold tracking-tight",
                  resume.selectedTemplate === 0 && "text-4xl",
                  resume.selectedTemplate === 1 && "text-3xl",
                  resume.selectedTemplate === 2 && "text-5xl text-primary"
                )}
              >
                {resume.contactInfo.fullName || "Your Name"}
              </h1>
              <p
                className={cn(
                  "text-muted-foreground mt-2",
                  resume.selectedTemplate === 0 && "text-sm",
                  resume.selectedTemplate === 1 && "text-xs font-medium",
                  resume.selectedTemplate === 2 && "text-sm font-semibold"
                )}
              >
                {resume.contactInfo.phone && `${resume.contactInfo.phone} | `}
                {resume.contactInfo.email}
                {resume.contactInfo.linkedin &&
                  ` | ${resume.contactInfo.linkedin}`}
              </p>
            </div>

            {/* Resume Body */}
            <div className="space-y-6">
              {/* Summary Section */}
              {summary && (
                <div>
                  <h2
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest mb-2",
                      resume.selectedTemplate === 0 && "text-primary",
                      resume.selectedTemplate === 1 &&
                        "text-foreground border-b border-primary pb-1",
                      resume.selectedTemplate === 2 &&
                        "text-primary border-b border-primary/30 pb-1"
                    )}
                  >
                    Professional Summary
                  </h2>
                  <p className="text-sm leading-relaxed">{summary}</p>
                </div>
              )}

              {/* Education Section (Refactored for multiple) */}
              {educations.length > 0 && educations[0].university && (
                <div>
                  <h2
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest mb-2",
                      resume.selectedTemplate === 0 && "text-primary",
                      resume.selectedTemplate === 1 &&
                        "text-foreground border-b border-primary pb-1",
                      resume.selectedTemplate === 2 &&
                        "text-primary border-b border-primary/30 pb-1"
                    )}
                  >
                    Education
                  </h2>
                  <div className="space-y-3">
                    {educations.map((edu) => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold">
                            {edu.degree || "Degree"} in {edu.major || "Major"}
                          </h3>
                          <p className="text-xs text-muted-foreground font-medium">
                            {edu.graduationYear
                              ? `Expected ${edu.graduationYear}`
                              : ""}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {edu.university || "University"}
                          {edu.gpa && ` | GPA: ${edu.gpa}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience Section (Refactored for multiple) */}
              {experiences.length > 0 && (
                <div>
                  <h2
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest mb-2",
                      resume.selectedTemplate === 0 && "text-primary",
                      resume.selectedTemplate === 1 &&
                        "text-foreground border-b border-primary pb-1",
                      resume.selectedTemplate === 2 &&
                        "text-primary border-b border-primary/30 pb-1"
                    )}
                  >
                    Work Experience
                  </h2>
                  <div className="space-y-4">
                    {experiences.map((exp) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold">
                            {exp.jobTitle || "Position Title"}
                          </h3>
                          <p className="text-xs text-muted-foreground font-medium">
                            {exp.startDate} - {exp.endDate || "Present"}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {exp.company || "Company Name"}
                        </p>
                        <ul className="text-sm list-disc pl-5 mt-1 text-muted-foreground space-y-1">
                          {exp.description
                            .split("\n")
                            .filter((line) => line.trim().length > 0)
                            .map((line, i) => (
                              <li key={i}>{line.replace(/•\s*/, "")}</li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {skills.length > 0 && (
                <div>
                  <h2
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest mb-2",
                      resume.selectedTemplate === 0 && "text-primary",
                      resume.selectedTemplate === 1 &&
                        "text-foreground border-b border-primary pb-1",
                      resume.selectedTemplate === 2 &&
                        "text-primary border-b border-primary/30 pb-1"
                    )}
                  >
                    Skills
                  </h2>
                  <div
                    className={cn(
                      "flex flex-wrap gap-2",
                      resume.selectedTemplate === 1 && "gap-3"
                    )}
                  >
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className={cn(
                          "text-xs px-2 py-1 font-medium",
                          resume.selectedTemplate === 0 &&
                            "rounded bg-primary/10 text-primary",
                          resume.selectedTemplate === 1 && "text-foreground",
                          resume.selectedTemplate === 2 &&
                            "rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary"
                        )}
                      >
                        {resume.selectedTemplate === 1 && "• "}
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Section (from user onboarding) */}
              {user.projects && experiences.length === 0 && (
                <div>
                  <h2
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest mb-2",
                      resume.selectedTemplate === 2
                        ? "text-primary border-b border-primary/30 pb-1"
                        : "text-primary"
                    )}
                  >
                    Projects
                  </h2>
                  <div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {user.projects}
                    </p>
                  </div>
                </div>
              )}

              {/* Certifications Section */}
              {certifications.length > 0 && (
                <div>
                  <h2
                    className={cn(
                      "text-sm font-bold uppercase tracking-widest mb-2",
                      resume.selectedTemplate === 2
                        ? "text-primary border-b border-primary/30 pb-1"
                        : "text-primary"
                    )}
                  >
                    Certifications
                  </h2>
                  <ul className="space-y-1">
                    {certifications.map((cert, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Placeholder if no content */}
              {!summary &&
                (educations.length === 0 || !educations[0].university) &&
                skills.length === 0 &&
                experiences.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">
                      Fill in the sections on the left to see your resume
                      preview
                    </p>
                  </div>
                )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
};
