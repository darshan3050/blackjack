'use client';

import { useParams } from 'next/navigation';
import { MultiplayerGame } from '@/components/MultiplayerGame';

export default function GameRoomPage() {
  const params = useParams<{ roomId: string }>();

  return <MultiplayerGame roomId={params.roomId} />;
}
