import { Observable, Subject, Subscription, interval } from "rxjs";

export class GameTimer {
    private time: number;

    private timerSubject: Subject<number>;
    private intervalSubscription: Subscription;

    public round: number;
    
    public roundSubject: Subject<number>;

    constructor() {
        this.time = 0;
        this.round = 1;
        this.timerSubject = new Subject();
        this.roundSubject = new Subject();
        this.intervalSubscription = null;
    }

    public start() {
        this.time = 20;
        this.round = 1;

        this.timerSubject.next(this.time);
        this.roundSubject.next(this.round);

        this.intervalSubscription = interval(1000).subscribe(() => {
            if (this.time > 0) {
                this.time--;
                this.timerSubject.next(this.time);
            } 
            else {
                this.round++;
                this.roundSubject.next(this.round);

                if (this.round === 5) {
                    this.stop();
                } 
                else {
                    this.time = 5;
                    this.timerSubject.next(this.time);
                }
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