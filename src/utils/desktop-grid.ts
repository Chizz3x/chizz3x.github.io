import { AppItem } from '../components/application/application';

// ─── Collect / Destroy / Reflow ─────────────────────────────────────────

export function collectAllApps(appGrid: AppItem[][]): AppItem[] {
  const seen = new Set<AppItem>();
  const apps: AppItem[] = [];
  for (const desktop of appGrid) {
    for (const app of desktop) {
      if (app && !seen.has(app)) {
        seen.add(app);
        apps.push(app);
      }
    }
  }
  return apps;
}

export function destroyAllOpenApps(apps: AppItem[]) {
  for (const app of apps) {
    if (app.Application) {
      app.destroy();
    }
  }
}

export function reflowApps(
  appGrid: AppItem[][],
  rows: number,
  cols: number,
  onCloseApp: () => void,
  onNewApp: (app: AppItem) => void,
) {
  const apps = collectAllApps(appGrid);
  destroyAllOpenApps(apps);
  appGrid.length = 0;
  appGrid.push([]);
  for (const app of apps) {
    insertAppAtPlace(appGrid, rows, cols, 'middle', 'middle', app);
    onNewApp(app);
  }
  for (let di = 0; di < appGrid.length; di++) {
    handleOverflow(appGrid, rows, cols, di);
  }
}

// ─── Grid helpers ────────────────────────────────────────────────────────

export function findClosestFreeIndex(
  appGrid: AppItem[][],
  rows: number,
  cols: number,
  startRow: number,
  startCol: number,
  di: number,
): number {
  let bestIndex = -1;
  let bestDist = Infinity;
  let bestRing = Infinity;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (appGrid[di][idx]) continue;

      const dx = r - startRow;
      const dy = c - startCol;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ring = Math.max(Math.abs(dx), Math.abs(dy));

      if (dist < bestDist || (dist === bestDist && ring < bestRing)) {
        bestDist = dist;
        bestRing = ring;
        bestIndex = idx;
      }
    }
  }

  return bestIndex;
}

export function isDesktopFull(
  appGrid: AppItem[][],
  rows: number,
  cols: number,
  di: number,
): boolean {
  return appGrid[di].filter(Boolean).length >= rows * cols;
}

export function addEmptyDesktop(appGrid: AppItem[][]) {
  appGrid.push([]);
}

export function findFirstFreeDesktop(
  appGrid: AppItem[][],
  rows: number,
  cols: number,
): number {
  for (let i = 0; i < appGrid.length; i++) {
    if (appGrid[i].filter(Boolean).length < rows * cols) {
      return i;
    }
  }
  return -1;
}

export function insertAppAtPlace(
  appGrid: AppItem[][],
  rows: number,
  cols: number,
  vertical: 'top' | 'middle' | 'bottom',
  horizontal: 'left' | 'middle' | 'right',
  app: AppItem,
  di = 0,
) {
  let chosenDI = di;
  let row = 0;
  let col = 0;

  if (vertical === 'middle') row = Math.floor(rows / 2);
  else if (vertical === 'bottom') row = rows - 1;

  if (horizontal === 'middle') col = Math.floor(cols / 2);
  else if (horizontal === 'right') col = cols - 1;

  let targetIndex = row * cols + col;

  if (!appGrid[chosenDI][targetIndex]) {
    appGrid[chosenDI][targetIndex] = app;
    return;
  }

  if (isDesktopFull(appGrid, rows, cols, chosenDI)) {
    chosenDI = findFirstFreeDesktop(appGrid, rows, cols);
    if (chosenDI === -1) {
      addEmptyDesktop(appGrid);
      chosenDI = appGrid.length - 1;
    } else {
      targetIndex = findClosestFreeIndex(
        appGrid,
        rows,
        cols,
        row,
        col,
        chosenDI,
      );
    }
  } else {
    targetIndex = findClosestFreeIndex(appGrid, rows, cols, row, col, chosenDI);
  }

  appGrid[chosenDI][targetIndex] = app;
}

export function handleOverflow(
  appGrid: AppItem[][],
  rows: number,
  cols: number,
  di: number,
) {
  const capacity = Math.max(1, rows * cols);
  const desktop = appGrid[di];
  if (!desktop) return;

  for (let i = 0; i < desktop.length; i++) {
    const app = desktop[i];
    if (!app) continue;
    if (i < capacity) continue;

    delete desktop[i];
    insertAppAtPlace(appGrid, rows, cols, 'middle', 'middle', app, di);
  }
}

// ─── DOM helper ─────────────────────────────────────────────────────────

export function checkUnderlyingElement(x: number, y: number) {
  const elements = document.elementsFromPoint(x, y);
  return elements.find((el) => el.classList.contains('cell'));
}
