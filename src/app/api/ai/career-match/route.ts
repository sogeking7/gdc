import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profile } = body

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile is required' },
        { status: 400 }
      )
    }

    const prompt = PROMPTS.careerMatch(profile)
    const aiResponse = await generateText(prompt)
    
    // Parse JSON response with balanced brace extraction
    let jsonText = aiResponse.trim()
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    let startIdx = jsonText.indexOf('{')
    if (startIdx === -1) {
      throw new Error('No JSON found in AI response')
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
    
    const recommendations = JSON.parse(cleanJson)

    return NextResponse.json({
      success: true,
      recommendations,
    })
  } catch (error) {
    console.error('Career Match API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}

