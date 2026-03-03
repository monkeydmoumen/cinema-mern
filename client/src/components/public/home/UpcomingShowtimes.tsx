// src/components/public/UpcomingShowtimes.tsx
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, ArrowRight, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import type { Showtime } from '@/types/cinema';

interface Props {
  showtimes: Showtime[];
  loading: boolean;
}

export default function UpcomingShowtimes({ showtimes, loading }: Props) {
  return (
    <section className="py-16 px-4 bg-zinc-900/40">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-4xl font-bold flex items-center gap-3">
            <Calendar className="h-10 w-10 text-emerald-400" />
            Upcoming Showtimes
          </h2>
          <Button asChild variant="ghost" className="text-emerald-400 hover:text-emerald-300">
            <Link to="/movies" className="flex items-center gap-2 text-lg">
              See All <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-80 bg-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : showtimes.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 text-xl">
            No upcoming showtimes at the moment – check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showtimes.slice(0, 6).map((st) => (
              <Link key={st._id} to={`/movies/${st.movie?._id || ''}`} className="group">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-emerald-600/50 transition-all h-full">
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="relative">
                      {st.movie?.posterUrl ? (
                        <img
                          src={st.movie.posterUrl}
                          alt={st.movie.title}
                          className="w-full h-56 object-cover rounded-t-2xl group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-56 bg-zinc-800 flex items-center justify-center rounded-t-2xl">
                          <Film className="h-16 w-16 text-zinc-700" />
                        </div>
                      )}
                      <Badge className="absolute top-4 right-4 bg-emerald-600 text-white">
                        ${st.price?.toFixed(2) || '—'}
                      </Badge>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-xl font-semibold mb-3 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                        {st.movie?.title || 'Movie Title'}
                      </h3>
                      <p className="text-zinc-400 mb-4">
                        {format(new Date(st.startTime), 'EEEE, MMM d • h:mm a')}
                      </p>
                      <div className="mt-auto">
                        <p className="text-sm text-zinc-500 mb-4">
                          {st.room?.name || 'Room TBA'}
                        </p>
                        <Button variant="outline" className="w-full border-emerald-600 text-emerald-400 hover:bg-emerald-950/50">
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}