import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { careerTitle, major, skills, graduationYear } = body

    if (!careerTitle) {
      return NextResponse.json(
        { error: 'Career title is required' },
        { status: 400 }
      )
    }

    const currentYear = new Date().getFullYear()
    const yearsUntilGraduation = graduationYear ? parseInt(graduationYear) - currentYear : 2

    const prompt = `Create a personalized career roadmap for a student pursuing "${careerTitle}"

Student Profile:
- Major: ${major || 'Not specified'}
- Skills: ${skills?.slice(0, 10).join(', ') || 'Various'}
- Years until graduation: ${yearsUntilGraduation}

Create a comprehensive roadmap with daily, weekly, and monthly tasks organized by time periods.

Return JSON format:
{
  "roadmap": {
    "currentMonth": {
      "daily": [
        {"task": "Task description (max 60 chars)", "category": "learning|practice|networking|project"},
        {"task": "Task 2", "category": "learning"}
      ],
      "weekly": [
        {"task": "Weekly task (max 60 chars)", "category": "project|networking"},
        {"task": "Weekly task 2", "category": "project"}
      ],
      "monthly": [
        {"task": "Monthly milestone (max 60 chars)", "category": "project|application"}
      ]
    },
    "nextMonth": {
      "daily": [...],
      "weekly": [...],
      "monthly": [...]
    },
    "threeMonths": {
      "daily": [...],
      "weekly": [...],
      "monthly": [...]
    },
    "sixMonths": {
      "daily": [...],
      "weekly": [...],
      "monthly": [...]
    }
  },
  "overallGoal": "Main goal for this career path (max 100 chars)",
  "milestones": [
    {"title": "Milestone 1", "timeframe": "1 month", "description": "Brief description"},
    {"title": "Milestone 2", "timeframe": "3 months", "description": "Brief description"},
    {"title": "Milestone 3", "timeframe": "6 months", "description": "Brief description"}
  ]
}

Requirements:
- Daily tasks: 2-3 per period (small, actionable)
- Weekly tasks: 1-2 per period (medium effort)
- Monthly tasks: 1 per period (significant milestone)
- Tasks should be specific and achievable
- Mix categories appropriately
- Consider graduation timeline
- Return ONLY valid JSON`

    const response = await generateText(prompt)
    
    // Parse JSON with balanced brace extraction
    let jsonText = response.trim()
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    let startIdx = jsonText.indexOf('{')
    if (startIdx === -1) {
      return NextResponse.json({
        success: true,
        roadmap: getFallbackRoadmap(careerTitle)
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
      return NextResponse.json({
        success: true,
        roadmap: getFallbackRoadmap(careerTitle)
      })
    }
    
    let rawJson = jsonText.substring(startIdx, endIdx)
    let cleanJson = rawJson
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
    
    let data
    try {
      data = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Parse error:', parseError)
      return NextResponse.json({
        success: true,
        roadmap: getFallbackRoadmap(careerTitle)
      })
    }

    return NextResponse.json({
      success: true,
      roadmap: data.roadmap || getFallbackRoadmap(careerTitle).roadmap,
      overallGoal: data.overallGoal || `Become a successful ${careerTitle}`,
      milestones: data.milestones || getFallbackRoadmap(careerTitle).milestones
    })
  } catch (error) {
    console.error('Roadmap API Error:', error)
    return NextResponse.json({
      success: true,
      roadmap: getFallbackRoadmap(null)
    })
  }
}

function getFallbackRoadmap(careerTitle: string | null) {
  return {
    roadmap: {
      currentMonth: {
        daily: [
          { task: 'Practice coding for 1 hour', category: 'practice' },
          { task: 'Read industry articles', category: 'learning' }
        ],
        weekly: [
          { task: 'Build a small project', category: 'project' },
          { task: 'Network with 2 professionals', category: 'networking' }
        ],
        monthly: [
          { task: 'Complete portfolio project', category: 'project' }
        ]
      },
      nextMonth: {
        daily: [
          { task: 'Continue daily practice', category: 'practice' },
          { task: 'Study new technologies', category: 'learning' }
        ],
        weekly: [
          { task: 'Apply to 3 internships', category: 'application' },
          { task: 'Attend networking event', category: 'networking' }
        ],
        monthly: [
          { task: 'Get internship offer', category: 'application' }
        ]
      },
      threeMonths: {
        daily: [
          { task: 'Maintain coding practice', category: 'practice' }
        ],
        weekly: [
          { task: 'Build advanced projects', category: 'project' }
        ],
        monthly: [
          { task: 'Complete certification', category: 'learning' }
        ]
      },
      sixMonths: {
        daily: [
          { task: 'Stay updated with industry', category: 'learning' }
        ],
        weekly: [
          { task: 'Prepare for interviews', category: 'practice' }
        ],
        monthly: [
          { task: 'Land first job/internship', category: 'application' }
        ]
      }
    },
    overallGoal: `Prepare for a successful career as ${careerTitle || 'a professional'}`,
    milestones: [
      { title: 'Build Foundation', timeframe: '1 month', description: 'Learn core skills' },
      { title: 'Gain Experience', timeframe: '3 months', description: 'Complete projects and internships' },
      { title: 'Career Ready', timeframe: '6 months', description: 'Ready for professional opportunities' }
    ]
  }
}

