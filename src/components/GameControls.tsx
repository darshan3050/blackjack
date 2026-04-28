'use client';

interface GameControlsProps {
  onHit: () => void;
  onStand: () => void;
  onDoubleDown: () => void;
  onNewGame: () => void;
  onPlayAgain: () => void;
  canHit: boolean;
  canStand: boolean;
  canDoubleDown: boolean;
  gameFinished: boolean;
  lastBet?: number;
}

export function GameControls({
  onHit,
  onStand,
  onDoubleDown,
  onNewGame,
  onPlayAgain,
  canHit,
  canStand,
  canDoubleDown,
  gameFinished,
  lastBet = 0,
}: GameControlsProps) {
  return (
    <div className="flex gap-4 flex-wrap justify-center mb-4 slide-up-animation">
      {!gameFinished && (
        <>
          <button
            onClick={onHit}
            disabled={!canHit}
            className={`
              px-8 py-4 font-bold rounded-xl transition-all duration-300 btn-glow text-white text-lg
              ${
                canHit
                  ? 'bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 shadow-lg hover:shadow-blue-500/50 active:scale-95'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            🃏 Hit
          </button>

          <button
            onClick={onStand}
            disabled={!canStand}
            className={`
              px-8 py-4 font-bold rounded-xl transition-all duration-300 btn-glow text-white text-lg
              ${
                canStand
                  ? 'bg-gradient-to-br from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 shadow-lg hover:shadow-orange-500/50 active:scale-95'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            ✋ Stand
          </button>

          <button
            onClick={onDoubleDown}
            disabled={!canDoubleDown}
            className={`
              px-8 py-4 font-bold rounded-xl transition-all duration-300 btn-glow text-white text-lg
              ${
                canDoubleDown
                  ? 'bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 shadow-lg hover:shadow-purple-500/50 active:scale-95'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              }
            `}
          >
            🎲 Double
          </button>
        </>
      )}

      {gameFinished && (
        <>
          <button
            onClick={onPlayAgain}
            className="px-8 py-4 font-bold rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 hover:from-green-400 hover:to-emerald-600 text-white transition-all duration-300 btn-glow shadow-lg hover:shadow-green-500/50 active:scale-95 text-lg bounce-animation"
          >
            🎉 Play Again (${lastBet})
          </button>

          <button
            onClick={onNewGame}
            className="px-8 py-4 font-bold rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 hover:from-slate-500 hover:to-slate-700 text-white transition-all duration-300 btn-glow shadow-lg hover:shadow-slate-500/50 active:scale-95 text-lg"
          >
            🎰 Change Bet
          </button>
        </>
      )}
    </div>
  );
}
