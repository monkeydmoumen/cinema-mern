// src/App.tsx — UPDATED: global Socket.IO notifications for new movie/showtime
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/public/Register';
import Profile from './pages/public/Profile';
import MoviesList from './pages/public/MoviesList';
import AdminLayout from './layout/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Movies from './pages/admin/Movies';
import Rooms from './pages/admin/Rooms';
import Showtimes from './pages/admin/Showtimes';
import MovieDetail from './pages/public/MovieDetail';
import Bookings from './pages/admin/Bookings';
import MyTickets from './pages/public/MyTickets';
import Home from './pages/public/Home';
import MovieChatPage from './pages/public/MovieChatPage';

const SOCKET_URL = 'https://cinema-mern-production.up.railway.app'; // ← your Railway backend

function App() {
  useEffect(() => {
    const socket = io(SOCKET_URL);

    // Listen for new movie created by admin
    socket.on('new-movie', ({ movie }: { movie: any }) => {
      toast.success(`New movie added: ${movie.title}`, {
        description: 'Browse it now in the movies list!',
        duration: 8000,
        action: {
          label: 'View Movies',
          onClick: () => window.location.href = '/movies',
        },
      });
    });

    // Listen for new showtime created by admin
    socket.on('new-showtime', ({ showtime }: { showtime: any }) => {
      toast.info(`New showtime scheduled!`, {
        description: `Movie: ${showtime.movie?.title || 'New movie'} at ${new Date(showtime.startTime).toLocaleString()}`,
        duration: 8000,
        action: {
          label: 'Check Showtimes',
          onClick: () => window.location.href = `/movies/${showtime.movie?._id || ''}`,
        },
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header />

        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home/>} />
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/movies" element={<MoviesList />} />
            <Route path="/movies/:id" element={<MovieDetail />} />
            <Route path="/my-tickets" element={<MyTickets />} />
<Route path="/movies/:id/chat" element={<MovieChatPage />} />
            {/* Protected routes (user + admin) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />

              {/* Admin section */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="movies" element={<Movies />} />
                <Route path="rooms" element={<Rooms />} />
                <Route path="showtimes" element={<Showtimes />} />
                <Route path="bookings" element={<Bookings />} />
              </Route>
            </Route>

            <Route path="*" element={<div className="text-center py-20 text-2xl">404 - Page Not Found</div>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;