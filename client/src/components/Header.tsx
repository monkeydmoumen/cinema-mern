// src/components/Header.tsx
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Film, User, LogOut, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <Film className="h-8 w-8 text-emerald-400" />
          <span className="text-2xl font-bold tracking-tight">Cinema</span>
        </Link>

        <nav className="flex items-center gap-8">
          <Link to="/movies" className="text-zinc-300 hover:text-white transition">
            Movies
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-8">
              <Link
                to="/my-tickets"
                className="text-sm font-medium text-zinc-300 hover:text-white transition flex items-center gap-2"
              >
                <Ticket className="h-4 w-4" />
                My Tickets
              </Link>

              <Link
                to="/profile"
                className="text-sm font-medium text-zinc-300 hover:text-white transition flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition"
                >
                  Admin Panel
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-300 hover:text-white transition"
              >
                Sign in
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}