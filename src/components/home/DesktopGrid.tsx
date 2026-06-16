import React from 'react';
import { AppItem } from '../application/application';
import classes from '../../utils/classes';

interface IDesktopGridProps {
  appGrid: React.MutableRefObject<AppItem[][]>;
  desktopIndex: React.MutableRefObject<number>;
  cols: number;
  rows: number;
  selectedCell: number;
  onSelectCell: (i: number) => void;
  onOpenApp: (i: number) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  dragHappenedRef: React.MutableRefObject<boolean>;
  /** Optional desktop offset for the swipe preview grid */
  sideOffset?: number;
}

function CellIcon({
  app,
  selected,
  onSelect,
  onOpen,
  onDrag,
  onTouch,
  dragHappenedRef,
  index,
}: {
  app: AppItem;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDrag: (e: React.MouseEvent) => void;
  onTouch: (e: React.TouchEvent) => void;
  dragHappenedRef: React.MutableRefObject<boolean>;
  index: number;
}) {
  const handleTouchEnd = () => {
    // If the touch turned into a drag, don't open
    if (dragHappenedRef.current) return;
    onOpen();
  };

  return (
    <div
      className={classes('app-object', selected && 'selected')}
      onClick={onSelect}
      onDoubleClick={onOpen}
      onTouchStart={onTouch}
      onTouchEnd={handleTouchEnd}
      onMouseDown={onDrag}
      data-index={index}
    >
      <div className="app-icon-box">
        {typeof app.icon === 'string' ? (
          <div
            className="app-icon"
            style={{ backgroundImage: `url(${app.icon})` }}
          />
        ) : (
          app.icon
        )}
      </div>
      <div className="app-title">{app.title}</div>
    </div>
  );
}

export function DesktopGrid({
  appGrid,
  desktopIndex,
  cols,
  rows,
  selectedCell,
  onSelectCell,
  onOpenApp,
  onDragStart,
  onTouchStart,
  dragHappenedRef,
  sideOffset = 0,
}: IDesktopGridProps): React.ReactElement {
  const di = desktopIndex.current + sideOffset;
  const desktop = appGrid.current[di] || [];

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < cols * rows; i++) {
    const app = desktop[i];
    cells.push(
      <div
        key={`${i}-${!!app?.aid}${sideOffset ? `-s${sideOffset}` : ''}`}
        className="cell"
        data-index={i}
      >
        <div className="cell-inner">
          {app ? (
            <CellIcon
              app={app}
              selected={selectedCell === i}
              onSelect={() => onSelectCell(i)}
              onOpen={() => onOpenApp(i)}
              onDrag={onDragStart}
              onTouch={onTouchStart}
              dragHappenedRef={dragHappenedRef}
              index={i}
            />
          ) : null}
        </div>
      </div>,
    );
  }

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{cells}</>;
}
