// src/types/cinema.ts
export interface Movie {
  _id: string;
  title: string;
  description?: string;
  posterUrl?: string;
  trailerUrl?: string;
  duration?: number;
  genres?: string[];
}

export interface Room {
  _id?: string;
  name: string;
  rows: number;
  columns: number;
  totalSeats: number;
  sections?: string[];
}

export interface Showtime {
  _id: string;
  startTime: string;
  
  price: number;
  movie?: Movie;
  room: Room;
}

export interface Booking {
  _id: string;
  user: { name: string; email: string };
  showtime: Showtime;
  seats: string[];
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  bookedAt: string;
}

export interface AdminShowtime {
  _id: string;
  movie: { _id: string; title: string };
  room: { _id: string; name: string; totalSeats: number };
  startTime: string;
  price: number;
}