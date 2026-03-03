// src/components/public/CallToAction.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function CallToAction() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-black to-zinc-950">
      <div className="container mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">
          Ready for Your Next Movie Night?
        </h2>
        <p className="text-xl text-zinc-300 mb-10 max-w-3xl mx-auto">
          Explore the latest releases, check showtimes, and secure your seats in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-7 text-lg">
            <Link to="/movies">Browse All Movies</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-emerald-600 text-white hover:bg-emerald-950/50 px-12 py-7 text-lg">
            <Link to="/my-tickets">My Tickets</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}