// src/pages/public/MovieChatPage.tsx — FIXED: correct API paths (no double /api)
import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, MessageCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

const SOCKET_URL = 'https://cinema-mern-production.up.railway.app'; // ← your Railway backend

type Message = {
  _id: string;
  username: string;
  text: string;
  createdAt: string;
};

export default function MovieChatPage() {
  const { id } = useParams<{ id: string }>(); // movieId
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [movie, setMovie] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Fetch movie info
  useEffect(() => {
    if (!id) return;

    const fetchMovie = async () => {
      setLoadingMovie(true);
      try {
        const res = await api.get(`/public/movies/${id}`);
        setMovie(res.data);
      } catch (err) {
        toast.error('Failed to load movie info');
        navigate(`/movies/${id}`);
      } finally {
        setLoadingMovie(false);
      }
    };

    fetchMovie();
  }, [id, navigate]);

  // Fetch messages + Socket.IO
  useEffect(() => {
    if (!id) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await api.get(`/chat/${id}`); // ← FIXED: removed extra /api
        setMessages(res.data);
      } catch (err) {
        toast.error('Failed to load chat history');
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();

    // Socket.IO
    socketRef.current = io(SOCKET_URL);

    socketRef.current.emit('join-movie-chat', id);

    socketRef.current.on('new-chat-message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current?.off('new-chat-message');
      socketRef.current?.disconnect();
    };
  }, [id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !isAuthenticated || !id) return;

    setSending(true);
    try {
      await api.post(`/chat/${id}`, { text: newMessage.trim() }); // ← FIXED: removed extra /api
      setNewMessage('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loadingMovie) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-4">Movie not found</h2>
        <Button asChild>
          <Link to="/movies">Back to Movies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="text-zinc-400 hover:text-white">
              <Link to={`/movies/${id}`} className="flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                Back to Movie
              </Link>
            </Button>
            <h1 className="text-2xl font-bold truncate max-w-[300px] md:max-w-none">
              {movie.title} Chat
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="text-sm text-zinc-400">
                Logged in as <span className="text-emerald-400">{user?.name || 'You'}</span>
              </div>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/login">Sign in to chat</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
          {loadingMessages ? (
            <div className="flex flex-col gap-6">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg bg-zinc-800" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-20">
              <MessageCircle className="h-16 w-16 mb-6 opacity-50" />
              <p className="text-xl font-medium">No messages yet</p>
              <p className="text-sm mt-2">Be the first to start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex ${msg.username === user?.name ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                  msg.username === user?.name
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-100'
                }`}>
                  <div className="text-xs opacity-70 mb-1">
                    {msg.username} • {format(new Date(msg.createdAt), 'HH:mm')}
                  </div>
                  <p className="break-words">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {isAuthenticated ? (
          <form onSubmit={handleSend} className="mt-6 flex gap-3 sticky bottom-0 bg-zinc-950 py-4 border-t border-zinc-800">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message... (spoilers ok!)"
              className="flex-1 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-emerald-600"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[100px]"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Send'
              )}
            </Button>
          </form>
        ) : (
          <div className="mt-6 text-center py-6 bg-zinc-900/80 border-t border-zinc-800">
            <p className="text-zinc-400 mb-4">Sign in to join the conversation</p>
            <Button asChild>
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}