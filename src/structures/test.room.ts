import Game from "../elements/Game";
import defaultify from "../modules/utils/defaultify";
import { RecursivePartial } from "../types/typescript";

namespace NTestRoom {
	export interface ITestRoomSettings {
		pos: { x: number, y: number }
	}
}

const defaultTestRoomSettings: NTestRoom.ITestRoomSettings = {
  pos: { x: 0, y: 0 }
};

const test_room = (game: Game, settings?: RecursivePartial<NTestRoom.ITestRoomSettings>) => {
  const sets = defaultify(defaultTestRoomSettings, settings);

  for(let i = 0; i < 7; i++) {
    if(i == 0 || i + 1 == 7) {
      for(let j = 0; j < 7; j++)
        game.addBk("solid_red", { pos: { x: sets.pos.x - game.getDist(3) + game.getDist(j), y: sets.pos.y - game.getDist(3) + game.getDist(i) } });
    } else {
      game.addBk("solid_red", { pos: { x: sets.pos.x - game.getDist(3), y: sets.pos.y - game.getDist(3) + game.getDist(i) } });
      if(i !== 3) game.addBk("solid_red", { pos: { x: sets.pos.x + game.getDist(3), y: sets.pos.y - game.getDist(3) + game.getDist(i) } });
    }
  }
};

export default test_room;