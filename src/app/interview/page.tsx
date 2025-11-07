'use client'

import { useAppSelector } from '@/lib/hooks'
import LiveInterview from '@/components/interview/LiveInterview'

export default function InterviewPage() {
  const user = useAppSelector((state: any) => state.user)

  const defaultTopic = user?.skills?.[0] || user?.role?.replace('Aspiring ', '') || ''

  return (
    <div className="flex-1 p-6 space-y-6">
                  <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mock Interview Studio</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Practice live, AI-powered interviews with real-time voice interaction, automatic transcripts, and detailed feedback tailored to your goals.
        </p>
      </div>
      <LiveInterview
        defaultTopic={defaultTopic}
        defaultRole={user.role}
        userName={user.name}
        userMajor={user.major}
        userExperience={user.experience}
      />
      </div>
  )
}

