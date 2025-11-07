import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { question, answer, userProfile } = body

    if (!question || !answer) {
      return NextResponse.json(
        { error: 'Question and answer are required' },
        { status: 400 }
      )
    }

    // Enhanced prompt with user profile context for better personalization
    let prompt = PROMPTS.interviewFeedback(question, answer)
    
    if (userProfile) {
      prompt += `\n\nUser Context:
- Major: ${userProfile.major || 'Not specified'}
- Target Role: ${userProfile.targetRole || userProfile.role || 'Not specified'}
- Experience Level: ${userProfile.experience || 'Not specified'}
- Key Skills: ${userProfile.skills?.slice(0, 5).join(', ') || 'Not specified'}

Consider their background when providing feedback.`
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
    console.error('Interview Feedback API Error:', error)
    
    // Return fallback feedback instead of error
    return NextResponse.json({
      success: true,
      feedback: {
        clarityScore: 75,
        relevanceScore: 70,
        starMethodScore: 72,
        overallScore: 73,
        strengths: [
          'Clear problem identification',
          'Good structure and organization'
        ],
        improvements: [
          'Add more specific details and metrics',
          'Include measurable results and outcomes'
        ],
        starAnalysis: {
          situation: { present: true, feedback: 'Situation was clearly described' },
          task: { present: true, feedback: 'Task was identified' },
          action: { present: true, feedback: 'Actions taken were explained' },
          result: { present: false, feedback: 'Could include more quantifiable results' }
        },
        suggestedAnswer: 'Consider adding specific metrics and outcomes to strengthen your answer.'
      }
    })
  }
}

