// src/pages/admin/Showtimes.tsx — POLISHED VERSION (optional)
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Pencil, Trash2, CalendarIcon, Film, Users, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';

const showtimeSchema = z.object({
  movie: z.string().min(1, 'Please select a movie'),
  room: z.string().min(1, 'Please select a room'),
  startTime: z.string().min(1, 'Date & time is required'),
  price: z.number().min(0.01, 'Price must be positive'),
});

type ShowtimeForm = z.infer<typeof showtimeSchema>;

type Movie = {
  _id: string;
  title: string;
  posterUrl?: string;
  duration?: number;
  genres?: string[];
};

type Room = {
  _id: string;
  name: string;
  rows?: number;
  columns?: number;
  totalSeats?: number;
  capacity?: number;
};

type Showtime = {
  _id: string;
  movie: { _id: string; title: string };
  room: { _id: string; name: string; capacity: number };
  startTime: string;
  price: number;
};

export default function Showtimes() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ShowtimeForm>({
    resolver: zodResolver(showtimeSchema),
    defaultValues: {
      movie: '',
      room: '',
      startTime: '',
      price: 12.99,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mRes, rRes, sRes] = await Promise.all([
          api.get('/admin/movies'),
          api.get('/admin/rooms'),
          api.get('/admin/showtimes'),
        ]);
        setMovies(mRes.data || []);
        setRooms(rRes.data || []);
        setShowtimes(sRes.data || []);
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Could not load data';
        toast.error(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const onSubmit = async (data: ShowtimeForm) => {
    try {
      if (!data.startTime) {
        toast.error('Please select date & time');
        return;
      }

      const payload = {
        movie: data.movie,
        room: data.room,
        startTime: new Date(data.startTime).toISOString(),
        price: data.price,
      };

      if (editingId) {
        await api.put(`/admin/showtimes/${editingId}`, payload);
        toast.success('Showtime updated');
        setEditingId(null);
      } else {
        await api.post('/admin/showtimes', payload);
        toast.success('Showtime scheduled');
      }

      const { data: updated } = await api.get('/admin/showtimes');
      setShowtimes(updated);
      form.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const startEdit = (st: Showtime) => {
    setEditingId(st._id);
    form.reset({
      movie: st.movie._id,
      room: st.room._id,
      startTime: format(new Date(st.startTime), "yyyy-MM-dd'T'HH:mm"),
      price: st.price,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this showtime?')) return;
    try {
      await api.delete(`/admin/showtimes/${id}`);
      toast.success('Showtime deleted');
      const { data } = await api.get('/admin/showtimes');
      setShowtimes(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete showtime');
    }
  };

  const selectedMovie = movies.find(m => m._id === form.watch('movie'));
  const selectedRoom = rooms.find(r => r._id === form.watch('room'));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-950/30 border-red-800">
        <CardContent className="p-8 text-center text-red-300">
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm mt-2">Try refreshing or check admin permissions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10 text-white">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Showtimes</h2>
        <p className="text-zinc-300 mt-1">Schedule and manage movie screenings</p>
      </div>

      <Card className="bg-zinc-900/70 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">
            {editingId ? 'Edit Showtime' : 'Schedule New Showtime'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-2">
            {/* Movie Popover */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Movie *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-white border-zinc-600 bg-zinc-950 hover:bg-zinc-800 hover:text-white"
                  >
                    {selectedMovie ? selectedMovie.title : 'Select movie...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] max-h-[500px] overflow-y-auto p-4 bg-zinc-950 border-zinc-700 text-white">
                  <div className="grid gap-4">
                    {movies.map(movie => (
                      <div
                        key={movie._id}
                        className={`flex gap-4 p-4 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors ${
                          form.watch('movie') === movie._id ? 'bg-zinc-800 border border-emerald-600' : ''
                        }`}
                        onClick={() => form.setValue('movie', movie._id)}
                      >
                        <div className="w-20 h-28 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                          {movie.posterUrl ? (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="h-10 w-10 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-lg truncate text-white">{movie.title}</h4>
                          {movie.duration && (
                            <p className="text-sm text-zinc-300 flex items-center gap-1 mt-1">
                              <Clock className="h-4 w-4" /> {movie.duration} min
                            </p>
                          )}
                          {movie.genres && movie.genres.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {movie.genres.map(g => (
                                <Badge key={g} variant="secondary" className="text-xs bg-zinc-800 text-white">
                                  {g}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {form.formState.errors.movie && (
                <p className="text-sm text-red-400">{form.formState.errors.movie.message}</p>
              )}
            </div>

            {/* Room Popover */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Room *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-white border-zinc-600 bg-zinc-950 hover:bg-zinc-800 hover:text-white"
                  >
                    {selectedRoom ? selectedRoom.name : 'Select room...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-4 bg-zinc-950 border-zinc-700 text-white">
                  <div className="grid gap-3">
                    {rooms.map(room => (
                      <div
                        key={room._id}
                        className={`p-4 rounded-lg cursor-pointer hover:bg-zinc-800 transition-colors ${
                          form.watch('room') === room._id ? 'bg-zinc-800 border border-emerald-600' : ''
                        }`}
                        onClick={() => form.setValue('room', room._id)}
                      >
                        <h4 className="font-medium text-lg text-white">{room.name}</h4>
                        <p className="text-sm text-zinc-300 flex items-center gap-2 mt-2">
                          <Users className="h-4 w-4" />
                          Capacity: {room.capacity || 'N/A'} seats
                        </p>
                        <p className="text-sm text-zinc-300 flex items-center gap-2 mt-1">
                          <span className="font-medium text-zinc-200">Total seats:</span>{' '}
                          {room.totalSeats || (room.rows && room.columns ? room.rows * room.columns : 'N/A')}
                        </p>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {form.formState.errors.room && (
                <p className="text-sm text-red-400">{form.formState.errors.room.message}</p>
              )}
            </div>

            {/* Date & Time */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-zinc-200">Date & Time *</Label>
              <div className="flex flex-col sm:flex-row gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto justify-start text-left font-normal text-white border-zinc-600 bg-zinc-950 hover:bg-zinc-800 hover:text-white"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('startTime')
                        ? format(new Date(form.watch('startTime')), 'PPP')
                        : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-950 border-zinc-700">
                    <Calendar
                      mode="single"
                      selected={form.watch('startTime') ? new Date(form.watch('startTime')) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const current = form.watch('startTime');
                          if (current) {
                            date.setHours(new Date(current).getHours(), new Date(current).getMinutes());
                          }
                          form.setValue('startTime', date.toISOString());
                        }
                      }}
                      initialFocus
                      className="bg-zinc-950 text-white border-zinc-700"
                    />
                  </PopoverContent>
                </Popover>

                <Input
                  type="time"
                  value={
                    form.watch('startTime')
                      ? format(new Date(form.watch('startTime')), 'HH:mm')
                      : ''
                  }
                  onChange={(e) => {
                    const timeStr = e.target.value;
                    if (!timeStr) return;

                    const currentDate = form.watch('startTime')
                      ? new Date(form.watch('startTime'))
                      : new Date();
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    currentDate.setHours(hours, minutes, 0, 0);
                    form.setValue('startTime', currentDate.toISOString());
                  }}
                  className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              {form.formState.errors.startTime && (
                <p className="text-sm text-red-400">{form.formState.errors.startTime.message}</p>
              )}
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label className="text-zinc-200">Ticket Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register('price', { valueAsNumber: true })}
                className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-400">{form.formState.errors.price.message}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex gap-3">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {form.formState.isSubmitting ? 'Saving…' : editingId ? 'Update Showtime' : 'Schedule Showtime'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  className="text-white border-zinc-600 hover:bg-zinc-800 hover:text-white"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Scheduled Showtimes ({showtimes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {showtimes.length === 0 ? (
            <p className="text-zinc-400 py-6">No showtimes scheduled yet</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {showtimes.map(s => (
                <div
                  key={s._id}
                  className="flex justify-between items-start border-b border-zinc-700 pb-4 last:border-0 gap-4 text-white"
                >
                  <div className="flex-1">
                    <div className="font-medium text-lg">{s.movie?.title || '—'}</div>
                    <div className="text-sm text-zinc-300 mt-1">
                      {s.room?.name || '—'} • ${s.price.toFixed(2)}
                    </div>
                    <div className="text-sm text-zinc-300 mt-1">
                      {format(new Date(s.startTime), 'PPP p')}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(s)} className="text-white hover:bg-zinc-800">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s._id)} className="text-red-400 hover:bg-zinc-800">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}