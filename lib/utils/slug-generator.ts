/**
 * Generate a URL-friendly slug from a business name, city, and state
 * Example: "Key's Marine Service" in "Marathon, FL" => "keys-marine-service-marathon-fl"
 */
export function generateBusinessSlug(businessName: string, city: string, state: string): string {
  // Combine business name, city, and state
  const combined = `${businessName} ${city} ${state}`
  
  // Convert to lowercase and replace special characters with dashes
  const slug = combined
    .toLowerCase()
    .trim()
    // Replace apostrophes with nothing
    .replace(/'/g, '')
    // Replace ampersands with 'and'
    .replace(/&/g, 'and')
    // Replace any non-alphanumeric characters (except dashes) with dashes
    .replace(/[^a-z0-9-]+/g, '-')
    // Remove consecutive dashes
    .replace(/-+/g, '-')
    // Remove leading and trailing dashes
    .replace(/^-|-$/g, '')
  
  return slug
}

/**
 * Extract business name from a slug that includes city and state
 * Example: "keys-marine-service-marathon-fl" => "keys-marine-service"
 */
export function extractBusinessNameFromSlug(slug: string): string {
  // This is a simple implementation that removes the last two parts (city-state)
  // In a real implementation, you might want to store the original slug mapping
  const parts = slug.split('-')
  // Remove last 2 parts (assuming they are city and state)
  return parts.slice(0, -2).join('-')
}