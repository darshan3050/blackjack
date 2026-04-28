'use client';

import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MultiplayerRoomState } from '@/lib/multiplayer';
import { BettingControls } from './BettingControls';
import { GameControls } from './GameControls';
import { HandDisplay } from './Hand';

const STORAGE_KEY = 'blackjack-room';
const NAME_KEY = 'blackjack-name';

export function MultiplayerRoom() {
  const [roomId, setRoomId] = useState('table-1');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [roomState, setRoomState] = useState<MultiplayerRoomState | null>(null);
  const [manualBetMode, setManualBetMode] = useState(true);

  const socket = useMemo<Socket | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return io({
      autoConnect: false,
      path: '/socket.io',
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const savedRoomId = window.localStorage.getItem(STORAGE_KEY);
    const savedName = window.localStorage.getItem(NAME_KEY);

    if (savedRoomId) {
      setRoomId(savedRoomId);
    }
    if (savedName) {
      setPlayerName(savedName);
    }

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onJoined = ({ playerId: joinedPlayerId, state }: { playerId: string; state: MultiplayerRoomState }) => {
      setPlayerId(joinedPlayerId);
      setRoomState(state);
      setManualBetMode(state.gameState === 'betting');
    };
    const onUpdate = (state: MultiplayerRoomState) => {
      setRoomState(state);
      setManualBetMode(state.gameState === 'betting' && state.currentBet === 0);
    };
    const onError = ({ message }: { message: string }) => {
      console.error(message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:joined', onJoined);
    socket.on('room:update', onUpdate);
    socket.on('room:error', onError);

    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:joined', onJoined);
      socket.off('room:update', onUpdate);
      socket.off('room:error', onError);
      socket.disconnect();
    };
  }, [socket]);

  const playerBalance = roomState && playerId ? roomState.players[playerId]?.balance ?? 0 : 0;
  const canPlay = Boolean(socket && connected && playerId && roomState);
  const currentHand = roomState?.playerHand;
  const dealerHand = roomState?.dealerHand;
  const isMyTurn = roomState?.activePlayerId === playerId;

  const joinRoom = () => {
    if (!socket) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, roomId);
    window.localStorage.setItem(NAME_KEY, playerName);
    socket.emit('room:join', { roomId, name: playerName });
  };

  const emitRoomAction = (eventName: string, payload: Record<string, unknown> = {}) => {
    if (!socket || !roomState) {
      return;
    }

    socket.emit(eventName, { roomId: roomState.roomId, ...payload });
  };

  const handleBet = (amount: number) => {
    emitRoomAction('room:startRound', { betAmount: amount });
    setManualBetMode(false);
  };

  const handleHit = () => emitRoomAction('room:hit');
  const handleStand = () => emitRoomAction('room:stand');
  const handleDouble = () => emitRoomAction('room:double');
  const handlePlayAgain = () => emitRoomAction('room:playAgain');
  const handleChangeBet = () => setManualBetMode(true);

  return (
    <div className="glass-alt rounded-3xl p-6 mb-8 border border-amber-500/20 shadow-2xl relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.12)_0%,transparent_40%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.1)_0%,transparent_45%)] pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-400/90 font-semibold">Online Table</p>
            <h2 className="text-3xl font-black text-gradient">Real-time multiplayer</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <input
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Room code"
            className="px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white"
          />
          <input
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Your name"
            className="px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-600 text-white"
          />
          <button
            onClick={joinRoom}
            className="px-5 py-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-white font-semibold btn-glow"
          >
            Join room
          </button>
        </div>

        {roomState && (
          <div className="grid gap-4">
            <div className="grid gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Room</p>
                <p className="text-lg font-bold text-white">{roomState.roomId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Round</p>
                <p className="text-lg font-bold text-white">{roomState.roundNumber}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Your balance</p>
                <p className="text-lg font-bold text-amber-300">${playerBalance}</p>
              </div>
            </div>

            <div className={`rounded-2xl p-5 text-center font-bold text-lg ${
              roomState.playerWon === true
                ? 'bg-linear-to-r from-green-900/50 to-emerald-900/50 border border-green-500/60 text-green-300'
                : roomState.playerWon === false && !roomState.isDraw
                ? 'bg-linear-to-r from-red-900/50 to-rose-900/50 border border-red-500/60 text-red-300'
                : roomState.isDraw
                ? 'bg-linear-to-r from-yellow-900/50 to-amber-900/50 border border-yellow-500/60 text-yellow-300'
                : 'bg-linear-to-r from-slate-800/60 to-slate-700/60 border border-slate-600/60 text-slate-300'
            }`}>
              {roomState.message}
            </div>

            <div className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/35 p-5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-slate-400">Players in room</p>
                  <p className="text-white font-semibold">{Object.values(roomState.players).length}</p>
                </div>
                <div className="text-sm text-slate-300">
                  Turn: <span className="text-amber-300 font-semibold">{isMyTurn ? 'You' : 'Waiting'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.values(roomState.players).map((player) => (
                  <span
                    key={player.id}
                    className={`rounded-full px-3 py-1 text-sm border ${
                      player.id === playerId
                        ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
                        : 'border-slate-600 bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    {player.name} {player.connected ? '' : '(off)'}
                  </span>
                ))}
              </div>
            </div>

            {roomState.gameState === 'betting' && (manualBetMode || roomState.currentBet === 0) && (
              <BettingControls balance={playerBalance} onBet={handleBet} disabled={!canPlay} />
            )}

            {roomState.gameState !== 'betting' && currentHand && dealerHand && (
              <div className="bg-linear-to-b from-slate-900/80 via-slate-800/80 to-slate-900/80 rounded-3xl p-6 border border-amber-500/20 shadow-xl">
                <div className="mb-10 pb-8 border-b border-slate-700/50">
                  <HandDisplay
                    hand={dealerHand}
                    title="🎰 Dealer"
                    hideFirstCard={roomState.gameState === 'playing' && dealerHand.cards.length > 0}
                    isDealer={true}
                  />
                </div>

                <div className="mb-10 p-6 bg-slate-800/50 rounded-xl border border-amber-500/20">
                  <HandDisplay hand={currentHand} title={`👤 ${playerName || 'Your'} Hand`} />
                </div>

                <div className="mb-8 text-center p-4 bg-linear-to-r from-amber-900/30 to-orange-900/30 rounded-xl border border-amber-500/30">
                  <p className="text-amber-300 text-lg font-semibold mb-1">Current Bet</p>
                  <p className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-amber-300 to-amber-500">
                    ${roomState.currentBet}
                  </p>
                </div>

                <GameControls
                  onHit={handleHit}
                  onStand={handleStand}
                  onDoubleDown={handleDouble}
                  onNewGame={handleChangeBet}
                  onPlayAgain={handlePlayAgain}
                  canHit={roomState.gameState === 'playing' && isMyTurn}
                  canStand={roomState.gameState === 'playing' && isMyTurn}
                  canDoubleDown={roomState.gameState === 'playing' && isMyTurn && currentHand.cards.length === 2}
                  gameFinished={roomState.gameState === 'finished'}
                  lastBet={roomState.currentBet}
                />
              </div>
            )}

            {roomState.gameState === 'finished' && roomState.finished && (
              <div className="text-center mt-8 p-5 rounded-2xl border border-slate-600/40 bg-linear-to-r from-slate-800/60 to-slate-700/60">
                <p className="text-slate-300 mb-2">Finish strong or change the wager.</p>
                <p className="text-sm text-slate-500">Play Again repeats the same bet. Change Bet returns you to betting mode.</p>
              </div>
            )}
          </div>
        )}

        {!roomState && (
          <div className="rounded-2xl border border-dashed border-slate-600/60 bg-slate-950/25 p-6 text-slate-300">
            Join a room to sync the table in real time.
          </div>
        )}
      </div>
    </div>
  );
}
