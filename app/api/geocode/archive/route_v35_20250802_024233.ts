import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const location = searchParams.get('location')

  if (!location) {
    return NextResponse.json({ error: 'Location is required' }, { status: 400 })
  }

  try {
    // Using a simple, free, and open geocoding service
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`)
    const data = await response.json()

    if (data && data.length > 0) {
      const { lat, lon } = data[0]
      return NextResponse.json({ latitude: parseFloat(lat), longitude: parseFloat(lon) })
    } else {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
  } catch {
    return NextResponse.json({ error: 'Failed to geocode location' }, { status: 500 })
  }
}
