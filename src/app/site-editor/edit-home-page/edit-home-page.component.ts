import { Component, Injector, ViewChild, HostListener, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { EditHomePageHeroImageComponent } from '../edit-home-page/edit-home-page-hero-image/edit-home-page-hero-image.component';
import { EditHomePageCardsComponent } from '../edit-home-page/edit-home-page-cards/edit-home-page-cards.component';
import { EditTeaserComponent } from './edit-teaser/edit-teaser.component';
import { PagePreviewComponent } from '../page-preview/page-preview.component';

@Component({
    selector: 'app-edit-home-page',
    templateUrl: './edit-home-page.component.html',
    styleUrls: ['./edit-home-page.component.css'],
    animations: [appModuleAnimation()],
})
export class EditHomePageComponent extends AppComponentBase implements OnInit {
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.pagePreview.resizeFrame();
    }

    @ViewChild('editHomeHeroImage') editHomeHeroImage: EditHomePageHeroImageComponent;
    @ViewChild('editHomeIconCards') editHomeIconCards: EditHomePageCardsComponent;
    @ViewChild('editHomeImageCards') editHomeImageCards: EditHomePageCardsComponent;
    @ViewChild('editHomeTeaser') editHomeTeaser: EditTeaserComponent;
    @ViewChild('pagePreview') pagePreview: PagePreviewComponent;

    constructor(injector: Injector) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.validateSchoolIsAssigned()) {
            return;
        }
    }

    setEditors(event) {
        if (event) {
            setTimeout(() => {
                const editHomeHeroImageElement = this.pagePreview.getEditingItemInfo('[data-fbp-id="school-hero"]')[0];
                const editHomeIconCardsElement = this.pagePreview.getEditingItemInfo('.gsi-icon-card__list')[0];
                const editHomeImageCardsElement = this.pagePreview.getEditingItemInfo('.gsi-image-cards')[0];
                const editHomeTeaserElement = this.pagePreview.getEditingItemInfo('#welcome-container')[0];
                this.editHomeHeroImage.adjustEditor(editHomeHeroImageElement);
                this.editHomeIconCards.adjustEditor(editHomeIconCardsElement);
                this.editHomeImageCards.adjustEditor(editHomeImageCardsElement);
                this.editHomeTeaser.adjustEditor(editHomeTeaserElement);
            }, 400);
        }
    }

    onSuccessSavingChanges(success: boolean) {
        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            this.pagePreview.loadSchoolSitePage();
        });
    }
}
