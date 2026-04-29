'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const STORAGE_KEY = 'blackjack-room';
const NAME_KEY = 'blackjack-name';
const DEFAULT_PLAYER_NAME = 'Player';

type RoomPlayer = {
  id?: string;
  name?: string;
  connected?: boolean;
};

type RemoteRoom = {
  roomId: string;
  players?: RoomPlayer[] | Record<string, RoomPlayer>;
  [key: string]: unknown;
};

type RoomAck = {
  ok: boolean;
  error?: string;
  room?: RemoteRoom;
};

type GameEventMessage = {
  event: string;
  payload?: unknown;
  from?: string;
};

function getStoredValue(key: string, fallback: string) {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return window.localStorage.getItem(key) || fallback;
}

function getPlayerCount(room: RemoteRoom | null) {
  if (!room?.players) {
    return 0;
  }

  return Array.isArray(room.players) ? room.players.length : Object.keys(room.players).length;
}

function formatPayload(payload: unknown) {
  if (payload == null) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

export function MultiplayerRoom() {
  const [roomId, setRoomId] = useState(() => getStoredValue(STORAGE_KEY, ''));
  const [playerName, setPlayerName] = useState(() => getStoredValue(NAME_KEY, ''));
  const [roomPassword, setRoomPassword] = useState('');
  const [connected, setConnected] = useState(false);
  const [activeRoom, setActiveRoom] = useState<RemoteRoom | null>(null);
  const [statusMessage, setStatusMessage] = useState('Create or join a room to sync moves.');
  const [errorMessage, setErrorMessage] = useState('');
  const [busyAction, setBusyAction] = useState<'create' | 'join' | null>(null);
  const [events, setEvents] = useState<GameEventMessage[]>([]);
  const [seat, setSeat] = useState(1);
  const [betAmount, setBetAmount] = useState(10);

  const socket = useMemo<Socket | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onConnect = () => {
      setConnected(true);
      setErrorMessage('');
    };
    const onDisconnect = () => setConnected(false);
    const onConnectError = (error: Error) => {
      setConnected(false);
      setErrorMessage(error.message || 'Unable to connect to socket server');
    };
    const onGameEvent = (message: GameEventMessage) => {
      setEvents((currentEvents) => [message, ...currentEvents].slice(0, 12));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('game:event', onGameEvent);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('game:event', onGameEvent);
      socket.disconnect();
    };
  }, [socket]);

  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const currentRoomId = activeRoom?.roomId || roomId.trim();
  const playerCount = getPlayerCount(activeRoom);
  const canUseRoom = Boolean(socket && connected);
  const canSendEvents = Boolean(canUseRoom && activeRoom?.roomId);

  const rememberRoom = (room: RemoteRoom) => {
    setActiveRoom(room);
    setRoomId(room.roomId);
    window.localStorage.setItem(STORAGE_KEY, room.roomId);
    window.localStorage.setItem(NAME_KEY, playerName.trim() || DEFAULT_PLAYER_NAME);
  };

  const applyRoomAck = (res: RoomAck | undefined, successMessage: string) => {
    if (!res?.ok || !res.room?.roomId) {
      setErrorMessage(res?.error || 'Room request failed');
      return;
    }

    rememberRoom(res.room);
    setEvents([]);
    setErrorMessage('');
    setStatusMessage(successMessage);
  };

  const createRoom = () => {
    if (!socket || !connected) {
      setErrorMessage('Socket is not connected yet');
      return;
    }

    setBusyAction('create');
    socket.emit(
      'room:create',
      {
        password: roomPassword,
        playerName: playerName.trim() || DEFAULT_PLAYER_NAME,
      },
      (res: RoomAck) => {
        setBusyAction(null);
        applyRoomAck(res, 'Room created. Share the room ID with another player.');
      }
    );
  };

  const joinRoom = () => {
    if (!socket || !connected) {
      setErrorMessage('Socket is not connected yet');
      return;
    }

    const trimmedRoomId = roomId.trim();
    if (!trimmedRoomId) {
      setErrorMessage('Enter a room ID to join');
      return;
    }

    setBusyAction('join');
    socket.emit(
      'room:join',
      {
        roomId: trimmedRoomId,
        password: roomPassword,
        playerName: playerName.trim() || DEFAULT_PLAYER_NAME,
      },
      (res: RoomAck) => {
        setBusyAction(null);
        applyRoomAck(res, 'Joined room. Gameplay events are now synced.');
      }
    );
  };

  const copyRoomId = async () => {
    if (!activeRoom?.roomId) {
      return;
    }

    await navigator.clipboard.writeText(activeRoom.roomId);
    setStatusMessage('Room ID copied.');
  };

  const sendGameEvent = (event: string, payload: Record<string, unknown> = {}) => {
    if (!socket || !activeRoom?.roomId) {
      setErrorMessage('Create or join a room before sending gameplay events');
      return;
    }

    const message = {
      roomId: activeRoom.roomId,
      event,
      payload: {
        seat,
        playerName: playerName.trim() || DEFAULT_PLAYER_NAME,
        ...payload,
      },
    };

    socket.emit('game:event', message);
    setEvents((currentEvents) => [
      {
        event,
        payload: message.payload,
        from: 'you',
      },
      ...currentEvents,
    ].slice(0, 12));
  };

  return (
    <div className="glass-alt rounded-3xl p-6 mb-8 border border-amber-500/20 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12)_0%,transparent_40%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.1)_0%,transparent_45%)] pointer-events-none"></div>

      <div className="relative z-10 grid gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-400/90 font-semibold">Online Table</p>
            <h2 className="text-3xl font-black text-gradient">Real-time multiplayer</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm text-slate-300">
            Player name
            <input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              placeholder="Your name"
              className="px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Room password
            <input
              value={roomPassword}
              onChange={(event) => setRoomPassword(event.target.value)}
              placeholder="Password"
              type="password"
              className="px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white"
            />
          </label>
          <label className="grid gap-2 text-sm text-slate-300">
            Room ID
            <input
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              placeholder="Paste room ID"
              className="px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={createRoom}
            disabled={!canUseRoom || busyAction !== null}
            className="px-5 py-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 text-white font-semibold btn-glow"
          >
            {busyAction === 'create' ? 'Creating...' : 'Create Room'}
          </button>
          <button
            onClick={joinRoom}
            disabled={!canUseRoom || busyAction !== null}
            className="px-5 py-3 rounded-xl bg-linear-to-r from-blue-500 to-indigo-600 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 text-white font-semibold btn-glow"
          >
            {busyAction === 'join' ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Socket URL</p>
            <p className="break-all text-sm font-semibold text-slate-200">{socketUrl || 'Not configured'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Room</p>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-white">{currentRoomId || 'None'}</p>
              {activeRoom?.roomId && (
                <button
                  onClick={copyRoomId}
                  className="rounded-lg border border-amber-400/40 px-2 py-1 text-xs font-semibold text-amber-200"
                >
                  Copy
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Players</p>
            <p className="text-lg font-bold text-white">{playerCount}</p>
          </div>
        </div>

        {(statusMessage || errorMessage) && (
          <div className={`rounded-2xl p-4 text-sm font-semibold ${
            errorMessage
              ? 'border border-red-500/60 bg-red-950/40 text-red-200'
              : 'border border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
          }`}>
            {errorMessage || statusMessage}
          </div>
        )}

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/35 p-5">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-2 text-sm text-slate-300">
              Seat
              <input
                type="number"
                min="1"
                value={seat}
                onChange={(event) => setSeat(Math.max(1, Number(event.target.value) || 1))}
                className="w-24 px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white"
              />
            </label>
            <label className="grid gap-2 text-sm text-slate-300">
              Bet
              <input
                type="number"
                min="1"
                value={betAmount}
                onChange={(event) => setBetAmount(Math.max(1, Number(event.target.value) || 1))}
                className="w-32 px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white"
              />
            </label>
            <button
              onClick={() => sendGameEvent('player:bet', { amount: betAmount })}
              disabled={!canSendEvents}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-green-500 to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 text-white font-semibold btn-glow"
            >
              Send Bet
            </button>
            <button
              onClick={() => sendGameEvent('player:hit')}
              disabled={!canSendEvents}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-blue-500 to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 text-white font-semibold btn-glow"
            >
              Hit
            </button>
            <button
              onClick={() => sendGameEvent('player:stand')}
              disabled={!canSendEvents}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-orange-500 to-orange-700 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 text-white font-semibold btn-glow"
            >
              Stand
            </button>
            <button
              onClick={() => sendGameEvent('player:double', { amount: betAmount * 2 })}
              disabled={!canSendEvents}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-purple-500 to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 text-white font-semibold btn-glow"
            >
              Double
            </button>
          </div>

          <div className="grid gap-2">
            <p className="text-sm font-semibold text-slate-300">Latest room events</p>
            {events.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-600/60 bg-slate-950/25 p-4 text-slate-400">
                No gameplay events yet.
              </div>
            ) : (
              <div className="grid gap-2">
                {events.map((message, index) => (
                  <div
                    key={`${message.event}-${index}`}
                    className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3 text-sm text-slate-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-amber-200">{message.event}</span>
                      <span className="text-xs text-slate-500">{message.from ? `from ${message.from}` : 'from room'}</span>
                    </div>
                    {message.payload != null && (
                      <p className="mt-1 break-all text-slate-400">{formatPayload(message.payload)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
