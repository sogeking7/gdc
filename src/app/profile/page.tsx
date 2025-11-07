'use client'

import { useAppSelector } from '@/lib/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target, CheckCircle, TrendingUp, Calendar, MapPin, GraduationCap, Briefcase } from 'lucide-react'
import Image from 'next/image'

export default function ProfilePage() {
  const user = useAppSelector((state: any) => state.user)
  
  const firstName = user.name?.split(' ')[0] || 'there'
  const completedTasks = user.developmentTasks?.filter((t: any) => t.completed).length || 0
  const totalTasks = user.developmentTasks?.length || 0
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  
  // Calculate milestone progress
  const milestones = user.careerMilestones || []
  const completedMilestones = milestones.filter((m: any) => m.completed).length
  const milestoneProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0

  return (
    <main className="flex flex-1 flex-col p-6">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">Track your career path progress</p>
        </div>

        {/* Profile Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24 rounded-full overflow-hidden">
                <Image
                  src={user.avatar}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                {user.selectedCareer && (
                  <div className="mt-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{user.selectedCareer.title}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Profile Completion</p>
                <p className="text-2xl font-bold text-primary">{user.profileCompletion}%</p>
                <Progress value={user.profileCompletion} className="w-32 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Career Path Progress */}
        {user.selectedCareer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Career Path Progress
              </CardTitle>
              <CardDescription>
                Your journey to becoming a {user.selectedCareer.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-bold text-primary">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {completedTasks} of {totalTasks} tasks completed
                </p>
              </div>

              {/* Milestones */}
              {milestones.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Milestones</h3>
                    <span className="text-sm text-muted-foreground">{completedMilestones}/{milestones.length} completed</span>
                  </div>
                  <div className="space-y-3">
                    {milestones.map((milestone: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center ${
                          milestone.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted border-2 border-primary'
                        }`}>
                          {milestone.completed ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{milestone.title}</h4>
                            <span className="text-xs text-muted-foreground">{milestone.timeframe}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Roadmap Timeline */}
              {user.careerRoadmap && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Roadmap Timeline
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(user.careerRoadmap).map(([period, tasks]: [string, any]) => (
                      <div key={period} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3 capitalize">{period.replace(/([A-Z])/g, ' $1').trim()}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {tasks.daily && tasks.daily.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Daily Tasks</p>
                              <ul className="space-y-1">
                                {tasks.daily.slice(0, 2).map((task: any, idx: number) => (
                                  <li key={idx} className="text-xs flex items-start gap-1">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{task.task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {tasks.weekly && tasks.weekly.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Weekly Tasks</p>
                              <ul className="space-y-1">
                                {tasks.weekly.slice(0, 2).map((task: any, idx: number) => (
                                  <li key={idx} className="text-xs flex items-start gap-1">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{task.task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {tasks.monthly && tasks.monthly.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2">Monthly Goals</p>
                              <ul className="space-y-1">
                                {tasks.monthly.map((task: any, idx: number) => (
                                  <li key={idx} className="text-xs flex items-start gap-1">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{task.task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Academic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.university && (
                <div>
                  <p className="text-xs text-muted-foreground">University</p>
                  <p className="font-medium">{user.university}</p>
                </div>
              )}
              {user.major && (
                <div>
                  <p className="text-xs text-muted-foreground">Major</p>
                  <p className="font-medium">{user.major}</p>
                </div>
              )}
              {user.graduationYear && (
                <div>
                  <p className="text-xs text-muted-foreground">Graduation Year</p>
                  <p className="font-medium">{user.graduationYear}</p>
                </div>
              )}
              {user.gpa && (
                <div>
                  <p className="text-xs text-muted-foreground">GPA</p>
                  <p className="font-medium">{user.gpa}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No skills added yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

