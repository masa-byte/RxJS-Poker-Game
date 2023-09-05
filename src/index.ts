import { start } from "./controller/main";
import { drawDeck, drawPlayerInput, drawPlayersInfo, drawTimer } from "./view/drawingFunctions";

(() => {
    console.log("Fold 0");
    console.log("CheckCall 1");
    console.log("Raise 2");
})();

(() => {
    console.log("Extremely Strong 0");
    console.log("Strong 1");
    console.log("Mid 2");
    console.log("Weak 3");
})();

drawPlayerInput(document.body);
drawTimer(document.body);
drawDeck(document.body);
drawPlayersInfo(document.body);

start()