import { Component, Injector, ViewChild, HostListener, OnInit, Renderer2 } from '@angular/core';
import { FacultyBios } from '@app/shared/common/apis/generated/faculty';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { PagePreviewComponent } from '../page-preview/page-preview.component';
import { IframeService, SiteEditorService } from '../services';
import { EditFacultyMembersComponent } from './edit-faculty-members/edit-faculty-members.component';
import { SortFacultyMembersComponent } from './sort-faculty-members/sort-faculty-members.component';
@Component({
    selector: 'app-edit-faculty',
    templateUrl: './edit-faculty.component.html',
    styleUrls: ['./edit-faculty.component.css'],
    animations: [appModuleAnimation()],
})
export class EditFacultyComponent extends AppComponentBase implements OnInit {
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        this.pagePreview.resizeFrame();
        this.innerWidth = window.innerWidth;
    }

    @ViewChild('editFacultyMember') editFacultyMemberComponent: EditFacultyMembersComponent;
    @ViewChild('sortFacultyMember') sortFacultyMemberComponent: SortFacultyMembersComponent;
    @ViewChild('pagePreview') pagePreview: PagePreviewComponent;
    _selectedFaculty: FacultyBios | undefined;
    facultyMembersDOMList: [] = [];
    _selectedFacultyDOMElement: any;
    prevEditorPositions = null;
    innerWidth: number = 0;
    constructor(
        injector: Injector,
        private renderer: Renderer2,
        private _siteEditorService: SiteEditorService,
        private _iframeService: IframeService
    ) {
        super(injector);
    }

    ngOnInit(): void {
        if (!this.validateSchoolIsAssigned()) {
            return;
        }

        this.innerWidth = window.innerWidth;
    }

    setEditors(event) {
        if (event) {
            this.facultyMembersDOMList = this.pagePreview.getEditingItemInfo('.gsi-faculty');
        }

        if (this.facultyMembersDOMList.length) {
            this.adjustEditor();
        }
    }

    adjustEditor() {
        let elementData = {};
        let timeout: number = 0;
        if (this.prevEditorPositions == null) {
            timeout = 400;
        }
        setTimeout(() => {
            this.facultyMembersDOMList.forEach((facultyMemberDOMElement: any) => {
                const editFacultyMembersTrigger = document.querySelector(
                    `#editTrigger-${this.getFacultyId(facultyMemberDOMElement)}`
                );

                console.log('resizing');
                if (this.innerWidth < 1200) {
                    elementData['height'] = facultyMemberDOMElement.offsetHeight + 100 + 'px';
                    elementData['top'] = facultyMemberDOMElement.offsetTop - 100 + 'px';
                } else {
                    elementData['height'] = facultyMemberDOMElement.offsetHeight + 'px';
                    elementData['top'] = facultyMemberDOMElement.offsetTop + 'px';
                }
                elementData['width'] = '100%';
                elementData['left'] = 0;

                this.renderer.setStyle(editFacultyMembersTrigger, 'height', elementData['height']);
                this.renderer.setStyle(editFacultyMembersTrigger, 'width', elementData['width']);
                this.renderer.setStyle(editFacultyMembersTrigger, 'top', elementData['top']);
                this.renderer.setStyle(editFacultyMembersTrigger, 'left', elementData['left']);
                this.renderer.removeClass(editFacultyMembersTrigger, 'd-none');
            });
            //IF THERE'S DISCREPANCY IN EDITOR POSITIONS WITH THE LAST UPDATE, WAIT 500ms AND REPEAT
            if (JSON.stringify(elementData) != JSON.stringify(this.prevEditorPositions)) {
                this.prevEditorPositions = elementData;
                setTimeout(() => {
                    this.adjustEditor();
                }, 500);
            }
        }, timeout);
    }

    getFacultyId(facultyMemberDOMElement: any): string {
        return this._iframeService.getAttributeValue(facultyMemberDOMElement, 'id');
    }

    onEditFacultyMember(facultyMemberDOMElement: any) {
        this._selectedFacultyDOMElement = facultyMemberDOMElement;
        //Find faculty id from the clicked DOM element
        let id = Number(this.getFacultyId(this._selectedFacultyDOMElement));
        let imgUrl = '';
        //Find img URL from the clicked DOM element
        const imageDOMElement = this._selectedFacultyDOMElement.querySelectorAll('.cmp-image__image-container img');
        if (imageDOMElement) {
            imgUrl = this._iframeService.getAttributeValue(imageDOMElement[0], 'src');
        }

        //Notify to EditFacultyMembersComponent with the selected Id
        this._siteEditorService.setCurrentFaculty({ id: id, photoUrl: imgUrl });
    }

    onSaveFacultyMember(isSuccess: boolean): void {
        abp.message.success(this.l('Success_Update_Msg'), this.l('Success_Update_Title')).then(() => {
            this.pagePreview.loadSchoolSitePage();
        });
    }

    onSortFacultyMembers() {
        this.sortFacultyMemberComponent.loadFacultyMembersAndOpenModal();
    }
}
