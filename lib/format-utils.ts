/**
 * Capitalizes the first letter of each word in a string
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Formats a location string with proper capitalization
 * Handles city names and state abbreviations
 * Examples: 
 * - "miami, fl" -> "Miami, FL"
 * - "fort lauderdale, florida" -> "Fort Lauderdale, FL"
 * - "jacksonville fl" -> "Jacksonville, FL"
 */
export function formatLocation(location: string | null | undefined): string {
  if (!location) return ''
  
  // Common state abbreviations mapping
  const stateAbbreviations: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
  }
  
  // Split by comma or last space (to handle "City State" or "City, State" formats)
  let parts = location.split(',').map(p => p.trim())
  
  if (parts.length === 1) {
    // Try to split by last space if no comma found
    const lastSpaceIndex = location.lastIndexOf(' ')
    if (lastSpaceIndex > 0) {
      parts = [
        location.substring(0, lastSpaceIndex).trim(),
        location.substring(lastSpaceIndex + 1).trim()
      ]
    }
  }
  
  if (parts.length >= 2) {
    // Format city
    const city = titleCase(parts[0])
    
    // Format state
    let state = parts[parts.length - 1].toLowerCase().trim()
    
    // Check if it's already a 2-letter abbreviation
    if (state.length === 2) {
      state = state.toUpperCase()
    } else {
      // Try to convert full state name to abbreviation
      const abbr = stateAbbreviations[state]
      if (abbr) {
        state = abbr
      } else {
        // If not found, just title case it
        state = titleCase(state)
      }
    }
    
    return `${city}, ${state}`
  }
  
  // If we can't parse it, just title case the whole thing
  return titleCase(location)
}

/**
 * Formats just a city name with proper capitalization
 */
export function formatCity(city: string | null | undefined): string {
  if (!city) return ''
  return titleCase(city)
}

/**
 * Formats a state abbreviation to uppercase
 */
export function formatState(state: string | null | undefined): string {
  if (!state) return ''
  
  // If it's a 2-letter abbreviation, uppercase it
  if (state.length === 2) {
    return state.toUpperCase()
  }
  
  // Otherwise, try to convert to abbreviation
  const stateAbbreviations: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
  }
  
  const abbr = stateAbbreviations[state.toLowerCase()]
  return abbr || state.toUpperCase()
}