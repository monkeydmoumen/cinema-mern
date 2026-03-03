// src/components/public/HeroSection.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
    <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-950 to-black overflow-hidden">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ 
          backgroundImage: "url('src/assets/colisee.jpg')" 
        }}
      />
      
      <div className="relative z-10 text-center px-6 max-w-5xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Welcome to CineVerse
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-200 mb-10 max-w-3xl mx-auto leading-relaxed">
          Discover the latest blockbusters • Book your perfect seat • Experience cinema like never before
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-7 text-lg font-medium">
            <Link to="/movies">Browse Movies</Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="border-emerald-600 text-white hover:bg-emerald-950/50 px-10 py-7 text-lg font-medium">
            <Link to="/my-tickets">My Tickets</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}