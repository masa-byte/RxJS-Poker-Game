import { start } from "./controller/main";
import { drawDeck, drawPlayerInput, drawPlayersInfo, drawTimer } from "./view/drawingFunctions";


drawPlayerInput(document.body);
drawTimer(document.body);
drawDeck(document.body);
drawPlayersInfo(document.body);

start()