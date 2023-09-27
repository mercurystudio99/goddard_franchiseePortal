import { Component, Injector, ViewChild, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
    selector: 'edit-testimonials',
    templateUrl: './edit-testimonials.component.html',
    styleUrls: ['./edit-testimonials.component.css'],
    animations: [appModuleAnimation()],
})
export class EditTestimonialsComponent extends AppComponentBase implements OnInit {

    constructor(
        injector: Injector
    ) {
        super(injector);
    }

    ngOnInit(): void {
    }
}
