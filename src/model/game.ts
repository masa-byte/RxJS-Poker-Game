import { Observable, Subject, bufferCount, distinctUntilChanged, from, mergeMap, of, switchMap, take } from "rxjs";
import { Card } from "./card";
import { Player } from "./player";
import { environments } from "../environments";
import { Action, dictionaryActions } from "./action";

export class Game {
    private cardIndex: number;
    private pot: number;
    private players: Player[];
    private cards: Card[];
    private filteredCards: Card[];
    public communityCards: Card[];
    public roundSubject: Subject<number>;
    public victorySubject: Subject<string>;
    private communityCardsDisplay: HTMLElement[];

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
        this.roundSubject = new Subject();
        this.victorySubject = new Subject();

        this.loadCards()
            .pipe(
                switchMap((cards) => {
                    this.cards = cards;
                    this.filteredCards = this.cards;
                    this.shuffleCards();

                    return this.roundSubject.pipe(
                        distinctUntilChanged()
                    );
                })
            )
            .subscribe((round) => {
                switch (round) {
                    case 1:
                        console.log("Round 1");
                        this.dealPlayerCards();
                        break;
                    case 2:
                        console.log("Round 2");
                        this.remainingRounds();
                        break;
                    case 3:
                        console.log("Round 3");
                        this.remainingRounds();
                        break;
                    case 4:
                        console.log("Decision Time");
                        break;
                    default:
                        console.log("Round not found");
                }
            });

            this.victorySubject.subscribe((victor) => {
                console.log(`Victory! ${victor} won! Congratulations!`);
            })
    }

    public resetGame() {
        this.cardIndex = 0;
        this.pot = 0;
        this.communityCards = [];
        this.filteredCards = this.cards;
        this.resetCards();
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

                this.bet()
                    .subscribe(
                        () => { },
                        () => { },
                        () => {
                            console.log("Betting completed");

                            this.dealCommunityCards(3);
                        }
                    );
            });
    }

    private dealCommunityCards(numCards: number) {
        const deckObservable = from(this.filteredCards);
        const dealCardsObservable = deckObservable.pipe(
            take(numCards)
        );

        dealCardsObservable.subscribe((card) => {
            console.log(this.communityCards, this.cardIndex)
            this.communityCardsDisplay[this.cardIndex].innerText = `${card.value} ${card.suit}`;
            this.communityCardsDisplay[this.cardIndex].style.color = card.color;
            this.filteredCards = this.filteredCards.filter((c) => c.id != card.id);
            this.communityCards.push(card);
            this.cardIndex + 1 == this.communityCardsDisplay.length ? this.cardIndex = 0 : this.cardIndex++;
        });
        console.log("Community cards dealt");
    }

    private bet() : Observable<null> {
        let idOfPlayerRaised = -1;
        let amountRaised = 0;
        let result = false;

        for (let i = this.players.length - 1; i >= 0; i--) {
            if (this.players[i].folded)
                continue;

            result = this.checkForVictory();
            if (result)
                return of(null);

            if (idOfPlayerRaised != -1) {
                const action = this.players[i].raiseOrFold(amountRaised);
                if (action == Action.Fold) {
                    this.players[i].fold();
                }
                else
                    this.pot += amountRaised;
                console.log(`${this.players[i].nickname} action: ${dictionaryActions[action]} betting: ${action == Action.Fold ? 0 : amountRaised}`);
            }
            else {
                const [action, bet] = this.players[i].play();
                console.log(`${this.players[i].nickname} action: ${dictionaryActions[action]} betting: ${bet}`);
                switch (action) {
                    case Action.Fold:
                        this.players[i].fold();
                        break;
                    case Action.Raise:
                        this.pot += bet;
                        amountRaised = bet;
                        idOfPlayerRaised = this.players[i].id;
                        console.log(`Player ${idOfPlayerRaised} raised ${amountRaised}`);
                        break;
                }
            }
        }
        console.log(`Pot: ${this.pot}`);
        result = this.checkForVictory();
        if (result)
            return of(null);

        // in case the last player raised
        if (idOfPlayerRaised != -1) {
            console.log(`Raising time!`);

            for (let i = this.players.length - 1; i >= 0; i--) {
                if (this.players[i].folded)
                    continue;

                result = this.checkForVictory();
                if (result)
                    return of(null);

                if (this.players[i].id != idOfPlayerRaised) {
                    const action = this.players[i].raiseOrFold(amountRaised);
                    if (action == Action.Fold) {
                        this.players[i].fold();
                    }
                    else
                        this.pot += amountRaised;
                    console.log(`${this.players[i].nickname} action: ${dictionaryActions[action]} betting: ${action == Action.Fold ? 0 : amountRaised}`);
                }
            }
            console.log(`Pot: ${this.pot}`);
        }
        result = this.checkForVictory();

        return of(null);
    }

    private checkForVictory(): boolean {
        if (this.players.filter((p) => p.folded == false).length == 1)
        {
            this.victorySubject.next(this.players.filter((p) => p.folded == false)[0].nickname);
            return true;
        }
        return false;
    }

    private remainingRounds() {
        this.bet()
            .subscribe(
                () => { },
                () => { },
                () => {
                    console.log("Betting completed");

                    this.dealCommunityCards(1);
                }
            );
    }

    public getRoundSubject(): Subject<number> {
        return this.roundSubject;
    }

    public getVictorySubject(): Observable<string> {
        return this.victorySubject.asObservable();
    }
}