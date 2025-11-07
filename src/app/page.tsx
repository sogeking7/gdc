'use client'

import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/lib/hooks'
import { toggleTask, updateProfile } from '@/lib/features/userSlice'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, Mic, Compass, GraduationCap, ArrowRight, Sparkles, TrendingUp, Target, Briefcase, X, MapPin, DollarSign, Users, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Dashboard() {
  const user = useAppSelector((state: any) => state.user)
  const dispatch = useAppDispatch()
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [careerTracks, setCareerTracks] = useState<any[]>([])
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [selectedCareer, setSelectedCareer] = useState<any>(null)
  const [showCareerModal, setShowCareerModal] = useState(false)
  const [careerDetails, setCareerDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Get first name for personalized greeting
  const firstName = user.name?.split(' ')[0] || 'there'
  
  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleToggleTask = (index: number) => {
    dispatch(toggleTask(index))
  }

  const getPersonalizedDevelopmentPlan = async () => {
    try {
      const userProfile = {
        major: user.major,
        role: user.role,
        interests: user.interests,
        skills: user.skills || user.skillsText?.split(',').map((s: string) => s.trim()),
        experience: user.experience,
        careerGoals: user.careerGoals
      }

      const response = await fetch('/api/ai/development-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userProfile })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.plan && data.plan.tasks) {
          // Store personalized tasks in localStorage
          localStorage.setItem('developmentPlan', JSON.stringify(data.plan))
          
          // Update Redux state with new tasks
          const tasks = data.plan.tasks.map((task: any) => ({
            text: task.text,
            completed: false
          }))
          
          dispatch(updateProfile({
            developmentTasks: tasks,
            developmentProgress: 0
          } as any))
        }
      }
    } catch (error) {
      console.error('Development Plan Error:', error)
    }
  }

  const getAIRecommendations = async () => {
    setLoadingAI(true)
    try {
      // Get personalized development plan
      await getPersonalizedDevelopmentPlan()
      
      const completedTasks = user.developmentTasks.filter((t: any) => t.completed).length
      const userState = {
        profileCompletion: user.profileCompletion,
        developmentProgress: user.developmentProgress,
        completedTasks,
        role: user.role,
        recentActivity: 'Active',
        // Include personalized data from onboarding
        education: user.education,
        interests: user.interests,
        experience: user.experience,
        careerGoals: user.careerGoals,
        skills: user.skillsText
      }

      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userState, type: 'smart' })
      })

      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('AI Suggestions Error:', error)
    } finally {
      setLoadingAI(false)
    }
  }

  const fetchCareerTracks = async () => {
    if (!user.major || !user.skills) return
    
    setLoadingTracks(true)
    try {
      const response = await fetch('/api/ai/career-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          major: user.major,
          skills: user.skills || user.skillsText?.split(',').map((s: string) => s.trim())
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCareerTracks(data.careerTracks || [])
      }
    } catch (error) {
      console.error('Career Tracks Error:', error)
    } finally {
      setLoadingTracks(false)
    }
  }

  const fetchCareerDetails = async (career: any) => {
    setLoadingDetails(true)
    setSelectedCareer(career)
    setShowCareerModal(true)
    
    try {
      const response = await fetch('/api/ai/career-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerTitle: career.title,
          major: user.major,
          skills: user.skills || user.skillsText?.split(',').map((s: string) => s.trim()),
          location: 'Kazakhstan'
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setCareerDetails(data.careerDetails)
      }
    } catch (error) {
      console.error('Career Details Error:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const selectCareerTrack = async (career: any) => {
    // Generate roadmap for selected career
    try {
      const response = await fetch('/api/ai/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerTitle: career.title,
          major: user.major,
          skills: user.skills || user.skillsText?.split(',').map((s: string) => s.trim()),
          graduationYear: user.graduationYear
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // Convert roadmap to development tasks
        const allTasks: any[] = []
        const roadmap = data.roadmap
        
        // Add current month tasks
        if (roadmap.currentMonth) {
          roadmap.currentMonth.daily?.forEach((task: any) => allTasks.push({ ...task, completed: false }))
          roadmap.currentMonth.weekly?.forEach((task: any) => allTasks.push({ ...task, completed: false }))
          roadmap.currentMonth.monthly?.forEach((task: any) => allTasks.push({ ...task, completed: false }))
        }
        
        // Update user profile with selected career
        dispatch(updateProfile({
          role: career.title,
          selectedCareer: career,
          careerRoadmap: data.roadmap,
          careerMilestones: data.milestones,
          developmentTasks: allTasks.slice(0, 12), // Limit to 12 tasks
          developmentProgress: 0,
          profileCompletion: 95
        } as any))
        
        // Save to localStorage
        localStorage.setItem('selectedCareer', JSON.stringify(career))
        localStorage.setItem('careerRoadmap', JSON.stringify(data.roadmap))
        
        setShowCareerModal(false)
      }
    } catch (error) {
      console.error('Roadmap generation error:', error)
    }
  }

  useEffect(() => {
    // Load development plan from localStorage if available
    const savedPlan = localStorage.getItem('developmentPlan')
    if (savedPlan) {
      try {
        const plan = JSON.parse(savedPlan)
        if (plan.tasks && plan.tasks.length > 0) {
          // Update Redux with tasks from saved plan
          dispatch(updateProfile({
            developmentTasks: plan.tasks.map((task: any) => ({
              text: task.text,
              completed: false
            }))
          } as any))
        }
      } catch (e) {
        console.error('Error loading saved plan:', e)
      }
    }
    
    // Fetch career tracks if user hasn't chosen one
    if (user.onboardingCompleted && (!user.selectedCareer || user.role === 'Career Explorer')) {
      fetchCareerTracks()
    }
    
    // Auto-fetch AI suggestions on load if user has completed onboarding
    if (user.onboardingCompleted && user.selectedCareer) {
      getAIRecommendations()
    }
  }, [user.onboardingCompleted, user.selectedCareer])

  return (
    <div className="flex h-full grow flex-col">
      <div className="px-4 sm:px-8 md:px-10 flex flex-1 justify-center py-5 md:py-10">
        <div className="flex flex-col max-w-7xl flex-1 gap-8">
          {/* Page Heading */}
          <div className="flex flex-wrap justify-between gap-3 p-4 animate-fade-in">
            <div className="flex min-w-72 flex-col gap-2">
              <p className="text-3xl lg:text-4xl font-black leading-tight tracking-tight">
                {getGreeting()}, {firstName}! 👋
              </p>
              <p className="text-muted-foreground text-base font-normal leading-normal">
                {user.major ? `Your personalized ${user.major} career dashboard` : "Here's your personalized dashboard to kickstart your career"}
              </p>
              
              {/* User Progress Summary */}
              {user.onboardingCompleted && (
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <Target className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">{user.role}</span>
                  </div>
                  {user.graduationYear && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                      <GraduationCap className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Class of {user.graduationYear}</span>
                    </div>
                  )}
                  {user.experience && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                      <Briefcase className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-400 capitalize">{user.experience}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Profile Summary Card */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden">
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col">
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription>{user.role}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium">Profile Completion</p>
                      <p className="text-sm">{user.profileCompletion}%</p>
                    </div>
                    <Progress value={user.profileCompletion} className="h-2" />
                  </div>
                  
                  {/* Personalized Info from Onboarding */}
                  {user.interests && user.interests.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {user.interests.slice(0, 3).map((interest: string, idx: number) => (
                          <span key={idx} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {user.careerGoals && (
                    <div className="space-y-1 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground">Career Goal</p>
                      <p className="text-sm line-clamp-2">{user.careerGoals}</p>
                    </div>
                  )}
                  
                  <Button className="w-full">Edit Profile</Button>
                </CardContent>
              </Card>

              {/* Suggested Courses */}
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Courses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.suggestedCourses.map((course: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <div className="flex flex-col">
                        <p className="font-semibold text-sm">{course.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.provider} • {course.duration}
                        </p>
                      </div>
                      <Link
                        href="#"
                        className="flex items-center gap-1 text-primary text-sm font-medium hover:underline"
                      >
                        View
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Career Tracks Selection - Show if no career selected */}
              {(!user.selectedCareer || user.role === 'Career Explorer') && careerTracks.length > 0 && (
                <Card className="animate-fade-in bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Choose Your Career Track
                    </CardTitle>
                    <CardDescription>
                      Based on your {user.major} major and skills, here are career paths we recommend
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {careerTracks.map((track) => (
                        <Card 
                          key={track.id}
                          className="cursor-pointer hover:scale-105 transition-all border-2 hover:border-primary"
                          onClick={() => fetchCareerDetails(track)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-lg">{track.title}</h3>
                              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {track.matchScore}% match
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{track.description}</p>
                            <p className="text-xs text-primary">{track.fitReason}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {loadingTracks && (
                <Card className="animate-fade-in">
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Finding the perfect career tracks for you...</p>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
                <Link href="/resume">
                  <Card className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all bg-gradient-to-br from-blue-500 to-primary text-primary-foreground border-0 h-full">
                    <CardContent className="p-6 space-y-2">
                      <FileText className="h-10 w-10" />
                      <p className="font-bold">Resume Builder</p>
                      <p className="text-sm opacity-90">
                        {user.major ? `Build your ${user.major} resume` : 'Create your resume'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/interview">
                  <Card className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all bg-gradient-to-br from-purple-500 to-pink-500 text-primary-foreground border-0 h-full">
                    <CardContent className="p-6 space-y-2">
                      <Mic className="h-10 w-10" />
                      <p className="font-bold">Mock Interview</p>
                      <p className="text-sm opacity-90">
                        {user.role ? `Practice for ${user.role.replace('Aspiring ', '')} roles` : 'Practice interviews'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/explore">
                  <Card className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all bg-gradient-to-br from-green-500 to-teal-500 text-primary-foreground border-0 h-full">
                    <CardContent className="p-6 space-y-2">
                      <Compass className="h-10 w-10" />
                      <p className="font-bold">Explore Careers</p>
                      <p className="text-sm opacity-90">
                        {user.interests && user.interests.length > 0 
                          ? `Discover ${user.interests[0]} paths` 
                          : 'Find your path'}
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="cursor-pointer hover:scale-105 hover:shadow-xl transition-all bg-gradient-to-br from-orange-500 to-red-500 text-primary-foreground border-0 h-full">
                  <CardContent className="p-6 space-y-2">
                    <GraduationCap className="h-10 w-10" />
                    <p className="font-bold">Learning Paths</p>
                    <p className="text-sm opacity-90">
                      {user.skills && user.skills.length > 0 
                        ? 'Enhance your skills' 
                        : 'Browse courses'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights */}
              {aiSuggestions && (
                <Card className="animate-fade-in bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Insights for You
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiSuggestions.motivationalMessage && (
                      <p className="text-sm font-medium text-primary">
                        {aiSuggestions.motivationalMessage}
                      </p>
                    )}
                    
                    {aiSuggestions.urgentActions && aiSuggestions.urgentActions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <Target className="h-4 w-4 text-red-500" />
                          Priority Actions:
                        </p>
                        <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
                          {aiSuggestions.urgentActions.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {aiSuggestions.recommendedActions && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          Recommended Next Steps:
                        </p>
                        <ul className="text-sm space-y-1 list-disc pl-5 text-muted-foreground">
                          {aiSuggestions.recommendedActions.map((action: string, i: number) => (
                            <li key={i}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiSuggestions.weeklyGoal && (
                      <div className="p-3 bg-background rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-1">This Week's Goal:</p>
                        <p className="text-sm font-semibold">{aiSuggestions.weeklyGoal}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* My Development Plan */}
              <Card className="animate-fade-in border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      My Development Plan
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {user.careerGoals ? `Working towards: ${user.careerGoals.substring(0, 50)}...` : 'Your personalized roadmap to success'}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={getAIRecommendations}
                    disabled={loadingAI}
                    className="hover:bg-primary/10"
                  >
                    {loadingAI ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    ) : (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">Overall Progress</p>
                      <p className="text-sm font-bold text-primary">{user.developmentProgress}%</p>
                    </div>
                    <Progress value={user.developmentProgress} className="h-2.5" />
                  </div>
                  <div className="space-y-2 mt-4">
                    {user.developmentTasks.map((task: any, idx: number) => (
                      <label
                        key={idx}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors border border-transparent hover:border-primary/20"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(idx)}
                          className="mt-0.5"
                        />
                        <span
                          className={`text-sm flex-1 ${
                            task.completed ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {task.text}
                        </span>
                      </label>
                    ))}
                  </div>
                  
                  {user.onboardingCompleted && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        💡 Click the sparkle icon to regenerate AI-powered tasks based on your profile
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Career Detail Modal */}
      {showCareerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <CardHeader className="sticky top-0 bg-background border-b z-10">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedCareer?.title}</CardTitle>
                  <CardDescription className="mt-1">{selectedCareer?.description}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCareerModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : careerDetails ? (
                <>
                  {/* Key Responsibilities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Key Responsibilities
                    </h3>
                    <ul className="space-y-2">
                      {careerDetails.keyResponsibilities?.map((resp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Required Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {careerDetails.requiredSkills?.map((skill: any, idx: number) => {
                        const userHasSkill = user.skills?.some((s: string) => 
                          s.toLowerCase().includes(skill.name.toLowerCase()) || 
                          skill.name.toLowerCase().includes(s.toLowerCase())
                        )
                        return (
                          <span
                            key={idx}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                              userHasSkill
                                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                                : 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {userHasSkill && <CheckCircle className="h-3 w-3" />}
                            {skill.name}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  {/* Average Salary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Average Salary (Kazakhstan)
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Entry Level</p>
                        <p className="font-semibold">{careerDetails.averageSalary?.entry || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Mid Level</p>
                        <p className="font-semibold">{careerDetails.averageSalary?.mid || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Senior</p>
                        <p className="font-semibold">{careerDetails.averageSalary?.senior || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Career Opportunities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Career Opportunities
                    </h3>
                    <ul className="space-y-2">
                      {careerDetails.careerOpportunities?.map((opp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Internships in Kazakhstan */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Internships in Kazakhstan
                    </h3>
                    <div className="space-y-3">
                      {careerDetails.internships?.map((intern: any, idx: number) => (
                        <Card key={idx} className="border hover:border-primary/50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-semibold">{intern.position}</h4>
                                <p className="text-sm text-muted-foreground">{intern.company}</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {intern.location}
                                </p>
                                {intern.description && (
                                  <p className="text-xs text-muted-foreground mt-2">{intern.description}</p>
                                )}
                              </div>
                              {intern.link && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  asChild
                                  className="shrink-0"
                                >
                                  <a 
                                    href={intern.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Apply
                                  </a>
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Growth Path */}
                  {careerDetails.growthPath && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Career Growth Path</h3>
                      <p className="text-sm text-muted-foreground">{careerDetails.growthPath}</p>
                    </div>
                  )}

                  {/* Select Career Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => selectCareerTrack(selectedCareer)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Choose This Career Track
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">Failed to load career details</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

