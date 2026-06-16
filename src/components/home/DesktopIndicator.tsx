import React from 'react';
import { AppItem } from '../application/application';
import classes from '../../utils/classes';

interface IDesktopIndicatorProps {
  appGrid: React.MutableRefObject<AppItem[][]>;
  desktopIndex: React.MutableRefObject<number>;
  desktopSwiperRef: React.RefObject<HTMLDivElement>;
}

export function DesktopIndicator({
  appGrid,
  desktopIndex,
  desktopSwiperRef,
}: IDesktopIndicatorProps) {
  return (
    <div className="screen-overlay-1">
      <div className="desktop-indicator-box">
        {appGrid.current.length > 1
          ? appGrid.current.map((_, i) => (
              <div
                key={i}
                className={classes(
                  'desktop-indicator',
                  i === desktopIndex.current && 'active',
                )}
              />
            ))
          : null}
      </div>
      <div ref={desktopSwiperRef} className="desktop-swiper" />
    </div>
  );
}
