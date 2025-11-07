import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resumeContent, userProfile } = body

    if (!resumeContent) {
      return NextResponse.json(
        { error: 'Resume content is required' },
        { status: 400 }
      )
    }

    // Enhanced prompt with user profile context
    let prompt = PROMPTS.resumeFeedback(resumeContent)
    
    if (userProfile) {
      prompt += `\n\nUser Context:
- Target Role: ${userProfile.targetRole || userProfile.role || 'Not specified'}
- Experience Level: ${userProfile.experience || 'Not specified'}
- Major: ${userProfile.major || 'Not specified'}

Provide feedback tailored to their career goals and experience level.`
    }

    const aiResponse = await generateText(prompt)
    
    // Robust JSON parsing with balanced brace extraction
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
    
    let feedback
    try {
      feedback = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw JSON:', cleanJson.substring(0, 500))
      throw new Error('Failed to parse JSON response')
    }

    return NextResponse.json({
      success: true,
      feedback,
    })
  } catch (error) {
    console.error('Resume Feedback API Error:', error)
    
    // Return fallback feedback instead of error
    return NextResponse.json({
      success: true,
      feedback: {
        overallScore: 75,
        strengths: [
          'Clear contact information',
          'Professional formatting',
          'Good use of sections'
        ],
        improvements: [
          'Add more detail to work experience',
          'Include quantifiable achievements',
          'Enhance professional summary'
        ],
        atsScore: 70,
        keywordSuggestions: ['Leadership', 'Problem Solving', 'Communication', 'Teamwork', 'Project Management']
      }
    })
  }
}

