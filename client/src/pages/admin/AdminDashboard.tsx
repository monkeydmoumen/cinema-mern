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
import { toast } from 'sonner'

/* ✅ PRODUCTION SAFE API */
const API =
  import.meta.env.VITE_API_URL ||
  'http://localhost:4000/api/admin'

/* ===================================================== */

type Movie = { _id: string; title: string }
type Room = { _id: string; name: string; capacity: number }
type Showtime = {
  _id: string
  movie: { title: string }
  room: { name: string; capacity: number }
  startTime: string
  price: number
}

/* ================= VALIDATION ================= */

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  posterUrl: z.string().url().optional().or(z.literal('')),
  duration: z.number().int().positive().optional(),
})

const roomSchema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().min(1),
})

const showtimeSchema = z.object({
  movie: z.string().min(1),
  room: z.string().min(1),
  startTime: z.string().min(1),
  price: z.number().min(0.01),
})

type MovieForm = z.infer<typeof movieSchema>
type RoomForm = z.infer<typeof roomSchema>
type ShowtimeForm = z.infer<typeof showtimeSchema>

/* ===================================================== */

export default function AdminDashboard() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [showtimes, setShowtimes] = useState<Showtime[]>([])

  /* ================= FORMS ================= */

  const movieForm = useForm<MovieForm>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: '',
      description: '',
      posterUrl: '',
      duration: undefined,
    },
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

  /* ================= LOAD DATA ================= */

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
        console.error('Load error:', err)
        toast.error('Failed to load data')
      }
    }

    fetchData()
  }, [])

  /* ================= CREATE MOVIE ================= */

  const onCreateMovie = async (data: MovieForm) => {
    try {
      await axios.post(`${API}/movies`, data)

      const { data: updated } = await axios.get(`${API}/movies`)
      setMovies(updated)

      movieForm.reset()
      toast.success('Movie created')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Movie creation failed')
    }
  }

  /* ================= CREATE ROOM ================= */

  const onCreateRoom = async (data: RoomForm) => {
    try {
      await axios.post(`${API}/rooms`, data)

      const { data: updated } = await axios.get(`${API}/rooms`)
      setRooms(updated)

      roomForm.reset()
      toast.success('Room created')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Room creation failed')
    }
  }

  /* ================= CREATE SHOWTIME ================= */

  const onCreateShowtime = async (data: ShowtimeForm) => {
    try {
      await axios.post(`${API}/showtimes`, {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
      })

      const { data: updated } = await axios.get(`${API}/showtimes`)
      setShowtimes(updated)

      showtimeForm.reset()
      toast.success('Showtime scheduled')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Showtime failed')
    }
  }

  /* ===================================================== */

  return (
    <div className="container mx-auto p-6 space-y-12 pb-20">
      <h1 className="text-4xl font-bold">Cinema Admin Panel</h1>

      {/* ================= MOVIE ================= */}

      <Card>
        <CardHeader>
          <CardTitle>Add Movie</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={movieForm.handleSubmit(onCreateMovie)}
            className="grid gap-4"
          >
            <Input placeholder="Title" {...movieForm.register('title')} />
            <Input placeholder="Poster URL" {...movieForm.register('posterUrl')} />
            <Input
              type="number"
              placeholder="Duration"
              {...movieForm.register('duration', { valueAsNumber: true })}
            />

            <Button type="submit">
              {movieForm.formState.isSubmitting
                ? 'Creating...'
                : 'Create Movie'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ================= ROOM ================= */}

      <Card>
        <CardHeader>
          <CardTitle>Add Room</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={roomForm.handleSubmit(onCreateRoom)}
            className="grid gap-4"
          >
            <Input placeholder="Room Name" {...roomForm.register('name')} />

            <Input
              type="number"
              placeholder="Capacity"
              {...roomForm.register('capacity', { valueAsNumber: true })}
            />

            <Button type="submit">
              {roomForm.formState.isSubmitting
                ? 'Creating...'
                : 'Create Room'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ================= SHOWTIME ================= */}

      <Card>
        <CardHeader>
          <CardTitle>Schedule Showtime</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={showtimeForm.handleSubmit(onCreateShowtime)}
            className="grid gap-4"
          >
            <Select
              onValueChange={(v) => showtimeForm.setValue('movie', v)}
              value={showtimeForm.watch('movie')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Movie" />
              </SelectTrigger>

              <SelectContent>
                {movies.map((m) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(v) => showtimeForm.setValue('room', v)}
              value={showtimeForm.watch('room')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Room" />
              </SelectTrigger>

              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r._id} value={r._id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="datetime-local"
              {...showtimeForm.register('startTime')}
            />

            <Input
              type="number"
              step="0.01"
              placeholder="Price"
              {...showtimeForm.register('price', { valueAsNumber: true })}
            />

            <Button type="submit">
              {showtimeForm.formState.isSubmitting
                ? 'Scheduling...'
                : 'Schedule'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}