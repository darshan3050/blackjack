import Link from 'next/link';
import { GameBoard } from '@/components/GameBoard';

export default function PracticePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto mb-8 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">Practice</p>
          <h1 className="text-4xl font-black">Solo blackjack</h1>
        </div>
        <Link
          href="/"
          className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-amber-400 hover:text-amber-200"
        >
          Home
        </Link>
      </div>
      <GameBoard />
    </main>
  );
}
