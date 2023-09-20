import { Subscription, combineLatest, startWith } from "rxjs";
import { playerNicknameObservable, playerChipsObservable } from "./observables";
import { Timer } from "../model/timer";
import { GameTimer } from "../model/gameTimer";
import { Game } from "../model/game";
import { Player } from "../model/player";
import { dictionaryHandRankings } from "../model/enumerations/handRankings";
import { numberOfPlayers } from "../environments";


export function start() {
    const timer = new Timer();
    const gameTimer = new GameTimer();
    
    const spanTimer = document.getElementById("timer");
    const spanPlayerName = document.getElementById("playerName");

    const playerNickInput = document.getElementById("playerNickInput");
    const playerNicknameObs = playerNicknameObservable(playerNickInput);

    const playerChipsInput = document.getElementById("playerChipsInput");
    const playerChipsObs = playerChipsObservable(playerChipsInput);

    const players = [new Player(0, undefined, document.getElementById("chips0"),
        [document.body.querySelector(".playerCards0 .playerCard0"), document.body.querySelector(".playerCards0 .playerCard1")] as HTMLElement[])];

    for (let i = 1; i < numberOfPlayers; i++) {
        players.push(new Player(i, "bot" + i, document.getElementById("chips" + i),
            [document.body.querySelector(".playerCards" + i + " .playerCard0"), document.body.querySelector(".playerCards" + i + " .playerCard1")] as HTMLElement[]));
    }

    const game = new Game(players, document.body.querySelectorAll(".communityCard") as unknown as HTMLElement[]);
    const gameSubscription: Subscription | undefined = undefined;

    const combined = combineLatest([
        playerNicknameObs.pipe(startWith('')),
        playerChipsObs.pipe(startWith(0))
    ]);

    combined.subscribe(([playerNick, playerChips]) => {
        enableButtons(false);
        gameTimer.stop();
        game.resetGame();
        if (gameSubscription) {
            gameSubscription.unsubscribe();
        }
        game.getRoundSubject().next(-1);
        gameTimer.roundSubject.next(-1);

        if (playerNick && playerChips) {
            updateNotification(3, playerNick, playerChips);
            players[0].nickname = playerNick;
            spanPlayerName.innerText = playerNick;
            updateChips(players, playerChips);
            timer.start(3);
        }
        else if (playerNick) {
            updateNotification(1, playerNick, undefined);
            players[0].nickname = playerNick;
            spanPlayerName.innerText = playerNick;
            updateChips(players, "n/a");
            timer.reset();
        }
        else if (playerChips) {
            updateNotification(2, undefined, playerChips);
            spanPlayerName.innerText = "You";
            updateChips(players, playerChips);
            timer.reset();
        }
        else {
            updateNotification(0);
            spanPlayerName.innerText = "You";
            updateChips(players, "n/a");
            timer.reset();
        }
    });

    timer.getTimerSubject().subscribe((time) => {
        if (time == -1) {
            spanTimer.innerText = "n/a";
        }
        else {
            spanTimer.innerText = time.toString();

            if (time == 0) {
                startGame(gameTimer, players, gameSubscription, game);
            }
        }
    });
}

function updateNotification(messageCode: number, playerNick?: string, playerChips?: number) {
    const spanNotification = document.getElementById("notification");
    switch (messageCode) {
        case 0:
            spanNotification.innerText = "Enter nickname and chips amount!";
            break;
        case 1:
            spanNotification.innerText = `Welcome ${playerNick}! Enter chips amount.`;
            break;
        case 2:
            spanNotification.innerText = `Starting chips amount ${playerChips}. Enter nickname!`;
            break;
        case 3:
            spanNotification.innerText = `Game is starting soon! Player ${playerNick}. Starting amount of chips is ${playerChips}.`;
            break;
    }
}

function updateChips(players: Player[], chipsAmount: number | string) {
    players.forEach((player) => {
        player.updateChips(chipsAmount);
    });
}

function startGame(timer: GameTimer, players: Player[], gameSubscription: Subscription | undefined, game: Game) {
    console.log("Game started!");
    enableButtons(true);

    const spanNotification = document.getElementById("notification");
    const spanTimer = document.getElementById("timer");

    gameSubscription = combineLatest([
        timer.getTimerSubject(),
        timer.getRoundSubject(),
        game.getVictorySubject().pipe(startWith("n/a"))
    ]).subscribe(([time, round, victor]) => {
        spanTimer.innerText = time.toString();
        spanNotification.innerText = "Round: " + round.toString();
        game.getRoundSubject().next(round);

        if (victor != "n/a") {
            victor = victor as Player;
            spanNotification.innerText = `Game ended! ${victor.nickname} won with ${dictionaryHandRankings[victor.handRanking]}! Congratulations!`;
            gameSubscription.unsubscribe();
        }
    });

    timer.start();
}

function enableButtons(enable: boolean) {
    const buttons = document.querySelectorAll("button");
    buttons.forEach((button) => {
        button.disabled = !enable;
    });
}