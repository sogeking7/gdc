import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai/gemini'

const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY
const GOOGLE_SEARCH_CX = process.env.GOOGLE_SEARCH_CX

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { careerTitle, major, skills, location = 'Kazakhstan' } = body

    if (!careerTitle) {
      return NextResponse.json(
        { error: 'Career title is required' },
        { status: 400 }
      )
    }

    // Fetch real internships via Google Custom Search (if configured)
    let internships: any[] = []
    try {
      internships = await fetchRealInternships(careerTitle, location)
    } catch (error) {
      console.error('Internship search error:', error)
    }

    // Generate other career details
    const prompt = `Provide detailed information about the career: "${careerTitle}"

Student Context:
- Major: ${major || 'Not specified'}
- Skills: ${skills?.slice(0, 10).join(', ') || 'Various'}
- Location: ${location}

Provide comprehensive information in JSON format:
{
  "keyResponsibilities": [
    "Responsibility 1 (max 80 chars)",
    "Responsibility 2",
    "Responsibility 3",
    "Responsibility 4"
  ],
  "requiredSkills": [
    {"name": "Skill 1", "category": "technical|soft|tool"},
    {"name": "Skill 2", "category": "technical|soft|tool"}
  ],
  "averageSalary": {
    "entry": "Entry level salary range",
    "mid": "Mid-level salary range",
    "senior": "Senior-level salary range"
  },
  "careerOpportunities": [
    "Opportunity 1 (max 60 chars)",
    "Opportunity 2",
    "Opportunity 3"
  ],
  "growthPath": "Brief description of career progression (max 100 chars)"
}

Requirements:
- 4-5 key responsibilities
- 8-12 required skills (mix of technical, soft, tools)
- Realistic salary ranges for ${location}
- 3-4 career opportunities
- Keep all text concise
- Return ONLY valid JSON (do NOT include internships here, they will be added separately)`

    const response = await generateText(prompt)
    
    // Parse JSON with balanced brace extraction
    let jsonText = response.trim()
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    let startIdx = jsonText.indexOf('{')
    if (startIdx === -1) {
      return NextResponse.json({
        success: true,
        careerDetails: getFallbackDetails(careerTitle)
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
        careerDetails: getFallbackDetails(careerTitle)
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
        careerDetails: getFallbackDetails(careerTitle)
      })
    }

    // Merge internships from search into the response
    const careerDetails = {
      ...data,
      internships: internships.length > 0 ? internships : data.internships || []
    }

    return NextResponse.json({
      success: true,
      careerDetails
    })
  } catch (error) {
    console.error('Career Details API Error:', error)
    return NextResponse.json({
      success: true,
      careerDetails: getFallbackDetails(null)
    })
  }
}

async function fetchRealInternships(careerTitle: string, location: string) {
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_CX) {
    console.warn('Google Custom Search credentials are not configured. Skipping live internship search.')
    return []
  }

  const query = `${careerTitle} internship ${location}`
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', GOOGLE_SEARCH_API_KEY)
  url.searchParams.set('cx', GOOGLE_SEARCH_CX)
  url.searchParams.set('q', query)
  url.searchParams.set('num', '5')

  const response = await fetch(url.toString())
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Google Custom Search error:', errorText)
    return []
  }

  const data = await response.json()
  const items: any[] = data.items || []

  return items
    .map((item) => {
      const link = item.link
      if (!link || !link.startsWith('http')) {
        return null
      }

      const title = item.title || ''
      const snippet = item.snippet || ''
      const displayLink = item.displayLink || ''

      return {
        company: extractCompanyName(title, displayLink),
        position: sanitizeTitle(title),
        location,
        description: snippet,
        link,
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
}

function extractCompanyName(title: string, displayLink: string) {
  if (!title) {
    return displayLink
  }

  const separators = [' - ', ' | ', ' • ']
  for (const separator of separators) {
    if (title.includes(separator)) {
      const [firstPart] = title.split(separator)
      if (firstPart) {
        return firstPart.trim()
      }
    }
  }

  return displayLink || title
}

function sanitizeTitle(title: string) {
  if (!title) return ''
  const separators = [' - ', ' | ', ' • ']
  let sanitized = title

  for (const separator of separators) {
    if (sanitized.includes(separator)) {
      const [firstPart] = sanitized.split(separator)
      sanitized = firstPart.trim()
      break
    }
  }

  return sanitized
}

function getFallbackDetails(careerTitle: string | null) {
  return {
    keyResponsibilities: [
      'Develop and maintain software applications',
      'Collaborate with cross-functional teams',
      'Write clean and efficient code',
      'Participate in code reviews'
    ],
    requiredSkills: [
      { name: 'Programming', category: 'technical' },
      { name: 'Problem Solving', category: 'soft' },
      { name: 'Git', category: 'tool' },
      { name: 'Communication', category: 'soft' }
    ],
    averageSalary: {
      entry: '₸500,000 - ₸800,000/month',
      mid: '₸1,000,000 - ₸1,500,000/month',
      senior: '₸2,000,000+/month'
    },
    careerOpportunities: [
      'Tech startups in Almaty',
      'International companies',
      'Remote opportunities'
    ],
    internships: [
      {
        company: 'Tech Company',
        position: 'Software Development Intern',
        location: 'Almaty, Kazakhstan',
        description: 'Learn software development practices',
        link: 'https://www.linkedin.com/jobs/view/example'
      }
    ],
    growthPath: 'Start as junior developer, progress to senior roles'
  }
}

