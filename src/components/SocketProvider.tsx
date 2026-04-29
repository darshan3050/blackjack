'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';

type SocketContextValue = {
  socket: Socket | null;
  socketUrl: string;
  connected: boolean;
  error: string;
};

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  socketUrl: '',
  connected: false,
  error: '',
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || '';
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(() =>
    socketUrl ? '' : 'Set NEXT_PUBLIC_SOCKET_URL to your Render service URL.'
  );

  const socket = useMemo<Socket | null>(() => {
    if (typeof window === 'undefined' || !socketUrl) {
      return null;
    }

    return io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }, [socketUrl]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleConnect = () => {
      setConnected(true);
      setError('');
    };
    const handleDisconnect = () => setConnected(false);
    const handleConnectError = (connectError: Error) => {
      setConnected(false);
      setError(connectError.message || 'Unable to connect to the socket server.');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.connect();

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [socket, socketUrl]);

  return (
    <SocketContext.Provider value={{ socket, socketUrl, connected, error }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
