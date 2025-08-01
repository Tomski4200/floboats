'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface BoatStats {
  total_views: number
  unique_viewers: number
  total_saves: number
  total_messages: number
  avg_view_duration: number
  daily_stats: {
    date: string
    views: number
    unique_viewers: number
    saves: number
    messages: number
  }[]
}

export default function BoatAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createBrowserClient()
  const [boat, setBoat] = useState<any>(null)
  const [stats, setStats] = useState<BoatStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(30) // days

  useEffect(() => {
    loadAnalytics()
  }, [resolvedParams.id, dateRange])

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Load boat details
      const { data: boatData, error: boatError } = await supabase
        .from('boats')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('owner_id', user.id)
        .single()

      if (boatError || !boatData) {
        console.error('Error loading boat:', boatError)
        router.push('/boats')
        return
      }

      setBoat(boatData)

      // Load analytics
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - dateRange)

      // Try to load stats - if RPC doesn't exist yet, use fallback
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_boat_stats', {
          p_boat_id: resolvedParams.id,
          p_start_date: startDate.toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        })

      if (statsError) {
        console.error('Error loading stats:', statsError)
        
        // Fallback: Load data directly from tables if RPC function doesn't exist
        const { data: analyticsData } = await supabase
          .from('boat_analytics')
          .select('*')
          .eq('boat_id', resolvedParams.id)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })

        // Calculate totals from the daily data
        if (analyticsData && analyticsData.length > 0) {
          const totals = analyticsData.reduce((acc, day) => ({
            total_views: acc.total_views + (day.view_count || 0),
            unique_viewers: acc.unique_viewers + (day.unique_viewers || 0),
            total_saves: acc.total_saves + (day.save_count || 0),
            total_messages: acc.total_messages + (day.message_count || 0)
          }), {
            total_views: 0,
            unique_viewers: 0,
            total_saves: 0,
            total_messages: 0
          })

          // Calculate average view duration from boat_views table
          const { data: viewsData } = await supabase
            .from('boat_views')
            .select('view_duration')
            .eq('boat_id', resolvedParams.id)
            .gte('viewed_at', startDate.toISOString())
            .not('view_duration', 'is', null)

          const avgDuration = viewsData && viewsData.length > 0
            ? viewsData.reduce((sum, v) => sum + v.view_duration, 0) / viewsData.length
            : 0

          setStats({
            ...totals,
            avg_view_duration: Math.round(avgDuration),
            daily_stats: analyticsData.map(day => ({
              date: day.date,
              views: day.view_count || 0,
              unique_viewers: day.unique_viewers || 0,
              saves: day.save_count || 0,
              messages: day.message_count || 0
            }))
          })
        }
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getChartData = () => {
    if (!stats?.daily_stats) return []
    
    // Fill in missing dates with zero values
    const data = []
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRange)
    
    const statsMap = new Map(
      stats.daily_stats.map(s => [s.date, s])
    )
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      const dayStats = statsMap.get(dateStr) || {
        date: dateStr,
        views: 0,
        unique_viewers: 0,
        saves: 0,
        messages: 0
      }
      data.push(dayStats)
    }
    
    return data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!boat || !stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data</h2>
          <p className="text-gray-600">Analytics data will appear here once your listing starts receiving views.</p>
          <Link
            href="/boats"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to My Boats
          </Link>
        </div>
      </div>
    )
  }

  const chartData = getChartData()
  const maxViews = Math.max(...chartData.map(d => d.views), 10)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/boats"
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to My Boats
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-2 text-gray-600">{boat.title || `${boat.make} ${boat.model}`}</p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex space-x-2">
        {[7, 30, 90].map(days => (
          <button
            key={days}
            onClick={() => setDateRange(days)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              dateRange === days
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last {days} days
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Views</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total_views}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Unique Viewers</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.unique_viewers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Times Saved</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total_saves}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Messages</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.total_messages}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg. View Time</h3>
          <p className="text-3xl font-bold text-gray-900">{formatDuration(stats.avg_view_duration)}</p>
        </div>
      </div>

      {/* Views Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Views Over Time</h2>
        <div className="relative h-64">
          <div className="absolute inset-0 flex items-end">
            {chartData.map((day, index) => {
              const height = maxViews > 0 ? (day.views / maxViews) * 100 : 0
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center mx-0.5"
                  title={`${day.date}: ${day.views} views`}
                >
                  <div
                    className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-700"
                    style={{ height: `${height}%` }}
                  />
                  {(index === 0 || index === chartData.length - 1 || index % 7 === 0) && (
                    <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
            <span>{maxViews}</span>
            <span>{Math.floor(maxViews / 2)}</span>
            <span>0</span>
          </div>
        </div>
      </div>

      {/* Daily Stats Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Daily Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unique Viewers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saves
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.slice().reverse().slice(0, 10).map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.unique_viewers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.saves}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.messages}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex space-x-4">
        <Link
          href={`/boats/${boat.id}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View Listing
        </Link>
        <Link
          href={`/boats/${boat.id}/edit`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Edit Listing
        </Link>
      </div>
    </div>
  )
}