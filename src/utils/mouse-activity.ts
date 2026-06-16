/**
 * Instead of defining this bs all the time over and over again we write functions to do this cleanly
 * I love this.
 */

export const registerMouseActivity = (props: NMouseActivity.IProps) => {
  if (props.start) {
    window.addEventListener('mousedown', props.start);
    window.addEventListener('touchstart', props.start);
  }
  if (props.do) {
    window.addEventListener('mousemove', props.do);
    window.addEventListener('touchmove', props.do);
  }
  if (props.end) {
    window.addEventListener('mouseup', props.end);
    window.addEventListener('touchend', props.end);
    window.addEventListener('blur', props.end);
  }
};

export const unregisterMouseActivity = (props: NMouseActivity.IProps) => {
  if (props.start) {
    window.removeEventListener('mousedown', props.start);
    window.removeEventListener('touchstart', props.start);
  }
  if (props.do) {
    window.removeEventListener('mousemove', props.do);
    window.removeEventListener('touchmove', props.do);
  }
  if (props.end) {
    window.removeEventListener('mouseup', props.end);
    window.removeEventListener('touchend', props.end);
    window.removeEventListener('blur', props.end);
  }
};
export const getPointerPos = (e: MouseEvent | TouchEvent | FocusEvent) => {
  return {
    x:
      'touches' in e
        ? e.touches[0]?.clientX || e.changedTouches[0]?.clientX || 0
        : 'clientX' in e
        ? e.clientX
        : 0,
    y:
      'touches' in e
        ? e.touches[0]?.clientY || e.changedTouches[0]?.clientY || 0
        : 'clientY' in e
        ? e.clientY
        : 0,
  };
};

export namespace NMouseActivity {
  export interface IProps {
    start?: (e: MouseEvent | TouchEvent) => any;
    do?: (e: MouseEvent | TouchEvent) => any;
    end?: (e: MouseEvent | TouchEvent | FocusEvent) => any;
  }
}
