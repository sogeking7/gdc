export const PROMPTS = {
  // Resume Analysis
  resumeFeedback: (resumeContent: string) => `
Analyze this resume and provide detailed, actionable feedback:

Resume Content:
${resumeContent}

Provide feedback in the following JSON format:
{
  "overallScore": <number 0-100>,
  "strengths": [<array of 3-5 specific strengths>],
  "improvements": [<array of 3-5 specific improvements>],
  "atsScore": <number 0-100>,
  "keywordSuggestions": [<array of 5-8 relevant keywords>],
  "sections": {
    "summary": {"score": <0-100>, "feedback": "<specific feedback>"},
    "experience": {"score": <0-100>, "feedback": "<specific feedback>"},
    "skills": {"score": <0-100>, "feedback": "<specific feedback>"}
  }
}

Be specific, actionable, and constructive.`,

  // Interview Analysis
  interviewFeedback: (question: string, answer: string) => `
Analyze this interview answer using the STAR method (Situation, Task, Action, Result):

Question: ${question}
Answer: ${answer}

Provide feedback in JSON format:
{
  "clarityScore": <number 0-100>,
  "relevanceScore": <number 0-100>,
  "starMethodScore": <number 0-100>,
  "overallScore": <number 0-100>,
  "strengths": [<array of 3-4 specific strengths>],
  "improvements": [<array of 3-4 specific improvements>],
  "starAnalysis": {
    "situation": {"present": <boolean>, "feedback": "<feedback>"},
    "task": {"present": <boolean>, "feedback": "<feedback>"},
    "action": {"present": <boolean>, "feedback": "<feedback>"},
    "result": {"present": <boolean>, "feedback": "<feedback>"}
  },
  "suggestedAnswer": "<brief example of a strong answer>"
}

Be encouraging but honest. Focus on actionable improvements.`,

  // Career Matching
  careerMatch: (profile: any) => `For profile: Education: ${profile.education || 'none'}, Skills: ${profile.skills || 'none'}, Interests: ${profile.interests?.join(', ') || 'none'}, suggest 3 career matches in JSON:
{
  "topCareers": [
    {
      "title": "Software Engineer",
      "matchScore": 90,
      "reasoning": "Strong fit based on technical skills",
      "skillGaps": ["Cloud", "DevOps"],
      "nextSteps": ["Learn AWS", "Build portfolio"],
      "salaryRange": "$80-120k",
      "growthPotential": "high"
    }
  ],
  "learningPath": ["Course 1", "Course 2", "Course 3"],
  "timeline": "6-12 months"
}

Requirements:
- Exactly 3 careers
- Keep reasoning under 50 chars
- 2-3 skill gaps max
- 2-3 next steps max
- 3-4 learning path items

Return ONLY valid JSON.`,

  // Course Recommendations
  courseRecommendations: (userProfile: any, careerGoal: string) => `
Recommend personalized courses for this user:

User Profile:
- Current Skills: ${userProfile.skills || 'Beginner'}
- Career Goal: ${careerGoal}
- Experience Level: ${userProfile.experience || 'Entry Level'}
- Interests: ${userProfile.interests?.join(', ') || 'Various'}

Provide recommendations in JSON format:
{
  "courses": [
    {
      "title": "<course name>",
      "provider": "<platform name>",
      "duration": "<time needed>",
      "difficulty": "<beginner/intermediate/advanced>",
      "relevance": <number 0-100>,
      "skills": [<array of skills learned>],
      "why": "<why this course is recommended>"
    }
  ]
}

Recommend 5-8 courses from popular platforms (Coursera, Udemy, edX, etc.).`,

  // Smart Suggestions
  smartSuggestions: (userState: any) => `
Based on this user's current state, provide smart next actions:

User State:
- Profile Completion: ${userState.profileCompletion}%
- Development Progress: ${userState.developmentProgress}%
- Completed Tasks: ${userState.completedTasks}
- Career Goal: ${userState.role}
- Recent Activity: ${userState.recentActivity || 'None'}

Provide suggestions in JSON format:
{
  "urgentActions": [<array of 2-3 high-priority actions>],
  "recommendedActions": [<array of 3-4 helpful actions>],
  "motivationalMessage": "<encouraging message>",
  "weeklyGoal": "<achievable goal for this week>",
  "insights": "<personalized insight based on progress>"
}

Be encouraging and specific.`,

  // Skill Gap Analysis
  skillGapAnalysis: (currentSkills: string[], targetRole: string) => `
Analyze skill gaps for career transition:

Current Skills: ${currentSkills.join(', ')}
Target Role: ${targetRole}

Provide analysis in JSON format:
{
  "existingStrengths": [<array of relevant current skills>],
  "criticalGaps": [<array of must-have skills missing>],
  "niceToHaveGaps": [<array of beneficial skills missing>],
  "learningPriority": [
    {
      "skill": "<skill name>",
      "priority": "<high/medium/low>",
      "timeToLearn": "<estimated time>",
      "resources": [<array of 2-3 learning resources>]
    }
  ],
  "readinessScore": <number 0-100>
}

Be realistic about timelines and priorities.`,
}

// Export individual prompt functions
export const getCareerRecommendationsPrompt = (
  careerTitle: string,
  userSkills?: string[],
  userInterests?: string[]
) => `Career: ${careerTitle}${userSkills && userSkills.length > 0 ? `, Skills: ${userSkills.slice(0, 5).join(', ')}` : ''}

Provide brief recommendations with clear headers:

LEARNING PATHS
- Item 1 (course/cert, max 60 chars)
- Item 2
- Item 3

SKILL PRIORITIES
- Skill 1: Brief reason (max 40 chars)
- Skill 2: Brief reason
- Skill 3: Brief reason

NEXT STEPS
- Action 1 (specific, max 50 chars)
- Action 2
- Action 3

SIMILAR ROLES
- Role 1
- Role 2
- Role 3

INDUSTRY INSIGHTS
1-2 sentences about market demand and outlook.

Keep all items concise.`

