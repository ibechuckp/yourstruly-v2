interface ClaimantData {
  name: string
  dob?: string | null
  dateOfDeath: string
}

interface ProfileData {
  full_name?: string | null
  date_of_birth?: string | null
}

interface ExtractedData {
  deceased_name?: string
  deceased_full_name?: string
  date_of_birth?: string
  date_of_death?: string
  extraction_confidence?: number
  error?: string
}

/**
 * Calculate a confidence score based on how well the claimant's data,
 * profile data, and AI-extracted data match.
 * 
 * Score breakdown:
 * - Name match between extracted and profile: 40 points
 * - DOB match between extracted and profile: 20 points
 * - Name match between claimant's claim and extracted: 20 points
 * - AI extraction confidence: 20 points (scaled)
 */
export function calculateConfidenceScore(
  claimantData: ClaimantData,
  profileData: ProfileData | null,
  extractedData: ExtractedData
): number {
  let score = 0
  let maxScore = 100

  // If extraction failed, return low score
  if (extractedData.error) {
    return 10 // Very low confidence - needs manual review
  }

  const extractedName = (extractedData.deceased_full_name || extractedData.deceased_name || '').toLowerCase().trim()
  const extractedDob = extractedData.date_of_birth
  const claimantName = claimantData.name.toLowerCase().trim()

  // 1. Compare extracted name with profile name (40 points)
  if (profileData?.full_name && extractedName) {
    const profileName = profileData.full_name.toLowerCase().trim()
    const nameMatchScore = calculateNameSimilarity(extractedName, profileName)
    score += Math.round(nameMatchScore * 40)
  } else {
    // Can't compare - reduce max score
    maxScore -= 20
  }

  // 2. Compare extracted DOB with profile DOB (20 points)
  if (profileData?.date_of_birth && extractedDob) {
    if (datesMatch(extractedDob, profileData.date_of_birth)) {
      score += 20
    } else if (datesPartialMatch(extractedDob, profileData.date_of_birth)) {
      score += 10
    }
  } else {
    maxScore -= 10
  }

  // 3. Compare claimant's stated name with extracted name (20 points)
  if (claimantName && extractedName) {
    const claimMatchScore = calculateNameSimilarity(claimantName, extractedName)
    score += Math.round(claimMatchScore * 20)
  }

  // 4. AI extraction confidence (20 points)
  if (extractedData.extraction_confidence) {
    const aiConfidence = Math.min(extractedData.extraction_confidence, 100)
    score += Math.round((aiConfidence / 100) * 20)
  }

  // Normalize to 0-100 scale based on max achievable score
  if (maxScore < 100) {
    score = Math.round((score / maxScore) * 100)
  }

  return Math.min(Math.max(score, 0), 100)
}

/**
 * Calculate name similarity using a simple approach
 * Returns 0-1 where 1 is perfect match
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  // Normalize names
  const n1 = normalizeName(name1)
  const n2 = normalizeName(name2)

  // Exact match
  if (n1 === n2) return 1

  // Split into parts
  const parts1 = n1.split(' ').filter(p => p.length > 0)
  const parts2 = n2.split(' ').filter(p => p.length > 0)

  // Check how many parts match
  let matches = 0
  for (const part of parts1) {
    if (parts2.some(p2 => p2 === part || p2.startsWith(part) || part.startsWith(p2))) {
      matches++
    }
  }

  // Calculate similarity based on matching parts
  const maxParts = Math.max(parts1.length, parts2.length)
  if (maxParts === 0) return 0

  return matches / maxParts
}

/**
 * Normalize a name for comparison
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove non-letters
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim()
}

/**
 * Check if two dates match (in various formats)
 */
function datesMatch(date1: string, date2: string): boolean {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  
  if (!d1 || !d2) return false
  
  return d1.getTime() === d2.getTime()
}

/**
 * Check if dates partially match (year matches, or month/day match)
 */
function datesPartialMatch(date1: string, date2: string): boolean {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  
  if (!d1 || !d2) return false
  
  // Year matches
  if (d1.getFullYear() === d2.getFullYear()) return true
  
  // Month and day match (but year different - possible typo)
  if (d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()) return true
  
  return false
}

/**
 * Parse a date string into a Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  
  // Try ISO format first
  let date = new Date(dateStr)
  if (!isNaN(date.getTime())) return date
  
  // Try common formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,  // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,   // MM-DD-YYYY
  ]
  
  for (const format of formats) {
    const match = dateStr.match(format)
    if (match) {
      // Determine which capture group is year based on format
      if (match[1].length === 4) {
        // YYYY-MM-DD
        date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
      } else {
        // MM/DD/YYYY or MM-DD-YYYY
        date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]))
      }
      if (!isNaN(date.getTime())) return date
    }
  }
  
  return null
}

/**
 * Get a human-readable confidence level
 */
export function getConfidenceLevel(score: number): {
  level: 'high' | 'medium' | 'low' | 'very_low'
  label: string
  color: string
} {
  if (score >= 80) {
    return { level: 'high', label: 'High Confidence', color: 'green' }
  } else if (score >= 60) {
    return { level: 'medium', label: 'Medium Confidence', color: 'yellow' }
  } else if (score >= 40) {
    return { level: 'low', label: 'Low Confidence', color: 'orange' }
  } else {
    return { level: 'very_low', label: 'Very Low Confidence', color: 'red' }
  }
}
