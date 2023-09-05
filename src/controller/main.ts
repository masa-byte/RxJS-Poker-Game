import { combineLatest, startWith } from "rxjs";
import { playerNicknameObservable, playerChipsObservable } from "./observables";
import { Timer } from "../model/timer";
import { GameTimer } from "../model/gameTimer";
import { Game } from "../model/game";
import { Player } from "../model/player";

export function start() {
    const timer = new Timer();
    const gameTimer = new GameTimer();
    const spanTimer = document.getElementById("timer");
    const playerName = document.getElementById("playerName");

    const playerNickInput = document.getElementById("playerNickInput");
    const playerNickname = playerNicknameObservable(playerNickInput);

    const playerChipsInput = document.getElementById("playerChipsInput");
    const playerChips = playerChipsObservable(playerChipsInput);

    const players = [
        new Player(0, undefined, document.getElementById("chips0"), 
        [document.body.querySelector(".playerCards0 .playerCard0"), document.body.querySelector(".playerCards0 .playerCard1")] as HTMLElement[]),
        new Player(1, "bot1", document.getElementById("chips1"), 
        [document.body.querySelector(".playerCards1 .playerCard0"), document.body.querySelector(".playerCards1 .playerCard1")] as HTMLElement[]), 
        new Player(2, "bot2", document.getElementById("chips2"),
        [document.body.querySelector(".playerCards2 .playerCard0"), document.body.querySelector(".playerCards2 .playerCard1")] as HTMLElement[])
    ];

    const combined = combineLatest([
        playerNickname.pipe(startWith('')),
        playerChips.pipe(startWith(0))
    ]);

    combined.subscribe(([playerNick, playerChips]) => {
        if (playerNick && playerChips) {
            updateNotification(3, playerNick, playerChips);
            players[0].nickname = playerNick;
            playerName.innerText = playerNick;
            updateChips(players, playerChips);
            timer.start(3);
        }
        else if (playerNick) {
            updateNotification(1, playerNick, undefined);
            players[0].nickname = playerNick;
            playerName.innerText = playerNick;
            updateChips(players, "n/a");
            timer.reset();
        }
        else if (playerChips) {
            updateNotification(2, undefined, playerChips);
            playerName.innerText = "You";
            updateChips(players, playerChips);
            timer.reset();
        }
        else {
            updateNotification(0);
            playerName.innerText = "You";
            updateChips(players, "n/a");
            timer.reset();
        }
        gameTimer.stop();
    });

    timer.getTimerSubject().subscribe((time) => {
        if (time == -1) {
            spanTimer.innerText = "n/a";
        }
        else {
            spanTimer.innerText = time.toString();

            if (time == 0) {
                startGame(gameTimer, players);
            }
        }
    });
}

function updateNotification(messageCode: number, playerNick?: string, playerChips?: number) {
    const notification = document.getElementById("notification");
    switch (messageCode) {
        case 0:
            notification.innerText = "Enter nickname and chips amount!";
            break;
        case 1:
            notification.innerText = `Welcome ${playerNick}! Enter chips amount.`;
            break;
        case 2:
            notification.innerText = `Starting chips amount ${playerChips}. Enter nickname!`;
            break;
        case 3:
            notification.innerText = `Game is starting soon! Player ${playerNick}. Starting amount of chips is ${playerChips}.`;
            break;
    }
}

function updateChips(players: Player[], chipsAmount: number | string) {
    players.forEach((player) => {
        player.updateChips(chipsAmount);
    });
}

function startGame(timer: GameTimer, players: Player[]) {
    const notification = document.getElementById("notification");
    const spanTimer = document.getElementById("timer");

    const game = new Game(players, document.body.querySelectorAll(".communityCard") as unknown as HTMLElement[]);

    combineLatest([timer.getTimerSubject(), timer.getRoundSubject()]).subscribe(([time, round]) => {
        spanTimer.innerText = time.toString();
        notification.innerText = "Round: " + round.toString();
        game.getRoundSubject().next(round);

        if (round == 4) {
            notification.innerText = "Game ended!";
            timer.stop();
        }
        else if (time == 0) {
            timer.start();
        }
    });

    timer.start();
}