"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { completeOnboarding, updateProfile } from "@/lib/features/userSlice";
import { auth } from "@/lib/firebase/clientApp";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Briefcase,
  Sparkles,
  Plus,
  X,
  Loader2,
} from "lucide-react";

interface CareerInterest {
  id: string;
  label: string;
  description?: string;
  relevance?: number;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  relevance: number;
  description: string;
  difficulty: string;
}

export const OnboardingPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    university: "",
    major: "",
    graduationYear: "",
    gpa: "",
    interests: [] as string[],
    customInterest: "",
    selectedSkills: [] as string[],
    customSkills: [] as string[],
  });

  // AI-powered suggestions
  const [careerInterests, setCareerInterests] = useState<CareerInterest[]>([]);
  const [suggestedSkills, setSuggestedSkills] = useState<Skill[]>([]);
  const [prioritySkills, setPrioritySkills] = useState<string[]>([]);
  const [isLoadingInterests, setIsLoadingInterests] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [showOtherInterest, setShowOtherInterest] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const progress = (currentStep / 2) * 100;
  const stepTitles = ["Academic Background", "Key Skills"];

  // Prefill user name and email from Redux store or Firebase Auth
  useEffect(() => {
    // First try to get from Redux store
    if (user.name && user.email) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }

    // Also listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || firebaseUser.displayName || "",
          email: prev.email || firebaseUser.email || "",
        }));
      }
    });

    return () => unsubscribe();
  }, [user.name, user.email]);

  // Fetch AI-suggested career interests when major is entered
  const fetchCareerInterests = async () => {
    if (!formData.major) return;

    setIsLoadingInterests(true);
    try {
      const response = await fetch("/api/ai/career-interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major: formData.major,
          university: formData.university,
          graduationYear: formData.graduationYear,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCareerInterests(data.interests || []);
      }
    } catch (error) {
      console.error("Error fetching career interests:", error);
    } finally {
      setIsLoadingInterests(false);
    }
  };

  // Fetch AI-suggested skills based on major
  const fetchSkillSuggestions = async () => {
    if (!formData.major) return;

    setIsLoadingSkills(true);
    try {
      const response = await fetch("/api/ai/skill-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major: formData.major,
          university: formData.university,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedSkills(data.skills || []);
        setPrioritySkills(data.prioritySkills || []);
      }
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Moving from step 1 to 2 - fetch skill suggestions based on major
      await fetchSkillSuggestions();
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInterestToggle = (interestId: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((id) => id !== interestId)
        : [...prev.interests, interestId],
    }));
  };

  const handleSkillToggle = (skillId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillId)
        ? prev.selectedSkills.filter((id) => id !== skillId)
        : [...prev.selectedSkills, skillId],
    }));
  };

  const handleAddCustomSkill = () => {
    if (customSkillInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        customSkills: [...prev.customSkills, customSkillInput.trim()],
      }));
      setCustomSkillInput("");
    }
  };

  const handleRemoveCustomSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      customSkills: prev.customSkills.filter((s) => s !== skill),
    }));
  };

  const handleAddCustomInterest = () => {
    if (formData.customInterest.trim()) {
      const customId = `custom-${formData.customInterest
        .toLowerCase()
        .replace(/\s+/g, "-")}`;
      setCareerInterests((prev) => [
        ...prev,
        {
          id: customId,
          label: formData.customInterest.trim(),
          description: "Custom interest",
        },
      ]);
      setFormData((prev) => ({
        ...prev,
        interests: [...prev.interests, customId],
        customInterest: "",
      }));
      setShowOtherInterest(false);
    }
  };

  const handleComplete = async () => {
    // Compile all skills (AI-suggested + custom)
    const selectedSkillObjects = suggestedSkills.filter((skill) =>
      formData.selectedSkills.includes(skill.id)
    );
    const allSkills = [
      ...selectedSkillObjects.map((s) => s.name),
      ...formData.customSkills,
    ];

    // Update user profile - no career goals, student exploring options
    dispatch(
      updateProfile({
        name: formData.name,
        email: formData.email,
        role: "Career Explorer", // Default until they choose a track
        education: `${formData.major} from ${formData.university}`,
        university: formData.university,
        major: formData.major,
        graduationYear: formData.graduationYear,
        gpa: formData.gpa,
        skills: allSkills,
        skillsText: allSkills.join(", "),
        profileCompletion: 80, // Complete onboarding, but no career chosen yet
      } as any)
    );

    // Store detailed onboarding data in localStorage
    const onboardingData = {
      name: formData.name,
      email: formData.email,
      university: formData.university,
      major: formData.major,
      graduationYear: formData.graduationYear,
      gpa: formData.gpa,
      skills: allSkills,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("onboardingData", JSON.stringify(onboardingData));

    dispatch(completeOnboarding());
    router.push("/");
  };

  const handleSkip = () => {
    if (
      confirm(
        "Are you sure you want to skip onboarding? You can always update your profile later."
      )
    ) {
      dispatch(completeOnboarding());
      router.push("/");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Background */}
      <div className="absolute inset-0 z-[-1]">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent" />
      </div>

      <div className="w-full max-w-2xl animate-fade-in">
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-primary" />
            <h2 className="text-lg font-bold tracking-tight">
              Career Assistant
            </h2>
          </div>
          <Button variant="outline" onClick={handleSkip}>
            Skip for now
          </Button>
        </header>

        {/* Onboarding Card */}
        <Card>
          <CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Step {currentStep} of 2
                </p>
                <p className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {stepTitles[currentStep - 1]}
                </p>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            <div className="pt-6 text-center">
              <CardTitle className="text-3xl sm:text-4xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Craft Your Future.
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Tell us about yourself and we'll help you discover the perfect
                career path.
              </CardDescription>
              {currentStep > 1 && formData.name && (
                <p className="mt-3 text-sm text-primary font-medium">
                  Welcome, {formData.name.split(" ")[0]}! 👋
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1: Academic Background */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Alex Johnson"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., alex@university.edu"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">University *</Label>
                  <Input
                    id="university"
                    placeholder="e.g., University of California, Berkeley"
                    value={formData.university}
                    onChange={(e) =>
                      setFormData({ ...formData, university: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="major">Major / Field of Study *</Label>
                  <Input
                    id="major"
                    placeholder="e.g., Computer Science"
                    value={formData.major}
                    onChange={(e) =>
                      setFormData({ ...formData, major: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    💡 We'll use this to suggest relevant career paths
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year *</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      placeholder="e.g., 2025"
                      value={formData.graduationYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          graduationYear: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gpa">GPA (Optional)</Label>
                    <Input
                      id="gpa"
                      placeholder="e.g., 3.5"
                      value={formData.gpa}
                      onChange={(e) =>
                        setFormData({ ...formData, gpa: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end pt-4">
                  <Button
                    onClick={handleNext}
                    disabled={
                      !formData.name ||
                      !formData.email ||
                      !formData.university ||
                      !formData.major ||
                      !formData.graduationYear
                    }
                  >
                    {isLoadingInterests ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating suggestions...
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Key Skills */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base">Select your key skills</Label>
                    {suggestedSkills.length > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        AI-recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose skills you have or want to develop
                  </p>

                  {isLoadingSkills ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {/* Priority Skills */}
                        {prioritySkills.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-primary flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Priority Skills for Your Path
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {suggestedSkills
                                .filter((skill) =>
                                  prioritySkills.includes(skill.id)
                                )
                                .map((skill) => (
                                  <label
                                    key={skill.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer hover:bg-accent transition-colors ${
                                      formData.selectedSkills.includes(skill.id)
                                        ? "border-primary bg-primary/5"
                                        : "border-primary/30"
                                    }`}
                                  >
                                    <Checkbox
                                      checked={formData.selectedSkills.includes(
                                        skill.id
                                      )}
                                      onCheckedChange={() =>
                                        handleSkillToggle(skill.id)
                                      }
                                      className="mt-0.5"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                          {skill.name}
                                        </span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                          {skill.difficulty}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {skill.description}
                                      </p>
                                    </div>
                                  </label>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Other Skills by Category */}
                        {["technical", "professional", "soft", "tools"].map(
                          (category) => {
                            const categorySkills = suggestedSkills.filter(
                              (skill) =>
                                skill.category === category &&
                                !prioritySkills.includes(skill.id)
                            );
                            if (categorySkills.length === 0) return null;

                            return (
                              <div key={category} className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground capitalize">
                                  {category} Skills
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {categorySkills.map((skill) => (
                                    <label
                                      key={skill.id}
                                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                                        formData.selectedSkills.includes(
                                          skill.id
                                        )
                                          ? "border-primary bg-primary/5"
                                          : ""
                                      }`}
                                    >
                                      <Checkbox
                                        checked={formData.selectedSkills.includes(
                                          skill.id
                                        )}
                                        onCheckedChange={() =>
                                          handleSkillToggle(skill.id)
                                        }
                                        className="mt-0.5"
                                      />
                                      <div className="flex-1">
                                        <span className="text-xs font-medium">
                                          {skill.name}
                                        </span>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>

                      {/* Add Custom Skills */}
                      <div className="mt-4 space-y-2">
                        <Label className="text-sm">Add Custom Skills</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Public Speaking"
                            value={customSkillInput}
                            onChange={(e) =>
                              setCustomSkillInput(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddCustomSkill();
                              }
                            }}
                          />
                          <Button
                            onClick={handleAddCustomSkill}
                            disabled={!customSkillInput.trim()}
                            size="sm"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {formData.customSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.customSkills.map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
                              >
                                {skill}
                                <button
                                  onClick={() => handleRemoveCustomSkill(skill)}
                                  className="hover:text-primary/70"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={
                      formData.selectedSkills.length === 0 &&
                      formData.customSkills.length === 0
                    }
                  >
                    Complete Onboarding
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
