import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class AppServiceBase {
    constructor() {}

    public $canExecuteSubject = new Subject<boolean>();
    $canExecuteObservable = this.$canExecuteSubject.asObservable();

    execute(execute: boolean) {
        this.$canExecuteSubject.next(execute);
    }
}
