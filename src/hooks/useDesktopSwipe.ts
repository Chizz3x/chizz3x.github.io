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
  const gridRef = React.useRef<HTMLDivElement>(null);

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

  React.useEffect(() => {
    const SWIPE_THRESHOLD = 10;

    const onSwipeStart = (e: MouseEvent | TouchEvent) => {
      if (draggableElement.current) return;
      if (appGrid.current.length < 2) return;

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

        secondGridRef.current.style.transform = `translateX(${
          secondGridRef.current.clientWidth * direction + distance
        }px)`;
        gridRef.current.style.transform = `translateX(${distance}px)`;
        desktopSwipingSide.current =
          window.innerWidth < desktopSwiperStart.current.x ? -1 : 1;

        desktopSwipingFrameTime.current = e.timeStamp;
        desktopSwipingFramePosition.current = { x: posX, y: posY };
      }
    };

    const onSwipeEnd = () => {
      if (
        desktopSwiperStart.current &&
        gridRef.current &&
        secondGridRef.current
      ) {
        const distance =
          desktopSwiperStart.current.x - desktopSwiperStart.current.x;
        const direction = distance > 0 ? -1 : 1;

        const velocityGate = Math.abs(desktopSwipingVelocity.current) > 1;

        if (velocityGate) {
          desktopIndex.current = Math.max(
            0,
            Math.min(
              appGrid.current.length - 1,
              desktopIndex.current + direction,
            ),
          );
        }

        secondGridRef.current.style.transform = 'translateX(0)';
        gridRef.current.style.transform = 'translateX(0)';
      }

      desktopSwiperStart.current = null;
      desktopSwiperSwiping.current = false;
      invalidate();

      unregisterMouseActivity({ do: onSwipe, end: onSwipeEnd });
    };

    registerMouseActivity({ start: onSwipeStart });

    return () => {
      unregisterMouseActivity({
        start: onSwipeStart,
        do: onSwipe,
        end: onSwipeEnd,
      });
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
