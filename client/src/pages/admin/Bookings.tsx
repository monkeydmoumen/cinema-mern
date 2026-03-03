import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  bookedAt: string;
};

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/admin/bookings');
        setBookings(res.data);
      } catch (err) {
        toast.error('Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
        <p className="text-zinc-400 mt-1">View and manage all ticket bookings</p>
      </div>

      <Card className="bg-zinc-900/70 border-zinc-800">
        <CardHeader>
          <CardTitle>All Bookings ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-zinc-500 py-6">Loading...</p>
          ) : bookings.length === 0 ? (
            <p className="text-zinc-500 py-6 text-center">No bookings yet</p>
          ) : (
            <div className="space-y-4">
              {bookings.map(b => (
                <div
                  key={b._id}
                  className="p-4 border border-zinc-800 rounded-lg bg-zinc-950/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{b.showtime.movie.title}</h3>
                      <p className="text-sm text-zinc-400 mt-1">
                        {b.showtime.room.name} • {new Date(b.showtime.startTime).toLocaleString()}
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">
                        User: {b.user.name || b.user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-400">
                        ${b.totalPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {b.seats.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}