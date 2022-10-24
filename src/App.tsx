import React from "react";
import styled from "styled-components";

import Game from "./elements/Game";

import "./App.css";
import test_room from "./structures/test.room";
import { convertPos } from "./types/two";

const App = () => {
  const refContainer = React.useRef<HTMLDivElement | null>(null);

  /**
	 * Main game function
	 * @param game new Game class object
	 */
  const initGame = (game: Game) => {
    console.info("init");
    const center = convertPos("CENTER", game.getTwo);
    test_room(game, { pos: { x: center.x, y: center.y } });
    game.addPlayer("sprites/entities/player");
  };

  React.useEffect(() => {
    let game: Game | null;
    if(refContainer?.current) {
      game = new Game({
        element: refContainer.current,
      });

      initGame(game);
    }
		
    return () => {
      if(game) {
        game?.destroy();
        game = null;
      }
    };
  }, [refContainer]);

  return (
    <AppStyle className="App">
      <div ref={refContainer} />
    </AppStyle>
  );
};

export default App;

const AppStyle = styled.div``;
