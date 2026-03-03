// AdminLayout.tsx
import { Outlet } from 'react-router-dom'
import AdminSidebar from '@/components/AdminSidebar'
import { useAuth } from '@/context/AuthContext'
import { UserCircle } from 'lucide-react'

export default function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        <header className="border-b border-zinc-800 bg-zinc-900/70 backdrop-blur-sm p-4 md:p-6 sticky top-0 z-10 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Admin Panel
          </h1>

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium">{user.name || user.email}</p>
                <p className="text-xs text-zinc-500">{user.role}</p>
              </div>
              <UserCircle className="h-10 w-10 text-zinc-400" />
            </div>
          )}
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}