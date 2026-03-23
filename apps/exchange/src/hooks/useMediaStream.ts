import { useCallback, useEffect, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * Standard video resolutions for media stream
 */
export const RESOLUTIONS = {
  FULL_HD: { height: 1080, width: 1920 },
  HD: { height: 720, width: 1280 },
  QVGA: { height: 240, width: 320 },
  VGA: { height: 480, width: 640 },
} as const;

/**
 * Media device information
 */
interface MediaDeviceInfo {
  deviceId: string;
  kind: 'audioinput' | 'audiooutput' | 'videoinput';
  label: string;
  groupId: string;
}

/**
 * Resolution configuration
 */
interface Resolution {
  width: number;
  height: number;
}

/**
 * Media stream constraints options
 */
interface UseMediaStreamOptions {
  /**
   * Enable audio capture
   * @default false
   */
  audio?: boolean | MediaTrackConstraints;

  /**
   * Enable video capture
   * @default false
   */
  video?: boolean | MediaTrackConstraints;

  /**
   * Preferred video resolution
   * @default RESOLUTIONS.HD
   */
  resolution?: Resolution;

  /**
   * Prefer back-facing camera (for mobile devices)
   * @default true
   */
  preferBackCamera?: boolean;

  /**
   * Automatically start stream on mount
   * @default false
   */
  autoStart?: boolean;

  /**
   * Enable development logging
   * @default true in development mode
   */
  debug?: boolean;

  /**
   * Callback when stream starts successfully
   */
  onStreamStart?: (stream: MediaStream) => void;

  /**
   * Callback when stream stops
   */
  onStreamStop?: () => void;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;
}

/**
 * Media stream hook return type
 */
interface UseMediaStreamReturn {
  /**
   * Active media stream (null if not active)
   */
  stream: MediaStream | null;

  /**
   * Error that occurred during stream access
   */
  error: Error | null;

  /**
   * Whether stream is currently active
   */
  isActive: boolean;

  /**
   * Whether stream is loading (requesting access)
   */
  isLoading: boolean;

  /**
   * Start media stream capture
   */
  startStream: () => Promise<MediaStream | null>;

  /**
   * Stop media stream capture
   */
  stopStream: () => void;

  /**
   * Toggle stream on/off
   */
  toggleStream: () => Promise<void>;

  /**
   * Get list of available media devices
   */
  getDevices: () => Promise<MediaDeviceInfo[]>;

  /**
   * Switch to different camera device
   */
  switchCamera: (deviceId: string) => Promise<void>;

  /**
   * Take a snapshot from video stream
   */
  takeSnapshot: () => string | null;
}

/**
 * Find back-facing camera from device list (for mobile devices)
 */
const findBackCamera = (devices: MediaDeviceInfo[]): MediaDeviceInfo | null => {
  const videoDevices = devices.filter((device) => device.kind === 'videoinput');

  // Try to find camera with "back" in label
  let backCamera = videoDevices.find((device) => device.label.toLowerCase().includes('back'));

  if (!backCamera) {
    // On Android, back camera is usually last in array
    backCamera = videoDevices[videoDevices.length - 1];
  }

  return backCamera || null;
};

/**
 * Build media constraints with resolution and device preferences
 */
const buildConstraints = (
  devices: MediaDeviceInfo[],
  resolution: Resolution,
  preferBackCamera: boolean,
  audio?: boolean | MediaTrackConstraints,
): MediaStreamConstraints => {
  const constraints: MediaStreamConstraints = {
    audio: audio || false,
    video: false,
  };

  if (resolution) {
    constraints.video = {
      height: { exact: resolution.height },
      width: { exact: resolution.width },
    };

    // Check if browser supports facingMode
    const supportsFacingMode = navigator.mediaDevices?.getSupportedConstraints().facingMode;

    if (supportsFacingMode && preferBackCamera) {
      (constraints.video as MediaTrackConstraints).facingMode = 'environment';
    } else if (preferBackCamera) {
      // Fallback: use specific deviceId
      const backCamera = findBackCamera(devices);
      if (backCamera) {
        (constraints.video as MediaTrackConstraints).deviceId = {
          exact: backCamera.deviceId,
        };
      }
    }
  }

  return constraints;
};

/**
 * Try to get user media with resolution fallback
 * Attempts higher resolutions first, falls back to lower on failure
 */
const getUserMediaWithFallback = async (
  devices: MediaDeviceInfo[],
  preferBackCamera: boolean,
  audio?: boolean | MediaTrackConstraints,
): Promise<MediaStream> => {
  const resolutions = [RESOLUTIONS.FULL_HD, RESOLUTIONS.HD, RESOLUTIONS.VGA, RESOLUTIONS.QVGA];

  // Try portrait and landscape orientations
  const tryResolution = async (res: Resolution): Promise<MediaStream> => {
    const constraints = buildConstraints(devices, res, preferBackCamera, audio);

    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      // Try rotated resolution (width <-> height)
      const rotated = { height: res.width, width: res.height };
      const rotatedConstraints = buildConstraints(devices, rotated, preferBackCamera, audio);
      return await navigator.mediaDevices.getUserMedia(rotatedConstraints);
    }
  };

  // Try resolutions from highest to lowest
  for (const resolution of resolutions) {
    try {
      return await tryResolution(resolution);
    } catch {
      // Continue to next resolution
    }
  }

  // If all resolutions fail, throw error
  throw new Error('Failed to access media stream at any resolution');
};

/**
 * Custom hook for WebRTC media stream handling
 *
 * Provides camera and microphone access with resolution fallback,
 * device selection, and automatic cleanup. Supports both audio
 * and video capture with comprehensive error handling.
 *
 * @param options - Configuration options
 * @returns Media stream control object
 *
 * @example
 * // Video with back camera
 * const { stream, startStream, stopStream } = useMediaStream({
 *   video: true,
 *   preferBackCamera: true,
 *   resolution: RESOLUTIONS.HD,
 * });
 *
 * // Audio only
 * const { stream, startStream } = useMediaStream({
 *   audio: true,
 * });
 */
export const useMediaStream = (options: UseMediaStreamOptions = {}): UseMediaStreamReturn => {
  const {
    audio = false,
    video = false,
    resolution = RESOLUTIONS.HD,
    preferBackCamera = true,
    autoStart = false,
    debug = import.meta.env.DEV,
    onStreamStart,
    onStreamStop,
    onError,
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  const getDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      throw new Error('navigator.mediaDevices.enumerateDevices not supported');
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices as unknown as MediaDeviceInfo[];
  }, []);

  const startStream = useCallback(async (): Promise<MediaStream | null> => {
    if (!isMountedRef.current) return null;

    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.mediaDevices) {
        throw new Error('navigator.mediaDevices is not supported in this browser');
      }

      let mediaStream: MediaStream;

      if (video) {
        // Video: Use resolution fallback
        const devices = await getDevices();
        mediaStream = await getUserMediaWithFallback(devices, preferBackCamera, audio);
      } else if (audio) {
        // Audio only: Simple constraints
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: typeof audio === 'boolean' ? true : audio,
          video: false,
        });
      } else {
        throw new Error('Either audio or video must be enabled');
      }

      if (!isMountedRef.current) {
        // Component unmounted during async operation
        mediaStream.getTracks().forEach((track) => {
          track.stop();
        });
        return null;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      setIsLoading(false);
      onStreamStart?.(mediaStream);

      if (debug) {
        const videoTrack = mediaStream.getVideoTracks()[0];
        const audioTrack = mediaStream.getAudioTracks()[0];
        logger.debug('[MediaStream] Stream started:', {
          audio: audioTrack ? audioTrack.label : 'none',
          video: videoTrack ? videoTrack.getSettings() : 'none',
        });
      }

      return mediaStream;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsActive(false);
      setIsLoading(false);
      onError?.(error);

      if (debug) {
        logger.error('[MediaStream] Failed to start stream:', error);
      }

      return null;
    }
  }, [video, audio, preferBackCamera, debug, getDevices, onStreamStart, onError]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        if (debug) {
          logger.debug(`[MediaStream] Stopped track: ${track.kind} - ${track.label}`);
        }
      });

      streamRef.current = null;
      setStream(null);
      setIsActive(false);
      onStreamStop?.();

      if (debug) {
        logger.debug('[MediaStream] Stream stopped');
      }
    }
  }, [debug, onStreamStop]);

  const toggleStream = useCallback(async () => {
    if (isActive) {
      stopStream();
    } else {
      await startStream();
    }
  }, [isActive, startStream, stopStream]);

  const switchCamera = useCallback(
    async (deviceId: string) => {
      stopStream();

      // Recreate stream with specific device
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio,
          video: {
            deviceId: { exact: deviceId },
            height: { ideal: resolution.height },
            width: { ideal: resolution.width },
          },
        });

        streamRef.current = mediaStream;
        setStream(mediaStream);
        setIsActive(true);
        onStreamStart?.(mediaStream);

        if (debug) {
          logger.debug(`[MediaStream] Switched to camera: ${deviceId}`);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);

        if (debug) {
          logger.error('[MediaStream] Failed to switch camera:', error);
        }
      }
    },
    [audio, resolution, debug, stopStream, onStreamStart, onError],
  );

  const takeSnapshot = useCallback((): string | null => {
    if (!streamRef.current) {
      if (debug) {
        logger.warn('[MediaStream] No active stream to snapshot');
      }
      return null;
    }

    // Create hidden video element if needed
    if (!videoElementRef.current) {
      videoElementRef.current = document.createElement('video');
      videoElementRef.current.style.display = 'none';
      document.body.appendChild(videoElementRef.current);
    }

    const video = videoElementRef.current;
    video.srcObject = streamRef.current;
    video.play();

    // Create canvas and draw current frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || resolution.width;
    canvas.height = video.videoHeight || resolution.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');

    if (debug) {
      logger.debug('[MediaStream] Snapshot taken:', {
        height: canvas.height,
        width: canvas.width,
      });
    }

    return dataUrl;
  }, [debug, resolution]);

  // Auto-start stream if enabled
  useEffect(() => {
    if (autoStart) {
      void startStream();
    }
  }, [autoStart, startStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopStream();

      // Remove hidden video element
      if (videoElementRef.current) {
        videoElementRef.current.remove();
        videoElementRef.current = null;
      }
    };
  }, [stopStream]);

  return {
    error,
    getDevices,
    isActive,
    isLoading,
    startStream,
    stopStream,
    stream,
    switchCamera,
    takeSnapshot,
    toggleStream,
  };
};

/**
 * Utility variant: useAudioStream
 * Simplified hook for audio-only capture (microphone)
 *
 * @example
 * const { stream, startStream, stopStream } = useAudioStream();
 */
export const useAudioStream = (options: Omit<UseMediaStreamOptions, 'video'> = {}) => {
  return useMediaStream({ ...options, audio: true, video: false });
};

/**
 * Utility variant: useVideoStream
 * Simplified hook for video-only capture (camera)
 *
 * @example
 * const { stream, startStream, stopStream } = useVideoStream({
 *   resolution: RESOLUTIONS.FULL_HD,
 *   preferBackCamera: true,
 * });
 */
export const useVideoStream = (options: Omit<UseMediaStreamOptions, 'audio'> = {}) => {
  return useMediaStream({ ...options, audio: false, video: true });
};

/**
 * Utility variant: useScreenCapture
 * Hook for screen sharing (uses getDisplayMedia instead)
 *
 * @example
 * const { stream, startCapture, stopCapture } = useScreenCapture();
 */
export const useScreenCapture = (options: { audio?: boolean; debug?: boolean } = {}) => {
  const { audio = false, debug = import.meta.env.DEV } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCapture = useCallback(async (): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen capture not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        audio,
        video: true,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsActive(true);
      setError(null);

      if (debug) {
        logger.debug('[ScreenCapture] Capture started');
      }

      return mediaStream;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsActive(false);

      if (debug) {
        logger.error('[ScreenCapture] Failed to start capture:', error);
      }

      return null;
    }
  }, [audio, debug]);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
      setIsActive(false);

      if (debug) {
        logger.debug('[ScreenCapture] Capture stopped');
      }
    }
  }, [debug]);

  useEffect(() => {
    return () => stopCapture();
  }, [stopCapture]);

  return {
    error,
    isActive,
    startCapture,
    stopCapture,
    stream,
  };
};

/**
 * Export types for external usage
 */
export type { MediaDeviceInfo, Resolution, UseMediaStreamOptions, UseMediaStreamReturn };
