// src/components/public/FeaturedMovieCarousel.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import type { Movie } from '@/types/cinema';

interface Props {
  movies: Movie[];
  loading: boolean;
}

export default function FeaturedMovieCarousel({ movies, loading }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (movies.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [movies.length]);

  if (loading) {
    return (
      <div className="w-full h-[500px] bg-zinc-900 animate-pulse rounded-2xl flex items-center justify-center">
        <Film className="h-24 w-24 text-zinc-700 animate-pulse" />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="w-full h-[500px] bg-zinc-900/50 rounded-2xl flex flex-col items-center justify-center text-zinc-400">
        <Film className="h-20 w-20 mb-6 opacity-50" />
        <p className="text-xl">No featured movies right now</p>
      </div>
    );
  }

  const currentMovie = movies[currentIndex];

  // Placeholder seat info (later replace with real API data)
  const totalSeats = 180;
  const bookedSeats = Math.floor(Math.random() * 80); // demo
  const available = totalSeats - bookedSeats;

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl group">
      {/* Background */}
      <div className="absolute inset-0">
        {currentMovie.posterUrl ? (
          <img
            src={currentMovie.posterUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
            <Film className="h-32 w-32 text-zinc-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-16 px-8 md:px-16">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 mb-6">
            <Badge className="bg-emerald-600 text-white px-5 py-2 text-base font-medium">
              Now Featured
            </Badge>
            <div className="flex items-center gap-2 text-zinc-200 text-lg">
              <Users className="h-5 w-5" />
              <span className={available > 20 ? 'text-emerald-400' : 'text-amber-400'}>
                {available} seats left
              </span>
            </div>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 line-clamp-2 text-white drop-shadow-2xl">
            {currentMovie.title}
          </h2>

          {currentMovie.genres && (
            <div className="flex flex-wrap gap-3 mb-8">
              {currentMovie.genres.slice(0, 4).map((g) => (
                <Badge key={g} variant="outline" className="text-base bg-black/40 border-zinc-600 text-zinc-200 px-4 py-1">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-6">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-7 text-xl">
              <Link to={`/movies/${currentMovie._id}`}>Book Now</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 px-12 py-7 text-xl">
              View Details <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-4 h-4 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-emerald-500 scale-125' : 'bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}