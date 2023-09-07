import { Card } from "../card";

export interface PlayerHand{
    StraightFlush: Card[],
    FourOfAKind: Card,
    FullHouse: Card[],
    Flush: Card[],
    Straight: Card[],
    ThreeOfAKind: Card[],
    Pairs: Card[],
    HighCard: Card,
}