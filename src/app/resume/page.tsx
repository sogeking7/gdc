'use client'

import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { updateContactInfo, selectTemplate } from '@/lib/features/resumeSlice'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Download, User, FileText, Briefcase, GraduationCap, Lightbulb, Sparkles, AlertCircle, Plus, X, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ResumePage() {
  const resume = useAppSelector((state) => state.resume)
  const user = useAppSelector((state) => state.user)
  const dispatch = useAppDispatch()
  const [aiFeedback, setAiFeedback] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [hasPreFilled, setHasPreFilled] = useState(false)

  // Education fields (pre-filled from onboarding)
  const [education, setEducation] = useState({
    university: '',
    degree: 'Bachelor of Science',
    major: '',
    graduationYear: '',
    gpa: ''
  })

  // Skills (pre-populated from onboarding)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState('')

  // Summary
  const [summary, setSummary] = useState('')
  const [generatingSummary, setGeneratingSummary] = useState(false)

  // Experience
  const [experiences, setExperiences] = useState<any[]>([])
  
  // Certifications
  const [certifications, setCertifications] = useState<string[]>([])
  const [newCertification, setNewCertification] = useState('')

  // Pre-fill resume with user data from onboarding
  useEffect(() => {
    if (!hasPreFilled && user.name) {
      // Contact info
      dispatch(updateContactInfo({
        fullName: user.name || '',
        email: user.email || '',
        phone: resume.contactInfo.phone || '',
        linkedin: resume.contactInfo.linkedin || ''
      }))

      // Education
      setEducation({
        university: user.university || '',
        degree: 'Bachelor of Science',
        major: user.major || '',
        graduationYear: user.graduationYear || '',
        gpa: user.gpa || ''
      })

      // Skills
      const userSkills = user.skills || user.skillsText?.split(',').map((s: string) => s.trim()) || []
      setSkills(userSkills.filter(s => s))

      setHasPreFilled(true)
    }
  }, [user, hasPreFilled, dispatch, resume.contactInfo.phone, resume.contactInfo.linkedin])

  const handleInputChange = (field: string, value: string) => {
    dispatch(updateContactInfo({ [field]: value }))
  }

  const handleTemplateSelect = (templateId: number) => {
    dispatch(selectTemplate(templateId))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const generateAISummary = async () => {
    if (!user.major && !user.role) {
      setSummary('Motivated professional seeking to leverage skills and experience in a dynamic role.')
      return
    }

    setGeneratingSummary(true)
    try {
      const prompt = `Write a professional 2-sentence resume summary (max 50 words) for:
- Major: ${user.major || 'general studies'}
- Target Role: ${user.role || 'entry-level position'}
- Key Skills: ${skills.slice(0, 5).join(', ') || 'various skills'}
- Experience: ${user.experience || 'student'}
- Goals: ${user.careerGoals || 'career growth'}

Return ONLY the summary text, no JSON, no quotes, just the summary.`

      const response = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      if (response.ok) {
        const data = await response.json()
        let summaryText = data.text || data.response || ''
        
        // Clean up the response (remove quotes, JSON markers, etc.)
        summaryText = summaryText
          .replace(/^["']|["']$/g, '')
          .replace(/^```json\s*|\s*```$/g, '')
          .replace(/^\{.*?"summary":\s*"|"\s*\}$/g, '')
          .trim()
        
        if (summaryText && summaryText.length > 20) {
          setSummary(summaryText)
        } else {
          // Fallback summary
          setSummary(`${user.major || 'Recent'} graduate with expertise in ${skills.slice(0, 3).join(', ')}. Seeking ${user.role?.replace('Aspiring ', '') || 'entry-level'} role to apply technical skills and drive impact.`)
        }
      } else {
        throw new Error('Failed to generate summary')
      }
    } catch (error) {
      console.error('Summary generation error:', error)
      // Fallback summary
      setSummary(`${user.major || 'Recent'} graduate with strong foundation in ${skills.slice(0, 3).join(', ')}. Seeking opportunities to contribute and grow in ${user.role?.replace('Aspiring ', '') || 'a professional environment'}.`)
    } finally {
      setGeneratingSummary(false)
    }
  }

  const handleGetAIFeedback = async () => {
    setLoadingAI(true)
    setAiFeedback(null)

    try {
      const resumeContent = `
Name: ${resume.contactInfo.fullName}
Email: ${resume.contactInfo.email}
Phone: ${resume.contactInfo.phone}
LinkedIn: ${resume.contactInfo.linkedin}

Professional Summary:
${summary || 'Not provided'}

Education:
${education.degree} in ${education.major}
${education.university}
${education.graduationYear ? `Expected Graduation: ${education.graduationYear}` : ''}
${education.gpa ? `GPA: ${education.gpa}` : ''}

Skills:
${skills.join(', ') || 'Not provided'}

Projects/Experience:
${user.projects || 'Not provided'}

Target Role: ${user.role || 'Not specified'}
Career Goals: ${user.careerGoals || 'Not specified'}
      `

      const response = await fetch('/api/ai/resume-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resumeContent,
          userProfile: {
            major: user.major,
            targetRole: user.role,
            role: user.role,
            experience: user.experience,
            skills: user.skills || user.skillsText?.split(',').map((s: string) => s.trim())
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI feedback')
      }

      const data = await response.json()
      setAiFeedback(data.feedback)
    } catch (error) {
      console.error('AI Feedback Error:', error)
      setAiFeedback({
        overallScore: 75,
        strengths: ['Clear contact information', 'Professional formatting'],
        improvements: ['Add more detail to work experience', 'Include quantifiable achievements'],
        atsScore: 70
      })
    } finally {
      setLoadingAI(false)
    }
  }

  return (
    <main className="flex flex-1 min-h-screen">
      {/* Left Panel: Form */}
      <div className="w-2/5 max-w-2xl border-r border-border p-8 overflow-y-auto animate-fade-in">
        <div className="flex flex-col gap-8">
          {/* Page Heading */}
          <div>
            <p className="text-3xl font-bold leading-tight tracking-tight">
              Build Your Resume, {user.name?.split(' ')[0] || 'there'}!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {user.major ? `Create your professional ${user.major} resume` : 'Complete the sections below to create your professional resume'}
            </p>
            {user.name && (
              <div className="mt-3 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xs text-green-700 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  We've pre-filled your information from onboarding!
                </p>
              </div>
            )}
          </div>

          {/* Form Sections (Accordion) */}
          <Accordion type="multiple" defaultValue={["contact"]} className="space-y-4">
            {/* Contact Information Section */}
            <AccordionItem value="contact" className="bg-muted border rounded-xl px-4">
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
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
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
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g., (123) 456-7890"
                      value={resume.contactInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    placeholder="e.g., linkedin.com/in/janedoe"
                    value={resume.contactInfo.linkedin}
                    onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" variant="outline" onClick={handleGetAIFeedback} disabled={loadingAI}>
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
                      <span className="text-2xl font-bold text-primary">{aiFeedback.overallScore}/100</span>
                    </div>
                    
                    {aiFeedback.atsScore && (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                        <span className="text-sm font-medium">ATS Score</span>
                        <span className="text-lg font-bold text-green-600">{aiFeedback.atsScore}/100</span>
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
                        {aiFeedback.improvements?.map((i: string, idx: number) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    </div>

                    {aiFeedback.keywordSuggestions && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">Suggested Keywords:</p>
                        <div className="flex flex-wrap gap-1">
                          {aiFeedback.keywordSuggestions.map((keyword: string, i: number) => (
                            <span key={i} className="text-xs bg-primary/20 px-2 py-1 rounded">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Professional Summary Section */}
            <AccordionItem value="summary" className="bg-muted border rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">Professional Summary</p>
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
                <Button variant="outline" onClick={generateAISummary} disabled={generatingSummary} className="w-full">
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

            {/* Education Section */}
            <AccordionItem value="education" className="bg-muted border rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">Education</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University/Institution</Label>
                  <Input
                    id="university"
                    placeholder="e.g., Stanford University"
                    value={education.university}
                    onChange={(e) => setEducation({ ...education, university: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="degree">Degree</Label>
                    <Input
                      id="degree"
                      placeholder="e.g., Bachelor of Science"
                      value={education.degree}
                      onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major">Major/Field of Study</Label>
                    <Input
                      id="major"
                      placeholder="e.g., Computer Science"
                      value={education.major}
                      onChange={(e) => setEducation({ ...education, major: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      placeholder="e.g., 2025"
                      value={education.graduationYear}
                      onChange={(e) => setEducation({ ...education, graduationYear: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gpa">GPA (optional)</Label>
                    <Input
                      id="gpa"
                      placeholder="e.g., 3.8"
                      value={education.gpa}
                      onChange={(e) => setEducation({ ...education, gpa: e.target.value })}
                    />
                  </div>
                </div>
                
                {user.university && (
                  <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <p className="text-xs text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Education details auto-filled from your onboarding profile!
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Work Experience Section */}
            <AccordionItem value="experience" className="bg-muted border rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">Work Experience & Projects</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Position Title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="e.g., Software Engineering Intern"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Organization</Label>
                    <Input
                      id="company"
                      placeholder="e.g., Google"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="month"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="month"
                        placeholder="Present"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description & Achievements</Label>
                    <textarea
                      id="description"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      rows={4}
                      placeholder={"• Led development of new feature\n• Improved performance by 30%\n• Collaborated with cross-functional team"}
                    />
                  </div>
                  
                  {user.projects && (
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-xs font-medium text-blue-700 mb-1">From Your Onboarding:</p>
                      <p className="text-xs text-blue-600">{user.projects}</p>
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Position
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Skills Section */}
            <AccordionItem value="skills" className="bg-muted border rounded-xl px-4">
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
                      <p className="text-sm text-muted-foreground">No skills added yet. Add some below!</p>
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
                        if (e.key === 'Enter') {
                          handleAddSkill()
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
                
                {user.skills && user.skills.length > 0 && (
                  <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-xs text-purple-700 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {skills.length} skills loaded from your onboarding profile!
                    </p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Certifications Section */}
            <AccordionItem value="certifications" className="bg-muted border rounded-xl px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <p className="text-base font-semibold">Certifications & Courses</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="space-y-2">
                  <Label>Your Certifications</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-background rounded-lg min-h-[60px] border border-border">
                    {certifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No certifications added yet</p>
                    ) : (
                      certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium"
                        >
                          {cert}
                          <button
                            onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
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
                        if (e.key === 'Enter' && newCertification.trim()) {
                          setCertifications([...certifications, newCertification.trim()])
                          setNewCertification('')
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (newCertification.trim()) {
                          setCertifications([...certifications, newCertification.trim()])
                          setNewCertification('')
                        }
                      }}
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
          <p className="text-sm font-medium text-muted-foreground mb-3">Template</p>
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
                <p className="text-xs font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent py-1">Creative</p>
              </div>
              </button>
          </div>
        </div>

        {/* Resume Preview Paper */}
        <Card className="w-full max-w-4xl aspect-[8.5/11] shadow-2xl overflow-hidden">
          <div className={cn(
            "p-12 text-foreground bg-background h-full overflow-y-auto",
            resume.selectedTemplate === 0 && "bg-background",
            resume.selectedTemplate === 1 && "bg-slate-50 dark:bg-slate-950",
            resume.selectedTemplate === 2 && "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/20"
          )}>
            {/* Resume Header - Different styles per template */}
            <div className={cn(
              "pb-6 mb-6",
              resume.selectedTemplate === 0 && "text-center border-b border-border",
              resume.selectedTemplate === 1 && "text-left border-b-2 border-primary",
              resume.selectedTemplate === 2 && "text-center bg-gradient-to-r from-primary/10 to-purple-500/10 -m-12 mb-6 p-8"
            )}>
              <h1 className={cn(
                "font-bold tracking-tight",
                resume.selectedTemplate === 0 && "text-4xl",
                resume.selectedTemplate === 1 && "text-3xl",
                resume.selectedTemplate === 2 && "text-5xl text-primary"
              )}>
                {resume.contactInfo.fullName || 'Your Name'}
              </h1>
              <p className={cn(
                "text-muted-foreground mt-2",
                resume.selectedTemplate === 0 && "text-sm",
                resume.selectedTemplate === 1 && "text-xs font-medium",
                resume.selectedTemplate === 2 && "text-sm font-semibold"
              )}>
                {resume.contactInfo.phone && `${resume.contactInfo.phone} | `}
                {resume.contactInfo.email}
                {resume.contactInfo.linkedin && ` | ${resume.contactInfo.linkedin}`}
              </p>
            </div>

            {/* Resume Body */}
            <div className="space-y-6">
              {/* Summary Section */}
              {summary && (
              <div>
                  <h2 className={cn(
                    "text-sm font-bold uppercase tracking-widest mb-2",
                    resume.selectedTemplate === 0 && "text-primary",
                    resume.selectedTemplate === 1 && "text-foreground border-b border-primary pb-1",
                    resume.selectedTemplate === 2 && "text-primary border-b border-primary/30 pb-1"
                  )}>
                  Professional Summary
                </h2>
                <p className="text-sm leading-relaxed">
                    {summary}
                  </p>
                </div>
              )}

              {/* Education Section */}
              {education.university && (
              <div>
                  <h2 className={cn(
                    "text-sm font-bold uppercase tracking-widest mb-2",
                    resume.selectedTemplate === 0 && "text-primary",
                    resume.selectedTemplate === 1 && "text-foreground border-b border-primary pb-1",
                    resume.selectedTemplate === 2 && "text-primary border-b border-primary/30 pb-1"
                  )}>
                  Education
                </h2>
                <div>
                  <div className="flex justify-between items-baseline">
                      <h3 className="font-semibold">
                        {education.degree} in {education.major}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        {education.graduationYear ? `Expected ${education.graduationYear}` : ''}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {education.university}
                      {education.gpa && ` | GPA: ${education.gpa}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Skills Section */}
              {skills.length > 0 && (
                <div>
                  <h2 className={cn(
                    "text-sm font-bold uppercase tracking-widest mb-2",
                    resume.selectedTemplate === 0 && "text-primary",
                    resume.selectedTemplate === 1 && "text-foreground border-b border-primary pb-1",
                    resume.selectedTemplate === 2 && "text-primary border-b border-primary/30 pb-1"
                  )}>
                    Skills
                  </h2>
                  <div className={cn(
                    "flex flex-wrap gap-2",
                    resume.selectedTemplate === 1 && "gap-3"
                  )}>
                    {skills.map((skill, idx) => (
                      <span key={idx} className={cn(
                        "text-xs px-2 py-1 font-medium",
                        resume.selectedTemplate === 0 && "rounded bg-primary/10 text-primary",
                        resume.selectedTemplate === 1 && "text-foreground",
                        resume.selectedTemplate === 2 && "rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary"
                      )}>
                        {resume.selectedTemplate === 1 && '• '}
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects/Experience Section */}
              {user.projects && (
                <div>
                  <h2 className={cn(
                    "text-sm font-bold uppercase tracking-widest mb-2",
                    resume.selectedTemplate === 2 ? "text-primary border-b border-primary/30 pb-1" : "text-primary"
                  )}>
                    Projects & Experience
                  </h2>
                  <div>
                    <h3 className="font-semibold">Key Projects</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {user.projects}
                    </p>
                  </div>
                </div>
              )}

              {/* Certifications Section */}
              {certifications.length > 0 && (
                <div>
                  <h2 className={cn(
                    "text-sm font-bold uppercase tracking-widest mb-2",
                    resume.selectedTemplate === 2 ? "text-primary border-b border-primary/30 pb-1" : "text-primary"
                  )}>
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
              {!summary && !education.university && skills.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">Fill in the sections on the left to see your resume preview</p>
              </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}

