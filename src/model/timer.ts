import { Observable, Subject, Subscription, interval } from "rxjs";

export class Timer {
    private time: number;
    
    private timerSubject: Subject<number>;
    private intervalSubscription: Subscription;

    constructor() {
        this.time = 0;
        this.timerSubject = new Subject();
        this.intervalSubscription = null;
    }

    public start(startTime: number) {
        this.stop();

        this.time = startTime;
        this.timerSubject.next(this.time);

        this.intervalSubscription = interval(1000).subscribe(() => {
            if (this.time > 0) {
                this.time--;
                if (this.time == 0) {
                    this.stop();
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
    
    public reset() {
        this.timerSubject.next(-1);
        this.stop();
    }

    public getTimerSubject(): Observable<number> {
        return this.timerSubject.asObservable();
    }
}