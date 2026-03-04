// src/pages/admin/Dashboard.tsx — POLISHED VERSION (optional)
import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { toast } from 'sonner'
import { Film, DoorOpen, Calendar, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  const [stats, setStats] = useState({
    movies: 0,
    rooms: 0,
    showtimes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      setError(null)
      try {
        const [moviesRes, roomsRes, showtimesRes] = await Promise.all([
          api.get('/admin/movies'),
          api.get('/admin/rooms'),
          api.get('/admin/showtimes'),
        ])

        setStats({
          movies: moviesRes.data.length,
          rooms: roomsRes.data.length,
          showtimes: showtimesRes.data.length,
        })
      } catch (err: any) {
        console.error('Failed to load dashboard stats:', err)
        const msg = err.response?.data?.error || 'Could not load dashboard data'
        toast.error(msg)
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-950/30 border-red-800">
        <CardContent className="p-8 text-center text-red-300">
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm mt-2">Try refreshing or check admin permissions</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-zinc-400 mt-1">Overview of your cinema operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-zinc-900/70 border-zinc-800 hover:border-zinc-600 transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
            <Film className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.movies}</div>
            <p className="text-xs text-zinc-500 mt-1">Catalog size</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/70 border-zinc-800 hover:border-zinc-600 transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Screening Rooms</CardTitle>
            <DoorOpen className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rooms}</div>
            <p className="text-xs text-zinc-500 mt-1">Available venues</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/70 border-zinc-800 hover:border-zinc-600 transition">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Showtimes</CardTitle>
            <Calendar className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.showtimes}</div>
            <p className="text-xs text-zinc-500 mt-1">Upcoming screenings</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions / Placeholder */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <p className="text-zinc-400">
            Use the sidebar to manage movies, rooms, showtimes, bookings and more.
          </p>
          {/* Add buttons/links later if you want */}
        </CardContent>
      </Card>
    </div>
  )
}