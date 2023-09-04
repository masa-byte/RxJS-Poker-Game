import { combineLatest, startWith } from "rxjs";
import { playerNicknameObservable, playerChipsObservable } from "./observables";
import { Timer } from "../model/timer";
import { GameTimer } from "../model/gameTimer";
import { Deck } from "../model/deck";

export function start() {
    const timer = new Timer();
    const gameTimer = new GameTimer();
    const spanTimer = document.getElementById("timer");
    const deck = new Deck();

    timer.timerSubject.subscribe((time) => {
        if (time == -1) {
            spanTimer.innerText = "n/a";
        }
        else {
            spanTimer.innerText = time.toString();

            if (time == 0) {
                startGame(gameTimer, deck);
            }
        }
    });

    const playerNickInput = document.getElementById("playerNickInput");
    const playerNickname = playerNicknameObservable(playerNickInput);

    const playerChipsInput = document.getElementById("playerChipsInput");
    const playerChips = playerChipsObservable(playerChipsInput);

    const combined = combineLatest([
        playerNickname.pipe(startWith('')),
        playerChips.pipe(startWith(0))
    ]);

    combined.subscribe(([playerNick, playerChips]) => {
        if (playerNick && playerChips) {
            updateNotification(3, playerNick, playerChips);
            timer.start(10);
        }
        else if (playerNick) {
            updateNotification(1, playerNick, undefined);
            timer.reset();
        }
        else if (playerChips) {
            updateNotification(2, undefined, playerChips);
            timer.reset();
        }
        else {
            updateNotification(0);
            timer.reset();
        }
        gameTimer.stop();
    });
}

function updateNotification(messageCode: number, playerNick?: string, playerChips?: number) {
    const notification = document.getElementById("notification");
    switch (messageCode) {
        case 0:
            notification.innerText = "Enter nickname and chips amount!";
            break;
        case 1:
            notification.innerText = `Welcome ${playerNick}. Enter chips amount!`;
            break;
        case 2:
            notification.innerText = `Starting chips amount ${playerChips}. Enter nickname!`;
            break;
        case 3:
            notification.innerText = `Game is starting soon! Player ${playerNick}. Starting amount of chips is ${playerChips}.`;
            break;
    }
}

function startGame(timer: GameTimer, deck: Deck) {
    const notification = document.getElementById("notification");
    const spanTimer = document.getElementById("timer");

    combineLatest([timer.timerSubject, timer.roundSubject]).subscribe(([time, round]) => {
        spanTimer.innerText = time.toString();
        notification.innerText = "Round: " + round.toString();
        deck.roundSubject.next(round);

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