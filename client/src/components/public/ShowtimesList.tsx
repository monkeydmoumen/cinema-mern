// src/components/public/ShowtimesList.tsx — MEMOIZED: prevents full list re-render
import { memo } from 'react';
import { Calendar } from 'lucide-react';
import ShowtimeCard from './ShowtimeCard';
import { Button } from '@/components/ui/button';

import type { Showtime } from '@/types/cinema';
import { Link } from 'react-router-dom';

type Props = {
  showtimes: Showtime[];
};

const ShowtimesList = ({ showtimes }: Props) => {
  if (showtimes.length === 0) {
    return (
      <div className="text-center py-20 px-6 border border-zinc-800/70 rounded-xl bg-zinc-900/40 backdrop-blur-sm">
        <Calendar className="h-16 w-16 mx-auto mb-6 text-zinc-500 opacity-70" />
        <h3 className="text-2xl font-semibold text-white mb-4">No upcoming showtimes</h3>
        <p className="text-zinc-400 max-w-md mx-auto text-lg leading-relaxed">
          This movie doesn't have any scheduled screenings right now.<br />
          Please check back later or browse other movies.
        </p>
        <Button asChild variant="outline" className="mt-6 text-white border-zinc-600 hover:bg-zinc-800">
          <Link to="/movies">Browse All Movies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showtimes.map((st) => (
        <div 
          key={st._id} 
          className="transition-all duration-300 hover:translate-y-[-2px]"
        >
          <ShowtimeCard showtime={st} />
        </div>
      ))}
    </div>
  );
};

export default memo(ShowtimesList); // ← Prevents re-render if showtimes prop is same