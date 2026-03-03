// src/components/public/SeatGrid.tsx
import { useState, useEffect } from 'react';

interface SeatGridProps {
  rows: number;
  columns: number;
  bookedSeats?: Set<string>;          // already taken seats (from API)
  selectedSeats?: string[];            // currently selected by user
  onSeatToggle?: (seat: string) => void; // callback when user clicks a seat
  disabled?: boolean;
  className?: string;
}

export default function SeatGrid({
  rows = 8,
  columns = 12,
  bookedSeats = new Set(),
  selectedSeats = [],
  onSeatToggle,
  disabled = false,
  className = '',
}: SeatGridProps) {
  // Optional: local state if no external selectedSeats provided
  const [internalSelected, setInternalSelected] = useState<string[]>(selectedSeats);

  // Sync with props if controlled from parent
  useEffect(() => {
    setInternalSelected(selectedSeats);
  }, [selectedSeats]);

  const toggleSeat = (seat: string) => {
    if (disabled || bookedSeats.has(seat)) return;

    if (onSeatToggle) {
      onSeatToggle(seat); // let parent handle it
    } else {
      // internal mode
      setInternalSelected(prev =>
        prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
      );
    }
  };

  const isSelected = (seat: string) =>
    onSeatToggle ? selectedSeats.includes(seat) : internalSelected.includes(seat);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Screen indicator */}
      <div className="w-full h-10 bg-zinc-700/70 rounded-md flex items-center justify-center text-sm font-medium text-zinc-400 mb-6">
        SCREEN
      </div>

      {/* Seat grid */}
      <div
        className="grid gap-2 mx-auto max-w-4xl"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: rows * columns }).map((_, index) => {
          const rowIndex = Math.floor(index / columns);
          const colIndex = index % columns;
          const seatId = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;

          const isBooked = bookedSeats.has(seatId);
          const isSel = isSelected(seatId);

          return (
            <button
              key={seatId}
              type="button"
              className={`
                aspect-square rounded-md text-xs md:text-sm font-medium transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950
                ${disabled || isBooked
                  ? 'bg-red-900/60 cursor-not-allowed text-red-300/60'
                  : isSel
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 scale-105'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:scale-105 active:scale-95'}
              `}
              onClick={() => toggleSeat(seatId)}
              disabled={disabled || isBooked}
              title={seatId}
            >
              {seatId}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-400 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-emerald-600" />
          Selected
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-800" />
          Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-red-900/60" />
          Booked
        </div>
      </div>
    </div>
  );
}