// src/pages/admin/Bookings.tsx — IMPROVED version (optional)
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

type Booking = {
  _id: string;
  user: { name: string; email: string };
  showtime: {
    movie: { title: string };
    room: { name: string };
    startTime: string;
  };
  seats: string[];
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled'; // ← added (good to show)
  bookedAt: string;
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/admin/bookings');
        setBookings(res.data);
      } catch (err: any) {
        console.error('Failed to load bookings:', err);
        const msg = err.response?.data?.error || 'Could not load bookings';
        toast.error(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-950/30 border-red-800">
        <CardContent className="p-6 text-center text-red-300">
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm mt-2">Try refreshing or check your admin permissions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
        <p className="text-zinc-400 mt-1">
          View and manage all ticket bookings ({bookings.length})
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="bg-zinc-900/70 border-zinc-800">
          <CardContent className="p-12 text-center text-zinc-400">
            No bookings yet. When users book tickets, they will appear here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((b) => (
            <Card key={b._id} className="bg-zinc-900/70 border-zinc-800 hover:border-zinc-600 transition">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1">{b.showtime.movie.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Room:</span>
                  <span>{b.showtime.room.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Time:</span>
                  <span>{new Date(b.showtime.startTime).toLocaleString([], {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">User:</span>
                  <span>{b.user.name || b.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Seats:</span>
                  <span className="font-medium">{b.seats.join(', ')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-800">
                  <span className="text-zinc-400">Total:</span>
                  <span className="text-lg font-bold text-emerald-400">
                    ${b.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Status:</span>
                  <Badge
                    variant={
                      b.status === 'confirmed' ? 'default' :
                      b.status === 'pending' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}