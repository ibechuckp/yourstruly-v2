export type MessageClassification = 'MEMORY' | 'WISDOM' | 'INTEREST' | 'GENERAL';

export type FragmentType = 'event' | 'location' | 'person' | 'time' | 'emotion' | 'meaning' | 'media';

export interface Fragment {
  type: FragmentType;
  value: string;
  confidence: number; // 0-1
}

export interface MemoryCandidate {
  id: string;
  fragments: Fragment[];
  confidence: number; // 0-1, increases as fragments accumulate
  questionCount: number; // track how many questions asked about this candidate
  narrative?: string; // reconstructed story when confidence is high
}

export interface WisdomEntry {
  statement: string;
  originMemoryId?: string; // link to memory if discovered
  category?: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  classification?: MessageClassification;
  fragments?: Fragment[];
}

export type ConversationContext = 'onboarding' | 'engagement' | 'interview';

export interface EngineState {
  messages: ConversationMessage[];
  activeCandidate: MemoryCandidate | null;
  pastCandidates: MemoryCandidate[]; // completed/saved ones
  wisdomEntries: WisdomEntry[];
  interestsMentioned: string[];
  questionDepth: 'low' | 'medium' | 'high'; // adaptive based on engagement
  totalUserMessages: number;
}

export interface EngineRequest {
  message: string;
  engineState: EngineState;
  context: ConversationContext;
  userName: string;
  userProfile?: {
    interests?: string[];
    religion?: string;
    location?: string;
    whyHere?: string;
  };
}

export interface EngineResponse {
  reply: string;
  classification: MessageClassification;
  fragments: Fragment[];
  engineState: EngineState; // updated state to pass back
  saveReady: boolean; // true when UI should show save button
  saveType?: 'memory' | 'wisdom'; // what kind of save
  candidateNarrative?: string; // reconstructed memory story if ready
}

export function createInitialState(): EngineState {
  return {
    messages: [],
    activeCandidate: null,
    pastCandidates: [],
    wisdomEntries: [],
    interestsMentioned: [],
    questionDepth: 'low',
    totalUserMessages: 0,
  };
}
