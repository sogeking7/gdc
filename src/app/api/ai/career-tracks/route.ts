import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { major, skills } = body

    if (!major) {
      return NextResponse.json(
        { error: 'Major is required' },
        { status: 400 }
      )
    }

    const prompt = `Based on a student's profile, suggest 5-6 career tracks they could pursue:

Student Profile:
- Major: ${major}
- Skills: ${skills?.join(', ') || 'Various skills'}

For each career track, provide:
1. Career title (e.g., "Software Engineer", "Data Analyst")
2. Brief description (1 sentence, max 60 chars)
3. Match score (0-100) based on their major and skills
4. Why it's a good fit (1 sentence, max 50 chars)

Return ONLY valid JSON in this format:
{
  "careerTracks": [
    {
      "id": "software-engineer",
      "title": "Software Engineer",
      "description": "Build and maintain software applications",
      "matchScore": 85,
      "fitReason": "Strong match with CS major and programming skills"
    }
  ]
}

Requirements:
- 5-6 career tracks
- Match scores should vary (highest first)
- Descriptions under 60 chars
- Fit reasons under 50 chars
- Return ONLY valid JSON, no markdown`

    const response = await generateText(prompt)
    
    // Parse JSON with balanced brace extraction
    let jsonText = response.trim()
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    let startIdx = jsonText.indexOf('{')
    if (startIdx === -1) {
      return NextResponse.json({
        success: true,
        careerTracks: getFallbackTracks(major)
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
        careerTracks: getFallbackTracks(major)
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
        careerTracks: getFallbackTracks(major)
      })
    }

    return NextResponse.json({
      success: true,
      careerTracks: data.careerTracks || getFallbackTracks(major)
    })
  } catch (error) {
    console.error('Career Tracks API Error:', error)
    return NextResponse.json({
      success: true,
      careerTracks: getFallbackTracks(null)
    })
  }
}

function getFallbackTracks(major: string | null) {
  const tracks = [
    {
      id: 'software-engineer',
      title: 'Software Engineer',
      description: 'Build and maintain software applications',
      matchScore: 85,
      fitReason: 'Strong match with technical skills'
    },
    {
      id: 'data-analyst',
      title: 'Data Analyst',
      description: 'Analyze data to help businesses make decisions',
      matchScore: 80,
      fitReason: 'Good fit for analytical skills'
    },
    {
      id: 'product-manager',
      title: 'Product Manager',
      description: 'Lead product development and strategy',
      matchScore: 75,
      fitReason: 'Combines technical and business skills'
    },
    {
      id: 'ux-designer',
      title: 'UX Designer',
      description: 'Design user-friendly digital experiences',
      matchScore: 70,
      fitReason: 'Creative and technical combination'
    },
    {
      id: 'consultant',
      title: 'Consultant',
      description: 'Help companies solve complex problems',
      matchScore: 65,
      fitReason: 'Leverages analytical thinking'
    }
  ]
  
  return tracks
}

