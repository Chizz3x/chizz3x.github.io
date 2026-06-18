import React from 'react';
import styled from 'styled-components';

// ─── Styled components ────────────────────────────────────────────────────

export const ScrollbarTrack = styled.div`
  position: absolute;
  right: 2px;
  top: 2px;
  bottom: 2px;
  width: 8px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
  &:hover {
    opacity: 1;
  }
`;

export const ScrollbarThumb = styled.div`
  position: absolute;
  left: 1px;
  right: 1px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.35);
  cursor: grab;
  &:active {
    background: rgba(255, 255, 255, 0.55);
    cursor: grabbing;
  }
`;

// ─── Interface ────────────────────────────────────────────────────────────

export interface IUseScrollbarOptions {
  /** Mutable ref whose `.current` value the scrollbar reads and writes */
  scrollOffset: React.MutableRefObject<number>;
  /** Scroll-clamp function — same signature as calcScrollTo */
  clamp: (row: number, total: number, visible: number) => number;
}

export interface IUseScrollbarResult {
  /** Ref to attach to the track element */
  trackRef: React.RefObject<HTMLDivElement>;
  /** Ref to attach to the thumb element */
  thumbRef: React.RefObject<HTMLDivElement>;
  /** PointerDown handler for the track element */
  onTrackPointerDown: (e: React.PointerEvent) => void;
  /**
   * Call every frame from your render loop:
   * `updateScrollbar(totalVirtualRows, visibleRows)`
   * Reads `scrollOffset.current` internally.
   */
  update: (total: number, visible: number) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useScrollbar({
  scrollOffset,
  clamp,
}: IUseScrollbarOptions): IUseScrollbarResult {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const thumbRef = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  const dragStartY = React.useRef(0);
  const dragStartOffset = React.useRef(0);
  const totalRef = React.useRef(0);
  const visibleRef = React.useRef(0);

  const update = (total: number, visible: number) => {
    totalRef.current = total;
    visibleRef.current = visible;

    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    if (total <= visible) {
      thumb.style.display = 'none';
      return;
    }
    thumb.style.display = '';

    const trackHeight = track.clientHeight;
    const thumbRatio = Math.min(1, visible / total);
    const thumbH = Math.max(20, trackHeight * thumbRatio);
    const scrollable = total - Math.round(visible / 2);
    const ratio = scrollable > 0 ? scrollOffset.current / scrollable : 0;

    thumb.style.height = `${thumbH}px`;
    thumb.style.top = `${ratio * (trackHeight - thumbH)}px`;
  };

  const onTrackPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const total = totalRef.current;
    const visible = visibleRef.current;

    const trackRect = track.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const thumbTop = thumb.offsetTop;
    const thumbH = thumb.clientHeight;

    // If clicking on the thumb, initiate drag
    if (clickY >= thumbTop && clickY <= thumbTop + thumbH) {
      dragging.current = true;
      dragStartY.current = e.clientY;
      dragStartOffset.current = scrollOffset.current;
      thumb.setPointerCapture(e.pointerId);
      return;
    }

    // Click on track — scroll to that position
    const scrollable = total - Math.round(visible / 2);
    if (scrollable <= 0) return;

    const clickRatio = clickY / trackRect.height;
    scrollOffset.current = clamp(
      Math.round(clickRatio * scrollable),
      total,
      visible,
    );
  };

  // Drag pointer handlers attached to window so we track out-of-bounds moves
  React.useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const track = trackRef.current;
      if (!track) return;

      const total = totalRef.current;
      const visible = visibleRef.current;
      const scrollable = total - Math.round(visible / 2);
      if (scrollable <= 0) return;

      const thumb = thumbRef.current;
      if (!thumb) return;
      const thumbH = thumb.clientHeight;
      const trackHeight = track.clientHeight;
      const trackScrollable = trackHeight - thumbH;

      const dy = e.clientY - dragStartY.current;
      const scrollDelta = (dy / trackScrollable) * scrollable;
      scrollOffset.current = clamp(
        dragStartOffset.current + scrollDelta,
        total,
        visible,
      );
    };

    const onPointerUp = () => {
      dragging.current = false;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [scrollOffset, clamp]);

  return {
    trackRef,
    thumbRef,
    onTrackPointerDown,
    update,
  };
}
