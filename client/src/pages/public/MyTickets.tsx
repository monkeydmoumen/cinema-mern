// src/pages/MyTickets.tsx — FULL UPDATED with Pay button + pending logic
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Ticket, Calendar, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import SeatGrid from '@/components/public/SeatGridticket';

type Booking = {
  _id: string;
  showtime: {
    _id: string;
    movie: { title: string; posterUrl?: string };
    room: { name: string; rows?: number; columns?: number; totalSeats?: number };
    startTime: string;
    price: number;
  };
  seats: string[];
  totalPrice: number;
  bookedAt: string;
  status: string;
};

export default function MyTickets() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditingSeats, setIsEditingSeats] = useState(false);
  const [editSelectedSeats, setEditSelectedSeats] = useState<string[]>([]);
  const [editBookedSeats, setEditBookedSeats] = useState<Set<string>>(new Set());
  const [cancelLoading, setCancelLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [roomLayout, setRoomLayout] = useState<{ rows: number; columns: number } | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/public/my-bookings');
        setBookings(res.data);
      } catch (err: any) {
        toast.error('Failed to load your tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const upcoming = bookings.filter(
    b => new Date(b.showtime.startTime) > new Date() && (b.status === 'confirmed' || b.status === 'pending')
  );
  const past = bookings.filter(
    b => new Date(b.showtime.startTime) <= new Date() || b.status === 'cancelled'
  );

  const openTicketModal = async (booking: Booking) => {
    setSelectedBooking(booking);
    setEditSelectedSeats(booking.seats);
    setIsEditingSeats(false);
    setEditBookedSeats(new Set());

    // Fetch full room layout
    try {
      const res = await api.get(`/public/showtimes/${booking.showtime._id}`);
      const room = res.data.room;
      setRoomLayout({
        rows: room.rows || 8,
        columns: room.columns || 12,
      });
    } catch (err) {
      console.error('Failed to load room layout:', err);
      toast.error('Could not load room details');
      setRoomLayout({ rows: 8, columns: 12 }); // fallback
    }
  };

  const closeModal = () => {
    setSelectedBooking(null);
    setIsEditingSeats(false);
    setRoomLayout(null);
  };

  // Fetch booked seats excluding current booking when edit mode starts
  useEffect(() => {
    if (isEditingSeats && selectedBooking) {
      const fetchEditBooked = async () => {
        try {
          const res = await api.get(
            `/public/bookings/seats/${selectedBooking.showtime._id}?excludeBookingId=${selectedBooking._id}`
          );
          setEditBookedSeats(new Set(res.data));
        } catch (err) {
          console.error('Failed to load booked seats for edit:', err);
          toast.error('Could not load seat availability');
        }
      };
      fetchEditBooked();
    }
  }, [isEditingSeats, selectedBooking]);

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this ticket? This action cannot be undone.')) return;

    setCancelLoading(true);
    try {
      await api.delete(`/public/my-bookings/${bookingId}`);
      toast.success('Ticket cancelled successfully');
      const res = await api.get('/public/my-bookings');
      setBookings(res.data);
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel ticket');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSaveSeats = async () => {
    if (!selectedBooking) return;

    try {
      const res = await api.patch(`/public/my-bookings/${selectedBooking._id}`, {
        seats: editSelectedSeats,
      });

      toast.success('Seats updated successfully');
      const updatedBookings = await api.get('/public/my-bookings');
      setBookings(updatedBookings.data);

      setSelectedBooking(res.data);
      setEditSelectedSeats(res.data.seats);
      setIsEditingSeats(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update seats');
    }
  };

  const handlePay = async () => {
    if (!selectedBooking) return;

    setPayLoading(true);
    try {
      // Mock payment delay (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await api.patch(`/public/my-bookings/${selectedBooking._id}/pay`);

      toast.success('Payment successful! Booking confirmed.');
      const updatedBookings = await api.get('/public/my-bookings');
      setBookings(updatedBookings.data);

      setSelectedBooking(res.data);
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-4xl font-bold tracking-tight mb-10 flex items-center gap-3 text-white">
        <Ticket className="h-10 w-10 text-emerald-400" />
        My Tickets
      </h1>

      {loading ? (
        <div className="text-center py-20 text-zinc-500">Loading your tickets...</div>
      ) : bookings.length === 0 ? (
        <Card className="bg-zinc-900/70 border-zinc-800 text-center py-16">
          <CardContent>
            <Ticket className="h-16 w-16 mx-auto mb-6 text-zinc-500 opacity-70" />
            <h2 className="text-2xl font-semibold mb-4 text-white">No tickets yet</h2>
            <p className="text-zinc-400 mb-8">
              You haven't booked any tickets. Start exploring movies!
            </p>
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Link to="/movies">Browse Movies</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                <Calendar className="h-6 w-6 text-emerald-400" />
                Upcoming ({upcoming.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(booking => {
                  const date = new Date(booking.showtime.startTime);
                  return (
                    <Card key={booking._id} className="bg-zinc-900/70 border-zinc-800 overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-start gap-4 text-white">
                          {booking.showtime.movie.posterUrl && (
                            <img
                              src={booking.showtime.movie.posterUrl}
                              alt={booking.showtime.movie.title}
                              className="w-20 h-28 object-cover rounded-md"
                            />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold">{booking.showtime.movie.title}</h3>
                            <p className="text-sm text-zinc-400 mt-1">
                              {format(date, 'EEEE, MMMM d • h:mm a')}
                            </p>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-white">
                        <div className="flex justify-between text-sm">
                          <div className="text-zinc-400">Room</div>
                          <div>{booking.showtime.room.name}</div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <div className="text-zinc-400">Seats</div>
                          <div className="font-medium">{booking.seats.join(', ')}</div>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                          <div>Total</div>
                          <div className="text-emerald-400">${booking.totalPrice.toFixed(2)}</div>
                        </div>
                        <div className="flex gap-3 mt-4">
                          <Button
                            variant="outline"
                            className="flex-1 text-white border-zinc-600 hover:bg-zinc-800"
                            onClick={() => openTicketModal(booking)}
                          >
                            View / Edit
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleCancel(booking._id)}
                            disabled={cancelLoading}
                          >
                            {cancelLoading ? 'Cancelling...' : 'Cancel'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Past */}
          {past.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
                <Calendar className="h-6 w-6 text-zinc-500" />
                Past Tickets ({past.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {past.map(booking => (
                  <Card key={booking._id} className="bg-zinc-900/50 border-zinc-800 opacity-90">
                    <CardContent className="pt-6 space-y-4 text-white">
                      <h3 className="font-medium">{booking.showtime.movie.title}</h3>
                      <p className="text-sm text-zinc-500">
                        {format(new Date(booking.showtime.startTime), 'EEEE, MMMM d • h:mm a')} • {booking.seats.join(', ')}
                      </p>
                      <p className="text-sm text-emerald-400 font-medium">
                        ${booking.totalPrice.toFixed(2)}
                      </p>
                      {booking.status === 'cancelled' && (
                        <Badge className="mt-2 bg-red-900/30 text-red-300 border-red-800">
                          Cancelled
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Ticket Detail / Edit Modal */}
      <Dialog open={!!selectedBooking} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-[700px] bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto text-white">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3 text-white">
                  <Ticket className="h-6 w-6 text-emerald-400" />
                  Ticket Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-8 py-6">
                {/* Movie + basic info */}
                <div className="flex flex-col sm:flex-row gap-6">
                  {selectedBooking.showtime.movie.posterUrl && (
                    <img
                      src={selectedBooking.showtime.movie.posterUrl}
                      alt={selectedBooking.showtime.movie.title}
                      className="w-full sm:w-40 h-60 object-cover rounded-lg border border-zinc-700"
                    />
                  )}
                  <div className="flex-1 space-y-4">
                    <h3 className="text-2xl font-bold text-white">{selectedBooking.showtime.movie.title}</h3>
                    <div className="space-y-2 text-zinc-300">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-emerald-400" />
                        <span>
                          {format(new Date(selectedBooking.showtime.startTime), 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-emerald-400" />
                        <span>
                          {format(new Date(selectedBooking.showtime.startTime), 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-block w-5" />
                        <span className="font-medium">{selectedBooking.showtime.room.name}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seats section */}
                <div className="border-t border-zinc-800 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold text-white">Seats</h4>
                    {selectedBooking.status === 'confirmed' &&
                      new Date(selectedBooking.showtime.startTime) > new Date() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingSeats(!isEditingSeats)}
                          className="text-white border-zinc-600 hover:bg-zinc-800"
                        >
                          {isEditingSeats ? 'Cancel Edit' : 'Edit Seats'}
                        </Button>
                      )}
                    {selectedBooking.status === 'pending' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handlePay}
                        disabled={payLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {payLoading ? 'Processing...' : 'Pay Now'}
                      </Button>
                    )}
                  </div>

                  {isEditingSeats ? (
                    <>
                      {roomLayout ? (
                        <SeatGrid
                          rows={roomLayout.rows}
                          columns={roomLayout.columns}
                          bookedSeats={editBookedSeats}
                          mySeats={new Set(selectedBooking.seats)}
                          initialSelected={editSelectedSeats}
                          onSelectionChange={setEditSelectedSeats}
                          maxSeats={8}
                        />
                      ) : (
                        <p className="text-center text-zinc-500 py-10">
                          Loading room layout...
                        </p>
                      )}

                      {/* Live price preview */}
                      {editSelectedSeats.length > 0 && (
                        <div className="mt-4 text-right text-lg font-medium text-zinc-300">
                          Total: <span className="text-emerald-400">
                            ${(editSelectedSeats.length * selectedBooking.showtime.price).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between py-3 text-lg text-white">
                      <span className="text-zinc-400">Selected Seats</span>
                      <span className="font-medium">{selectedBooking.seats.join(', ')}</span>
                    </div>
                  )}

                  {isEditingSeats && (
                    <div className="mt-6 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsEditingSeats(false)} className="text-white border-zinc-600 hover:bg-zinc-800">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveSeats}
                        disabled={editSelectedSeats.length === 0 || editSelectedSeats.length > 8}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>

                {/* Price & status */}
                <div className="border-t border-zinc-800 pt-6">
                  <div className="flex justify-between items-center text-xl font-bold text-white">
                    <span>Total Price</span>
                    <span className="text-emerald-400">${selectedBooking.totalPrice.toFixed(2)}</span>
                  </div>
                  {selectedBooking.status !== 'confirmed' && (
                    <Badge className="mt-4 bg-zinc-800 text-zinc-300 border-zinc-700">
                      {selectedBooking.status.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {/* QR placeholder */}
                <div className="bg-white/5 p-8 rounded-xl text-center border border-zinc-700">
                  <div className="w-56 h-56 mx-auto bg-white flex items-center justify-center text-black font-mono text-xl font-bold">
                    [QR CODE]
                  </div>
                  <p className="text-sm text-zinc-500 mt-4">
                    Show this QR code at the cinema entrance
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-3">
                <Button variant="outline" onClick={closeModal} className="text-white border-zinc-600 hover:bg-zinc-800">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}