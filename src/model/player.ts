import { Card } from "./interfaces/card";
import { Game } from "./game";
import { HandStrength, dictionaryHandStrength } from "./enumerations/handStrength";
import { Action } from "./enumerations/action";
import { PlayerHand } from "./interfaces/playerHand";
import { HandRankings } from "./enumerations/handRankings";
import { Subject } from "rxjs";

export class Player {
    private handStrength: HandStrength;

    public id: number;
    public nickname: string;
    public chips: number;
    public cardIndex: number;
    public folded: boolean;
    public game: Game;
    public cards: Card[];
    public handRanking: HandRankings;

    public chipsDisplay: HTMLElement;
    public cardsDisplay: HTMLElement[];
    
    public chipsSubject: Subject<number | string>;

    public hand: PlayerHand = {
        StraightFlush: [],
        FourOfAKind: undefined,
        FullHouse: [],
        Flush: [],
        Straight: [],
        ThreeOfAKind: [],
        Pairs: [],
        HighCard: undefined
    }

    constructor(id: number, nickname: string, chipsDisplay: HTMLElement, cardsDisplay: HTMLElement[]) {
        this.id = id;
        this.nickname = nickname;
        this.cards = [];
        this.cardsDisplay = cardsDisplay;
        this.chipsDisplay = chipsDisplay;
        this.cardIndex = 0;
        this.folded = false;
        this.chipsSubject = new Subject();
        this.chipsSubject.subscribe((chips) => {
            this.chipsDisplay.innerText = chips.toString();
        });
    }

    private resetCards(fold: boolean) {
        this.cards = [];
        this.cardIndex = 0;

        if (fold == false) {
            this.cardsDisplay.forEach((cardDisplay) => {
                cardDisplay.innerText = "n/a";
                cardDisplay.style.color = "black";
            });
            if (this.game)
                this.game.resetGame();
        }
        else {
            this.cardsDisplay.forEach((cardDisplay) => {
                cardDisplay.innerText = "fold";
                cardDisplay.style.color = "black";
            });
        }
    }

    private determineIfCardsAreConsecutive(card1: Card, card2: Card): boolean {
        if (card1.value < 10 && card2.value == card1.value + 1)
            return true;
        else if (card1.value == 10 && card2.value == 12)
            return true;
        else if (card1.value < 14 && card1.value >= 12 && card2.value == card1.value + 1)
            return true;
        else if (card1.value == 14 && card2.value == 1)
            return true;
        else
            return false;
    }

    private evaluateHand(cards: Card[]): HandStrength {
        this.handRanking = HandRankings.HighCard;
        this.hand = {
            StraightFlush: [],
            FourOfAKind: undefined,
            FullHouse: [],
            Flush: [],
            Straight: [],
            ThreeOfAKind: [],
            Pairs: [],
            HighCard: undefined
        };
        const valueCounts = new Map<number, number>();
        const suitsCounts = new Map<string, Card[]>();
        let cardsLength = cards.length;
        let sequenceCards = [];

        for (let i = 0; i < cardsLength; i++) {
            // for value
            let value = cards[i].value;
            if (valueCounts.has(value))
                valueCounts.set(value, valueCounts.get(value) + 1);
            else
                valueCounts.set(value, 1);

            // for suit
            if (suitsCounts.has(cards[i].suit))
                suitsCounts.set(cards[i].suit, suitsCounts.get(cards[i].suit).concat(cards[i]));
            else
                suitsCounts.set(cards[i].suit, [cards[i]]);

            // for sequence
            if (i != 0) {
                if (this.determineIfCardsAreConsecutive(cards[i - 1], cards[i]) == true) {
                    if (sequenceCards.length == 0)
                        sequenceCards.push(cards[i - 1]);
                    sequenceCards.push(cards[i]);
                }
                else
                    if (sequenceCards.length < 5)
                        sequenceCards = [];
            }
        }

        // because of the duplicate ace
        if (cards[0].value == 1) {
            valueCounts.set(1, valueCounts.get(1) - 1);

            let card = suitsCounts.get(cards[0].suit);
            if (card != undefined)
                card.pop();

            cardsLength--;
        }

        for (const key of valueCounts.keys()) {
            let count = valueCounts.get(key); 
            if (count == 2) {
                console.log("pair" + key + " " + count);
                for (let i = 0; i < cardsLength; i++) {
                    if (cards[i].value == key) {
                        this.hand.Pairs.push(cards[i]);
                        break;
                    }
                }
                console.log(this.nickname, this.hand.Pairs);
                if (this.hand.Pairs.length > 1)
                    this.hand.Pairs = this.hand.Pairs.sort((a, b) => b.value - a.value);
            }
            else if (count == 3) {
                for (let i = 0; i < cards.length; i++) {
                    if (cards[i].value == key) {
                        this.hand.ThreeOfAKind.push(cards[i]);
                        break;
                    }
                }
                if (this.hand.ThreeOfAKind.length > 1)
                    this.hand.ThreeOfAKind = this.hand.ThreeOfAKind.sort((a, b) => b.value - a.value);
            }
            else if (count == 4) {
                for (let i = 0; i < cardsLength; i++) {
                    if (cards[i].value == key) {
                        this.hand.FourOfAKind = cards[i];
                        break;
                    }
                }
            }
        }

        if (sequenceCards.length == 5 && suitsCounts.get(sequenceCards[0].suit).length == 5 && sequenceCards[0].value == 10) {
            this.handRanking = HandRankings.RoyalFlush;
            return HandStrength.ExtremelyStrong;
        }
        else if (sequenceCards.length == 5 && suitsCounts.get(sequenceCards[0].suit).length == 5) {
            this.hand.StraightFlush = sequenceCards;
            this.handRanking = HandRankings.StraightFlush;
            return HandStrength.ExtremelyStrong;
        }
        else if (this.hand.FourOfAKind != undefined) {
            this.handRanking = HandRankings.FourOfAKind;
            return HandStrength.Strong;
        }
        else if (this.hand.ThreeOfAKind.length != 0 && this.hand.Pairs.length != 0) {
            this.hand.FullHouse = [this.hand.ThreeOfAKind[0], (this.hand.Pairs[0])];
            this.handRanking = HandRankings.FullHouse;
            return HandStrength.Strong;
        }
        else if ((suitsCounts.get("spade") != undefined ? suitsCounts.get("spade").length : 0) == 5
            || (suitsCounts.get("heart") != undefined ? suitsCounts.get("heart").length : 0) == 5
            || (suitsCounts.get("club") != undefined ? suitsCounts.get("club").length : 0) == 5
            || (suitsCounts.get("diamond") != undefined ? suitsCounts.get("diamond").length : 0) == 5) {

            this.hand.Flush = (suitsCounts.get("spade") != undefined ? suitsCounts.get("spade").length : 0) == 5 ? suitsCounts.get("spade") :
                (suitsCounts.get("heart") != undefined ? suitsCounts.get("heart").length : 0) == 5 ? suitsCounts.get("heart") :
                    (suitsCounts.get("club") != undefined ? suitsCounts.get("club").length : 0) == 5 ? suitsCounts.get("club")
                        : suitsCounts.get("diamond");
            this.handRanking = HandRankings.Flush;
            return HandStrength.Strong;
        }
        else if (sequenceCards.length == 5) {
            this.hand.Straight = sequenceCards;
            this.handRanking = HandRankings.Straight;
            return HandStrength.Mid;
        }
        else if (this.hand.ThreeOfAKind.length != 0) {
            this.handRanking = HandRankings.ThreeOfAKind;
            return HandStrength.Mid;
        }
        else if (this.hand.Pairs.length == 2) {
            this.handRanking = HandRankings.TwoPair;
            return HandStrength.Mid;
        }
        else if (this.hand.Pairs.length == 1) {
            this.handRanking = HandRankings.OnePair;
            return HandStrength.Weak;
        }
        else if (sequenceCards.length == this.cards.length) {
            return HandStrength.Mid;
        }
        else if ((suitsCounts.get("spade") != undefined ? suitsCounts.get("spade").length : 0) == cardsLength
            || (suitsCounts.get("heart") != undefined ? suitsCounts.get("heart").length : 0) == cardsLength
            || (suitsCounts.get("club") != undefined ? suitsCounts.get("club").length : 0) == cardsLength
            || (suitsCounts.get("diamond") != undefined ? suitsCounts.get("diamond").length : 0) == cardsLength) {

            return HandStrength.Mid;
        }
        else {
            this.hand.HighCard = cards[cards.length - 1];
            return HandStrength.Weak;
        }
    }

    public play(): [Action, number] {
        let cards = this.cards.concat(this.game.communityCards);
        cards = cards.sort((a, b) => a.value - b.value);
        
        if (cards[0].value == 1)
            cards.push(cards[0]);

        this.handStrength = this.evaluateHand(cards);
        console.log(`Player ${this.nickname} has ${dictionaryHandStrength[this.handStrength]} hand`);

        if (this.handStrength === HandStrength.ExtremelyStrong) {
            return [Action.Raise, Math.floor(this.chips / 2)];
        }
        else if (this.handStrength === HandStrength.Strong) {
            const action = Math.random() * 100 < 80 ? Action.Raise : Action.CheckCall;
            if (action === Action.Raise)
                return [Action.Raise, Math.floor(this.chips / 4)];
            else
                return [Action.CheckCall, 0];
        }
        else if (this.handStrength === HandStrength.Mid) {
            const action = Math.random() * 100 < 50 ? Action.Raise : Action.CheckCall;
            if (action === Action.Raise)
                return [Action.Raise, Math.floor(this.chips / 8)];
            else
                return [Action.CheckCall, 0];
        }
        else if (this.handStrength === HandStrength.Weak) {
            const action = Math.random() * 100 < 90 ? Action.CheckCall : Action.Fold;
            return [action, 0];
        }
    }

    public addCard(card: Card) {
        this.cards.push(card);
        this.cardsDisplay[this.cardIndex].innerText = `${card.value} ${card.suit}`;
        this.cardsDisplay[this.cardIndex].style.color = card.color;
        this.cardIndex + 1 == this.cardsDisplay.length ? this.cardIndex = 0 : this.cardIndex++;
    }

    public updateChips(chips: number | string) {
        this.folded = false;
        this.chips = chips == "n/a" ? 0 : chips as number;
        this.resetCards(false);
        this.chipsSubject.next(chips);
    }

    public bet(amount: number) {
        this.chips += amount;
        this.chipsSubject.next(this.chips);
    }

    public fold() {
        this.folded = true;
        this.resetCards(true);
    }

    public raiseOrFold(amountRaised: number): Action {
        if (this.chips < amountRaised)
            return Action.Fold;

        let coefficient = 0;
        if (this.handStrength === HandStrength.ExtremelyStrong)
            coefficient = 1;
        else if (this.handStrength === HandStrength.Strong)
            coefficient = 0.8;
        else if (this.handStrength === HandStrength.Mid)
            coefficient = 0.6;
        else if (this.handStrength === HandStrength.Weak)
            coefficient = 0.5;

        const action = Math.random() * 100 < coefficient * 100 ? Action.Raise : Action.Fold;
        return action;
    }
}

