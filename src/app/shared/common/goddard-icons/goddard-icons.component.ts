import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'goddard-icons',
    templateUrl: './goddard-icons.component.html',
    styleUrls: ['./goddard-icons.component.css'],
})
export class GoddardIconsComponent {
    @Input() iconName: string = '';
    @Input() iconSize: number = 30;
    @Input() iconClass: string = '';

    constructor() {}

    ngOnInit() {}
}
