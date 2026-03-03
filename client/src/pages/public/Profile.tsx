// src/pages/Profile.tsx
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Ticket, User, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';

type Booking = {
  _id: string;
  showtime: {
    movie: { title: string; posterUrl?: string };
    room: { name: string };
    startTime: string;
  };
  seats: string[];
  totalPrice: number;
  bookedAt: string;
};

export default function Profile() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const fetchMyBookings = async () => {
      try {
        const res = await api.get('/public/my-bookings');
        setBookings(res.data);
      } catch (err: any) {
        toast.error('Failed to load your bookings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [isAuthenticated, user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const upcomingBookings = bookings.filter(b => new Date(b.showtime.startTime) > new Date());
  const pastBookings = bookings.filter(b => new Date(b.showtime.startTime) <= new Date());

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-4xl font-bold tracking-tight mb-10">My Profile</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left column - User Info */}
        <Card className="md:col-span-1 bg-zinc-900/70 border-zinc-800 h-fit sticky top-8">
          <CardHeader className="text-center pb-4">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarFallback className="text-3xl bg-emerald-600">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user?.name || 'User'}</CardTitle>
            <p className="text-zinc-400 text-sm">{user?.email}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-300">
                <Mail className="h-5 w-5 text-emerald-400" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <User className="h-5 w-5 text-emerald-400" />
                <span>Role: {user?.role}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-300">
                <Calendar className="h-5 w-5 text-emerald-400" />
                <span>Member since: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </CardContent>
        </Card>

        {/* Right column - Bookings */}
        <div className="md:col-span-2 space-y-10">
          {/* Upcoming Bookings */}
          <Card className="bg-zinc-900/70 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Ticket className="h-6 w-6 text-emerald-400" />
                Upcoming Tickets ({upcomingBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-12 text-zinc-500">Loading your bookings...</p>
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No upcoming tickets yet</p>
                  <Button className="mt-6" asChild>
                    <Link to="/movies">Browse Movies</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingBookings.map(booking => {
                    const date = new Date(booking.showtime.startTime);
                    return (
                      <div
                        key={booking._id}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border border-zinc-800 rounded-lg hover:bg-zinc-800/50 transition"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          {booking.showtime.movie.posterUrl && (
                            <img
                              src={booking.showtime.movie.posterUrl}
                              alt={booking.showtime.movie.title}
                              className="w-20 h-28 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{booking.showtime.movie.title}</h3>
                            <p className="text-zinc-400 text-sm mt-1">
                              {date.toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-zinc-500 text-sm mt-1">
                              {booking.showtime.room.name} • Seats: {booking.seats.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xl font-bold text-emerald-400">
                            ${booking.totalPrice.toFixed(2)}
                          </p>
                          <Button size="sm" variant="outline" className="mt-2">
                            View Ticket
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Bookings (optional) */}
          {pastBookings.length > 0 && (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle>Past Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastBookings.map(booking => (
                    <div key={booking._id} className="p-4 border border-zinc-800 rounded-lg">
                      <h4 className="font-medium">{booking.showtime.movie.title}</h4>
                      <p className="text-sm text-zinc-500">
                        {new Date(booking.showtime.startTime).toLocaleDateString()} • {booking.seats.join(', ')}
                      </p>
                      <p className="text-sm text-emerald-400 mt-1">
                        ${booking.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}