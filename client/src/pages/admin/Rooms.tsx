// src/pages/admin/Rooms.tsx — full file with calculation
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import api from '@/lib/axios'
import { useAuth } from '@/context/AuthContext'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  rows: z.number().int().min(1, 'At least 1 row').max(50, 'Max 50 rows'),
  columns: z.number().int().min(1, 'At least 1 column').max(50, 'Max 50 columns'),
})

type RoomForm = z.infer<typeof roomSchema>

type Room = {
  _id: string
  name: string
  rows: number
  columns: number
  totalSeats: number
}

export default function Rooms() {
  const { isAuthenticated } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm<RoomForm>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: '', rows: 8, columns: 12 },
  })

  // Watch rows & columns to show live total
  const rows = form.watch('rows')
  const columns = form.watch('columns')
  const totalSeats = rows && columns ? rows * columns : 0

  useEffect(() => {
    if (!isAuthenticated) return

    const loadRooms = async () => {
      try {
        const { data } = await api.get('/admin/rooms')
        setRooms(data || [])
      } catch (err: any) {
        toast.error(err.response?.data?.error || 'Could not load rooms')
      }
    }
    loadRooms()
  }, [isAuthenticated])

  const onSubmit = async (data: RoomForm) => {
    try {
      const payload = {
        ...data,
        totalSeats: data.rows * data.columns, // calculate here
      }

      if (editingId) {
        await api.put(`/admin/rooms/${editingId}`, payload)
        toast.success('Room updated')
        setEditingId(null)
      } else {
        await api.post('/admin/rooms', payload)
        toast.success('Room created')
      }
      const { data: updated } = await api.get('/admin/rooms')
      setRooms(updated)
      form.reset()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed')
    }
  }

  const startEdit = (room: Room) => {
    setEditingId(room._id)
    form.reset({ name: room.name, rows: room.rows, columns: room.columns })
  }

  const cancelEdit = () => {
    setEditingId(null)
    form.reset()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this room? Related showtimes will be removed.')) return
    try {
      await api.delete(`/admin/rooms/${id}`)
      toast.success('Room deleted')
      const { data } = await api.get('/admin/rooms')
      setRooms(data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete room')
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Rooms</h2>
        <p className="text-zinc-400 mt-1">
          Define rows and columns for realistic seating layout.
        </p>
      </div>

      <Card className="bg-zinc-900/70 border-zinc-800">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Room' : 'Add New Room'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Room Name *</Label>
              <Input {...form.register('name')} placeholder="e.g. IMAX 1" />
              {form.formState.errors.name && (
                <p className="text-sm text-red-400">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Rows *</Label>
              <Input
                type="number"
                {...form.register('rows', { valueAsNumber: true })}
                placeholder="8"
              />
              {form.formState.errors.rows && (
                <p className="text-sm text-red-400">{form.formState.errors.rows.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Seats per Row *</Label>
              <Input
                type="number"
                {...form.register('columns', { valueAsNumber: true })}
                placeholder="12"
              />
              {form.formState.errors.columns && (
                <p className="text-sm text-red-400">{form.formState.errors.columns.message}</p>
              )}
            </div>

            {/* Live preview of total */}
            <div className="md:col-span-3 text-sm text-zinc-400">
              Total seats: <span className="font-medium text-emerald-400">{totalSeats}</span>
            </div>

            <div className="md:col-span-3 flex gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving…'
                  : editingId ? 'Update Room' : 'Create Room'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle>All Rooms ({rooms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-zinc-500 py-6">No rooms added yet</p>
          ) : (
            <div className="space-y-4">
              {rooms.map(r => (
                <div
                  key={r._id}
                  className="flex justify-between items-center border-b border-zinc-800 pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium text-lg">{r.name}</div>
                    <div className="text-sm text-zinc-500">
                      {r.rows} rows × {r.columns} columns = {r.totalSeats} seats
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r._id)}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}