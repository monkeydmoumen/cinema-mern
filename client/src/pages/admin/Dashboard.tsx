// pages/admin/Dashboard.tsx
import { useEffect, useState } from 'react'
import api from '@/lib/axios'
import { toast } from 'sonner'
import { Film, DoorOpen, Calendar } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  const [stats, setStats] = useState({
    movies: 0,
    rooms: 0,
    showtimes: 0,
    // future: ticketsSold: 0, etc.
  })

  useEffect(() => {
    const fetchStats = async () => {
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
      } catch (err) {
        toast.error('Failed to load dashboard stats')
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-zinc-400 mt-1">Overview of your cinema operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-zinc-900/70 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
            <Film className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.movies}</div>
            <p className="text-xs text-zinc-500 mt-1">Catalog size</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/70 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Screening Rooms</CardTitle>
            <DoorOpen className="h-5 w-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.rooms}</div>
            <p className="text-xs text-zinc-500 mt-1">Available venues</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/70 border-zinc-800">
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

      {/* You can add more sections later: recent activity, upcoming shows, etc. */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <p className="text-zinc-400">
          Use the sidebar to manage movies, rooms, showtimes and more.
        </p>
      </div>
    </div>
  )
}