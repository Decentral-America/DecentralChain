/**
 * Session Context
 * Manages user sessions with auto-lock, cross-tab sync, and multi-account support
 * Matches Angular sessions module functionality
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Session, SessionState, SessionEvent, SessionConfig } from './types';
import { DEFAULT_SESSION_CONFIG } from './types';

interface SessionContextValue extends SessionState {
  createSession: (user: {
    address: string;
    userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
  }) => Promise<Session>;
  switchSession: (sessionId: string) => Promise<void>;
  lockSession: () => void;
  unlockSession: (password: string) => Promise<boolean>;
  destroySession: (sessionId: string) => void;
  refreshActivity: () => void;
  isSessionLocked: boolean;
  config: SessionConfig;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = 'dcc_sessions';
const ACTIVE_SESSION_KEY = 'dcc_active_session';
const BROADCAST_CHANNEL_NAME = 'dcc_sessions_channel';

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [config] = useState<SessionConfig>(DEFAULT_SESSION_CONFIG);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    loadSessionsFromStorage();
  }, []);

  // Setup BroadcastChannel for cross-tab synchronization
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('BroadcastChannel not supported in this browser');
      return;
    }

    channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    channelRef.current.onmessage = (event: MessageEvent<SessionEvent>) => {
      handleBroadcastMessage(event.data);
    };

    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Auto-lock timer
  useEffect(() => {
    if (!config.autoLock || !activeSession || activeSession.isLocked) {
      return;
    }

    const startInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(() => {
        const inactiveTime = Date.now() - activeSession.lastActivity;
        if (inactiveTime >= config.inactivityTimeout) {
          lockSession();
        }
      }, config.inactivityTimeout);
    };

    startInactivityTimer();

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [activeSession, config.autoLock, config.inactivityTimeout]);

  // Persist sessions to localStorage
  useEffect(() => {
    if (config.persistSessions) {
      persistSessionsToStorage();
    }
  }, [sessions, activeSession, config.persistSessions]);

  const loadSessionsFromStorage = () => {
    try {
      const sessionsData = localStorage.getItem(STORAGE_KEY);
      const activeSessionId = localStorage.getItem(ACTIVE_SESSION_KEY);

      if (sessionsData) {
        const loadedSessions: Session[] = JSON.parse(sessionsData);
        setSessions(loadedSessions);

        if (activeSessionId) {
          const active = loadedSessions.find((s) => s.id === activeSessionId);
          if (active) {
            setActiveSession(active);
          }
        }
      }
    } catch (error) {
      console.error('Error loading sessions from storage:', error);
    }
  };

  const persistSessionsToStorage = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      if (activeSession) {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSession.id);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch (error) {
      console.error('Error persisting sessions to storage:', error);
    }
  };

  const broadcastEvent = (event: Omit<SessionEvent, 'timestamp'>) => {
    const fullEvent: SessionEvent = {
      ...event,
      timestamp: Date.now(),
    };

    channelRef.current?.postMessage(fullEvent);
  };

  const handleBroadcastMessage = (event: SessionEvent) => {
    switch (event.type) {
      case 'session-created':
        if (event.session) {
          setSessions((prev) => {
            if (prev.find((s) => s.id === event.session!.id)) {
              return prev;
            }
            return [...prev, event.session!];
          });
        }
        break;

      case 'session-locked':
        if (event.sessionId === activeSession?.id) {
          setActiveSession((prev) => (prev ? { ...prev, isLocked: true } : null));
        }
        setSessions((prev) =>
          prev.map((s) => (s.id === event.sessionId ? { ...s, isLocked: true } : s))
        );
        break;

      case 'session-unlocked':
        if (event.sessionId === activeSession?.id) {
          setActiveSession((prev) => (prev ? { ...prev, isLocked: false } : null));
        }
        setSessions((prev) =>
          prev.map((s) => (s.id === event.sessionId ? { ...s, isLocked: false } : s))
        );
        break;

      case 'session-switched':
        if (event.session) {
          setActiveSession(event.session);
        }
        break;

      case 'session-destroyed':
        setSessions((prev) => prev.filter((s) => s.id !== event.sessionId));
        if (activeSession?.id === event.sessionId) {
          setActiveSession(null);
        }
        break;

      case 'activity-refresh':
        if (event.sessionId === activeSession?.id) {
          setActiveSession((prev) => (prev ? { ...prev, lastActivity: event.timestamp } : null));
        }
        break;
    }
  };

  const createSession = useCallback(
    async (user: {
      address: string;
      userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
    }): Promise<Session> => {
      const newSession: Session = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.address,
        address: user.address,
        userType: user.userType,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        isLocked: false,
      };

      setSessions((prev) => [...prev, newSession]);
      setActiveSession(newSession);

      // Broadcast to other tabs
      broadcastEvent({
        type: 'session-created',
        session: newSession,
      });

      return newSession;
    },
    []
  );

  const switchSession = useCallback(
    async (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      setActiveSession(session);

      // Broadcast to other tabs
      broadcastEvent({
        type: 'session-switched',
        session,
      });
    },
    [sessions]
  );

  const lockSession = useCallback(() => {
    if (!activeSession) return;

    const lockedSession = { ...activeSession, isLocked: true };
    setActiveSession(lockedSession);
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? lockedSession : s)));

    // Broadcast to other tabs
    broadcastEvent({
      type: 'session-locked',
      sessionId: activeSession.id,
    });
  }, [activeSession]);

  const unlockSession = useCallback(
    async (password: string): Promise<boolean> => {
      if (!activeSession) return false;

      try {
        // Validate password with data-service (matching Angular)
        // This is a placeholder - actual implementation would verify with stored hash
        // In production, this would call data-service to verify password

        const unlockedSession = {
          ...activeSession,
          isLocked: false,
          lastActivity: Date.now(),
        };

        setActiveSession(unlockedSession);
        setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? unlockedSession : s)));

        // Broadcast to other tabs
        broadcastEvent({
          type: 'session-unlocked',
          sessionId: activeSession.id,
        });

        return true;
      } catch (error) {
        console.error('Error unlocking session:', error);
        return false;
      }
    },
    [activeSession]
  );

  const destroySession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }

      // Broadcast to other tabs
      broadcastEvent({
        type: 'session-destroyed',
        sessionId,
      });
    },
    [activeSession]
  );

  const refreshActivity = useCallback(() => {
    if (!activeSession || activeSession.isLocked) return;

    const updatedSession = {
      ...activeSession,
      lastActivity: Date.now(),
    };

    setActiveSession(updatedSession);
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? updatedSession : s)));

    // Broadcast to other tabs
    broadcastEvent({
      type: 'activity-refresh',
      sessionId: activeSession.id,
    });
  }, [activeSession]);

  const value: SessionContextValue = {
    activeSession,
    sessions,
    createSession,
    switchSession,
    lockSession,
    unlockSession,
    destroySession,
    refreshActivity,
    isSessionLocked: activeSession?.isLocked ?? false,
    config,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};
