import { Observable, Subject, Subscription, combineLatest, from, startWith } from "rxjs";
import { playerNicknameObservable, playerChipsObservable } from "./observables";
import { Timer } from "../model/timer";
import { GameTimer } from "../model/gameTimer";
import { Game } from "../model/game";
import { Player } from "../model/player";
import { dictionaryHandRankings } from "../model/enumerations/handRankings";
import { environments, numberOfPlayers } from "../environments";

let players: Player[] = [];
let subject: Subject<number> = new Subject();

export function start() {
    addEventListener();

    const timer = new Timer();
    const gameTimer = new GameTimer();

    const spanTimer = document.getElementById("timer");
    const spanPlayerName = document.getElementById("playerName");

    const playerNickInput = document.getElementById("playerNickInput");
    const playerNicknameObs = playerNicknameObservable(playerNickInput);

    const playerChipsInput = document.getElementById("playerChipsInput");
    const playerChipsObs = playerChipsObservable(playerChipsInput);

    players = [new Player(0, undefined, document.getElementById("chips0"),
        [document.body.querySelector(".playerCards0 .playerCard0"), document.body.querySelector(".playerCards0 .playerCard1")] as HTMLElement[])];

    for (let i = 1; i < numberOfPlayers; i++) {
        players.push(new Player(i, "bot" + i, document.getElementById("chips" + i),
            [document.body.querySelector(".playerCards" + i + " .playerCard0"), document.body.querySelector(".playerCards" + i + " .playerCard1")] as HTMLElement[]));
    }

    const game = new Game(players, document.body.querySelectorAll(".communityCard") as unknown as HTMLElement[]);
    const gameSubscription: Subscription | undefined = undefined;

    const combined = combineLatest([
        playerNicknameObs.pipe(startWith('')),
        playerChipsObs.pipe(startWith(0)),
        subject.pipe(startWith(0))
    ]);

    combined.subscribe(([playerNick, playerChips, playAgain]) => {
        enableButtons(false);
        enablePlayAgainButton(false);
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
            enablePlayAgainButton(true);
            gameSubscription.unsubscribe();
        }
    });

    timer.start();
}

function enableButtons(enable: boolean) {
    const player0Div = document.querySelector(".player0");
    const buttons = player0Div.querySelectorAll("button");
    buttons.forEach((button) => {
        button.disabled = !enable;
    });
}

function enablePlayAgainButton(enable: boolean) {
    const playAgainButton = document.getElementById("playAgainButton") as HTMLButtonElement;
    playAgainButton.disabled = !enable;
}

function savePlayerChips(players: Player[]) {
    console.log('Saving player chips...');
    const playerChips: { [key: number]: number } = {};

    players.forEach((player: Player) => {
        playerChips[player.id] = player.chips;
    });

    // fetch(`${environments.API_URL}/player_chips`, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(playerChips),
    // })
    //     .then((res) => {
    //         if (res.ok) {
    //             console.log('Player chips saved successfully');
    //         } else {
    //             console.error('Failed to save player chips');
    //         }
    //     })
    //     .catch((err) => {
    //         console.error('Error while saving player chips:', err);
    //     });
}

function loadPlayerChips(players: Player[]) {
    fetch(`${environments.API_URL}/player_chips`)
        .then((res) => {
            if (res.ok) {
                return res.json();
            } else {
                throw new Error('Failed to fetch player chips');
            }
        })
        .then((playerChips) => {
            players.forEach((player: Player) => {
                if (playerChips[0][player.id] !== undefined) {
                    player.updateChips(playerChips[0][player.id]);
                }
            });
            console.log('Player chips fetched successfully');
            subject.next(1);
        })
        .catch((err) => {
            console.error('Error while fetching player chips:', err);
        });
}

function addEventListener() {
    const playAgainButton = document.getElementById("playAgainButton") as HTMLButtonElement;
    playAgainButton.addEventListener("click", (event) => {
        event.preventDefault();
        console.log("Play again!");
        savePlayerChips(players);
        loadPlayerChips(players);
    });
}