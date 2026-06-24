import React from 'react';

export interface IHiddenInputHandlers {
  onChar: (ch: string) => void;
  onEnter: () => void;
  onBackspace: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
}

export interface IUseHiddenInputReturn {
  hiddenInputRef: React.RefObject<HTMLInputElement>;
  /** Call this on <canvas onMouseDown /> to focus the hidden input */
  onFocusInput: () => void;
  /** Spread these on the <input> element */
  inputHandlers: {
    onInput: (e: React.FormEvent<HTMLInputElement>) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onBlur: () => void;
  };
}

/**
 * Shared hidden-input logic for canvas-based text editors.
 *
 * Manages a transparent <input> that captures mobile keyboard input
 * and desktop keystrokes, forwarding them to the provided handlers.
 * The window keydown handler guards via `skipIfInputFocused(hiddenInputRef)`
 * to avoid double-processing.
 */
export function useHiddenInput(
  handlers: IHiddenInputHandlers,
): IUseHiddenInputReturn {
  const hiddenInputRef = React.useRef<HTMLInputElement>(null);

  const onFocusInput = () => {
    hiddenInputRef.current?.focus();
  };

  const onBlur = () => {
    requestAnimationFrame(() => {
      if (
        hiddenInputRef.current &&
        document.activeElement !== hiddenInputRef.current
      ) {
        hiddenInputRef.current.focus();
      }
    });
  };

  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const { value } = input;

    for (let i = 0; i < value.length; i++) {
      const ch = value[i];
      if (ch === '\n') {
        handlers.onEnter();
      } else {
        handlers.onChar(ch);
      }
    }
    input.value = '';
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    switch (e.key) {
      case 'Backspace':
        e.preventDefault();
        handlers.onBackspace();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        handlers.onArrowLeft?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        handlers.onArrowRight?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        handlers.onArrowUp?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        handlers.onArrowDown?.();
        break;
    }
  };

  return {
    hiddenInputRef,
    onFocusInput,
    inputHandlers: { onInput, onKeyDown, onBlur },
  };
}

/**
 * Guard for window-level keydown listeners. Returns true when the hidden
 * input is the active element, meaning the hidden input's own handlers
 * already processed the key — skip to avoid double-processing.
 */
export function skipIfInputFocused(
  hiddenInputRef: React.RefObject<HTMLInputElement>,
): boolean {
  return !!(
    hiddenInputRef.current && document.activeElement === hiddenInputRef.current
  );
}
