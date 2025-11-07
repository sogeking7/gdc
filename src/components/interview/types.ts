export enum InterviewStatus {
  TOPIC_SELECTION = 'TOPIC_SELECTION',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  ERROR = 'ERROR'
}

export interface TranscriptMessage {
  id: number
  speaker: 'user' | 'ai'
  text: string
}

