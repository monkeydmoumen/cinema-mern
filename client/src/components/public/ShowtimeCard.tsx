// src/components/public/ShowtimeCard.tsx — FULL UPDATED with Socket.IO real-time + reusable fetch
import { useState, useEffect, useCallback } from 'react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/axios';
import SeatGrid from './SeatGridticket';

import type { Showtime } from '@/types/cinema';
import { Loader2 } from 'lucide-react';

const SOCKET_URL = 'http://localhost:4000'; // your backend URL

export default function ShowtimeCard({ showtime }: { showtime: Showtime }) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set());
  const [myBookedSeats, setMyBookedSeats] = useState<Set<string>>(new Set());
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Reusable fetch function
  const fetchSeats = useCallback(async () => {
    setLoadingSeats(true);
    try {
      // 1. All booked seats (red for others — includes pending)
      const allBookedRes = await api.get(`/public/bookings/seats/${showtime._id}`);
      setBookedSeats(new Set(allBookedRes.data));

      // 2. User's own seats for THIS showtime (gold — confirmed or pending)
      const myBookingsRes = await api.get('/public/my-bookings');
      const userSeatsHere = myBookingsRes.data
        .filter((b: any) => b.showtime._id === showtime._id && (b.status === 'confirmed' || b.status === 'pending'))
        .flatMap((b: any) => b.seats);

      setMyBookedSeats(new Set(userSeatsHere));
    } catch (err) {
      console.error('Failed to load seat data:', err);
      toast.error('Could not load seat availability');
    } finally {
      setLoadingSeats(false);
    }
  }, [showtime._id]);

  useEffect(() => {
    fetchSeats();

    // Socket.IO real-time listener
    const socket = io(SOCKET_URL);

    socket.emit('join-showtime', showtime._id);

    socket.on('seats-updated', ({ showtimeId }: { showtimeId: string }) => {
      if (showtimeId === showtime._id) {
        fetchSeats();
        toast.info('Seat availability updated in real-time');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [showtime._id, fetchSeats]);

  const date = new Date(showtime.startTime);

  let dateLabel = format(date, 'EEEE, MMMM d');
  if (isToday(date)) dateLabel = 'Today';
  else if (isTomorrow(date)) dateLabel = 'Tomorrow';

  const time = format(date, 'h:mm a');
  const daysAway = differenceInDays(date, new Date());

  const soonBadge = daysAway <= 3 ? (
    <Badge variant="secondary" className="bg-amber-900/50 text-amber-300 border-amber-700/40 text-xs">
      {daysAway <= 0 ? 'Today' : daysAway === 1 ? 'Tomorrow' : `In ${daysAway} days`}
    </Badge>
  ) : null;

  const handleBook = async () => {
    if (selectedSeats.length === 0) {
      toast.error('Select at least one seat');
      return;
    }

    setBookingLoading(true);

    try {
      const payload = {
        showtimeId: showtime._id,
        seats: selectedSeats,
      };

      await api.post('/public/bookings', payload);

      toast.success(`Booked ${selectedSeats.length} seat(s): ${selectedSeats.join(', ')}!`);

      // Refresh seats (Socket.IO will also notify others)
      await fetchSeats();

      setSelectedSeats([]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const rows = showtime.room?.rows ?? 8;
  const columns = showtime.room?.columns ?? 12;

  if (loadingSeats) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        Loading seat availability...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 border border-zinc-800 rounded-xl hover:bg-zinc-800/60 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="font-semibold text-xl">{dateLabel}</p>
            {soonBadge}
          </div>
          <p className="text-3xl font-bold text-emerald-400">{time}</p>
          <p className="text-base text-zinc-300">
            {showtime.room?.name ?? 'Unknown Room'} — {rows} rows × {columns} columns
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">
            ${showtime.price.toFixed(2)} <span className="text-sm text-zinc-500">/ ticket</span>
          </div>
        </div>
      </div>

      {/* Seat Grid */}
      <SeatGrid
        rows={rows}
        columns={columns}
        bookedSeats={bookedSeats}           // red = booked by anyone else (includes pending)
        mySeats={myBookedSeats}             // gold = user's seats (pending or confirmed)
        initialSelected={selectedSeats}
        onSelectionChange={setSelectedSeats}
        disabled={bookingLoading}
        maxSeats={8}
        showtimeId={showtime._id}
      />

      {/* Summary + Book button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-zinc-800">
        <div className="text-zinc-300 text-lg">
          {selectedSeats.length > 0 ? (
            <>
              Selected: <span className="font-medium text-emerald-400">{selectedSeats.join(', ')}</span>
              <span className="ml-3">({selectedSeats.length} × ${showtime.price.toFixed(2)})</span>
              <span className="ml-2 font-medium text-emerald-300">
                Total: ${(selectedSeats.length * showtime.price).toFixed(2)}
              </span>
            </>
          ) : (
            'Select seats above'
          )}
        </div>

        <Button
          className="bg-emerald-600 hover:bg-emerald-700 min-w-[180px]"
          disabled={bookingLoading || selectedSeats.length === 0 || loadingSeats}
          onClick={handleBook}
        >
          {bookingLoading ? 'Booking...' : `Book ${selectedSeats.length || ''} Ticket${selectedSeats.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}