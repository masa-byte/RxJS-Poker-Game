import { fromEvent, debounceTime, map, filter, Observable } from "rxjs";

export function playerNicknameObservable(playerNickInput: HTMLElement): Observable<string> {
    return fromEvent(playerNickInput, "input").pipe(
        debounceTime(500),
        map((ev: InputEvent) => (<HTMLInputElement>ev.target).value),
        filter((playerNick) => playerNick.length >= 2 || playerNick.length == 0)
    );
}

export function playerChipsObservable(playerChipsInput: HTMLElement): Observable<number> {
    return fromEvent(playerChipsInput, "input").pipe(
        debounceTime(500),
        map((ev: InputEvent) => (<HTMLInputElement>ev.target).value),
        map((playerChips) => parseInt(playerChips)),
        filter((playerChips) => playerChips >= 10 || playerChips == 0 || isNaN(playerChips))
    );
}