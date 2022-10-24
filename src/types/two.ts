import Two from "twojs-ts";
import glob from "../constants/global";
import Block from "../elements/Block";
import Player from "../elements/Player";

type AllObjects = Block | Player; // + bg, fg, ent

const convertPos = (posName: keyof typeof glob.pos, two: Two) => {
  return {
    CENTER: () => ({ x: Math.round(two.width / 2), y: Math.round(two.height / 2) }),
    MIDDLE_LEFT: () => ({ x: 0, y: Math.round(two.height / 2) }),
    MIDDLE_RIGHT: () => ({ x: two.width, y: Math.round(two.height / 2) }),
    MIDDLE_TOP: () => ({ x: Math.round(two.width / 2), y: 0 }),
    MIDDLE_BOTTOM: () => ({ x: Math.round(two.width / 2), y: two.height }),
  }[posName]();
};

export { convertPos };
export type { AllObjects };