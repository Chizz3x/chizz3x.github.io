import { CommandBase } from './command-base';

export namespace NTerminalApp {
  export interface IProps {
    newLinePrefix?: string;
    initData?: TPushData[][];
    commands?: Map<string, CommandBase>;
  }

  export interface IGridSize {
    cols: number;
    rows: number;
  }
  export interface ICellSize {
    width: number;
    height: number;
  }
  export type TCell =
    | {
        type: 'char';
        value: string;
        color?: string;
        backgroundColor?: string;
        locked?: boolean;
      }
    | {
        type: 'pixels';
        value: ImageBitmap;
        backgroundColor?: string;
        locked?: boolean;
        char?: string;
        charColor?: string;
      };
  export type TCursor = {
    row: number;
    col: number;
  };

  export type TPushData =
    | {
        type: 'text';
        value: string;
        color?: string;
        backgroundColor?: string;
        locked?: boolean;
      }
    | {
        type: 'pixels';
        value: number[];
        backgroundColor?: string;
        locked?: boolean;
      }
    | {
        type: 'image';
        value: string;
        backgroundColor?: string;
        locked?: boolean;
      }
    | {
        type: 'progress';
        length: number;
        backgroundColor?: [number, number, number, number];
        color: [number, number, number, number];
        locked?: boolean;
        value: number; // normalized percent 0 - 1
        text?: string;
        textColor?: string;
        textAlign?: 'left' | 'middle' | 'right';
      };
}
