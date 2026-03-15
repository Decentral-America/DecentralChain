/**
 * Session Management Types
 * Defines types for multi-account session management
 */

export interface Session {
  id: string;
  userId: string;
  address: string;
  userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
  createdAt: number;
  lastActivity: number;
  isLocked: boolean;
}

export interface SessionState {
  activeSession: Session | null;
  sessions: Session[];
}

export type SessionEventType =
  | 'session-created'
  | 'session-locked'
  | 'session-unlocked'
  | 'session-switched'
  | 'session-destroyed'
  | 'activity-refresh';

export interface SessionEvent {
  type: SessionEventType;
  sessionId?: string;
  session?: Session;
  timestamp: number;
}

export interface SessionConfig {
  inactivityTimeout: number; // milliseconds
  autoLock: boolean;
  persistSessions: boolean;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  autoLock: true,
  inactivityTimeout: 15 * 60 * 1000, // 15 minutes
  persistSessions: true,
};
