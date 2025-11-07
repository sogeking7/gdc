import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const response = await generateText(prompt)
    
    return NextResponse.json({
      success: true,
      text: response,
      response: response
    })
  } catch (error) {
    console.error('Gemini API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate text', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

