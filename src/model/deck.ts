import { Subject, filter } from "rxjs";

export class Deck {
    private cards: string[];
    private index: number;
    public roundSubject: Subject<number>;
    private round: number;

    constructor() {
        this.cards = [];
        this.index = 0;
        this.roundSubject = new Subject();
        this.roundSubject.pipe(
            filter((round) => round != this.round)
        ).subscribe((round) => {
            this.round = round;
            console.log("Round: " + this.round);
        });
    }

    public shuffle() {
        this.index = 0;
        this.cards = [];

        const suits = ["spades", "hearts", "clubs", "diamonds"];
        const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10",
                        "jack", "queen", "king", "ace"];

        for (let i = 0; i < suits.length; i++) {
            for (let j = 0; j < values.length; j++) {
                this.cards.push(values[j] + "_of_" + suits[i]);
            }
        }

        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    public dealCard(): string {
        if (this.index < this.cards.length) {
            return this.cards[this.index++];
        } else {
            return null;
        }
    }
}