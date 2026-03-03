import { NavLink } from 'react-router-dom';
import { Film, DoorOpen, Calendar, LogOut, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function AdminSidebar() {
  const { logout } = useAuth();

const handleLogout = () => {
    logout();                     // ← calls context logout → clears token + user
    toast.success('Logged out');
    // No need for window.location — ProtectedRoute will redirect automatically
    // But if you want instant redirect:
    // window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h2 className="text-2xl font-bold text-emerald-400">Cinema Admin</h2>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavLink
          to="/admin"
          end
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`
          }
        >
          <Calendar className="h-5 w-5" />
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/movies"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`
          }
        >
          <Film className="h-5 w-5" />
          Movies
        </NavLink>

        <NavLink
          to="/admin/rooms"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`
          }
        >
          <DoorOpen className="h-5 w-5" />
          Rooms
        </NavLink>

        <NavLink
          to="/admin/showtimes"
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`
          }
        >
          <Calendar className="h-5 w-5" />
          Showtimes
        </NavLink>
<div className="pt-6 mt-4 border-t border-zinc-800">
    <p className="px-4 text-xs text-zinc-500 uppercase tracking-wider mb-2">
      Coming Soon
    </p>
<NavLink
  to="/admin/bookings"  // ← change to real route later
  className={({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
    }`
  }
>
  <Ticket className="h-5 w-5" />
  Tickets & Bookings
</NavLink>
  </div>

      </nav>

         <div className="p-4 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      
      
      </div>
      
    </aside>
  );
}