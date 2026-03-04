// src/pages/public/Home.tsx — FULL home with all components
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

import FeaturedMovieCarousel from '@/components/public/home/FeaturedMovieCarousel';
import UpcomingShowtimes from '@/components/public/home/UpcomingShowtimes';
import CallToAction from '@/components/public/home/CallToAction';

import type { Movie, Showtime } from '@/types/cinema';

export default function Home() {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [upcomingShowtimes, setUpcomingShowtimes] = useState<Showtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [moviesRes, showtimesRes] = await Promise.all([
          api.get('https://cinema-mern-production.up.railway.app/public/movies'),
          api.get('https://cinema-mern-production.up.railway.app/public/showtimes?limit=6'),
        ]);

        setFeaturedMovies(moviesRes.data.slice(0, 8)); // more for carousel
        setUpcomingShowtimes(showtimesRes.data || []);
      } catch (err) {
        toast.error('Failed to load home content');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      

      <div className="container mx-auto px-4 py-12 md:py-16 space-y-20">
        <FeaturedMovieCarousel movies={featuredMovies} loading={loading} />

        <UpcomingShowtimes showtimes={upcomingShowtimes} loading={loading} />
      </div>

      <CallToAction />
    </div>
  );
}