// src/pages/public/MovieDetail.tsx — FIXED PRODUCTION SOCKET
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Calendar, Clock, Film, ArrowLeft, PlayCircle, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

import type { Movie, Showtime } from '@/types/cinema';
import ShowtimesList from '@/components/public/ShowtimesList';
import { formatDate } from 'date-fns';

/* ================= PRODUCTION SOCKET ================= */

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:4000';

/* ===================================================== */

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    if (!id) return;

    const fetchMovieData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [movieRes, showtimesRes] = await Promise.all([
          api.get(`/public/movies/${id}`),
          api.get(`/public/showtimes/movie/${id}`),
        ]);

        setMovie(movieRes.data);
        setShowtimes(showtimesRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load movie');
        toast.error('Could not load movie information');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  /* ================= SOCKET ================= */

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('new-showtime', ({ showtime }: { showtime: Showtime }) => {
      if (showtime.movie === id) {
        toast.info('🎟 New showtime added!', {
          description: formatDate(new Date(showtime.startTime), 'PPP p'),
        });

        setShowtimes((prev) => [showtime, ...prev]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  /* ================= LOADING STATE ================= */

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-96 w-full rounded-xl bg-zinc-800" />
      </div>
    );
  }

  /* ================= ERROR STATE ================= */

  if (error || !movie) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl text-red-400 mb-6">Error</h2>
        <p className="text-xl text-zinc-300 mb-8">
          {error || 'Movie not found'}
        </p>

        <Button asChild>
          <Link to="/movies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Movies
          </Link>
        </Button>
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="container mx-auto px-4 py-10 text-white">
      {/* Back */}
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/movies" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>

      <div className="grid md:grid-cols-3 gap-10">
        {/* Poster */}
        <div>
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="rounded-2xl w-full aspect-[2/3] object-cover"
            />
          ) : (
            <div className="bg-zinc-800 rounded-2xl aspect-[2/3]" />
          )}

          {movie.duration && (
            <div className="mt-4 flex items-center gap-2 text-zinc-300">
              <Clock className="text-emerald-400" />
              {movie.duration} minutes
            </div>
          )}
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-8">
          <h1 className="text-5xl font-bold">{movie.title}</h1>

          {movie.description && (
            <p className="text-lg text-zinc-300 whitespace-pre-line">
              {movie.description}
            </p>
          )}

          {/* Chat Button */}
          <div>
            <Button asChild size="lg" className="bg-purple-600">
              <Link to={`/movies/${id}/chat`}>
                <MessageCircle className="mr-2" />
                Open Movie Chat
              </Link>
            </Button>
          </div>

          {/* Showtimes */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="text-emerald-400" />
                Showtimes
              </CardTitle>
            </CardHeader>

            <CardContent>
              <ShowtimesList showtimes={showtimes} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}