/**
 * Portal Component
 * Renders children into a DOM node outside the parent component hierarchy
 * Used for modals, tooltips, and other overlays
 */
import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface PortalProps {
  /**
   * Content to render in the portal
   */
  children: ReactNode;

  /**
   * DOM element ID to render into
   * @default 'portal-root'
   */
  containerId?: string;
}

export const Portal: React.FC<PortalProps> = ({ children, containerId = 'portal-root' }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Get or create the container element
    let element = document.getElementById(containerId);

    if (!element) {
      element = document.createElement('div');
      element.id = containerId;
      document.body.appendChild(element);
    }

    setContainer(element);

    // Cleanup: remove container if it was created by this portal
    return () => {
      if (element && element.childNodes.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, [containerId]);

  if (!container) {
    return null;
  }

  return createPortal(children, container);
};
