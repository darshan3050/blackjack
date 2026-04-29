'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSocket } from '@/components/SocketProvider';
import { HandDisplay } from '@/components/Hand';
import { MultiplayerPlayer, MultiplayerRoomState, RoomAck } from '@/lib/multiplayer';
import { readPlayerName, readRoomPassword, saveRoomSession } from '@/lib/roomSession';

const defaultPlayerName = 'Player';

function PlayerBadge({ player, active }: { player: MultiplayerPlayer; active: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        active
          ? 'border-amber-400 bg-amber-400/10 text-amber-100'
          : 'border-slate-700 bg-slate-900/80 text-slate-300'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold">{player.name}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${player.connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>{player.host ? 'Host' : 'Player'}</span>
        <span>${player.balance}</span>
      </div>
    </div>
  );
}

export function MultiplayerGame({ roomId }: { roomId: string }) {
  const normalizedRoomId = roomId.trim().toUpperCase();
  const { socket, connected, error: socketError } = useSocket();
  const [playerName, setPlayerName] = useState(defaultPlayerName);
  const [password, setPassword] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [room, setRoom] = useState<MultiplayerRoomState | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPlayerName(readPlayerName() || defaultPlayerName);
      setPassword(readRoomPassword(normalizedRoomId));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [normalizedRoomId]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleRoomUpdate = (nextRoom: MultiplayerRoomState) => {
      if (nextRoom.roomId === normalizedRoomId) {
        setRoom(nextRoom);
      }
    };
    const handleRoomError = (payload: { message?: string }) => {
      setMessage(payload.message || 'Room error.');
    };

    socket.on('room:update', handleRoomUpdate);
    socket.on('room:error', handleRoomError);

    return () => {
      socket.off('room:update', handleRoomUpdate);
      socket.off('room:error', handleRoomError);
    };
  }, [normalizedRoomId, socket]);

  const applyAck = useCallback(
    (ack: RoomAck | undefined) => {
      setBusy(false);

      if (!ack?.ok || !ack.room) {
        setMessage(ack?.error || 'Room request failed.');
        return;
      }

      setMessage('');
      setPlayerId(ack.playerId || socket?.id || '');
      setRoom(ack.room);
      saveRoomSession(ack.room.roomId, playerName || defaultPlayerName, password);
    },
    [password, playerName, socket?.id]
  );

  const joinRoom = useCallback(() => {
    if (!socket || !connected) {
      setMessage('Socket is not connected yet.');
      return;
    }

    if (!password) {
      setMessage('Enter the room password to join.');
      return;
    }

    setBusy(true);
    socket.emit(
      'room:join',
      {
        roomId: normalizedRoomId,
        password,
        playerName: playerName || defaultPlayerName,
      },
      applyAck
    );
  }, [applyAck, connected, normalizedRoomId, password, playerName, socket]);

  useEffect(() => {
    if (socket && connected && password && playerName && !room && !busy) {
      const timer = window.setTimeout(joinRoom, 0);
      return () => window.clearTimeout(timer);
    }
  }, [busy, connected, joinRoom, password, playerName, room, socket]);

  const currentPlayer = useMemo(
    () => room?.players.find((player) => player.socketId === playerId) || null,
    [playerId, room?.players]
  );
  const activePlayer = useMemo(
    () => room?.players.find((player) => player.socketId === room.activePlayerId) || null,
    [room]
  );
  const isPlayerTurn = Boolean(room && playerId && room.activePlayerId === playerId && room.gameState === 'playing');
  const canBet = Boolean(room && currentPlayer && (room.gameState === 'betting' || room.gameState === 'finished'));
  const canDouble =
    isPlayerTurn &&
    room?.playerHand.cards.length === 2 &&
    (currentPlayer?.balance ?? 0) >= (room?.currentBet || 0);

  const emitRoomAction = (event: string, payload: Record<string, unknown> = {}) => {
    if (!socket || !room) {
      setMessage('Join the room first.');
      return;
    }

    setBusy(true);
    socket.emit(event, { roomId: normalizedRoomId, ...payload }, applyAck);
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(normalizedRoomId);
    setMessage('Room ID copied.');
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">Room</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black">{normalizedRoomId}</h1>
              <button
                onClick={copyRoomId}
                className="rounded-lg border border-amber-400/50 px-3 py-1 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/10"
              >
                Copy ID
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-sm text-slate-300">{connected ? 'Connected' : 'Disconnected'}</span>
            <Link
              href="/"
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-200"
            >
              Home
            </Link>
          </div>
        </header>

        {!room && (
          <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                Player name
                <input
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  className="rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                Room password
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  className="rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                />
              </label>
              <button
                onClick={joinRoom}
                disabled={!connected || busy}
                className="self-end rounded-xl bg-amber-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {busy ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </section>
        )}

        {(socketError || message) && (
          <div
            className={`rounded-xl border p-4 text-sm font-semibold ${
              socketError
                ? 'border-red-500/50 bg-red-950/40 text-red-200'
                : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
            }`}
          >
            {socketError || message}
          </div>
        )}

        {room && (
          <>
            <section className="grid gap-3 md:grid-cols-3">
              {room.players.map((player) => (
                <PlayerBadge
                  key={player.socketId}
                  player={player}
                  active={player.socketId === room.activePlayerId}
                />
              ))}
            </section>

            <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5 text-center">
              <p className="text-lg font-bold text-amber-100">{room.message}</p>
              {activePlayer && room.gameState === 'playing' && (
                <p className="mt-1 text-sm text-slate-400">
                  Active player: {activePlayer.name}
                </p>
              )}
            </section>

            {(room.playerHand.cards.length > 0 || room.dealerHand.cards.length > 0) && (
              <section className="rounded-3xl border border-amber-500/30 bg-slate-900/80 p-6 shadow-2xl">
                <div className="border-b border-slate-700 pb-8">
                  <HandDisplay
                    hand={room.dealerHand}
                    title="Dealer"
                    hideFirstCard={room.gameState === 'playing' && room.dealerHand.cards.length > 0}
                    isDealer
                  />
                </div>
                <div className="pt-8">
                  <HandDisplay hand={room.playerHand} title={activePlayer ? activePlayer.name : 'Player'} />
                </div>
                <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-center">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-200">Current Bet</p>
                  <p className="mt-1 text-3xl font-black text-amber-100">${room.currentBet}</p>
                </div>
              </section>
            )}

            {canBet && (
              <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <div className="flex flex-wrap items-end justify-center gap-3">
                  <label className="grid gap-2 text-sm font-semibold text-slate-300">
                    Bet amount
                    <input
                      type="number"
                      min="1"
                      max={currentPlayer?.balance || 1}
                      value={betAmount}
                      onChange={(event) => setBetAmount(Math.max(1, Number(event.target.value) || 1))}
                      className="w-36 rounded-xl border border-slate-600 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                    />
                  </label>
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setBetAmount(amount)}
                      disabled={(currentPlayer?.balance || 0) < amount}
                      className="rounded-xl border border-slate-600 px-4 py-3 font-bold text-slate-200 transition hover:border-amber-400 hover:text-amber-200 disabled:cursor-not-allowed disabled:text-slate-600"
                    >
                      ${amount}
                    </button>
                  ))}
                  <button
                    onClick={() => emitRoomAction('room:startRound', { betAmount })}
                    disabled={busy || !currentPlayer || betAmount > currentPlayer.balance}
                    className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    Deal
                  </button>
                </div>
              </section>
            )}

            {(room.gameState === 'playing' || room.gameState === 'dealerTurn') && (
              <section className="flex flex-wrap justify-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
                <button
                  onClick={() => emitRoomAction('room:hit')}
                  disabled={!isPlayerTurn || busy}
                  className="rounded-xl bg-blue-500 px-6 py-3 font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Hit
                </button>
                <button
                  onClick={() => emitRoomAction('room:stand')}
                  disabled={!isPlayerTurn || busy}
                  className="rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Stand
                </button>
                <button
                  onClick={() => emitRoomAction('room:double')}
                  disabled={!canDouble || busy}
                  className="rounded-xl bg-purple-500 px-6 py-3 font-bold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  Double
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
