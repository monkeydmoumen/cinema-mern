import { useEffect, useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'   // ← correct import for sonner

const API = 'http://localhost:4000/api/admin'

type Movie = { _id: string; title: string }
type Room = { _id: string; name: string; capacity: number }
type Showtime = {
  _id: string
  movie: { title: string }
  room: { name: string; capacity: number }
  startTime: string
  price: number
}

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  posterUrl: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  duration: z.number().int().positive().optional(),
})

const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
})

const showtimeSchema = z.object({
  movie: z.string().min(1, 'Please select a movie'),
  room: z.string().min(1, 'Please select a room'),
  startTime: z.string().min(1, 'Date & time is required'),
  price: z.number().min(0.01, 'Price must be positive'),
})

type MovieForm = z.infer<typeof movieSchema>
type RoomForm = z.infer<typeof roomSchema>
type ShowtimeForm = z.infer<typeof showtimeSchema>

export default function AdminDashboard() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [showtimes, setShowtimes] = useState<Showtime[]>([])

  const movieForm = useForm<MovieForm>({
    resolver: zodResolver(movieSchema),
    defaultValues: { title: '', description: '', posterUrl: '', duration: undefined },
  })

  const roomForm = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: '', capacity: 100 },
  })

  const showtimeForm = useForm<ShowtimeForm>({
    resolver: zodResolver(showtimeSchema),
    defaultValues: {
      movie: '',
      room: '',
      startTime: '',
      price: 12.99,
    },
  })

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moviesRes, roomsRes, showtimesRes] = await Promise.all([
          axios.get(`${API}/movies`),
          axios.get(`${API}/rooms`),
          axios.get(`${API}/showtimes`),
        ])

        setMovies(moviesRes.data)
        setRooms(roomsRes.data)
        setShowtimes(showtimesRes.data)
      } catch (err) {
        console.error('Failed to load initial data:', err)
        toast.error('Could not load movies, rooms or showtimes')
      }
    }

    fetchData()
  }, [])

  const onCreateMovie = async (data: MovieForm) => {
    try {
      await axios.post(`${API}/movies`, data)
      const { data: updated } = await axios.get(`${API}/movies`)
      setMovies(updated)
      movieForm.reset()
      toast.success('Movie created successfully')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to create movie')
    }
  }

  const onCreateRoom = async (data: RoomForm) => {
    try {
      await axios.post(`${API}/rooms`, data)
      const { data: updated } = await axios.get(`${API}/rooms`)
      setRooms(updated)
      roomForm.reset()
      toast.success('Room created successfully')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to create room')
    }
  }

  const onCreateShowtime = async (data: ShowtimeForm) => {
    try {
      await axios.post(`${API}/showtimes`, {
        movie: data.movie,
        room: data.room,
        startTime: new Date(data.startTime).toISOString(),
        price: data.price,
      })

      const { data: updated } = await axios.get(`${API}/showtimes`)
      setShowtimes(updated)
      showtimeForm.reset()
      toast.success('Showtime scheduled successfully')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to create showtime')
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-12 pb-20">
      <header className="flex justify-between items-center">
        <h1 className="text-4xl font-bold tracking-tight">Cinema Admin Panel</h1>
      </header>

      {/* ────────────────────────────────────────────── */}
      {/* Add Movie */}
      <Card className="bg-zinc-900/70 border-zinc-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Add New Movie</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={movieForm.handleSubmit(onCreateMovie)}
            className="grid gap-5 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...movieForm.register('title')} />
              {movieForm.formState.errors.title && (
                <p className="text-sm text-red-400">
                  {movieForm.formState.errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                {...movieForm.register('duration', { valueAsNumber: true })}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...movieForm.register('description')}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="posterUrl">Poster URL</Label>
              <Input
                id="posterUrl"
                placeholder="https://image.tmdb.org/..."
                {...movieForm.register('posterUrl')}
              />
              {movieForm.formState.errors.posterUrl && (
                <p className="text-sm text-red-400">
                  {movieForm.formState.errors.posterUrl.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="md:col-span-2"
              disabled={movieForm.formState.isSubmitting}
            >
              {movieForm.formState.isSubmitting ? 'Creating...' : 'Create Movie'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────── */}
      {/* Add Room */}
      <Card className="bg-zinc-900/70 border-zinc-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Add Cinema Room</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={roomForm.handleSubmit(onCreateRoom)}
            className="grid gap-5 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Room Name *</Label>
              <Input id="name" {...roomForm.register('name')} />
              {roomForm.formState.errors.name && (
                <p className="text-sm text-red-400">
                  {roomForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Number of Seats *</Label>
              <Input
                id="capacity"
                type="number"
                {...roomForm.register('capacity', { valueAsNumber: true })}
              />
              {roomForm.formState.errors.capacity && (
                <p className="text-sm text-red-400">
                  {roomForm.formState.errors.capacity.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="md:col-span-2"
              disabled={roomForm.formState.isSubmitting}
            >
              {roomForm.formState.isSubmitting ? 'Creating...' : 'Create Room'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────── */}
      {/* Schedule Showtime */}
      <Card className="bg-zinc-900/70 border-zinc-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Schedule Showtime</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={showtimeForm.handleSubmit(onCreateShowtime)}
            className="grid gap-5 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label>Movie *</Label>
              <Select
                onValueChange={(value) => showtimeForm.setValue('movie', value)}
                value={showtimeForm.watch('movie')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select movie" />
                </SelectTrigger>
                <SelectContent>
                  {movies.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showtimeForm.formState.errors.movie && (
                <p className="text-sm text-red-400">
                  {showtimeForm.formState.errors.movie.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Room *</Label>
              <Select
                onValueChange={(value) => showtimeForm.setValue('room', value)}
                value={showtimeForm.watch('room')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.name} ({r.capacity} seats)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showtimeForm.formState.errors.room && (
                <p className="text-sm text-red-400">
                  {showtimeForm.formState.errors.room.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Date & Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...showtimeForm.register('startTime')}
              />
              {showtimeForm.formState.errors.startTime && (
                <p className="text-sm text-red-400">
                  {showtimeForm.formState.errors.startTime.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Ticket Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                {...showtimeForm.register('price', { valueAsNumber: true })}
              />
              {showtimeForm.formState.errors.price && (
                <p className="text-sm text-red-400">
                  {showtimeForm.formState.errors.price.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="md:col-span-2"
              disabled={showtimeForm.formState.isSubmitting}
            >
              {showtimeForm.formState.isSubmitting ? 'Scheduling...' : 'Schedule Showtime'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────── */}
      {/* Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle>Movies ({movies.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {movies.length === 0 ? (
              <p className="text-zinc-500">No movies yet</p>
            ) : (
              movies.map((m) => <div key={m._id}>{m.title}</div>)
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle>Rooms ({rooms.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {rooms.length === 0 ? (
              <p className="text-zinc-500">No rooms yet</p>
            ) : (
              rooms.map((r) => (
                <div key={r._id}>
                  {r.name} — <span className="text-emerald-400">{r.capacity} seats</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle>Upcoming Showtimes ({showtimes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm max-h-80 overflow-y-auto">
            {showtimes.length === 0 ? (
              <p className="text-zinc-500">No showtimes scheduled</p>
            ) : (
              showtimes.map((s) => (
                <div key={s._id} className="pb-1 border-b border-zinc-800 last:border-0">
                  <div className="font-medium">{s.movie.title}</div>
                  <div className="text-zinc-400">
                    {s.room.name} • {new Date(s.startTime).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })} • ${s.price.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}