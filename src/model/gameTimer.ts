import { Observable, Subject, Subscription, interval } from "rxjs";

export class GameTimer {
    private time: number;
    private round: number;
    private timerSubject: Subject<number>;
    private roundSubject: Subject<number>;
    private intervalSubscription: Subscription;

    constructor() {
        this.time = 0;
        this.round = 1;
        this.timerSubject = new Subject();
        this.roundSubject = new Subject();
        this.intervalSubscription = null;
    }

    public start() {
        this.time = 5;

        this.stop();

        this.timerSubject.next(this.time);
        this.roundSubject.next(this.round);

        this.intervalSubscription = interval(1000).subscribe(() => {
            if (this.time > 0) {
                this.time--;
                if (this.time == 0) {
                    this.round += 1;
                    this.stop();
                    if (this.round == 4) {
                        this.roundSubject.next(this.round);
                    }
                }
                this.timerSubject.next(this.time);
            }
        });
    }

    public stop() {
        if (this.intervalSubscription) {
            this.intervalSubscription.unsubscribe();
        }
    }

    public getTimerSubject(): Observable<number> {
        return this.timerSubject.asObservable();
    }

    public getRoundSubject(): Observable<number> {
        return this.roundSubject.asObservable();
    }
}