'use client';

import { Card } from '@/lib/gameTypes';

interface CardProps {
  card: Card;
  hidden?: boolean;
}

export function CardComponent({ card, hidden = false }: CardProps) {
  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div
      className={`
        w-20 h-28 rounded-lg font-bold text-center flex flex-col items-center justify-center
        transition-all duration-300 transform hover:scale-110 cursor-pointer
        card-hover bounce-animation relative overflow-hidden
        ${
          hidden
            ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border-2 border-blue-400 shadow-lg card-shadow'
            : `bg-white border-2 ${isRed ? 'border-red-500' : 'border-black'} shadow-lg card-shadow`
        }
      `}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
      
      {!hidden && (
        <>
          <div className={`text-xl font-black ${isRed ? 'text-red-600' : 'text-black'}`}>
            {card.rank}
          </div>
          <div className={`text-2xl ${isRed ? 'text-red-600' : 'text-black'}`}>
            {card.suit}
          </div>
          {/* Corner decorations */}
          <div className="absolute top-1 right-1 text-xs opacity-60">
            {card.suit}
          </div>
        </>
      )}
      {hidden && (
        <div className="flex flex-col items-center gap-1">
          <div className="text-white text-xl font-bold">?</div>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-300 to-blue-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
}
