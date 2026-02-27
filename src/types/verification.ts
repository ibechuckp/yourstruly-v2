export type DeathVerificationStatus = 'pending' | 'approved' | 'rejected' | 'needs_more_info';
export type ClaimantRelationship = 'spouse' | 'child' | 'sibling' | 'parent' | 'executor' | 'other';
export type DeathDocumentType = 'death_certificate' | 'obituary_link' | 'both';

export interface DeathVerification {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Claimed user
  claimed_user_id: string | null;
  
  // Claimant info
  claimant_name: string;
  claimant_email: string;
  claimant_phone: string | null;
  claimant_relationship: ClaimantRelationship;
  claimant_relationship_other: string | null;
  
  // Deceased info
  deceased_name: string;
  deceased_dob: string | null;
  deceased_date_of_death: string;
  
  // Documentation
  document_type: DeathDocumentType;
  document_url: string | null;
  obituary_url: string | null;
  
  // AI Processing
  ai_confidence_score: number | null;
  ai_extraction_data: AiExtractionData | null;
  ai_processed_at: string | null;
  
  // Status
  status: DeathVerificationStatus;
  
  // Review
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  
  // Approval actions
  transfer_access_to_claimant: boolean;
  memorial_conversion_completed: boolean;
  
  // Metadata
  submission_ip: string | null;
  submission_user_agent: string | null;
}

export interface AiExtractionData {
  deceased_name?: string;
  deceased_full_name?: string;
  date_of_birth?: string;
  date_of_death?: string;
  place_of_death?: string;
  cause_of_death?: string;
  certificate_number?: string;
  filing_date?: string;
  issuing_authority?: string;
  raw_text?: string;
  extraction_confidence?: number;
  error?: string;
  manual_review_required?: boolean;
}

export interface DeathVerificationWithProfile extends DeathVerification {
  profiles?: {
    id: string;
    full_name: string | null;
    date_of_birth: string | null;
    avatar_url: string | null;
    account_status: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    biography?: string | null;
    created_at?: string;
  } | null;
  reviewer?: {
    id: string;
    email: string;
  } | null;
  document_signed_url?: string | null;
  profile_email?: string | null;
}

export interface VerificationListResponse {
  verifications: DeathVerificationWithProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    all: number;
    pending: number;
    approved: number;
    rejected: number;
    needs_more_info: number;
  };
}

export interface ReviewAction {
  action: 'approve' | 'reject' | 'needs_more_info';
  notes?: string;
  transfer_access?: boolean;
}
