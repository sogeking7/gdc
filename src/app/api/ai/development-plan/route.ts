import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userProfile } = body

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile is required' },
        { status: 400 }
      )
    }

    const prompt = `For a student with this profile, create a personalized 6-week development plan:

Profile:
- Major: ${userProfile.major || 'Not specified'}
- Role Goal: ${userProfile.role || 'Career explorer'}
- Interests: ${userProfile.interests?.join(', ') || 'General'}
- Skills: ${userProfile.skills?.slice(0, 5).join(', ') || 'None listed'}
- Experience: ${userProfile.experience || 'Student'}
- Goals: ${userProfile.careerGoals || 'Career growth'}

Create 6 actionable tasks in JSON format:
{
  "tasks": [
    {
      "text": "Task description (max 60 chars)",
      "category": "learning|networking|practice|project|application",
      "priority": "high|medium|low",
      "estimatedWeeks": 1
    }
  ],
  "overallGoal": "Short description of what they'll achieve"
}

Requirements:
- 6 tasks total, ordered by priority
- Mix categories (2 learning, 2 practice, 1 networking, 1 project)
- Tasks specific to their major and goals
- Actionable and achievable in 1-2 weeks each

Return ONLY valid JSON.`

    const response = await generateText(prompt)
    
    // Handle empty response (MAX_TOKENS with 0 chars)
    if (!response || response.trim().length === 0) {
      return NextResponse.json({
        success: true,
        plan: getFallbackPlan(userProfile)
      })
    }
    
    // Parse JSON with balanced brace extraction
    let jsonText = response.trim()
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    let startIdx = jsonText.indexOf('{')
    if (startIdx === -1) {
      return NextResponse.json({
        success: true,
        plan: getFallbackPlan(userProfile)
      })
    }
    
    // Extract balanced JSON
    let braceCount = 0
    let endIdx = -1
    for (let i = startIdx; i < jsonText.length; i++) {
      if (jsonText[i] === '{') braceCount++
      if (jsonText[i] === '}') {
        braceCount--
        if (braceCount === 0) {
          endIdx = i + 1
          break
        }
      }
    }
    
    if (endIdx === -1) {
      throw new Error('Incomplete JSON in AI response')
    }
    
    let rawJson = jsonText.substring(startIdx, endIdx)
    let cleanJson = rawJson
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
    
    const data = JSON.parse(cleanJson)
    
    return NextResponse.json({
      success: true,
      plan: data
    })
  } catch (error) {
    console.error('Development Plan AI Error:', error)
    // Return fallback plan instead of error
    return NextResponse.json({
      success: true,
      plan: getFallbackPlan(null)
    })
  }
}

function getFallbackPlan(userProfile: any) {
  const major = userProfile?.major || 'your field'
  const role = userProfile?.role || 'your career goal'
  
  return {
    tasks: [
      {
        text: `Complete a certification course in ${major}`,
        category: 'learning',
        priority: 'high',
        estimatedWeeks: 2
      },
      {
        text: 'Build a portfolio project showcasing your skills',
        category: 'project',
        priority: 'high',
        estimatedWeeks: 3
      },
      {
        text: 'Network with 5 professionals in your target field',
        category: 'networking',
        priority: 'medium',
        estimatedWeeks: 1
      },
      {
        text: 'Practice technical/behavioral interview questions',
        category: 'practice',
        priority: 'medium',
        estimatedWeeks: 2
      },
      {
        text: 'Update your resume and LinkedIn profile',
        category: 'application',
        priority: 'medium',
        estimatedWeeks: 1
      },
      {
        text: 'Research companies aligned with your career goals',
        category: 'learning',
        priority: 'low',
        estimatedWeeks: 1
      }
    ],
    overallGoal: `Prepare for success in ${role}`
  }
}

