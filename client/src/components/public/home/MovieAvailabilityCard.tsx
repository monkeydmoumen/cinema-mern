// src/components/public/MovieAvailabilityCard.tsx
import { Link } from 'react-router-dom';
import { Film, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import type { Movie, Showtime } from '@/types/cinema';
import { format } from 'date-fns/format';

interface Props {
  movie: Movie;
  nextShowtime?: Showtime; // optional — if we have one
  totalSeats?: number;     // from room
  bookedSeats?: number;    // we'll calculate later
}

export default function MovieAvailabilityCard({
  movie,
  nextShowtime,
  totalSeats = 0,
  bookedSeats = 0,
}: Props) {
  const availableSeats = totalSeats - bookedSeats;
  const isAvailable = availableSeats > 0;

  return (
    <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-600/50 transition-all overflow-hidden group h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        <div className="relative">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-64 bg-zinc-800 flex items-center justify-center">
              <Film className="h-20 w-20 text-zinc-600" />
            </div>
          )}
          {nextShowtime && (
            <div className="absolute top-4 left-4">
              <Badge className="bg-emerald-600 text-white flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(nextShowtime.startTime), 'MMM d • h:mm a')}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-semibold text-xl line-clamp-2 group-hover:text-emerald-400 transition-colors mb-2">
            {movie.title}
          </h3>

          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {movie.genres.slice(0, 3).map(g => (
                <Badge key={g} variant="secondary" className="text-xs bg-zinc-800 text-zinc-300">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-auto space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <Users className="h-4 w-4" />
                Seats left:
              </div>
              <Badge variant={isAvailable ? "default" : "destructive"} className={isAvailable ? "bg-emerald-600" : ""}>
                {isAvailable ? availableSeats : 'Sold Out'}
              </Badge>
            </div>

            <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link to={`/movies/${movie._id}`}>
                {isAvailable ? 'Book Now' : 'View Details'}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}