// src/pages/public/MoviesList.tsx — FULL UPDATED with white text + consistent dark theme
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Search, Film, Loader2 } from 'lucide-react';
import {
  isToday,
  isThisWeek,
  addDays,
  startOfToday,
  isAfter,
} from 'date-fns';

import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';


type Movie = {
  _id: string;
  title: string;
  posterUrl?: string;
  description?: string;
  duration?: number;
  genres?: string[];
};

type Showtime = {
  _id: string;
  movie: string;
  startTime: string;
};

export default function MoviesList() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this-week' | 'upcoming'>('all');
  const [loading, setLoading] = useState(true);

  // Socket.IO for real-time admin notifications
  // empty deps → only connect once

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [moviesRes, showtimesRes] = await Promise.all([
          api.get('/public/movies'),
          api.get('/public/showtimes'),
        ]);
        setMovies(moviesRes.data || []);
        setShowtimes(showtimesRes.data || []);
        setFilteredMovies(moviesRes.data || []);
      } catch (err) {
        toast.error('Failed to load movies or showtimes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load movies + upcoming showtimes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [moviesRes, showtimesRes] = await Promise.all([
          api.get('/public/movies'),
          api.get('/public/showtimes'),
        ]);
        setMovies(moviesRes.data || []);
        setShowtimes(showtimesRes.data || []);
        setFilteredMovies(moviesRes.data || []);
      } catch (err) {
        toast.error('Failed to load movies or showtimes');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group showtimes by movie _id
  const showtimesByMovie = useMemo(() => {
    const map: Record<string, Showtime[]> = {};
    showtimes.forEach(st => {
      if (!map[st.movie]) map[st.movie] = [];
      map[st.movie].push(st);
    });
    return map;
  }, [showtimes]);

  // Unique genres
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    movies.forEach(m => m.genres?.forEach(g => genreSet.add(g)));
    return Array.from(genreSet).sort();
  }, [movies]);

  // Filtering logic
  useEffect(() => {
    let result = [...movies];

    // Text search
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(lower) ||
        (m.description && m.description.toLowerCase().includes(lower))
      );
    }

    // Genre filter (must have ALL selected)
    if (selectedGenres.length > 0) {
      result = result.filter(m =>
        selectedGenres.every(g => m.genres?.includes(g))
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = startOfToday();
      const endOfWeek = addDays(today, 7);

      result = result.filter(movie => {
        const movieShowtimes = showtimesByMovie[movie._id] || [];
        if (movieShowtimes.length === 0) return false;

        return movieShowtimes.some(st => {
          const showDate = new Date(st.startTime);

          if (dateFilter === 'today') return isToday(showDate);
          if (dateFilter === 'this-week') return isThisWeek(showDate, { weekStartsOn: 1 });
          if (dateFilter === 'upcoming') return isAfter(showDate, endOfWeek);
          return true;
        });
      });
    }

    setFilteredMovies(result);
  }, [search, selectedGenres, dateFilter, movies, showtimesByMovie]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  return (
    <div className="container mx-auto px-4 py-12 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">All Movies</h1>
          <p className="text-zinc-300 mt-2">
            Browse our full catalog – find your next favorite film
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-80">
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 py-6 bg-zinc-900 border-zinc-700 text-white text-lg placeholder:text-zinc-500 focus-visible:ring-emerald-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          </div>

          {/* Genre Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 text-white border-zinc-600 bg-zinc-950 hover:bg-zinc-800 hover:text-white">
                <Film className="h-4 w-4" />
                Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-96 overflow-y-auto bg-zinc-950 border-zinc-700 text-white">
              <div className="space-y-4">
                <h4 className="font-medium text-white">Filter by Genre</h4>
                <div className="grid grid-cols-2 gap-3">
                  {allGenres.map(genre => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox
                        id={genre}
                        checked={selectedGenres.includes(genre)}
                        onCheckedChange={() => toggleGenre(genre)}
                        className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <Label htmlFor={genre} className="text-sm cursor-pointer text-zinc-200 hover:text-white">
                        {genre}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedGenres.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGenres([])}
                    className="text-red-400 hover:text-red-300 hover:bg-zinc-800"
                  >
                    Clear genres
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Date Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'today', 'this-week', 'upcoming'].map(filter => (
              <Button
                key={filter}
                variant={dateFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter(filter as any)}
                className={
                  dateFilter === filter
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'text-white border-zinc-600 hover:bg-zinc-800 hover:text-white'
                }
              >
                {filter === 'all' ? 'All' : filter === 'today' ? 'Today' : filter === 'this-week' ? 'This Week' : 'Upcoming'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-400 flex items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading movies...
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          {search || selectedGenres.length > 0 || dateFilter !== 'all'
            ? 'No movies match your filters'
            : 'No movies available yet'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map(movie => (
            <Link
              key={movie._id}
              to={`/movies/${movie._id}`}
              className="group block"
            >
              <Card className="overflow-hidden bg-zinc-900 border-zinc-800 hover:border-emerald-600/50 transition-all duration-300 h-full flex flex-col">
                <div className="aspect-[2/3] bg-zinc-800 relative">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-zinc-400">No Poster</div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      No Poster
                    </div>
                  )}
                </div>
                <CardContent className="p-4 flex-1 flex flex-col text-white">
                  <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-emerald-400 transition-colors">
                    {movie.title}
                  </h3>
                  {movie.genres && movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {movie.genres.slice(0, 3).map(g => (
                        <Badge key={g} variant="secondary" className="text-xs bg-zinc-800 text-white">
                          {g}
                        </Badge>
                      ))}
                      {movie.genres.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
                          +{movie.genres.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  {movie.duration && (
                    <p className="text-sm text-zinc-300 mt-2">
                      {movie.duration} min
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}