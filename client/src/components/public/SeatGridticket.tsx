// src/components/public/SeatGrid.tsx — FULL UPDATED with built-in Socket.IO real-time updates
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SOCKET_URL = 'http://localhost:4000'; // your backend URL

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
  showtimeId?: string;           // NEW: required for real-time listening
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
  showtimeId,                    // pass this from parent!
}: SeatGridProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [liveBookedSeats, setLiveBookedSeats] = useState<Set<string>>(initialBookedSeats);
  const [liveMySeats, setLiveMySeats] = useState<Set<string>>(initialMySeats);

  // Sync initial props when they change
  useEffect(() => {
    setLiveBookedSeats(initialBookedSeats);
    setLiveMySeats(initialMySeats);
  }, [initialBookedSeats, initialMySeats]);

  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected]);

  // Real-time Socket.IO listener
  useEffect(() => {
    if (!showtimeId) return;

    const socket = io(SOCKET_URL);

    socket.emit('join-showtime', showtimeId);

    socket.on('seats-updated', ({ showtimeId: updatedId }: { showtimeId: string }) => {
      if (updatedId === showtimeId) {
        // Re-fetch latest booked seats (or you could receive delta in future)
        const fetchLatest = async () => {
          try {
            const res = await fetch(`/api/public/bookings/seats/${showtimeId}`);
            const data = await res.json();
            setLiveBookedSeats(new Set(data));
          } catch (err) {
            console.error('Failed to refresh seats:', err);
          }
        };
        fetchLatest();

        toast.info('Seat availability updated live');
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
              if (isSelected && !isMy) {
                bgClass = 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 scale-105';
               
              } else {
                bgClass = 'bg-amber-700/80 text-amber-100 shadow-lg shadow-amber-900/40';
                
              }
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