// src/components/public/SeatGrid.tsx — FIXED: Railway URL + use api instance for fetch
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios'; // ← use your configured api (Railway baseURL)

const SOCKET_URL = 'https://cinema-mern-production.up.railway.app'; // ← live Railway backend

interface SeatGridProps {
  rows: number;
  columns: number;
  bookedSeats: Set<string>;      // initial booked seats (red)
  mySeats: Set<string>;          // initial your seats (gold)
  initialSelected: string[];
  onSelectionChange?: (selected: string[]) => void;
  disabled?: boolean;
  maxSeats?: number;
  className?: string;
  showtimeId?: string;           // required for Socket.IO
}

export default function SeatGrid({
  rows = 8,
  columns = 12,
  bookedSeats: initialBookedSeats,
  mySeats: initialMySeats,
  initialSelected = [],
  onSelectionChange,
  disabled = false,
  maxSeats = Infinity,
  className = '',
  showtimeId,
}: SeatGridProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [liveBookedSeats, setLiveBookedSeats] = useState<Set<string>>(initialBookedSeats);
  const [liveMySeats, setLiveMySeats] = useState<Set<string>>(initialMySeats);

  // Sync props when they change
  useEffect(() => {
    setLiveBookedSeats(initialBookedSeats);
    setLiveMySeats(initialMySeats);
  }, [initialBookedSeats, initialMySeats]);

  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected]);

  // Real-time Socket.IO + live seat refresh
  useEffect(() => {
    if (!showtimeId) return;

    const socket = io(SOCKET_URL);

    socket.emit('join-showtime', showtimeId);

    socket.on('seats-updated', ({ showtimeId: updatedId }: { showtimeId: string }) => {
      if (updatedId === showtimeId) {
        // Refresh booked seats using api instance (no localhost!)
        const fetchLatest = async () => {
          try {
            const res = await api.get(`/public/bookings/seats/${showtimeId}`);
            setLiveBookedSeats(new Set(res.data));
            toast.info('Seat availability updated live!');
          } catch (err) {
            console.error('Failed to refresh seats:', err);
          }
        };
        fetchLatest();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [showtimeId]);

  const toggleSeat = (seat: string) => {
    if (disabled) return;

    if (liveBookedSeats.has(seat) && !liveMySeats.has(seat)) {
      return;
    }

    setSelected(prev => {
      const isAdding = !prev.includes(seat);

      if (isAdding && prev.length >= maxSeats) {
        toast.warning(`Maximum ${maxSeats} seats allowed`);
        return prev;
      }

      const newSelected = isAdding ? [...prev, seat] : prev.filter(s => s !== seat);

      onSelectionChange?.(newSelected);
      return newSelected;
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="w-full h-12 bg-zinc-700/70 rounded-md flex items-center justify-center text-sm font-medium text-zinc-300 mb-6">
        SCREEN
      </div>

      {rows * columns === 0 ? (
        <div className="text-center py-10 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          Loading seat map...
        </div>
      ) : (
        <div
          className="grid gap-2 mx-auto max-w-4xl"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: rows * columns }).map((_, i) => {
            const row = Math.floor(i / columns);
            const col = i % columns;
            const seatId = `${String.fromCharCode(65 + row)}${col + 1}`;

            const isOtherBooked = liveBookedSeats.has(seatId) && !liveMySeats.has(seatId);
            const isMy = liveMySeats.has(seatId);
            const isSelected = selected.includes(seatId);

            let bgClass = 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:scale-105';
            let cursor = 'cursor-pointer';

            if (disabled) {
              bgClass = 'bg-zinc-900 cursor-not-allowed text-zinc-600';
              cursor = 'cursor-not-allowed';
            } else if (isMy || isSelected) {
              bgClass = isSelected && !isMy
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 scale-105'
                : 'bg-amber-700/80 text-amber-100 shadow-lg shadow-amber-900/40';
              cursor = 'cursor-pointer';
            } else if (isOtherBooked) {
              bgClass = 'bg-red-900/70 cursor-not-allowed text-red-300/70';
              cursor = 'cursor-not-allowed';
            }

            return (
              <button
                key={seatId}
                type="button"
                className={`
                  aspect-square rounded-md text-xs md:text-sm font-medium transition-all duration-150
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950
                  ${bgClass} ${cursor}
                `}
                onClick={() => toggleSeat(seatId)}
                disabled={disabled || (isOtherBooked && !isMy)}
                title={seatId}
              >
                {seatId}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-300 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-600" /> Newly selected
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-amber-700/80" /> Your seats
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-800" /> Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-red-900/70" /> Booked
        </div>
      </div>

      {selected.length > 0 && (
        <div className="text-center text-zinc-300 mt-4 font-medium">
          Selected: {selected.join(', ')} ({selected.length} seats)
        </div>
      )}
    </div>
  );
}