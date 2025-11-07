'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAppSelector } from '@/lib/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { ChevronRight, CheckCircle, Plus, Sparkles, BookOpen, TrendingUp, Users, Lightbulb, Briefcase } from 'lucide-react'

const skills = [
  { name: 'Product Strategy', owned: true },
  { name: 'User Research', owned: false },
  { name: 'Agile Methodologies', owned: true },
  { name: 'Communication', owned: true },
  { name: 'Data Analysis', owned: false },
  { name: 'Roadmapping', owned: false },
  { name: 'Leadership', owned: true },
  { name: 'Technical Literacy', owned: false },
]

const careerProgression = [
  { title: 'Associate PM', duration: '0-2 years' },
  { title: 'Product Manager', duration: '2-5 years' },
  { title: 'Senior PM', duration: '5-8 years' },
  { title: 'Director of Product', duration: '8+ years' },
]

export default function ExplorePage() {
  const user = useAppSelector((state: any) => state.user)
  const [aiRecommendations, setAiRecommendations] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  
  // Get personalized info
  const firstName = user.name?.split(' ')[0] || 'there'
  const careerTitle = user.role ? user.role.replace('Aspiring ', '') : 'Product Manager'

  const getAIRecommendations = async () => {
    setLoadingAI(true)
    try {
      const ownedSkills = skills.filter(s => s.owned).map(s => s.name)
      
      // Use personalized data from user profile
      const userInterests = user.interests && user.interests.length > 0 
        ? user.interests 
        : ['Technology', 'Strategy', 'Leadership']
      
      const response = await fetch('/api/ai/career-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerTitle,
          userSkills: ownedSkills,
          userInterests
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error('AI Recommendations Error:', error)
    } finally {
      setLoadingAI(false)
    }
  }

  useEffect(() => {
    getAIRecommendations()
  }, [])

  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in">
      <div className="flex flex-col gap-8">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link href="/" className="text-muted-foreground hover:text-primary">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground font-medium">Explore Careers</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-black leading-tight tracking-tight">
              Career Paths for {firstName} 🎯
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              {user.major 
                ? `Based on your ${user.major} background and interest in ${user.interests?.[0] || 'your chosen field'}`
                : 'Explore career paths tailored to your profile'}
            </p>
            {user.role && (
              <div className="flex items-center gap-2 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  Current Goal: {user.role}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={getAIRecommendations}
              disabled={loadingAI}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              {loadingAI ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 mr-2" />
                  AI Recommendations
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* User Profile Context */}
        {(user.skills || user.interests) && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
            <div className="flex flex-wrap gap-6">
              {user.skills && user.skills.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    Your Current Skills:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.slice(0, 8).map((skill: string, idx: number) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {skill}
                      </span>
                    ))}
                    {user.skills.length > 8 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                        +{user.skills.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {user.experience && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Experience:</p>
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 font-medium capitalize">
                    <Briefcase className="h-3 w-3" />
                    {user.experience}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {aiRecommendations && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Learning Paths */}
            <Card className="animate-fade-in bg-gradient-to-br from-primary/5 to-blue-500/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Recommended Learning Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiRecommendations.learningPaths?.slice(0, 3).map((path: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{path}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Skill Priorities */}
            <Card className="animate-fade-in bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Priority Skills to Develop
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {aiRecommendations.skillPriorities?.slice(0, 3).map((item: any, idx: number) => (
                    <li key={idx} className="text-sm">
                      <div className="font-semibold text-foreground">{item.skill}</div>
                      <div className="text-muted-foreground text-xs">{item.reason}</div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="animate-fade-in bg-gradient-to-br from-primary/5 to-green-500/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Next Steps This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiRecommendations.nextSteps?.slice(0, 3).map((step: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Similar Roles */}
            <Card className="animate-fade-in bg-gradient-to-br from-primary/5 to-orange-500/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Similar Career Paths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiRecommendations.similarRoles?.slice(0, 3).map((role: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{role}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Industry Insights */}
        {aiRecommendations?.industryInsights && (
          <Card className="animate-fade-in bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">Industry Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    {aiRecommendations.industryInsights}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accordion Sections */}
        <Accordion type="multiple" defaultValue={["responsibilities", "skills"]} className="space-y-4">
          {/* Key Responsibilities */}
          <AccordionItem value="responsibilities" className="border rounded-xl bg-card px-5">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <p className="text-base font-semibold">Key Responsibilities</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                A Product Manager's daily tasks involve a blend of strategic planning, market research, 
                and team collaboration. Key responsibilities include:
              </p>
              <ul className="space-y-2 pl-5 list-disc">
                <li>Defining the product vision, strategy, and roadmap.</li>
                <li>Gathering and prioritizing product and customer requirements.</li>
                <li>
                  Working closely with engineering, sales, marketing, and support to ensure revenue 
                  and customer satisfaction goals are met.
                </li>
                <li>Defining the 'why', 'what,' and 'when' of the product that the engineering team builds.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Required Skills */}
          <AccordionItem value="skills" className="border rounded-xl bg-card px-5">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <p className="text-base font-semibold">Required Skills</p>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-3 transition-transform hover:scale-105 ${
                      skill.owned
                        ? 'bg-primary/20 dark:bg-primary/30'
                        : 'border border-border hover:bg-accent'
                    }`}
                  >
                    {skill.owned && <CheckCircle className="h-3 w-3 text-green-500" />}
                    <p className="text-sm font-medium">{skill.name}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Average Salary Range */}
          <AccordionItem value="salary" className="border rounded-xl bg-card px-5">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">$</span>
                </div>
                <p className="text-base font-semibold">Average Salary Range</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm text-muted-foreground pt-2">
              <p>
                Salaries for Product Managers vary based on experience, location, and company size. 
                The typical range in the US is shown below.
              </p>
              <div className="w-full">
                <div className="relative h-2 w-full rounded-full bg-secondary">
                  <div 
                    className="absolute h-2 rounded-full bg-gradient-to-r from-primary/40 to-primary" 
                    style={{ left: '15%', width: '60%' }}
                  />
                </div>
                <div className="relative mt-3 grid grid-cols-3 text-xs">
                  <div className="text-left">
                    <div className="text-muted-foreground">Entry-Level</div>
                    <div className="font-bold text-foreground">$90k</div>
                  </div>
                  <div className="text-center">
                    <div className="text-muted-foreground">Average</div>
                    <div className="font-bold text-foreground">$125k</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground">Senior</div>
                    <div className="font-bold text-foreground">$170k+</div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Career Progression */}
          <AccordionItem value="progression" className="border rounded-xl bg-card px-5">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary">→</span>
                </div>
                <p className="text-base font-semibold">Career Progression</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="relative flex flex-col sm:flex-row justify-between gap-8 pb-2">
                {/* Connection Line */}
                <div className="absolute left-[1.125rem] top-4 bottom-4 w-0.5 bg-border sm:top-4 sm:left-4 sm:right-4 sm:w-auto sm:h-0.5" />
                
                {careerProgression.map((step, idx) => (
                  <div 
                    key={idx} 
                    className={`relative flex items-center gap-4 sm:flex-col sm:gap-2 ${
                      idx === 0 ? 'sm:items-start' : 
                      idx === careerProgression.length - 1 ? 'sm:items-end' : 
                      'sm:items-center'
                    }`}
                  >
                    <div className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary ring-4 ring-background">
                      <span className="text-primary-foreground font-bold text-sm">{idx + 1}</span>
                    </div>
                    <div className={idx === careerProgression.length - 1 ? 'sm:text-right' : idx === 0 ? '' : 'sm:text-center'}>
                      <p className="font-semibold text-foreground text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </main>
  )
}

