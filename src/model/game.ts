import { Observable, Subject, bufferCount, distinctUntilChanged, from, mergeMap, of, switchMap, take } from "rxjs";
import { Card } from "./card";
import { Player } from "./player";
import { environments } from "../environments";
import { Action } from "./action";

export class Game {
    private cardIndex: number;
    private pot: number;
    private players: Player[];
    private cards: Card[];
    public communityCards: Card[];
    private roundSubject: Subject<number>;
    private communityCardsDisplay: HTMLElement[];

    constructor(players: Player[], communityCardsDisplay: HTMLElement[]) {
        this.players = players;
        players.forEach((player) => {
            player.game = this;
            player.cards = [];
        });
        this.cardIndex = 0;
        this.pot = 0;
        this.cards = [];
        this.communityCards = [];
        this.communityCardsDisplay = communityCardsDisplay;
        this.roundSubject = new Subject();

        this.loadCards()
            .pipe(
                switchMap((cards) => {
                    this.cards = cards;
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
                        break;
                    case 4:
                        console.log("Round 4");
                        break;
                    default:
                        break;
                }
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

        const deckObservable = from(this.cards);
        const dealCardsObservable = deckObservable.pipe(
            take(numPlayers * cardsPerPlayer),
            bufferCount(cardsPerPlayer),
            mergeMap((playerCards) => from(playerCards))
        );

        let i = 0;
        dealCardsObservable.subscribe((card) => {
            this.players[i % numPlayers].addCard(card);
            this.cards = this.cards.filter((c) => c.id != card.id);
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
        const deckObservable = from(this.cards);
        const dealCardsObservable = deckObservable.pipe(
            take(numCards)
        );

        dealCardsObservable.subscribe((card) => {
            this.communityCardsDisplay[this.cardIndex].innerHTML = `${card.value} ${card.suit}`;
            this.communityCardsDisplay[this.cardIndex].style.color = card.color;
            this.cards = this.cards.filter((c) => c.id != card.id);
            this.communityCards.push(card);
            this.cardIndex++;
        });
        console.log("Community cards dealt");
    }

    private bet() : Observable<null> {
        let idOfPlayerRaised = -1;
        let amountRaised = 0;

        this.players.forEach((player) => {
            const [action, bet] = player.play();
            console.log(`${player.nickname} action: ${action} betting: ${bet}`);
            switch (action) {
                case Action.Fold:
                    player.fold();
                    // don't remove player from players array here and also chekc if there is only one player left
                    this.players = this.players.filter((p) => p.id != player.id);
                case Action.Raise:
                    this.pot += bet;
                    amountRaised = bet;
                    idOfPlayerRaised = player.id;
                    break;
            }
        });

        if (idOfPlayerRaised != -1) {
            this.players.forEach((player) => {
                if (player.id != idOfPlayerRaised) {
                    const action = player.raiseOrFold();
                    if (action == Action.Fold) {
                        player.fold();
                        this.players = this.players.filter((p) => p.id != player.id);
                    }
                    else 
                        this.pot += amountRaised;
                }
            });
            console.log(`Pot: ${this.pot}`);
        }

        return of(null);
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

    public resetCards() {
        this.communityCardsDisplay.forEach((cardDisplay) => {
            cardDisplay.innerText = "n/a";
            cardDisplay.style.color = "black";
        });
    }
}