import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let active = true;
    let connectedSocket;

    if (user) {
      import('socket.io-client').then(({ io }) => {
        if (!active) return;
        const socketUrl = import.meta.env.VITE_API_DOMAIN || 'http://localhost:5000';
        connectedSocket = io(socketUrl, {
          transports: ['polling', 'websocket'],
          auth: { token: localStorage.getItem('token') }
        });
        setSocket(connectedSocket);
      });
    }

    return () => {
      active = false;
      connectedSocket?.close();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
