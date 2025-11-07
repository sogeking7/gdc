import { NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  try {
    const { major, university, graduationYear } = await request.json()

    if (!major) {
      return NextResponse.json(
        { error: 'Major is required' },
        { status: 400 }
      )
    }

    const prompt = `For a ${major} major, suggest 6 relevant career paths in this exact JSON format:
{
  "interests": [
    {
      "id": "software-engineering",
      "label": "Software Engineering",
      "description": "Build software systems and applications",
      "relevance": 95
    }
  ]
}

Requirements:
- Keep descriptions under 50 characters
- Use lowercase-with-hyphens for IDs
- List 6 careers most relevant to ${major}
- Order by relevance (100 = perfect fit)

Return ONLY valid JSON, no extra text.`

    const response = await generateText(prompt)
    
    // Parse JSON from response with better extraction
    let jsonText = response.trim()
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // Find the outermost JSON object with balanced braces
    let startIdx = jsonText.indexOf('{')
    if (startIdx === -1) {
      console.error('AI Response (no JSON found):', response.substring(0, 1000))
      throw new Error('Invalid AI response format - no JSON found')
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
      console.error('AI Response (incomplete JSON):', jsonText.substring(0, 1000))
      throw new Error('Invalid AI response format - incomplete JSON')
    }
    
    let rawJson = jsonText.substring(startIdx, endIdx)
    
    // Clean up common JSON issues
    let cleanJson = rawJson
      .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
      .replace(/[\r\n]+/g, ' ')        // Remove newlines
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .replace(/\\'/g, "'")            // Handle escaped quotes
    
    let data
    try {
      data = JSON.parse(cleanJson)
    } catch (parseError) {
      console.error('Failed to parse cleaned JSON. Length:', cleanJson.length)
      console.error('First 800 chars:', cleanJson.substring(0, 800))
      console.error('Last 200 chars:', cleanJson.substring(Math.max(0, cleanJson.length - 200)))
      console.error('Parse error:', parseError)
      throw new Error('Failed to parse AI response as valid JSON')
    }
    
    return NextResponse.json({ 
      interests: data.interests || [],
      major,
    })
  } catch (error) {
    console.error('Career interests AI error:', error)
    return NextResponse.json(
      { error: 'Failed to generate career interests' },
      { status: 500 }
    )
  }
}

