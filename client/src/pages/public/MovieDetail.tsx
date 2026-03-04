// src/pages/public/MovieDetail.tsx — FIXED Socket.IO cleanup + live showtime notifications
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

const SOCKET_URL = 'https://cinema-mern-production.up.railway.app'; // ← your Railway backend

export default function MovieDetail() {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.error(err);
        setError(err.response?.data?.error || 'Failed to load movie details');
        toast.error('Could not load movie information');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  // Socket.IO: listen for new showtimes (global + filter for this movie)
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('new-showtime', ({ showtime }: { showtime: Showtime }) => {
      if (showtime.movie === id) { // only if for this movie
        toast.info('New showtime added!', {
          description: formatDate(new Date(showtime.startTime), 'PPP p'),
        });
        setShowtimes(prev => [showtime, ...prev]);
      }
    });

    // Correct cleanup: return a function
    return () => {
      socket.disconnect();
    };
  }, [id]); // re-run only if id changes

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-10">
          <Skeleton className="aspect-[2/3] w-full rounded-xl bg-zinc-800" />
          <div className="md:col-span-2 space-y-8">
            <Skeleton className="h-14 w-3/4 bg-zinc-800 rounded" />
            <Skeleton className="h-6 w-1/2 bg-zinc-800 rounded" />
            <Skeleton className="h-40 w-full bg-zinc-800 rounded" />
            <Skeleton className="h-96 w-full rounded-xl bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-white">
        <h2 className="text-4xl font-bold mb-6 text-red-400">Error</h2>
        <p className="text-xl text-zinc-300 mb-10">{error || 'Movie not found'}</p>
        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Link to="/movies">Back to All Movies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-16 text-white">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
        <Link to="/movies" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Movies
        </Link>
      </Button>

      <div className="grid md:grid-cols-3 gap-10 lg:gap-12">
        {/* Poster column */}
        <div className="md:col-span-1">
          <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-auto object-cover aspect-[2/3]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x750/1a1a1a/4a4a4a?text=No+Poster';
                }}
              />
            ) : (
              <div className="aspect-[2/3] bg-zinc-800 flex items-center justify-center text-zinc-600">
                <Film className="h-32 w-32 opacity-30" />
              </div>
            )}
          </div>

          {movie.duration && (
            <div className="mt-6 p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl text-center">
              <div className="flex items-center justify-center gap-3 text-zinc-300">
                <Clock className="h-6 w-6 text-emerald-400" />
                <span className="text-xl font-medium">{movie.duration} minutes</span>
              </div>
            </div>
          )}

          {movie.genres && movie.genres.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {movie.genres.map(genre => (
                <Badge
                  key={genre}
                  variant="outline"
                  className="px-3 py-1 text-sm bg-zinc-800 border-emerald-900 text-emerald-300"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {movie.trailerUrl && (
            <div className="mt-6 text-center">
              <Button asChild variant="outline" className="gap-2 text-white border-zinc-600 hover:bg-zinc-800">
                <a href={movie.trailerUrl} target="_blank" rel="noopener noreferrer">
                  <PlayCircle className="h-5 w-5" />
                  Watch Trailer
                </a>
              </Button>
            </div>
          )}
          
        </div>

        {/* Content column */}
        <div className="md:col-span-2 space-y-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">{movie.title}</h1>
          </div>

          {movie.description && (
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold flex items-center gap-3 text-white">
                <Film className="h-6 w-6 text-emerald-400" />
                Storyline
              </h3>
              <p className="text-zinc-300 leading-relaxed text-lg whitespace-pre-line">
                {movie.description}
              </p>
            </div>
          )}
          <div className="mt-10">
  <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg">
    <Link to={`/movies/${id}/chat`}>
      <MessageCircle className="mr-3 h-6 w-6" />
      Open Movie Chat Room
    </Link>
  </Button>
  <p className="text-sm text-zinc-400 mt-3">
    Discuss the movie, share theories, spoilers allowed!
  </p>
</div>
          <Card className="bg-zinc-900/70 border-zinc-800 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-2xl flex items-center gap-3 text-white">
                <Calendar className="h-6 w-6 text-emerald-400" />
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