import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userState, type, customPrompt } = body

    if (!userState && !customPrompt) {
      return NextResponse.json(
        { error: 'User state or custom prompt is required' },
        { status: 400 }
      )
    }

    let prompt: string
    
    if (customPrompt) {
      // Allow custom prompts (e.g., for resume summary)
      prompt = customPrompt
    } else if (!type) {
      return NextResponse.json(
        { error: 'Type is required when using userState' },
        { status: 400 }
      )
    } else {
      switch (type) {
        case 'smart':
          prompt = PROMPTS.smartSuggestions(userState)
          break
        case 'courses':
          prompt = PROMPTS.courseRecommendations(userState, userState.careerGoal)
          break
        case 'skillGap':
          prompt = PROMPTS.skillGapAnalysis(userState.currentSkills, userState.targetRole)
          break
        default:
          return NextResponse.json(
            { error: 'Invalid suggestion type' },
            { status: 400 }
          )
      }
    }

    const aiResponse = await generateText(prompt)
    
    // For custom prompts that return plain text (like resume summary)
    if (customPrompt && !aiResponse.includes('{')) {
      return NextResponse.json({
        success: true,
        suggestions: {
          motivationalMessage: aiResponse.trim()
        },
      })
    }
    
    // Robust JSON parsing with balanced brace extraction
    let jsonText = aiResponse.trim()
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    let startIdx = jsonText.indexOf('{')
    if (startIdx === -1) {
      // If no JSON found, return as plain text
      return NextResponse.json({
        success: true,
        suggestions: {
          motivationalMessage: jsonText
        },
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
    
    let suggestions
    try {
      suggestions = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw JSON:', cleanJson.substring(0, 500))
      throw new Error('Failed to parse JSON response')
    }

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (error) {
    console.error('Suggestions API Error:', error)
    
    // Return fallback suggestions instead of error
    return NextResponse.json({
      success: true,
      suggestions: {
        urgentActions: [
          'Complete your profile',
          'Update your resume'
        ],
        recommendedActions: [
          'Explore career paths',
          'Practice interview questions',
          'Build your portfolio'
        ],
        motivationalMessage: 'Keep pushing forward! You\'re making great progress.',
        weeklyGoal: 'Complete at least one development task this week'
      }
    })
  }
}

