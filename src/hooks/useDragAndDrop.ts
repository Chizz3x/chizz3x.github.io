import React from 'react';
import { AppItem } from '../components/application/application';
import {
  getPointerPos,
  registerMouseActivity,
  unregisterMouseActivity,
} from '../utils/mouse-activity';
import { checkUnderlyingElement } from '../utils/desktop-grid';

const DRAG_THRESHOLD = 5; // px before touch starts dragging
const DRAG_HOLD_MS = 300; // ms finger must stay pressed before drag activates
const DRAG_CANCEL_THRESHOLD = 15; // px movement during hold cancels the drag

export function useDragAndDrop(
  appGrid: React.MutableRefObject<AppItem[][]>,
  desktopIndex: React.MutableRefObject<number>,
  setSelectedCell: (v: number) => void,
  invalidate: () => void,
) {
  const draggableContainerRef = React.useRef<HTMLDivElement>(null);
  const draggableBoxRef = React.useRef<HTMLDivElement>(null);
  const draggableElement = React.useRef<HTMLDivElement | null>();
  const dragOffset = React.useRef({ x: 0, y: 0 });

  // Track touch potential (press down before drag starts)
  const touchPotential = React.useRef<{
    element: HTMLElement;
    startX: number;
    startY: number;
    startTime: number;
    index: number;
  } | null>(null);
  const isDragging = React.useRef(false);

  // Shared: create the drag clone from a source element
  const startDragging = (
    source: HTMLElement,
    clientX: number,
    clientY: number,
  ) => {
    const rect = source.getBoundingClientRect();
    dragOffset.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    const appClone = source.cloneNode(true) as HTMLDivElement;
    appClone.style.backgroundColor = 'transparent';
    // Visual lift — scale up slightly
    appClone.style.transform = 'scale(1.1)';
    appClone.style.transition = 'transform 0.15s ease-out';
    const boxClone = draggableBoxRef.current?.cloneNode() as HTMLDivElement;
    if (!boxClone) return;
    boxClone.appendChild(appClone);
    boxClone.dataset.index = source.dataset.index;
    boxClone.style.left = `${clientX - dragOffset.current.x}px`;
    boxClone.style.top = `${clientY - dragOffset.current.y}px`;
    draggableElement.current = boxClone;
    isDragging.current = true;
  };

  // Mouse drag start
  const onDragStart = (e: React.MouseEvent) => {
    startDragging(e.currentTarget as HTMLElement, e.clientX, e.clientY);
  };

  // Touch drag start (record potential, wait for move)
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchPotential.current = {
      element: e.currentTarget as HTMLElement,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      index: Number((e.currentTarget as HTMLElement).dataset.index),
    };
    isDragging.current = false;
    // Block browser scroll during the entire drag initiation and dragging period
    document.body.style.touchAction = 'none';
    document.body.style.overflow = 'hidden';
  };

  // Expose a ref so CellIcon can check if a drag happened (to skip open)
  const dragHappened = React.useRef(false);

  React.useEffect(() => {
    const onMouseUp = (e: MouseEvent | TouchEvent | FocusEvent) => {
      const endDragging =
        'touches' in e
          ? e.type === 'touchend'
            ? true
            : !!e.touches.length
          : 'button' in e
          ? e.button === 0
          : true;
      if (!endDragging) return;

      // If a drag was in progress — drop the app
      if (draggableElement.current) {
        const bbox = draggableElement.current.getBoundingClientRect();
        const element = checkUnderlyingElement(
          bbox.left + bbox.width / 2,
          bbox.top + bbox.height / 2,
        );
        if (element) {
          const indexTo = Number(element.getAttribute('data-index'));
          const indexFrom = Number(draggableElement.current.dataset.index);
          if (indexFrom !== indexTo) {
            if (appGrid.current[desktopIndex.current][indexTo]) {
              const toApp = appGrid.current[desktopIndex.current][indexTo];
              appGrid.current[desktopIndex.current][indexTo] =
                appGrid.current[desktopIndex.current][indexFrom];
              appGrid.current[desktopIndex.current][indexFrom] = toApp;
            } else {
              appGrid.current[desktopIndex.current][indexTo] =
                appGrid.current[desktopIndex.current][indexFrom];
              delete appGrid.current[desktopIndex.current][indexFrom];
            }
            setSelectedCell(-1);
            invalidate();
          }
        }

        draggableElement.current.remove();
        draggableElement.current = null;
      }

      // Restore browser scroll
      document.body.style.touchAction = '';
      document.body.style.overflow = '';

      touchPotential.current = null;
      isDragging.current = false;
      // Reset drag-happened flag after a tick so touchEnd handlers can check it
      setTimeout(() => {
        dragHappened.current = false;
      }, 0);
    };

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      const { x: posX, y: posY } = getPointerPos(e);

      // Check if we should initiate a touch drag
      if (!draggableElement.current && touchPotential.current) {
        const dx = posX - touchPotential.current.startX;
        const dy = posY - touchPotential.current.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const elapsed = Date.now() - touchPotential.current.startTime;

        // If finger moved too much during hold, cancel the drag entirely
        if (elapsed < DRAG_HOLD_MS && dist > DRAG_CANCEL_THRESHOLD) {
          touchPotential.current = null;
        } else if (elapsed >= DRAG_HOLD_MS && dist > DRAG_THRESHOLD) {
          dragHappened.current = true;
          startDragging(touchPotential.current.element, posX, posY);
        }
      }

      if (!draggableElement.current) return;
      if (!draggableContainerRef.current?.children.item(1)) {
        draggableContainerRef.current?.appendChild(draggableElement.current);
      }
      draggableElement.current.style.left = `${posX - dragOffset.current.x}px`;
      draggableElement.current.style.top = `${posY - dragOffset.current.y}px`;
    };

    registerMouseActivity({ do: onMouseMove, end: onMouseUp });
    return () => {
      unregisterMouseActivity({ do: onMouseMove, end: onMouseUp });
    };
  }, []);

  return {
    draggableContainerRef,
    draggableBoxRef,
    onDragStart,
    onTouchStart,
    dragHappened,
  };
}
