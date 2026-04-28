'use client';

import { Hand } from '@/lib/gameTypes';
import { CardComponent } from './Card';

interface HandProps {
  hand: Hand;
  title: string;
  hideFirstCard?: boolean;
  isDealer?: boolean;
}

export function HandDisplay({ hand, title, hideFirstCard = false, isDealer = false }: HandProps) {
  return (
    <div className="flex flex-col gap-4 slide-up-animation">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold text-white drop-shadow-lg">{title}</h3>
        <div className="flex gap-4 items-center">
          <div className={`
            px-4 py-2 rounded-lg font-bold text-lg badge-glow
            ${hand.isBust && !hideFirstCard 
              ? 'bg-red-600/80 text-red-100 border border-red-400' 
              : 'bg-slate-700/60 text-amber-300 border border-amber-500/40'
            }
          `}>
            Value: {isDealer && hideFirstCard ? '?' : hand.value}
          </div>
          {hand.isBust && !hideFirstCard && (
            <span className="text-xl font-bold text-red-400 animate-pulse">💥 BUST</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {hand.cards.map((card, idx) => (
          <div key={card.id} className="transform transition-all duration-300 hover:scale-105">
            <CardComponent card={card} hidden={hideFirstCard && idx === 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
