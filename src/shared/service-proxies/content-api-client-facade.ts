import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, concatMap, mergeMap } from 'rxjs/operators';
import {
    OriginalAsset,
    AssetsService,
    SchoolsService,
    ExtendedSchoolInfoResponse,
    InitiateUploadResponse,
    IconCardsService,
    IconCard,
    ComponentsService,
    ImageCardDto,
    ImageCardUpdateDto,
    TextComponentDto,
    CarouselDto,
    AssetListDto,
    TitleComponentDto,
} from '@app/shared/common/apis/generated/content';
import { AssetsApiClientFacade } from './assets-api-client-facade';
import { CompleteUploadDto, InitiateUploadDto, SiteEditorServiceProxy } from './service-proxies';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ContentApiClientFacade {
    constructor(
        private _assetsService: AssetsService,
        private _schoolService: SchoolsService,
        private _iconCardsService: IconCardsService,
        private _componentsService: ComponentsService,
        private _assetsApiClientFacade: AssetsApiClientFacade,
        private _siteEditorServiceProxy: SiteEditorServiceProxy,
        private httpClient: HttpClient
    ) {}

    public getSchoolHeroImages(): Observable<Array<OriginalAsset>> {
        return this._assetsService.apiV1DcpAssetsSchoolHeroImagesGet().pipe(
            //tap(data => console.log('[DATA]: ' + JSON.stringify(data))),
            catchError(this.handleError)
        );
    }

    public getSchool(crmId?: string): Observable<ExtendedSchoolInfoResponse> {
        return this._schoolService.apiV1DcpSchoolsGet(crmId).pipe(
            //tap(data => console.log('[DATA]: ' + JSON.stringify(data))),
            catchError(this.handleError)
        );
    }

    public getImages(path: string): Observable<Array<OriginalAsset>> {
        return this._assetsService.apiV1DcpAssetsImagesPathGet(path).pipe(catchError(this.handleError));
    }

    /**
     * Concat the three steps process for uploading an image to AEM blob storage
     *      1 - make a request to AEM (through content API), relaying the intent to upload files
     *      2 - Upload binary to the blob store
     *      3-  Complete in AEM (Assets will not appear within AEM until this final STEP-API call is completed)
     */
    public uploadAsset(crmId: string, path: string, fileName: string, image: Blob): Observable<Object> {
        let body = InitiateUploadDto.fromJS({ crmId: crmId, path: path, fileName: fileName, size: image.size });
        //Step 1. Make a request for upload to AEM, this is done through content API
        return this._assetsApiClientFacade.initiateUpload(body).pipe(
            tap((response) => console.log('[STEP 1]: ' + JSON.stringify(response))),
            concatMap((response) => {
                if (!response) {
                    return throwError('STEP 1 FAILED');
                }

                //Step 2. Upload binary to the blob store
                return this.uploadToBlobStore(crmId, response, fileName, image);
            }),
            catchError(this.handleError)
        );
    }

    /*
     * Make a PUT request to the pre-signed upload URI for uploading the blob
     */
    public uploadToBlobStore(
        crmId: string,
        response: InitiateUploadResponse,
        fileName: string,
        image: Blob
    ): Observable<Object> {
        const uploadUri = response?.files?.[0].uploadUris?.[0];

        const httpOptions = {
            headers: new HttpHeaders({
                'Content-Type': image.type,
            }),
        };

        //Step 2. Upload binary to the blob store
        return this.httpClient.put(uploadUri, image, httpOptions).pipe(
            tap((resp) => console.log('[STEP 2]: ' + JSON.stringify(resp))),
            concatMap((resp) => {
                //Step 3. Make a request to complete in AEM
                return this.completeImageUpload(crmId, fileName, response, image);
            }),
            catchError(this.handleError)
        );
    }

    /*
     * Request to complete the upload with AEM
     */
    public completeImageUpload(
        crmId: string,
        fileName: string,
        response: InitiateUploadResponse,
        image: Blob
    ): Observable<Object> {
        const uploadToken = response?.files?.[0].uploadToken;

        let body = CompleteUploadDto.fromJS({
            crmId: crmId,
            path: response.folderPath,
            completeUri: response.completeUri,
            fileName: fileName,
            uploadToken: uploadToken,
            mimeType: image.type,
            affinity: response.affinity,
        });

        return this._assetsApiClientFacade.completeUpload(body).pipe(
            tap((resp) => console.log('[STEP 3]: ' + JSON.stringify(resp))),
            catchError(this.handleError)
        );
    }

    public getAvailableIconCards(): Observable<Array<IconCard>> {
        return this._iconCardsService.apiV1DcpIconcardsGet();
    }

    public getImageCards(path?: string): Observable<Array<ImageCardDto>> {
        return this._componentsService.apiV1DcpComponentsImageCardsGet(path).pipe(catchError(this.handleError));
    }

    public updateImageCards(
        path?: string,
        imageCardUpdateDto?: Array<ImageCardUpdateDto>
    ): Observable<Array<ImageCardDto>> {
        return this._componentsService.apiV1DcpComponentsImageCardsPut(path, imageCardUpdateDto);
    }

    public getTextContent(path?: string): Observable<TextComponentDto> {
        return this._componentsService.apiV1DcpComponentsTextGet(path);
    }

    public getTitleContent(path?: string): Observable<TitleComponentDto> {
        return this._componentsService.apiV1DcpComponentsTitleGet(path);
    }

    public getHeroImageCarousel(path?: string): Observable<CarouselDto> {
        return this._componentsService.apiV1DcpComponentsCarouselGet(path).pipe(catchError(this.handleError));
    }

    public getAssetList(path?: string): Observable<AssetListDto> {
        return this._componentsService.apiV1DcpComponentsAssetListGet(path);
    }

    /**
     * build page URL based on School's scheduleTourUrl
     * @param schoolScheduleTourUrl
     * @param page
     * @returns
     */
    public getPageLinkFromSchoolScheduleTourUrl(schoolScheduleTourUrl: string, page: string): string {
        return `${environment.schoolBaseSiteUrl}${schoolScheduleTourUrl
            .replace('/content/gsi/us/en/', '/')
            .replace('goddard-form.html', page)}`;
    }

    /**
     * validates the school have the specified page
     * @param pageURL school's page
     * @returns observable request virtual tour page
     */
    public validatePageExistsObservable(pageURL: string): Observable<boolean> {
        return this._siteEditorServiceProxy.validateSchoolPageExists(pageURL);
    }

    private handleError(err: any) {
        console.error('[ERROR]: ' + JSON.stringify(err));
        return throwError(err);
    }
}
