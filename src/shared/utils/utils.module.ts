import { TimeSpanToDatePipe } from './../common/pipes/timespan-to-date.pipe';
import { groupBy } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AutoFocusDirective } from './auto-focus.directive';
import { BusyIfDirective } from './busy-if.directive';
import { ButtonBusyDirective } from './button-busy.directive';
import { FileDownloadService } from './file-download.service';
import { FriendProfilePictureComponent } from './friend-profile-picture.component';
import { LocalStorageService } from './local-storage.service';
import { LuxonFormatPipe } from './luxon-format.pipe';
import { LuxonFromNowPipe } from './luxon-from-now.pipe';
import { ValidationMessagesComponent } from './validation-messages.component';
import { EqualValidator } from './validation/equal-validator.directive';
import { GreaterThanTimeValidator } from './validation/greater-than-time-validator.directive';
import { PasswordComplexityValidator } from './validation/password-complexity-validator.directive';
import { NullDefaultValueDirective } from './null-value.directive';
import { ScriptLoaderService } from './script-loader.service';
import { StyleLoaderService } from './style-loader.service';
import { ArrayToTreeConverterService } from './array-to-tree-converter.service';
import { TreeDataHelperService } from './tree-data-helper.service';
import { LocalizePipe } from '@shared/common/pipes/localize.pipe';
import { PermissionPipe } from '@shared/common/pipes/permission.pipe';
import { PermissionAnyPipe } from '@shared/common/pipes/permission-any.pipe';
import { PermissionAllPipe } from '@shared/common/pipes/permission-all.pipe';
import { FeatureCheckerPipe } from '@shared/common/pipes/feature-checker.pipe';
import { DatePickerLuxonModifierDirective } from './date-time/date-picker-luxon-modifier.directive';
import { DateRangePickerLuxonModifierDirective } from './date-time/date-range-picker-luxon-modifier.directive';
import { DateAgoPipe } from '@shared/common/pipes/date-ago.pipe';
import { GroupByPipe } from '@shared/common/pipes/group-by-pipe';
import { FilterPipe } from '@shared/common/pipes/filter.pipe';
import { URIValidator } from './validation/uri-validator.directive';
import { RequiredTrimmerValidator } from './validation/required-trimmer-validator.directive';
import { SplitPipe } from '@shared/common/pipes/split.pipe';
import { NotHtmlValidator } from './validation/not-html-validator.directive';
import { DeactivateGuardService } from './deactivate-guard.service';
import { GetFromBetweenService } from './get-from-between.service';
import { DescriptionLengthValidator } from './validation/description-length-validator.directive';
import { DescriptionLengthValidatorService } from './description-length-validator.service';
import { QuilljsExtensionsService } from './quilljs-extensions.service';
import { LuxonDatePipe } from '@shared/common/pipes/luxon-date-pipe';
import { DisplayNamePipe } from '@shared/common/pipes/display-name.pipe';
import { CopyDirective } from './copy.directive';
import { OrderByPipe } from '@shared/common/pipes';

@NgModule({
    imports: [CommonModule],
    providers: [
        FileDownloadService,
        LocalStorageService,
        ScriptLoaderService,
        StyleLoaderService,
        ArrayToTreeConverterService,
        TreeDataHelperService,
        DeactivateGuardService,
        GetFromBetweenService,
        DescriptionLengthValidatorService,
        QuilljsExtensionsService,
    ],
    declarations: [
        EqualValidator,
        URIValidator,
        NotHtmlValidator,
        GreaterThanTimeValidator,
        RequiredTrimmerValidator,
        PasswordComplexityValidator,
        DescriptionLengthValidator,
        ButtonBusyDirective,
        AutoFocusDirective,
        BusyIfDirective,
        CopyDirective,
        FriendProfilePictureComponent,
        LuxonFormatPipe,
        LuxonFromNowPipe,
        ValidationMessagesComponent,
        NullDefaultValueDirective,
        LocalizePipe,
        OrderByPipe,
        PermissionPipe,
        PermissionAnyPipe,
        FeatureCheckerPipe,
        DatePickerLuxonModifierDirective,
        DateRangePickerLuxonModifierDirective,
        PermissionAllPipe,
        DateAgoPipe,
        GroupByPipe,
        FilterPipe,
        SplitPipe,
        DisplayNamePipe,
        TimeSpanToDatePipe,
        LuxonDatePipe,
    ],
    exports: [
        EqualValidator,
        URIValidator,
        NotHtmlValidator,
        GreaterThanTimeValidator,
        RequiredTrimmerValidator,
        PasswordComplexityValidator,
        DescriptionLengthValidator,
        ButtonBusyDirective,
        AutoFocusDirective,
        BusyIfDirective,
        CopyDirective,
        FriendProfilePictureComponent,
        LuxonFormatPipe,
        LuxonFromNowPipe,
        ValidationMessagesComponent,
        NullDefaultValueDirective,
        LocalizePipe,
        OrderByPipe,
        PermissionPipe,
        PermissionAnyPipe,
        FeatureCheckerPipe,
        DatePickerLuxonModifierDirective,
        DateRangePickerLuxonModifierDirective,
        PermissionAllPipe,
        DateAgoPipe,
        GroupByPipe,
        FilterPipe,
        SplitPipe,
        DisplayNamePipe,
        TimeSpanToDatePipe,
        LuxonDatePipe,
    ],
})
export class UtilsModule {}
