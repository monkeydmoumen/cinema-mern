// src/pages/admin/Movies.tsx — POLISHED VERSION (optional enhancements)
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import api from '@/lib/axios'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

// Available genres (expand as needed)
const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
  'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance',
  'Sci-Fi', 'Thriller', 'Documentary', 'Family', 'Musical',
];

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  posterUrl: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  trailerUrl: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
  duration: z.number().int().positive().optional(),
  genres: z.array(z.string()).optional(),
});

type MovieForm = z.infer<typeof movieSchema>;

type Movie = {
  _id: string;
  title: string;
  description?: string;
  posterUrl?: string;
  trailerUrl?: string;
  duration?: number;
  genres?: string[];
};

export default function Movies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<MovieForm>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      title: '',
      description: '',
      posterUrl: '',
      trailerUrl: '',
      duration: undefined,
      genres: [],
    },
  });

  useEffect(() => {
    const loadMovies = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/admin/movies');
        setMovies(data || []);
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Could not load movies';
        toast.error(msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadMovies();
  }, []);

  const onSubmit = async (data: MovieForm) => {
    try {
      if (editingId) {
        await api.put(`/admin/movies/${editingId}`, data);
        toast.success('Movie updated');
        setEditingId(null);
      } else {
        await api.post('/admin/movies', data);
        toast.success('Movie created');
      }
      const { data: updated } = await api.get('/admin/movies');
      setMovies(updated);
      form.reset();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const startEdit = (movie: Movie) => {
    setEditingId(movie._id);
    form.reset({
      title: movie.title,
      description: movie.description || '',
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || '',
      duration: movie.duration,
      genres: movie.genres || [],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this movie? Related showtimes will also be removed.')) return;
    try {
      await api.delete(`/admin/movies/${id}`);
      toast.success('Movie deleted');
      const { data } = await api.get('/admin/movies');
      setMovies(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete movie');
    }
  };

  const toggleGenre = (genre: string) => {
    const current = form.watch('genres') || [];
    if (current.includes(genre)) {
      form.setValue('genres', current.filter(g => g !== genre));
    } else {
      form.setValue('genres', [...current, genre]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-950/30 border-red-800">
        <CardContent className="p-8 text-center text-red-300">
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm mt-2">Try refreshing or check admin permissions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Movies</h2>
        <p className="text-zinc-400 mt-1">Add, edit and manage your movie catalog</p>
      </div>

      <Card className="bg-zinc-900/70 border-zinc-800">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Movie' : 'Add New Movie'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Title *</Label>
              <Input {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-sm text-red-400">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input type="number" {...form.register('duration', { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Trailer URL (optional)</Label>
              <Input placeholder="https://www.youtube.com/watch?v=..." {...form.register('trailerUrl')} />
              {form.formState.errors.trailerUrl && (
                <p className="text-sm text-red-400">{form.formState.errors.trailerUrl.message}</p>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Description</Label>
              <textarea
                className="w-full min-h-[110px] rounded-md border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register('description')}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Poster URL (optional)</Label>
              <Input placeholder="https://" {...form.register('posterUrl')} />
              {form.formState.errors.posterUrl && (
                <p className="text-sm text-red-400">{form.formState.errors.posterUrl.message}</p>
              )}
            </div>

            {/* Genres */}
            <div className="md:col-span-2 space-y-2">
              <Label>Genres</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {AVAILABLE_GENRES.map(genre => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={genre}
                      checked={form.watch('genres')?.includes(genre)}
                      onCheckedChange={() => toggleGenre(genre)}
                    />
                    <Label htmlFor={genre} className="text-sm cursor-pointer">
                      {genre}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Saving…'
                  : editingId ? 'Update Movie' : 'Create Movie'}
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
          <CardTitle>Movies ({movies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {movies.length === 0 ? (
            <p className="text-zinc-500 py-6">No movies added yet</p>
          ) : (
            <div className="space-y-4">
              {movies.map(m => (
                <div
                  key={m._id}
                  className="flex items-start justify-between border-b border-zinc-800 pb-4 last:border-0 gap-4"
                >
                  <div className="flex-1">
                    <div className="font-medium text-lg">{m.title}</div>
                    {m.genres && m.genres.length > 0 && (
                      <div className="text-sm text-zinc-400 mt-1">
                        Genres: {m.genres.join(', ')}
                      </div>
                    )}
                    {m.duration && <div className="text-sm text-zinc-400">{m.duration} min</div>}
                    {m.trailerUrl && (
                      <div className="text-xs text-zinc-500 mt-1 break-all">
                        Trailer: <a href={m.trailerUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                          {m.trailerUrl}
                        </a>
                      </div>
                    )}
                    {m.posterUrl && (
                      <div className="text-xs text-zinc-500 mt-1 break-all">{m.posterUrl}</div>
                    )}
                    {m.description && (
                      <div className="text-sm text-zinc-400 mt-2 line-clamp-2">{m.description}</div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(m._id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}