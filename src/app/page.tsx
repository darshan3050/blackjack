'use client';

import { GameBoard } from '@/components/GameBoard';
import { MultiplayerRoom } from '@/components/MultiplayerRoom';

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        
        {/* Animated grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-size-[50px_50px] animate-[float_20s_ease-in-out_infinite]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header with enhanced styling */}
        <div className="text-center mb-12 slide-up-animation">
          <div className="inline-block mb-4 px-4 py-2 bg-linear-to-r from-amber-500/20 to-purple-500/20 rounded-full border border-amber-500/30 backdrop-blur">
            <p className="text-amber-400 text-sm font-semibold tracking-widest">PREMIUM GAMING EXPERIENCE</p>
          </div>
          
          <h1 className="text-7xl font-black text-gradient mb-4 drop-shadow-lg">
            Blackjack
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-1 w-12 bg-linear-to-r from-amber-400 to-amber-600 rounded-full"></div>
            <p className="text-slate-300 text-lg font-medium">Strategy • Luck • Thrills</p>
            <div className="h-1 w-12 bg-linear-to-l from-amber-400 to-amber-600 rounded-full"></div>
          </div>
          
          <p className="text-slate-400 text-base max-w-md mx-auto">Master the card game with smooth gameplay and stunning visuals</p>
        </div>

        <MultiplayerRoom />

        <div className="mt-10 mb-4 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Practice Mode</p>
        </div>

        {/* Game Board */}
        <div className="relative z-20">
          <GameBoard />
        </div>

        {/* Footer decoration */}
        <div className="mt-16 text-center">
          <div className="inline-flex gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full glow-animation"></div>
            <p className="text-slate-500 text-sm">Live • Real-time • Secure</p>
            <div className="w-2 h-2 bg-purple-400 rounded-full glow-animation"></div>
          </div>
        </div>
      </div>
    </main>
  );
}
