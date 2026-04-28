'use client';

import { useState } from 'react';

interface BettingControlsProps {
  balance: number;
  onBet: (amount: number) => void;
  disabled: boolean;
}

export function BettingControls({ balance, onBet, disabled }: BettingControlsProps) {
  const [betAmount, setBetAmount] = useState(10);

  const handleBet = () => {
    if (betAmount > 0 && betAmount <= balance) {
      onBet(betAmount);
      setBetAmount(10);
    }
  };

  const quickBets = [10, 25, 50, 100];

  return (
    <div className="bg-gradient-to-br from-slate-800/80 via-slate-700/80 to-slate-900/80 rounded-3xl p-8 border-2 border-gradient-to-r from-amber-500/60 to-purple-500/40 shadow-2xl glass-alt backdrop-blur-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.15)_0%,transparent_60%),radial-gradient(circle_at_top_right,rgba(167,139,250,0.1)_0%,transparent_60%)] pointer-events-none"></div>
      
      <div className="relative z-10">
        <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-6">
          💰 Place Your Bet
        </h3>

        <div className="flex gap-3 mb-6 flex-wrap">
          {quickBets.map((amount) => (
            <button
              key={amount}
              onClick={() => setBetAmount(amount)}
              disabled={disabled || amount > balance}
              className={`
                px-5 py-3 rounded-xl font-bold transition-all duration-300 btn-glow
                ${
                  disabled || amount > balance
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-lg hover:shadow-amber-500/50 active:scale-95'
                }
              `}
            >
              ${amount}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <input
            type="number"
            min="1"
            max={balance}
            value={betAmount}
            onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
            disabled={disabled}
            className="flex-1 px-4 py-3 bg-slate-900/60 border-2 border-amber-500/40 text-white rounded-xl focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/30 transition-all placeholder-slate-500"
            placeholder="Enter custom bet"
          />
          <button
            onClick={handleBet}
            disabled={disabled || betAmount > balance || betAmount <= 0}
            className={`
              px-8 py-3 font-bold rounded-xl transition-all duration-300 btn-glow
              ${
                disabled || betAmount > balance || betAmount <= 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                  : 'bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/50 active:scale-95'
              }
            `}
          >
            🎰 Deal
          </button>
        </div>

        <div className="p-4 bg-slate-900/40 rounded-xl border border-amber-500/20">
          <p className="text-slate-400 text-sm mb-1">Current Balance</p>
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">
            ${balance}
          </p>
        </div>
      </div>
    </div>
  );
}
