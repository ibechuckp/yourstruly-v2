// Group Interview Types

export interface GroupInterviewQuestion {
  id: string
  text: string
  order: number
}

export interface GroupInterview {
  id: string
  user_id: string
  title: string
  description?: string
  questions: GroupInterviewQuestion[]
  allow_video: boolean
  allow_audio: boolean
  allow_text: boolean
  deadline?: string
  status: 'draft' | 'active' | 'closed' | 'archived'
  cover_image_url?: string
  generated_video_url?: string
  created_at: string
  updated_at: string
  
  // Joined data
  participants?: GroupInterviewParticipant[]
  response_count?: number
  participant_count?: number
  completed_count?: number
}

export interface GroupInterviewParticipant {
  id: string
  group_interview_id: string
  contact_id?: string
  name: string
  email?: string
  phone?: string
  access_token: string
  status: 'pending' | 'viewed' | 'in_progress' | 'completed' | 'declined'
  invited_at: string
  viewed_at?: string
  started_at?: string
  completed_at?: string
  last_reminder_at?: string
  reminder_count: number
  created_at: string
  
  // Joined data
  contact?: {
    id: string
    name: string
    avatar_url?: string
  }
  responses?: GroupInterviewResponse[]
}

export interface GroupInterviewResponse {
  id: string
  group_interview_id: string
  participant_id: string
  question_id: string
  response_type: 'text' | 'audio' | 'video'
  response_text?: string
  media_url?: string
  media_duration_seconds?: number
  transcription?: string
  transcription_status: 'pending' | 'processing' | 'completed' | 'failed'
  reactions: Record<string, string> // user_id -> emoji
  ai_summary?: string
  ai_sentiment?: string
  ai_themes?: string[]
  created_at: string
  updated_at: string
  
  // Joined data
  participant?: GroupInterviewParticipant
}

// API Request/Response types
export interface CreateGroupInterviewRequest {
  title: string
  description?: string
  questions: { text: string }[]
  allow_video?: boolean
  allow_audio?: boolean
  allow_text?: boolean
  deadline?: string
}

export interface InviteParticipantsRequest {
  group_interview_id: string
  participants: {
    contact_id?: string
    name: string
    email?: string
    phone?: string
  }[]
}

export interface SubmitGroupResponseRequest {
  participant_token: string
  question_id: string
  response_type: 'text' | 'audio' | 'video'
  response_text?: string
  media_url?: string
  media_duration_seconds?: number
}

// Story Time view types
export interface StoryTimeSlide {
  response: GroupInterviewResponse
  participant: GroupInterviewParticipant
  question: GroupInterviewQuestion
}

export interface StoryTimeData {
  groupInterview: GroupInterview
  slides: StoryTimeSlide[]
  questionGroups: {
    question: GroupInterviewQuestion
    responses: (GroupInterviewResponse & { participant: GroupInterviewParticipant })[]
  }[]
}
