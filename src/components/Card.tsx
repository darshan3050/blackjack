'use client';

import { Card, Suit } from '@/lib/gameTypes';

interface CardProps {
  card: Card;
  hidden?: boolean;
}

const suitLabels: Record<Suit, string> = {
  S: 'Spade',
  H: 'Heart',
  D: 'Diamond',
  C: 'Club',
};

const suitMarks: Record<Suit, string> = {
  S: 'S',
  H: 'H',
  D: 'D',
  C: 'C',
};

export function CardComponent({ card, hidden = false }: CardProps) {
  const isRed = card.suit === 'H' || card.suit === 'D';
  const suitMark = suitMarks[card.suit];

  return (
    <div
      aria-label={hidden ? 'Hidden card' : `${card.rank} of ${suitLabels[card.suit]}`}
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
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>

      {!hidden && (
        <>
          <div className={`text-xl font-black ${isRed ? 'text-red-600' : 'text-black'}`}>
            {card.rank}
          </div>
          <div className={`text-2xl ${isRed ? 'text-red-600' : 'text-black'}`}>
            {suitMark}
          </div>
          <div className="absolute top-1 right-1 text-xs opacity-60">
            {suitMark}
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
