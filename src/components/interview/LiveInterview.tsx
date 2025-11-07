'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAiBlob } from '@google/genai'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { InterviewStatus, TranscriptMessage } from './types'
import { Button } from '@/components/ui/button'

type LiveInterviewProps = {
  defaultTopic?: string
  defaultRole?: string
  userName?: string
  userMajor?: string
  userExperience?: string
}

// --- Audio Utility Functions (from Gemini Docs) ---
function encode(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer)
  const frameCount = dataInt16.length / numChannels
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate)

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel)
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0
    }
  }
  return buffer
}

function createGenAiBlob(data: Float32Array): GenAiBlob {
  const l = data.length
  const int16 = new Int16Array(l)
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] < 0 ? data[i] * 32768 : data[i] * 32767
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000'
  }
}

function resampleBuffer(
  inputBuffer: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return inputBuffer
  }
  const sampleRateRatio = inputSampleRate / outputSampleRate
  const newLength = Math.round(inputBuffer.length / sampleRateRatio)
  const result = new Float32Array(newLength)
  let offsetResult = 0
  let offsetBuffer = 0
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio)
    let accum = 0
    let count = 0
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < inputBuffer.length; i++) {
      accum += inputBuffer[i]
      count++
    }
    result[offsetResult] = count > 0 ? accum / count : 0
    offsetResult++
    offsetBuffer = nextOffsetBuffer
  }
  return result
}

const SpinnerDots = () => (
  <div className="flex items-center justify-center space-x-1 h-5">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
  </div>
)

const TranscriptView: React.FC<{ transcript: TranscriptMessage[]; isThinking: boolean }> = ({ transcript, isThinking }) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript, isThinking])

  return (
    <div ref={scrollRef} className="flex-grow p-1 space-y-4 overflow-y-auto">
      {transcript.length === 0 && !isThinking && (
        <div className="flex items-center justify-center pt-16 text-sm text-muted-foreground">
          <p>Your conversation will appear here.</p>
        </div>
      )}
      {transcript.map((msg) => (
        <div key={msg.id} className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div
            className={`px-4 py-2 rounded-2xl max-w-sm shadow-sm text-sm ${
              msg.speaker === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-none'
                : 'bg-muted text-foreground rounded-bl-none'
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      {isThinking && (
        <div className="flex justify-start">
          <div className="px-4 py-2 rounded-2xl max-w-sm shadow-sm bg-muted text-foreground rounded-bl-none">
            <SpinnerDots />
          </div>
        </div>
      )}
    </div>
  )
}

const FormattedSummary: React.FC<{ summary: string }> = ({ summary }) => (
  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
  </div>
)

const DEFAULT_TOPICS = ['Frontend', 'Backend', 'Machine Learning', 'System Design', 'Algorithms & Data Structures']

export const LiveInterview: React.FC<LiveInterviewProps> = ({
  defaultTopic,
  defaultRole,
  userName,
  userMajor,
  userExperience
}) => {
  const [status, setStatus] = useState<InterviewStatus>(InterviewStatus.TOPIC_SELECTION)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [speaker, setSpeaker] = useState<'none' | 'user' | 'ai' | 'thinking'>('none')
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(defaultTopic ?? '')
  const [customTopic, setCustomTopic] = useState('')
  const [interviewLevel, setInterviewLevel] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [numQuestions, setNumQuestions] = useState<3 | 5 | 7>(5)

  const videoRef = useRef<HTMLVideoElement>(null)
  const sessionPromiseRef = useRef<Promise<any> | null>(null)
  const inputAudioContextRef = useRef<AudioContext | null>(null)
  const outputAudioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const previewStreamRef = useRef<MediaStream | null>(null)
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null)
  const currentInputTranscriptionRef = useRef('')
  const currentOutputTranscriptionRef = useRef('')
  const nextStartTimeRef = useRef(0)
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())
  const thinkingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const apiKey = useMemo(() => process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY, [])

  const cleanup = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    previewStreamRef.current?.getTracks().forEach((track) => track.stop())
    scriptProcessorRef.current?.disconnect()
    inputAudioContextRef.current?.close()
    outputAudioContextRef.current?.close()
    audioSourcesRef.current.forEach((source) => source.stop())
    audioSourcesRef.current.clear()
    sessionPromiseRef.current
      ?.then((session) => session.close())
      .catch(() => undefined)
    if (thinkingTimerRef.current) {
      clearTimeout(thinkingTimerRef.current)
    }
    sessionPromiseRef.current = null
    inputAudioContextRef.current = null
    outputAudioContextRef.current = null
    mediaStreamRef.current = null
    previewStreamRef.current = null
    scriptProcessorRef.current = null
    nextStartTimeRef.current = 0
  }, [])

  useEffect(() => {
    async function setupCamera() {
      previewStreamRef.current?.getTracks().forEach((track) => track.stop())
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        previewStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Error accessing camera for preview:', err)
        setError('Camera access is required. Please enable it in your browser settings and refresh the page.')
        setStatus(InterviewStatus.ERROR)
      }
    }
    if (status === InterviewStatus.TOPIC_SELECTION) {
      setupCamera()
    }
  }, [status])

  const startInterview = useCallback(
    async (topic: string) => {
      if (!topic) return
      if (!apiKey) {
        setError('Missing NEXT_PUBLIC_GOOGLE_GENAI_API_KEY in environment. Please add it and restart the app.')
        setStatus(InterviewStatus.ERROR)
        return
      }

      previewStreamRef.current?.getTracks().forEach((track) => track.stop())
      previewStreamRef.current = null

      setStatus(InterviewStatus.CONNECTING)
      setError(null)
      setTranscript([])

      try {
        const ai = new GoogleGenAI({ apiKey })

        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 })

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        mediaStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

        const systemPrompt = `You are 'Eve', a friendly and professional AI technical interviewer from Apple. You are conducting a live interview for the topic of "${topic}". The interview difficulty is set to "${interviewLevel}" and should consist of exactly ${numQuestions} questions. Ask challenging and relevant questions according to the difficulty level. Keep your responses concise and your tone conversational. ${userName ? `The candidate's name is ${userName}.` : ''} ${userMajor ? `They are studying ${userMajor}.` : ''} ${userExperience ? `Their experience level is ${userExperience}.` : ''} ${defaultRole ? `They are targeting ${defaultRole} positions.` : ''} Start by introducing yourself and then ask the first question. After asking the final question and receiving an answer, say "That's all the questions I have for you. Thank you for your time." and nothing more.`

        sessionPromiseRef.current = ai.live.connect({
          model: 'gemini-2.0-flash-exp',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            }
          } as any,
          callbacks: {
            onopen: async () => {
              console.log('✅ Session opened')
              
              // Resume audio contexts
              if (outputAudioContextRef.current?.state === 'suspended') {
                await outputAudioContextRef.current.resume()
                console.log('🔊 Output AudioContext resumed:', outputAudioContextRef.current.state)
              }
              if (inputAudioContextRef.current?.state === 'suspended') {
                await inputAudioContextRef.current.resume()
                console.log('🎤 Input AudioContext resumed:', inputAudioContextRef.current.state)
              }

              setStatus(InterviewStatus.ACTIVE)
              const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!)
              const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1)
              scriptProcessorRef.current = scriptProcessor

              scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0)
                const resampledData = resampleBuffer(
                  inputData,
                  audioProcessingEvent.inputBuffer.sampleRate,
                  16000
                )
                const pcmBlob = createGenAiBlob(resampledData)
                sessionPromiseRef.current?.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob })
                })
              }
              source.connect(scriptProcessor)
              scriptProcessor.connect(inputAudioContextRef.current!.destination)
            },
            onmessage: async (message: LiveServerMessage) => {
              const serverContent: any = message.serverContent

              // Extract text and audio from modelTurn
              if (serverContent?.modelTurn) {
                const modelTurn = serverContent.modelTurn
                const parts = modelTurn.parts || []
                
                // Extract text from parts
                let textContent = ''
                for (const part of parts) {
                  if (part.text) {
                    textContent += part.text
                  }
                }

                // Update transcript if there's text
                if (textContent.trim()) {
                  const role = modelTurn.role === 'user' ? 'user' : 'ai'
                  
                  if (role === 'user') {
                    if (thinkingTimerRef.current) clearTimeout(thinkingTimerRef.current)
                    setSpeaker('user')
                    thinkingTimerRef.current = setTimeout(() => {
                      setSpeaker('thinking')
                    }, 1000)

                    currentInputTranscriptionRef.current += textContent
                    setTranscript((prev) => {
                      const last = prev[prev.length - 1]
                      if (last && last.speaker === 'user') {
                        return [...prev.slice(0, -1), { ...last, text: currentInputTranscriptionRef.current }]
                      }
                      return [...prev, { id: Date.now(), speaker: 'user', text: currentInputTranscriptionRef.current }]
                    })
                  } else {
                    if (thinkingTimerRef.current) {
                      clearTimeout(thinkingTimerRef.current)
                      thinkingTimerRef.current = null
                    }
                    setSpeaker('ai')
                    currentOutputTranscriptionRef.current += textContent
                    setTranscript((prev) => {
                      const last = prev[prev.length - 1]
                      if (last && last.speaker === 'ai') {
                        return [...prev.slice(0, -1), { ...last, text: currentOutputTranscriptionRef.current }]
                      }
                      return [...prev, { id: Date.now(), speaker: 'ai', text: currentOutputTranscriptionRef.current }]
                    })
                  }
                }

                // Play audio from parts
                for (const part of parts) {
                  if (part.inlineData?.data && outputAudioContextRef.current) {
                    const outputCtx = outputAudioContextRef.current
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime)

                    const audioBuffer = await decodeAudioData(decode(part.inlineData.data), outputCtx, 24000, 1)
                    const source = outputCtx.createBufferSource()
                    source.buffer = audioBuffer
                    source.connect(outputCtx.destination)

                    source.addEventListener('ended', () => {
                      audioSourcesRef.current.delete(source)
                    })

                    source.start(nextStartTimeRef.current)
                    nextStartTimeRef.current += audioBuffer.duration
                    audioSourcesRef.current.add(source)
                  }
                }
              }

              if (serverContent?.turnComplete) {
                if (thinkingTimerRef.current) {
                  clearTimeout(thinkingTimerRef.current)
                  thinkingTimerRef.current = null
                }
                setSpeaker('none')
                currentInputTranscriptionRef.current = ''
                currentOutputTranscriptionRef.current = ''
              }

              if (serverContent?.interrupted) {
                audioSourcesRef.current.forEach((source) => source.stop())
                audioSourcesRef.current.clear()
                nextStartTimeRef.current = 0
              }
            },
            onerror: (e: ErrorEvent) => {
              console.error('❌ Session error:', e)
              setError('An error occurred with the connection. Please try again.')
              setStatus(InterviewStatus.ERROR)
              cleanup()
            },
            onclose: () => {
              console.log('🔒 Session closed')
              if (status === InterviewStatus.ACTIVE) {
                setStatus(InterviewStatus.ENDED)
                cleanup()
              }
            }
          }
        })
      } catch (err) {
        console.error('Failed to start interview:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred.')
        setStatus(InterviewStatus.ERROR)
        cleanup()
      }
    },
    [apiKey, cleanup, interviewLevel, numQuestions, status, userExperience, userMajor, defaultRole, userName]
  )

  const endInterview = useCallback(() => {
    setStatus(InterviewStatus.ENDED)
    cleanup()
  }, [cleanup])

  useEffect(() => {
    if (status === InterviewStatus.ENDED && transcript.length > 0 && !summary && !isSummarizing) {
      const generateSummary = async () => {
        setIsSummarizing(true)
        setSummary(null)

        const fullTranscript = transcript
          .map((msg) => `${msg.speaker === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.text}`)
          .join('\n\n')

        try {
          if (!apiKey) {
            throw new Error('Missing NEXT_PUBLIC_GOOGLE_GENAI_API_KEY in environment.')
          }
          const ai = new GoogleGenAI({ apiKey })
          const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: `As a career coach, provide a professional, detailed, and well-structured summary of the following technical interview from the candidate's perspective. Please format the entire response in clean, readable Markdown. Use headings for different sections and bullet points for lists. Please include relevant emojis to make the feedback more engaging (e.g., Strengths 💪, Areas for Improvement 📈).

Transcript:
${fullTranscript}`
          })
          setSummary(response.text ?? '')
        } catch (e) {
          console.error('Failed to generate summary:', e)
          setSummary('Sorry, I was unable to generate a summary for this interview.')
        } finally {
          setIsSummarizing(false)
        }
      }
      generateSummary()
    }
  }, [apiKey, isSummarizing, status, summary, transcript])

  const reset = useCallback(() => {
    setStatus(InterviewStatus.TOPIC_SELECTION)
    setTranscript([])
    setError(null)
    setSummary(null)
    setIsSummarizing(false)
    setSelectedTopic(defaultTopic ?? '')
    setCustomTopic('')
    setInterviewLevel('Medium')
    setNumQuestions(5)
  }, [defaultTopic])

  const finalTopic = selectedTopic || customTopic
  const displayName = userName?.split(' ')[0] ?? 'there'
  const displayRole = defaultRole ?? 'your target role'

  const renderContent = () => {
    switch (status) {
      case InterviewStatus.CONNECTING:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-xl font-semibold mb-2">Connecting...</h2>
            <p className="text-sm text-muted-foreground">Please allow microphone access.</p>
          </div>
        )
      case InterviewStatus.ACTIVE: {
        const speakerInfo = (() => {
          switch (speaker) {
            case 'user':
              return { text: 'Listening...', ping: 'bg-blue-400', dot: 'bg-blue-500' }
            case 'ai':
              return { text: 'Speaking...', ping: 'bg-purple-400', dot: 'bg-purple-500' }
            case 'thinking':
              return { text: 'Thinking...', ping: 'bg-yellow-400', dot: 'bg-yellow-500' }
            default:
              return { text: 'Live', ping: 'bg-gray-400', dot: 'bg-gray-500' }
          }
        })()

        return (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  {speaker !== 'none' && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${speakerInfo.ping}`}></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${speakerInfo.dot}`}></span>
                </span>
                <p className="text-sm font-medium text-foreground">{speakerInfo.text}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={endInterview}>
                End Interview
              </Button>
            </div>
            <TranscriptView transcript={transcript} isThinking={speaker === 'thinking'} />
          </div>
        )
      }
      case InterviewStatus.ENDED:
        return (
          <div className="flex flex-col h-full space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Interview Ended</h2>
              <p className="text-sm text-muted-foreground">Review your summary and start another session when you are ready.</p>
            </div>
            <div className="flex-1 overflow-y-auto rounded-xl border border-border bg-card p-4">
              <h3 className="text-base font-semibold mb-3">Interview Summary</h3>
              {isSummarizing && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="space-y-2 pl-4">
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="space-y-2 pl-4">
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </div>
              )}
              {summary && <FormattedSummary summary={summary} />}
              {!summary && !isSummarizing && transcript.length === 0 && (
                <p className="text-sm text-muted-foreground">No conversation was recorded to summarize.</p>
              )}
            </div>
            <Button onClick={reset} className="w-full" size="lg">
              Start New Interview
            </Button>
          </div>
        )
      case InterviewStatus.ERROR:
        return (
          <div className="text-center flex flex-col items-center justify-center h-full space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-destructive mb-2">Connection Error</h2>
              <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
            </div>
            <Button onClick={reset}>Try Again</Button>
          </div>
        )
      case InterviewStatus.TOPIC_SELECTION:
      default: {
        const topics = DEFAULT_TOPICS
        return (
          <div className="flex flex-col h-full space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Interviewer</h1>
              <p className="text-muted-foreground">Configure your interview setup to begin practicing.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div>
                <h3 className="text-base font-semibold mb-3">Topic</h3>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => {
                        setSelectedTopic(topic)
                        setCustomTopic('')
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTopic === topic ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value)
                      setSelectedTopic('')
                    }}
                    placeholder="Or enter a custom topic..."
                    className="w-full px-4 py-3 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-3">Difficulty</h3>
                <div className="flex flex-wrap gap-2">
                  {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setInterviewLevel(level)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        interviewLevel === level ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-3">Length</h3>
                <div className="flex flex-wrap gap-2">
                  {[3, 5, 7].map((num) => (
                    <button
                      key={num}
                      onClick={() => setNumQuestions(num as 3 | 5 | 7)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        numQuestions === num ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {num} Questions
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => startInterview(finalTopic)}
              disabled={!finalTopic}
              className="w-full"
              size="lg"
            >
              Start Interview
            </Button>
          </div>
        )
      }
    }
  }

  return (
    <main className="w-full flex flex-col lg:flex-row rounded-xl border border-border bg-background overflow-hidden min-h-[calc(100vh-11rem)]">
      <div className="relative flex-1 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]"
        />
        {status !== InterviewStatus.ACTIVE && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>}
        <div className="absolute top-4 left-4 space-y-2 text-white">
          <div className="text-lg font-semibold">Practice Interview, {displayName}! 🎤</div>
          <div className="text-sm text-white/80">
            Prepare for <span className="font-semibold">{displayRole}</span>
            {userMajor && <span> • {userMajor}</span>}
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl border-l border-border bg-card h-full flex flex-col p-4 sm:p-6">
        {renderContent()}
      </div>
    </main>
  )
}

export default LiveInterview
