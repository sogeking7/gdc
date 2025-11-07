import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || ''

if (!API_KEY) {
  console.warn('Warning: GOOGLE_GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(API_KEY)

export const geminiModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    temperature: 0.7,
    topP: 0.8,
    topK: 40,
    maxOutputTokens: 4096,  // Increased to handle longer JSON responses
  },
})

export async function generateText(prompt: string) {
  try {
    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Log response stats for debugging
    console.log(`AI Response length: ${text.length} chars`)
    console.log(`Finish reason: ${result.response.candidates?.[0]?.finishReason || 'unknown'}`)
    
    return text
  } catch (error) {
    console.error('Gemini AI Error:', error)
    throw new Error('Failed to generate AI response')
  }
}

// Model with web search enabled (for finding real internships)
// Using Gemini Pro with enhanced prompt for real-time search
export async function generateTextWithSearch(prompt: string) {
  try {
    // Use Gemini Pro model which has better web search capabilities
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more factual results
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096,
      },
    })
    
    // Enhanced prompt that instructs the model to search for real information
    const enhancedPrompt = `${prompt}

IMPORTANT: Use your knowledge and search capabilities to find REAL, CURRENT internship opportunities. Only include internships that actually exist with working URLs. Verify all links before including them.`

    const result = await model.generateContent(enhancedPrompt)
    const response = await result.response
    const text = response.text()
    
    // Log response stats for debugging
    console.log(`AI Response with Search length: ${text.length} chars`)
    console.log(`Finish reason: ${result.response.candidates?.[0]?.finishReason || 'unknown'}`)
    
    return text
  } catch (error) {
    console.error('Gemini AI Search Error:', error)
    // Fallback to regular model if search fails
    return generateText(prompt)
  }
}

export async function streamText(prompt: string) {
  try {
    const result = await geminiModel.generateContentStream(prompt)
    return result.stream
  } catch (error) {
    console.error('Gemini AI Stream Error:', error)
    throw new Error('Failed to stream AI response')
  }
}

