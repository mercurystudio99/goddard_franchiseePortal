import { IThemeAssetContributor } from '../ThemeAssetContributor';
import { AppConsts } from '@shared/AppConsts';

export class Theme7ThemeAssetContributor implements IThemeAssetContributor {
    public getAssetUrls(): string[] {
        return [AppConsts.appBaseUrl + '/assets/fonts/fonts-ramona.min.css'];
    }

    public getAdditionalBodyStle(): string {
        return 'goddard-bg-shine-cotton-candy';
    }

    public getMenuWrapperStyle(): string {
        return 'w-100';
    }

    public getSubheaderStyle(): string {
        return 'text-dark font-weight-bold my-1 mr-5';
    }

    public getFooterStyle(): string {
        return 'footer  bg-primary text-white py-4 d-flex flex-lg-column';
    }
}
