import { useEffect, useRef, useState } from 'react';

interface UseIdleTimerOptions {
  enabled?: boolean;
}

export function useIdleTimer(options: UseIdleTimerOptions = {}) {
  const { enabled = true } = options;
  const lastActivityRef = useRef<number>(Date.now());
  const [idleMinutes, setIdleMinutes] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setIdleMinutes(0);
      return;
    }

    // Reset activity timestamp on user interaction
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setIdleMinutes(0);
    };

    // Activity events to monitor
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetActivity, { passive: true });
    });

    // Check idle time every minute
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const idleMs = now - lastActivityRef.current;
      const minutes = Math.floor(idleMs / 60000);
      setIdleMinutes(minutes);
    }, 60000); // Check every 60 seconds

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetActivity);
      });
      clearInterval(checkInterval);
    };
  }, [enabled]);

  return idleMinutes;
}
