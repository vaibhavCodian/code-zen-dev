// src/hooks/useResizablePanels.ts
import { useState, useRef, useEffect, RefObject } from 'react';

interface UseResizablePanelsReturn {
  leftWidth: number;
  containerRef: RefObject<HTMLDivElement>;
  dividerRef: RefObject<HTMLDivElement>;
}

export function useResizablePanels(
  initialWidth: number = 50,
  minWidth: number = 20,
  maxWidth: number = 80
): UseResizablePanelsReturn {
  const [leftWidth, setLeftWidth] = useState(initialWidth);
  const dividerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const divider = dividerRef.current;
    if (!container || !divider) return;

    let isDragging = false;

    const handleMouseDown = (e: MouseEvent) => {
      // Prevent text selection during drag
      e.preventDefault();
      isDragging = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent selection
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const containerRect = container.getBoundingClientRect();
      // Calculate new width relative to container, clamping to bounds
      let newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      newLeftWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth));

      setLeftWidth(newLeftWidth);
    };

    const handleMouseUp = () => {
      if (isDragging) {
         isDragging = false;
         document.body.style.cursor = '';
         document.body.style.userSelect = ''; // Re-enable selection
      }
    };

    divider.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Clean up event listeners on component unmount or when refs change
    return () => {
      divider.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
       // Ensure cursor and selection are reset if unmounted during drag
      if (isDragging) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [minWidth, maxWidth]); // Add minWidth, maxWidth as dependencies if they could change

  return { leftWidth, containerRef, dividerRef };
}