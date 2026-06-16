import React from 'react';
import styled from 'styled-components';
import { CSSMediaSize } from '../const';
import { AppItem } from '../components/application/application';
import { TerminalApp } from '../components/application/apps/terminal';
import { TestApp } from '../components/application/apps/test';
import { DesktopBackground } from '../components/home/DesktopBackground';
import { DesktopGrid } from '../components/home/DesktopGrid';
import { DesktopIndicator } from '../components/home/DesktopIndicator';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useDesktopSwipe } from '../hooks/useDesktopSwipe';
import {
  insertAppAtPlace,
  handleOverflow,
  reflowApps,
} from '../utils/desktop-grid';
import { isTouchDevice } from '../utils/touch-device';

const defaultCellSize = 100;
const defaultGap = 20;

function PageHome() {
  const [initSetup, setInitSetup] = React.useState(false);
  const [selectedCell, setSelectedCell] = React.useState(-1);
  const [, forceRender] = React.useState(false);
  const invalidate = () => forceRender((v) => !v);

  const onCloseApp = () => invalidate();

  const appGrid = React.useRef<AppItem[][]>([[]]);
  const desktopIndex = React.useRef(0);

  const [cellSize] = React.useState(defaultCellSize);
  const [gap] = React.useState(defaultGap);
  const [size, setSize] = React.useState<NHome.IGridSize>({
    cols: 0,
    rows: 0,
  });

  const gridRef = React.useRef<HTMLDivElement>(null);
  const [gridRefSize, setGridRefSize] = React.useState({
    width: 0,
    height: 0,
  });

  // Grid sizing
  const updateGrid = () => {
    const newCols = Math.floor((gridRefSize.width + gap) / (cellSize + gap));
    const newRows = Math.floor((gridRefSize.height + gap) / (cellSize + gap));
    if (newCols === size.cols && newRows === size.rows) return;
    setSize({ cols: newCols, rows: newRows });
  };

  React.useEffect(() => {
    updateGrid();
  }, [gridRefSize]);

  React.useEffect(() => {
    const onResize = () => {
      setGridRefSize({
        width: (gridRef.current?.clientWidth || 0) - gap * 2,
        height: (gridRef.current?.clientHeight || 0) - gap * 2,
      });
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [cellSize, gap]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('.app-object')) {
        setSelectedCell(-1);
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  // Init & grid-resize reflow
  React.useEffect(() => {
    if (!initSetup && size.cols * size.rows > 0) {
      setInitSetup(true);
      insertAppAtPlace(
        appGrid.current,
        size.rows,
        size.cols,
        'middle',
        'middle',
        new TerminalApp(onCloseApp),
      );
      for (let i = 0; i < 20; i++) {
        insertAppAtPlace(
          appGrid.current,
          size.rows,
          size.cols,
          'middle',
          'middle',
          new TestApp(onCloseApp),
        );
      }
      for (let di = 0; di < appGrid.current.length; di++) {
        handleOverflow(appGrid.current, size.rows, size.cols, di);
      }
      return;
    }

    if (initSetup && size.cols * size.rows > 0) {
      reflowApps(appGrid.current, size.rows, size.cols, onCloseApp, () => {});
      invalidate();
    }
  }, [size]);

  const openApp = (index: number) => {
    if (swipe.desktopSwiperSwiping.current) return;
    appGrid.current[desktopIndex.current][index].build(isTouchDevice());
    setSelectedCell(-1);
  };

  const {
    draggableContainerRef,
    draggableBoxRef,
    onDragStart,
    onTouchStart,
    dragHappened,
  } = useDragAndDrop(appGrid, desktopIndex, setSelectedCell, invalidate);

  const swipe = useDesktopSwipe(
    appGrid,
    desktopIndex,
    draggableContainerRef as unknown as React.MutableRefObject<
      HTMLDivElement | null | undefined
    >,
    invalidate,
  );

  return (
    <PageHomeStyle id="Home">
      <DesktopBackground />
      <div className="space">
        {Object.values(appGrid.current[desktopIndex.current]).map(
          (m) => m?.Application,
        )}
      </div>

      <GroundStyle
        ref={gridRef ?? swipe.gridRef}
        columns={size.cols}
        gap={gap}
        cellSize={cellSize}
        className="ground"
      >
        <DesktopGrid
          appGrid={appGrid}
          desktopIndex={desktopIndex}
          cols={size.cols}
          rows={size.rows}
          selectedCell={selectedCell}
          onSelectCell={setSelectedCell}
          onOpenApp={openApp}
          onDragStart={onDragStart}
          onTouchStart={onTouchStart}
          dragHappenedRef={dragHappened}
        />
      </GroundStyle>

      {swipe.desktopSwiperSwiping.current ? (
        <GroundStyle
          ref={swipe.secondGridRef}
          columns={size.cols}
          gap={gap}
          cellSize={cellSize}
          className="ground ground-second"
        >
          <DesktopGrid
            appGrid={appGrid}
            desktopIndex={desktopIndex}
            cols={size.cols}
            rows={size.rows}
            selectedCell={selectedCell}
            onSelectCell={setSelectedCell}
            onOpenApp={openApp}
            onDragStart={onDragStart}
            onTouchStart={onTouchStart}
            dragHappenedRef={dragHappened}
            sideOffset={swipe.desktopSwipingSide.current}
          />
        </GroundStyle>
      ) : null}

      <div ref={draggableContainerRef} className="draggable-container">
        <div ref={draggableBoxRef} className="draggable-box" />
      </div>

      <DesktopIndicator
        appGrid={appGrid}
        desktopIndex={desktopIndex}
        desktopSwiperRef={swipe.desktopSwiperRef}
      />
    </PageHomeStyle>
  );
}

export { PageHome };

export namespace NHome {
  export interface IGridStyleProps {
    columns: number;
    gap: number;
    cellSize: number;
  }
  export interface IGridSize {
    cols: number;
    rows: number;
  }
}

const GroundStyle = styled.div<NHome.IGridStyleProps>`
  position: absolute;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(${({ columns }) => columns}, 1fr);
  padding: ${({ gap }) => gap / 2}px;
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  &.ground-second {
    pointer-events: none;
    user-select: none;
  }
  .cell {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: ${({ gap }) => gap / 2}px;
    box-sizing: border-box;
    .cell-inner {
      aspect-ratio: 1/1;
      width: ${({ cellSize }) => cellSize}px;
    }
  }
`;

const PageHomeStyle = styled.div`
  flex-shrink: 0;
  flex-grow: 1;

  @keyframes bg-pulse {
    0% {
      filter: brightness(1) grayscale(0) saturate(1);
    }
    25% {
      filter: brightness(0.8) grayscale(0.2) saturate(0.8);
    }
    50% {
      filter: brightness(1.3) grayscale(0) saturate(1);
    }
    75% {
      filter: brightness(0.75) grayscale(0.25) saturate(0.75);
    }
    100% {
      filter: brightness(1) grayscale(0) saturate(1);
    }
  }

  width: 100%;
  min-height: 100vh;
  position: relative;
  .app-object {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 8px 12px;
    user-select: none;
    cursor: pointer;
    &.selected {
      background-color: rgba(0, 0, 0, 0.4);
    }
    &:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
    .app-icon-box {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      .app-icon {
        width: 100%;
        height: 100%;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
      }
    }
    .app-title {
      font-size: 14px;
      text-align: center;
    }
  }
  .draggable-container {
    width: 100%;
    height: 100%;
    position: absolute;
    user-select: none;
    pointer-events: none;
    overflow: hidden;
    .draggable-box {
      width: ${defaultCellSize}px;
      height: ${defaultCellSize}px;
      position: absolute;
    }
  }
  .cover-fade {
    position: absolute;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      var(--c-bg-1),
      transparent 50%,
      var(--c-bg-1) 100%
    );
  }
  .cover {
    position: absolute;
    width: 100%;
    height: 100%;
    background: url('./img/1.png');
    animation: bg-pulse 20s ease-in-out infinite;
    background-size: cover;
    background-position: center;
  }
  .space {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 2;
    pointer-events: none;
    box-sizing: border-box;
    > * {
      pointer-events: all;
    }
  }

  .screen-overlay-1 {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: flex;
    .desktop-indicator-box {
      position: absolute;
      display: flex;
      justify-content: center;
      align-self: flex-end;
      justify-self: end;
      padding: 20px 10px;
      display: flex;
      column-gap: 10px;
      width: 100%;
      box-sizing: border-box;
      .desktop-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        transition: background-color 0.3s ease-in-out;
        background-color: rgba(255, 255, 255, 0.5);
        &.active {
          background-color: white;
        }
      }
    }
    .desktop-swiper {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }

  ${CSSMediaSize.tablet} {
    //
  }
`;
