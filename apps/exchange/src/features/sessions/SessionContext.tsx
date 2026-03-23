/**
 * Session Context
 * Manages user sessions with auto-lock, cross-tab sync, and multi-account support
 * Matches Angular sessions module functionality
 */
import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';
import { multiAccount } from '@/services/multiAccount';
import {
  DEFAULT_SESSION_CONFIG,
  type Session,
  type SessionConfig,
  type SessionEvent,
  type SessionState,
} from './types';

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
// Must match AuthContext — OWASP 2024 recommendation for PBKDF2-SHA-256
const PBKDF2_ROUNDS = 600000;

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [config] = useState<SessionConfig>(DEFAULT_SESSION_CONFIG);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const broadcastEvent = useCallback((event: Omit<SessionEvent, 'timestamp'>) => {
    const fullEvent: SessionEvent = {
      ...event,
      timestamp: Date.now(),
    };

    channelRef.current?.postMessage(fullEvent);
  }, []);

  const loadSessionsFromStorage = useCallback(() => {
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
      logger.error('Error loading sessions from storage:', error);
    }
  }, []);

  const persistSessionsToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      if (activeSession) {
        localStorage.setItem(ACTIVE_SESSION_KEY, activeSession.id);
      } else {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
    } catch (error) {
      logger.error('Error persisting sessions to storage:', error);
    }
  }, [sessions, activeSession]);

  const handleBroadcastMessage = useCallback((event: SessionEvent) => {
    switch (event.type) {
      case 'session-created':
        if (event.session) {
          const newSession = event.session;
          setSessions((prev) => {
            if (prev.find((s) => s.id === newSession.id)) {
              return prev;
            }
            return [...prev, newSession];
          });
        }
        break;

      case 'session-locked':
        setSessions((prev) =>
          prev.map((s) => (s.id === event.sessionId ? { ...s, isLocked: true } : s)),
        );
        setActiveSession((prev) =>
          prev != null && prev.id === event.sessionId ? { ...prev, isLocked: true } : prev,
        );
        break;

      case 'session-unlocked':
        setSessions((prev) =>
          prev.map((s) => (s.id === event.sessionId ? { ...s, isLocked: false } : s)),
        );
        setActiveSession((prev) =>
          prev != null && prev.id === event.sessionId ? { ...prev, isLocked: false } : prev,
        );
        break;

      case 'session-switched':
        if (event.session) {
          setActiveSession(event.session);
        }
        break;

      case 'session-destroyed':
        setSessions((prev) => prev.filter((s) => s.id !== event.sessionId));
        setActiveSession((prev) => (prev?.id === event.sessionId ? null : prev));
        break;

      case 'activity-refresh':
        setActiveSession((prev) =>
          prev != null && prev.id === event.sessionId
            ? { ...prev, lastActivity: event.timestamp }
            : prev,
        );
        break;
    }
  }, []);

  const lockSession = useCallback(() => {
    if (!activeSession) return;

    const lockedSession = { ...activeSession, isLocked: true };
    setActiveSession(lockedSession);
    setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? lockedSession : s)));

    broadcastEvent({
      sessionId: activeSession.id,
      type: 'session-locked',
    });
  }, [activeSession, broadcastEvent]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    loadSessionsFromStorage();
  }, [loadSessionsFromStorage]);

  // Setup BroadcastChannel for cross-tab synchronization
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      logger.warn('BroadcastChannel not supported in this browser');
      return;
    }

    channelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

    channelRef.current.onmessage = (event: MessageEvent<SessionEvent>) => {
      handleBroadcastMessage(event.data);
    };

    return () => {
      channelRef.current?.close();
    };
  }, [handleBroadcastMessage]);

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
  }, [activeSession, config.autoLock, config.inactivityTimeout, lockSession]);

  // Persist sessions to localStorage
  useEffect(() => {
    if (config.persistSessions) {
      persistSessionsToStorage();
    }
  }, [config.persistSessions, persistSessionsToStorage]);

  const createSession = useCallback(
    async (user: {
      address: string;
      userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
    }): Promise<Session> => {
      const newSession: Session = {
        address: user.address,
        createdAt: Date.now(),
        id: `session_${Date.now()}_${crypto.randomUUID().slice(0, 9)}`,
        isLocked: false,
        lastActivity: Date.now(),
        userId: user.address,
        userType: user.userType,
      };

      setSessions((prev) => [...prev, newSession]);
      setActiveSession(newSession);

      // Broadcast to other tabs
      broadcastEvent({
        session: newSession,
        type: 'session-created',
      });

      return newSession;
    },
    [broadcastEvent],
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
        session,
        type: 'session-switched',
      });
    },
    [sessions, broadcastEvent],
  );

  const unlockSession = useCallback(
    async (password: string): Promise<boolean> => {
      if (!activeSession) return false;

      try {
        // Verify the password by decrypting the vault — if wrong, signIn throws
        const multiAccountData = localStorage.getItem('multiAccountData');
        const multiAccountHash = localStorage.getItem('multiAccountHash');

        if (!multiAccountData || !multiAccountHash) {
          logger.error('unlockSession: no vault data found in storage');
          return false;
        }

        await multiAccount.signIn(multiAccountData, password, PBKDF2_ROUNDS, multiAccountHash);

        const unlockedSession = {
          ...activeSession,
          isLocked: false,
          lastActivity: Date.now(),
        };

        setActiveSession(unlockedSession);
        setSessions((prev) => prev.map((s) => (s.id === activeSession.id ? unlockedSession : s)));

        broadcastEvent({
          sessionId: activeSession.id,
          type: 'session-unlocked',
        });

        return true;
      } catch (error) {
        logger.error('Error unlocking session:', error);
        return false;
      }
    },
    [activeSession, broadcastEvent],
  );

  const destroySession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }

      // Broadcast to other tabs
      broadcastEvent({
        sessionId,
        type: 'session-destroyed',
      });
    },
    [activeSession, broadcastEvent],
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
      sessionId: activeSession.id,
      type: 'activity-refresh',
    });
  }, [activeSession, broadcastEvent]);

  const value: SessionContextValue = {
    activeSession,
    config,
    createSession,
    destroySession,
    isSessionLocked: activeSession?.isLocked ?? false,
    lockSession,
    refreshActivity,
    sessions,
    switchSession,
    unlockSession,
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
