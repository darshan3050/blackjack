'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSocket } from '@/components/SocketProvider';
import { RoomAck } from '@/lib/multiplayer';
import { readPlayerName, saveRoomSession } from '@/lib/roomSession';

const defaultPlayerName = 'Player';

export function RoomLobby() {
  const router = useRouter();
  const { socket, socketUrl, connected, error: socketError } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('');
  const [busyAction, setBusyAction] = useState<'create' | 'join' | null>(null);
  const [message, setMessage] = useState('');

  const displayName = playerName.trim() || defaultPlayerName;
  const disabled = !socket || !connected || busyAction !== null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPlayerName(readPlayerName());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const finishRoomEntry = (ack: RoomAck | undefined) => {
    setBusyAction(null);

    if (!ack?.ok || !ack.room?.roomId) {
      setMessage(ack?.error || 'Room request failed.');
      return;
    }

    saveRoomSession(ack.room.roomId, displayName, password);
    router.push(`/game/${ack.room.roomId}`);
  };

  const createRoom = () => {
    if (!socket || !connected) {
      setMessage('Socket is not connected yet.');
      return;
    }

    setMessage('');
    setBusyAction('create');
    socket.emit(
      'room:create',
      {
        password,
        playerName: displayName,
      },
      finishRoomEntry
    );
  };

  const joinRoom = () => {
    if (!socket || !connected) {
      setMessage('Socket is not connected yet.');
      return;
    }

    const normalizedRoomId = roomId.trim().toUpperCase();

    if (!normalizedRoomId) {
      setMessage('Enter a room ID.');
      return;
    }

    setMessage('');
    setBusyAction('join');
    socket.emit(
      'room:join',
      {
        roomId: normalizedRoomId,
        password,
        playerName: displayName,
      },
      finishRoomEntry
    );
  };

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1fr_1.1fr] lg:py-16">
      <div className="flex flex-col justify-center gap-5">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">
          Blackjack
        </p>
        <h1 className="text-5xl font-black text-white md:text-7xl">Play at a private table</h1>
        <p className="max-w-xl text-base leading-7 text-slate-300">
          Create a room, share the room ID and password, then play on a dedicated game page.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-300">
          <span className={`h-2.5 w-2.5 self-center rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          <span>{connected ? 'Connected to socket server' : 'Connecting to socket server'}</span>
        </div>
        <p className="break-all text-xs text-slate-500">{socketUrl || 'NEXT_PUBLIC_SOCKET_URL is not set'}</p>
      </div>

      <div className="rounded-2xl border border-amber-500/25 bg-slate-950/75 p-6 shadow-2xl">
        <div className="grid gap-4">
          <label className="grid gap-2 text-sm font-semibold text-slate-300">
            Player name
            <input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Your name"
              className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-300">
            Room password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 4 characters"
              type="password"
              className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white outline-none focus:border-amber-400"
            />
          </label>

          <div className="grid gap-3 border-t border-slate-700 pt-5">
            <button
              onClick={createRoom}
              disabled={disabled}
              className="rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {busyAction === 'create' ? 'Creating...' : 'Create Room'}
            </button>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                placeholder="Room ID"
                className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-white uppercase outline-none focus:border-blue-400"
              />
              <button
                onClick={joinRoom}
                disabled={disabled}
                className="rounded-xl bg-blue-500 px-5 py-3 font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {busyAction === 'join' ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>

          {(socketError || message) && (
            <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-sm font-semibold text-red-200">
              {message || socketError}
            </div>
          )}

          <Link
            href="/practice"
            className="text-center text-sm font-semibold text-slate-300 underline-offset-4 hover:text-amber-200 hover:underline"
          >
            Practice without multiplayer
          </Link>
        </div>
      </div>
    </section>
  );
}
