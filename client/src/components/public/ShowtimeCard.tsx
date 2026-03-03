// src/components/public/ShowtimeCard.tsx — PRODUCTION SOCKET FIX
import { useState, useEffect, useCallback, useRef } from 'react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/axios';
import SeatGrid from './SeatGridticket';
import type { Showtime } from '@/types/cinema';
import { Loader2 } from 'lucide-react';

/* ================= SOCKET ================= */

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:4000';

/* ========================================== */

export default function ShowtimeCard({ showtime }: { showtime: Showtime }) {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<Set<string>>(new Set());
  const [myBookedSeats, setMyBookedSeats] = useState<Set<string>>(new Set());
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  /* ================= FETCH SEATS ================= */

  const fetchSeats = useCallback(async () => {
    setLoadingSeats(true);
    try {
      const allBookedRes = await api.get(
        `/public/bookings/seats/${showtime._id}`
      );

      setBookedSeats(new Set(allBookedRes.data));

      const myBookingsRes = await api.get('/public/my-bookings');

      const userSeatsHere = myBookingsRes.data
        .filter(
          (b: any) =>
            b.showtime._id === showtime._id &&
            (b.status === 'confirmed' || b.status === 'pending')
        )
        .flatMap((b: any) => b.seats);

      setMyBookedSeats(new Set(userSeatsHere));
    } catch (err) {
      toast.error('Could not load seat availability');
    } finally {
      setLoadingSeats(false);
    }
  }, [showtime._id]);

  /* ================= SOCKET REALTIME ================= */

  useEffect(() => {
    fetchSeats();

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.emit('join-showtime', showtime._id);

    socket.on(
      'seats-updated',
      ({ showtimeId }: { showtimeId: string }) => {
        if (showtimeId !== showtime._id) return;

        fetchSeats();
        toast.info('🪑 Seats updated live');
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showtime._id, fetchSeats]);

  /* ================= BOOKING ================= */

  const handleBook = async () => {
    if (!selectedSeats.length) {
      toast.error('Select at least one seat');
      return;
    }

    setBookingLoading(true);

    try {
      await api.post('/public/bookings', {
        showtimeId: showtime._id,
        seats: selectedSeats,
      });

      toast.success(
        `Booked ${selectedSeats.length} seat(s): ${selectedSeats.join(', ')}`
      );

      await fetchSeats();
      setSelectedSeats([]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  /* ================= DATE ================= */

  const date = new Date(showtime.startTime);

  let dateLabel = format(date, 'EEEE, MMMM d');
  if (isToday(date)) dateLabel = 'Today';
  else if (isTomorrow(date)) dateLabel = 'Tomorrow';

  const time = format(date, 'h:mm a');
  const daysAway = differenceInDays(date, new Date());

  const rows = showtime.room?.rows ?? 8;
  const columns = showtime.room?.columns ?? 12;

  const soonBadge =
    daysAway <= 3 ? (
      <Badge
        variant="secondary"
        className="bg-amber-900/50 text-amber-300 border-amber-700/40 text-xs"
      >
        {daysAway <= 0
          ? 'Today'
          : daysAway === 1
          ? 'Tomorrow'
          : `In ${daysAway} days`}
      </Badge>
    ) : null;

  /* ================= LOADING ================= */

  if (loadingSeats) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        Loading seat availability...
      </div>
    );
  }

  /* ================= UI ================= */

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
            {showtime.room?.name ?? 'Unknown Room'} — {rows} rows × {columns}{' '}
            columns
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-400">
            ${showtime.price.toFixed(2)}{' '}
            <span className="text-sm text-zinc-500">/ ticket</span>
          </div>
        </div>
      </div>

      {/* Seat Grid */}
      <SeatGrid
        rows={rows}
        columns={columns}
        bookedSeats={bookedSeats}
        mySeats={myBookedSeats}
        initialSelected={selectedSeats}
        onSelectionChange={setSelectedSeats}
        disabled={bookingLoading}
        maxSeats={8}
        showtimeId={showtime._id}
      />

      {/* Booking Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-zinc-800">
        <div className="text-zinc-300 text-lg">
          {selectedSeats.length > 0 ? (
            <>
              Selected:{' '}
              <span className="font-medium text-emerald-400">
                {selectedSeats.join(', ')}
              </span>
              <span className="ml-3">
                ({selectedSeats.length} × ${showtime.price.toFixed(2)})
              </span>
              <span className="ml-2 font-medium text-emerald-300">
                Total: $
                {(selectedSeats.length * showtime.price).toFixed(2)}
              </span>
            </>
          ) : (
            'Select seats above'
          )}
        </div>

        <Button
          className="bg-emerald-600 hover:bg-emerald-700 min-w-[180px]"
          disabled={
            bookingLoading || !selectedSeats.length || loadingSeats
          }
          onClick={handleBook}
        >
          {bookingLoading
            ? 'Booking...'
            : `Book ${selectedSeats.length || ''} Ticket${
                selectedSeats.length !== 1 ? 's' : ''
              }`}
        </Button>
      </div>
    </div>
  );
}