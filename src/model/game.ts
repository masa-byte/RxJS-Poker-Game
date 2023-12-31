import { Observable, Subject, bufferCount, distinctUntilChanged, from, mergeMap, of, switchMap, take } from "rxjs";
import { Card } from "./interfaces/card";
import { Player } from "./player";
import { environments } from "../environments";
import { Action, dictionaryActions } from "./enumerations/action";
import { dictionaryHandRankings } from "./enumerations/handRankings";

export class Game {
    private cardIndex: number;
    private pot: number;
    private players: Player[];
    private cards: Card[];
    private communityCardsDisplay: HTMLElement[];
    private filteredCards: Card[];
    private playerButtons: HTMLButtonElement[];

    public communityCards: Card[];

    public roundSubject: Subject<number>;
    public victorySubject: Subject<Player>;

    constructor(players: Player[], communityCardsDisplay: HTMLElement[]) {
        this.players = players;
        this.players.forEach((player) => {
            player.game = this;
        });
        this.cardIndex = 0;
        this.pot = 0;
        this.cards = [];
        this.communityCards = [];
        this.communityCardsDisplay = communityCardsDisplay;
        const player0Div = document.querySelector(".player0");
        this.playerButtons = player0Div.querySelectorAll("button") as unknown as HTMLButtonElement[];
        this.roundSubject = new Subject();
        this.victorySubject = new Subject();

        this.loadCards()
            .pipe(
                switchMap((cards) => {
                    this.cards = cards;
                    this.filteredCards = this.cards;

                    return this.roundSubject.pipe(
                        distinctUntilChanged()
                    );
                })
            )
            .subscribe((round) => {
                switch (round) {
                    case 1:
                        console.log("Round 1");
                        this.shuffleCards();
                        this.dealPlayerCards();
                        break;
                    case 2:
                        console.log("Round 2");
                        this.remainingRounds(round);
                        break;
                    case 3:
                        console.log("Round 3");
                        this.remainingRounds(round);
                        break;
                    case 4:
                        console.log("Round 4");
                        this.lastRound();
                        break;
                    case 5:
                        console.log("Decision Time");
                        this.determineWinner();
                        break;
                    default:
                        break;
                }
            });

        this.victorySubject.subscribe((victor) => {
            victor.bet(this.pot);
            console.log(`Victory! ${victor.nickname} won with ${dictionaryHandRankings[victor.handRanking]}! Congratulations!`);
        })
    }

    private resetCards() {
        this.communityCardsDisplay.forEach((cardDisplay) => {
            cardDisplay.innerText = "n/a";
            cardDisplay.style.color = "black";
        });
    }

    private loadCards(): Observable<Card[]> {
        return from(
            fetch(`${environments.API_URL}/deck_cards`)
                .then((res) => {
                    if (res.ok) return res.json();
                    else throw new Error("Cards not found");
                })
                .catch((err) => (console.log("Cards not found")))
        );
    }

    private shuffleCards() {
        for (let i = 0; i < 52; i++) {
            let r = i + (Math.floor(Math.random() * (52 - i)));
            let tmp = this.cards[i];
            this.cards[i] = this.cards[r];
            this.cards[r] = tmp;
        }
        console.log("Cards shuffled");
    }

    private dealPlayerCards() {
        const numPlayers = this.players.length;
        const cardsPerPlayer = 2;

        const deckObservable = from(this.filteredCards);
        const dealCardsObservable = deckObservable.pipe(
            take(numPlayers * cardsPerPlayer),
            bufferCount(cardsPerPlayer),
            mergeMap((playerCards) => from(playerCards))
        );

        let i = 0;
        dealCardsObservable.subscribe((card) => {
            this.players[i % numPlayers].addCard(card);
            this.filteredCards = this.filteredCards.filter((c) => c.id != card.id);
            i++;
        },
            () => { },
            () => {
                console.log("Player cards dealt");

                this.bet().then(() => {
                    console.log("Pre-betting completed");
                    this.dealCommunityCards(3);
                });
            });
    }
    
    private dealCommunityCards(numCards: number) {
        const deckObservable = from(this.filteredCards);
        const dealCardsObservable = deckObservable.pipe(
            take(numCards)
        );

        dealCardsObservable.subscribe((card) => {
            this.communityCardsDisplay[this.cardIndex].innerText = `${card.value} ${card.suit}`;
            this.communityCardsDisplay[this.cardIndex].style.color = card.color;
            this.filteredCards = this.filteredCards.filter((c) => c.id != card.id);
            this.communityCards.push(card);
            this.cardIndex + 1 == this.communityCardsDisplay.length ? this.cardIndex = 0 : this.cardIndex++;
        });
        console.log("Community cards dealt");
    }

    private async bet(): Promise<any> {
        const idsOfPlayersRaised: number[] = [];
        let amountRaised = 0;
        let victor = false;

        for (const player of this.players) {
            if (!player.folded) {
                victor = this.checkForVictory();
                if (victor)
                    return of(null);

                if (idsOfPlayersRaised.length != 0) {
                    const action = await player.raiseOrFold(amountRaised);
                    if (action == Action.Fold) {
                        player.fold();
                    }
                    else {
                        this.pot += amountRaised;
                        player.bet(-amountRaised);
                        idsOfPlayersRaised.push(player.id);
                    }
                    console.log(`${player.nickname} action: ${dictionaryActions[action]} betting: ${action == Action.Fold ? 0 : amountRaised}`);
                }
                else {
                    let action: Action, bet: number;
                    if (player.id == 0) {
                        this.enableButtons(true);
                        [action, bet] = await player.getPlayerAction();
                        this.enableButtons(false);
                    }
                    else
                        [action, bet] = await player.play();

                    console.log(`${player.nickname} action: ${dictionaryActions[action]} betting: ${bet}`);
                    switch (action) {
                        case Action.Fold:
                            player.fold();
                            break;
                        case Action.Raise:
                            this.pot += bet;
                            amountRaised = bet;
                            player.bet(-amountRaised);
                            idsOfPlayersRaised.push(player.id);
                            console.log(`Player ${player.id} raised ${bet}`);
                            break;
                    }
                }
            }
        };
        console.log(`Pot: ${this.pot}`);
        victor = this.checkForVictory();
        if (victor)
            return of(null);

        // in case not the first player raised
        if (idsOfPlayersRaised.length != 0 && idsOfPlayersRaised.length != this.players.length) {
            console.log(`Raising time!`);

            for (const player of this.players) {
                if (!player.folded) {
                    victor = this.checkForVictory();
                    if (victor)
                        return of(null);

                    if (idsOfPlayersRaised.indexOf(player.id) == -1) {
                        let action: Action;

                        if (player.id == 0) {
                            this.enableButtons(true, player.chips < amountRaised, true);
                            action = await player.getPlayerCheckOrFold();
                            this.enableButtons(false);
                        }
                        else
                            action = await player.raiseOrFold(amountRaised);

                        if (action == Action.Fold)
                            player.fold();
                        else {
                            this.pot += amountRaised;
                            player.bet(-amountRaised);
                            idsOfPlayersRaised.push(player.id);
                        }
                        console.log(`${player.nickname} action: ${dictionaryActions[action]} betting: ${action == Action.Fold ? 0 : amountRaised}`);
                    }
                }
            };
            console.log(`Pot: ${this.pot}`);
        }
        victor = this.checkForVictory();

        return of(null);
    }

    private checkForVictory(): boolean {
        if (this.players.filter((p) => p.folded == false).length == 1) {
            this.victorySubject.next(this.players.filter((p) => p.folded == false)[0]);
            return true;
        }
        return false;
    }

    private remainingRounds(round: number) {
        this.bet().then(() => {
            console.log("Betting completed for round " + round);
            this.dealCommunityCards(1);
        });
    }

    private lastRound() {
        this.bet().then(() => {
            console.log("Betting for last round completed");
        });
    }

    private determineWinner() {
        let winner: Player = null;
        let index = undefined;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].folded == false) {
                winner = this.players[i];
                index = i;
                break;
            }
        }

        let bestRank = winner.handRanking;

        for (let i = index + 1; i < this.players.length; i++) {
            if (this.players[i].folded)
                continue;

            const currentRank = this.players[i].handRanking;
            if (currentRank > bestRank) {
                winner = this.players[i];
                bestRank = currentRank;
            }
            else if (currentRank == bestRank) {
                switch (bestRank) {
                    case 1:
                        if (this.players[i].hand.HighCard.value == 1 || this.players[i].hand.HighCard.value > winner.hand.HighCard.value) {
                            winner = this.players[i];
                        }
                        break;
                    case 2:
                        if (this.players[i].hand.Pairs[0].value == 1 || this.players[i].hand.Pairs[0].value > winner.hand.Pairs[0].value) {
                            winner = this.players[i];
                        }
                        break;
                    case 3:
                        if (this.players[i].hand.Pairs[0].value == 1 || this.players[i].hand.Pairs[0].value > winner.hand.Pairs[0].value) {
                            winner = this.players[i];
                        }
                        else if (this.players[i].hand.Pairs[0].value == winner.hand.Pairs[0].value) {
                            if (this.players[i].hand.Pairs[1].value > winner.hand.Pairs[1].value) {
                                winner = this.players[i];
                            }
                        }
                        break;
                    case 4:
                        if (this.players[i].hand.ThreeOfAKind[0].value == 1 || this.players[i].hand.ThreeOfAKind[0].value > winner.hand.ThreeOfAKind[0].value) {
                            winner = this.players[i];
                        }
                        break;
                    case 5:
                        if (this.players[i].hand.Straight[4].value == 1 || this.players[i].hand.Straight[4].value > winner.hand.Straight[4].value) {
                            winner = this.players[i];
                        }
                        break;
                    case 6:
                        let diff = false;
                        if (this.players[i].hand.Flush[4].value == 1) {
                            diff = true;
                        }
                        else {
                            for (let i = 4; i >= 0; i--) {
                                if (this.players[i].hand.Flush[i].value > winner.hand.Flush[i].value) {
                                    diff = true;
                                    break;
                                }
                            }
                        }
                        if (diff) {
                            winner = this.players[i];
                        }
                        break;
                    case 7:
                        if (this.players[i].hand.FullHouse[0].value == 1 || this.players[i].hand.FullHouse[0].value > winner.hand.FullHouse[0].value) {
                            winner = this.players[i];
                        }
                        else if (this.players[i].hand.FullHouse[0].value == winner.hand.FullHouse[0].value) {
                            if (this.players[i].hand.FullHouse[1].value == 1 || this.players[i].hand.FullHouse[1].value > winner.hand.FullHouse[1].value) {
                                winner = this.players[i];
                            }
                        }
                        break;
                    case 8:
                        if (this.players[i].hand.FourOfAKind.value == 1 || this.players[i].hand.FourOfAKind.value > winner.hand.FourOfAKind.value) {
                            winner = this.players[i];
                        }
                        break;
                }
            }
        }

        this.victorySubject.next(winner);
    }

    private enableButtons(enable: boolean, raising: boolean = false, check: boolean = false) {
        this.playerButtons.forEach((button) => {
            button.disabled = !enable;
        });
        if (raising) {
            const raiseButton = document.getElementById("raiseButton") as HTMLButtonElement;
            raiseButton.disabled = true;
        }
        if (check) {
            const checkButton = document.getElementById("checkCallButton") as HTMLButtonElement;
            checkButton.disabled = true;
        }
    }

    public resetGame() {
        this.cardIndex = 0;
        this.pot = 0;
        this.communityCards = [];
        this.filteredCards = this.cards;
        this.resetCards();
    }

    public getRoundSubject(): Subject<number> {
        return this.roundSubject;
    }

    public getVictorySubject(): Observable<Player> {
        return this.victorySubject.asObservable();
    }
}