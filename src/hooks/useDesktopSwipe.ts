import React from 'react';
import { AppItem } from '../components/application/application';
import {
  getPointerPos,
  registerMouseActivity,
  unregisterMouseActivity,
} from '../utils/mouse-activity';

export function useDesktopSwipe(
  appGrid: React.MutableRefObject<AppItem[][]>,
  desktopIndex: React.MutableRefObject<number>,
  draggableElement: React.MutableRefObject<HTMLDivElement | null | undefined>,
  invalidate: () => void,
  gridRef: React.RefObject<HTMLDivElement | null>,
) {
  const desktopSwiperRef = React.useRef<HTMLDivElement>(null);
  const secondGridRef = React.useRef<HTMLDivElement>(null);
  const desktopSwiperSwiping = React.useRef(false);
  const desktopSwipingSide = React.useRef(0);
  const desktopSwiperStart = React.useRef<{ x: number; y: number } | null>(
    null,
  );
  const desktopSwipingFrameTime = React.useRef(0);
  const desktopSwipingFramePosition = React.useRef<{
    x: number;
    y: number;
  } | null>(null);
  const desktopSwipingVelocity = React.useRef(0);

  /** True while a CSS transition is in progress (from keyboard nav or touch end) */
  const animating = React.useRef(false);
  /** 'forward' = change desktop index on completion, 'snap-back' = just revert */
  const animationType = React.useRef<'forward' | 'snap-back'>('forward');

  const insideElement = (
    element: HTMLElement,
    pos: { x: number; y: number },
  ) => {
    const rect = element.getBoundingClientRect();
    return (
      rect.left < pos.x &&
      pos.x < rect.right &&
      rect.top < pos.y &&
      pos.y < rect.bottom
    );
  };

  /** Animate to the adjacent desktop (forward animation) */
  const animateToDesktop = (direction: number) => {
    if (!gridRef.current || !secondGridRef.current) return;
    if (animating.current) return;

    animating.current = true;
    animationType.current = 'forward';

    const grid = gridRef.current;
    const second = secondGridRef.current;
    const w = grid.clientWidth;

    // Remove any in-flight transition first
    grid.style.transition = 'none';
    second.style.transition = 'none';

    // Set starting positions: current grid at 0, next grid offscreen
    grid.style.transform = 'translateX(0)';
    second.style.transform = `translateX(${w * direction}px)`;

    // Force layout so the starting positions commit
    second.getBoundingClientRect();

    // Then animate with transition
    grid.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
    second.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';

    grid.style.transform = `translateX(${w * -direction}px)`;
    second.style.transform = 'translateX(0)';
  };

  /** Clean up all animation state after the transition has finished */
  const resetAnimation = () => {
    // Hide the second grid — it's done its job
    if (secondGridRef.current) {
      secondGridRef.current.style.display = 'none';
    }
    // Snap the main grid back in place. By this point React has already
    // committed new content (we defer DOM cleanup to after the commit).
    if (gridRef.current) {
      gridRef.current.style.transition = 'none';
      gridRef.current.style.transform = 'translateX(0)';
    }

    desktopSwiperStart.current = null;
    desktopSwiperSwiping.current = false;
    animating.current = false;
    invalidate();
  };

  /** After a forward animation completes, switch the desktop index */
  const finalizeDesktopChange = (direction: number) => {
    desktopIndex.current = Math.max(
      0,
      Math.min(appGrid.current.length - 1, desktopIndex.current + direction),
    );

    // Defer DOM cleanup to after React has committed the new desktop content.
    // Double rAF is the standard pattern for "after the next paint / React commit":
    //   rAF 1 → fires between paint frames (React may have committed)
    //   rAF 2 → fires on the next frame, guaranteeing React's DOM is live
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resetAnimation();
      });
    });
  };

  React.useEffect(() => {
    const SWIPE_THRESHOLD = 10;

    const onSwipeStart = (e: MouseEvent | TouchEvent) => {
      if (draggableElement.current) return;
      if (appGrid.current.length < 2) return;
      if (animating.current) return;

      const { x: posX, y: posY } = getPointerPos(e);

      if (
        desktopSwiperRef.current &&
        insideElement(desktopSwiperRef.current, { x: posX, y: posY })
      ) {
        desktopSwiperStart.current = { x: posX, y: posY };

        registerMouseActivity({ do: onSwipe, end: onSwipeEnd });
      }
    };

    const onSwipe = (e: MouseEvent | TouchEvent) => {
      const { x: posX, y: posY } = getPointerPos(e);
      if (
        !desktopSwiperStart.current ||
        !desktopSwiperRef.current ||
        !insideElement(desktopSwiperRef.current, { x: posX, y: posY })
      )
        return;

      if (!desktopSwiperSwiping.current) {
        const distance = posX - desktopSwiperStart.current.x;
        const direction = distance > 0 ? -1 : 1;
        if (
          Math.abs(desktopSwiperStart.current.x - posX) > SWIPE_THRESHOLD &&
          appGrid.current?.[desktopIndex.current + direction]
        ) {
          desktopSwiperSwiping.current = true;
          desktopSwipingSide.current = direction;
          desktopSwipingFrameTime.current = e.timeStamp;
          desktopSwipingFramePosition.current = { x: posX, y: posY };
          invalidate();
        }
      } else if (
        gridRef.current &&
        secondGridRef.current &&
        desktopSwipingFramePosition.current
      ) {
        desktopSwipingVelocity.current =
          (posX - desktopSwipingFramePosition.current.x) /
          (e.timeStamp - desktopSwipingFrameTime.current);

        const distance = posX - desktopSwiperStart.current.x;
        const direction = distance > 0 ? -1 : 1;

        // Use raw pixel transforms (no transition for responsive feel)
        secondGridRef.current.style.transition = 'none';
        secondGridRef.current.style.transform = `translateX(${
          secondGridRef.current.clientWidth * direction + distance
        }px)`;
        gridRef.current.style.transition = 'none';
        gridRef.current.style.transform = `translateX(${distance}px)`;
        desktopSwipingSide.current = direction;

        desktopSwipingFrameTime.current = e.timeStamp;
        desktopSwipingFramePosition.current = { x: posX, y: posY };
      }
    };

    // Schedule a deferred cleanup after an animation starts.
    // We use setTimeout instead of transitionend to avoid racing React's
    // commit phase: by the time the timeout fires (well after the CSS
    // transition is done), React has already re-rendered with the new
    // desktop content and there's no old content to flash.
    let scheduledCleanup: ReturnType<typeof setTimeout> | null = null;

    const scheduleCleanup = () => {
      if (scheduledCleanup) clearTimeout(scheduledCleanup);
      scheduledCleanup = setTimeout(() => {
        scheduledCleanup = null;
        if (animationType.current === 'forward') {
          finalizeDesktopChange(desktopSwipingSide.current);
        } else {
          resetAnimation();
        }
      }, 400); // 350ms transition + 50ms buffer for React to commit
    };

    const onSwipeEnd = (e: MouseEvent | TouchEvent | FocusEvent) => {
      if (
        desktopSwiperStart.current &&
        gridRef.current &&
        secondGridRef.current
      ) {
        const { x: endX } = getPointerPos(e);
        const distance = endX - desktopSwiperStart.current.x;
        const direction = distance > 0 ? -1 : 1;

        const velocityGate = Math.abs(desktopSwipingVelocity.current) > 1;
        const distanceGate =
          Math.abs(distance) > secondGridRef.current.clientWidth * 0.3;

        const shouldSwitch = velocityGate || distanceGate;

        if (shouldSwitch) {
          // Animate to the next desktop with a transition
          animateToDesktop(direction);
          scheduleCleanup();
        } else {
          // Snap back with transition — keep second grid alive until transition ends
          animating.current = true;
          animationType.current = 'snap-back';
          gridRef.current.style.transition =
            'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
          secondGridRef.current.style.transition =
            'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)';
          gridRef.current.style.transform = 'translateX(0)';
          secondGridRef.current.style.transform = `translateX(${
            secondGridRef.current.clientWidth * direction
          }px)`;
          scheduleCleanup();
        }
      }

      desktopSwiperStart.current = null;
      desktopSwiperSwiping.current = false;

      // Clean up only on no-animation path; animations finalize via transitionend
      if (!animating.current) {
        invalidate();
      }

      unregisterMouseActivity({ do: onSwipe, end: onSwipeEnd });
    };

    // Keyboard navigation for switching desktops
    const onKeyDown = (e: KeyboardEvent) => {
      if (appGrid.current.length < 2) return;
      if (animating.current) return;

      let direction = 0;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        direction = -1;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        direction = 1;
      }

      if (direction === 0) return;
      if (!appGrid.current[desktopIndex.current + direction]) return;

      // Trigger animated switch via the swipe system
      desktopSwiperSwiping.current = true;
      desktopSwipingSide.current = direction;
      invalidate();

      // After React renders the second grid, animate
      requestAnimationFrame(() => {
        animateToDesktop(direction);
        scheduleCleanup();
      });
    };

    registerMouseActivity({ start: onSwipeStart });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      if (scheduledCleanup) clearTimeout(scheduledCleanup);
      unregisterMouseActivity({
        start: onSwipeStart,
        do: onSwipe,
        end: onSwipeEnd,
      });
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return {
    gridRef,
    secondGridRef,
    desktopSwiperRef,
    desktopSwiperSwiping,
    desktopSwipingSide,
  };
}
