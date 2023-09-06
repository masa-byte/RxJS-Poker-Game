import { Card } from "./card";
import { Game } from "./game";
import { HandStrength, dictionaryHandStrength } from "./handStrength";
import { Action } from "./action";

export class Player {
    private handStrength: HandStrength;
    public id: number;
    public nickname: string;
    public chips: number;
    public cardIndex: number;
    public folded: boolean;
    public game: Game;
    public cards: Card[];
    public chipsDisplay: HTMLElement;
    public cardsDisplay: HTMLElement[];

    constructor(id: number, nickname: string, chipsDisplay: HTMLElement, cardsDisplay: HTMLElement[]) {
        this.id = id;
        this.nickname = nickname;
        this.cards = [];
        this.cardsDisplay = cardsDisplay;
        this.chipsDisplay = chipsDisplay;
        this.cardIndex = 0;
        this.folded = false;
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
        const card1Value = parseInt(card1.value);
        const card2Value = parseInt(card2.value);

        if (card1Value < 10 && card2Value == card1Value + 1)
            return true;
        else if (card1Value == 10 && card2Value == 12)
            return true;
        else if ( card1Value < 14 && card1Value >= 12 && card2Value == card1Value + 1)
            return true;
        else if (card1Value == 14 && card2Value == 1)
            return true;
        else 
            return false;
    }

    private evaluateHand(cards: Card[]): HandStrength {
        const valueCounts = new Map<string, number>();
        let numberOfPairs = 0;
        let numberOfThrees = 0;
        let numberOfFours = 0;
        let numberOfASingleSuit = 1;
        let sequence = true;
        let royalFlush = true;

        for (let i = 0; i < cards.length; i++) {
            // for value
            if (valueCounts.has(cards[i].value))
                valueCounts.set(cards[i].value, valueCounts.get(cards[i].value) + 1);
            else
                valueCounts.set(cards[i].value, 1);

            // for suit
            if (i == 0)
                continue;
            else if (cards[i].suit == cards[0].suit)
                numberOfASingleSuit++;

            // for sequence
            if (sequence)
                if (i == 0)
                    continue;
                else if (this.determineIfCardsAreConsecutive(cards[i - 1], cards[i]) == false) {
                    sequence = false;
                }

            // for royal flush
            if (royalFlush)
                if (i == 0)
                    if (cards[i].value != "10")
                        royalFlush = false;
                    else
                        continue;
                else if (this.determineIfCardsAreConsecutive(cards[i - 1], cards[i]) == false) {
                    royalFlush = false;
                }
        }

        for (const count of valueCounts.values()) {
            if (count == 2) {
                numberOfPairs++;
            }
            else if (count == 3) {
                numberOfThrees++;
            }
            else if (count == 4) {
                numberOfFours++;
            }
        }

        if (royalFlush && numberOfASingleSuit == 5)
            return HandStrength.ExtremelyStrong;
        else if (sequence && numberOfASingleSuit == 5)
            return HandStrength.ExtremelyStrong;
        else if (numberOfFours == 1)
            return HandStrength.Strong;
        else if (numberOfThrees == 1 && numberOfPairs == 1)
            return HandStrength.Strong;
        else if (numberOfASingleSuit == 5)
            return HandStrength.Strong;
        else if (sequence)
            return HandStrength.Mid;
        else if (numberOfThrees == 1)
            return HandStrength.Mid;
        else if (numberOfPairs == 2)
            return HandStrength.Mid;
        else if (numberOfPairs == 1)
            return HandStrength.Weak;

        return HandStrength.Weak;
    }

    public play() : [Action, number] {
        let cards = this.cards.concat(this.game.communityCards);
        cards = cards.sort((a, b) => parseInt(a.value) - parseInt(b.value));

        this.handStrength = this.evaluateHand(cards);
        console.log(`Player ${this.nickname} has ${dictionaryHandStrength[this.handStrength]} hand`);

        if (this.handStrength === HandStrength.ExtremelyStrong) {
            return [Action.Raise, this.chips / 2];
        }
        else if (this.handStrength === HandStrength.Strong) {
            const action = Math.random() < 0.7 ? Action.Raise : Action.CheckCall;
            if (action === Action.Raise)
                return [Action.Raise, this.chips / 4];
            else
                return [Action.CheckCall, 0];
        }
        else if (this.handStrength === HandStrength.Mid) {
            const action = Math.random() < 0.3 ? Action.Raise : Action.CheckCall;
            if (action === Action.Raise)
                return [Action.Raise, this.chips / 8];
            else
                return [Action.CheckCall, 0];
        }
        else if (this.handStrength === HandStrength.Weak) {
            const action = Math.random() < 0.9 ? Action.CheckCall : Action.Fold;
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
        this.chipsDisplay.innerText = chips.toString();
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
            coefficient = 0.9;
        else if (this.handStrength === HandStrength.Strong)
            coefficient = 0.7;
        else if (this.handStrength === HandStrength.Mid)
            coefficient = 0.5;
        else if (this.handStrength === HandStrength.Weak)
            coefficient = 0.3;

        const action = Math.random() < coefficient ? Action.Raise : Action.Fold;
        return action;
    }
}

