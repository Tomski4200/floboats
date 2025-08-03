export function getSiteURL() {
  // Check for production URL environment variable first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // In production on Vercel
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  }
  
  // Check if we're on floboats.com
  if (typeof window !== 'undefined') {
    const { hostname, protocol, port } = window.location
    if (hostname === 'floboats.com' || hostname === 'www.floboats.com') {
      return 'https://floboats.com'
    }
    // Return current origin for other environments
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }
  
  // Default to localhost for server-side rendering in development
  return 'http://localhost:3000'
}