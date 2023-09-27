import { AppConsts } from '@shared/AppConsts';
import * as rtlDetect from 'rtl-detect';
import { StyleLoaderService } from '@shared/utils/style-loader.service';
import { ThemeHelper } from '@app/shared/layout/themes/ThemeHelper';
import { ThemeAssetContributorFactory } from './ThemeAssetContributorFactory';

export class DynamicResourcesHelper {
    static loadResources(callback: () => void): void {
        Promise.all([DynamicResourcesHelper.loadStyles()]).then(() => {
            callback();
        });
    }

    static loadStyles(): Promise<any> {
        let theme = ThemeHelper.getTheme();

        const isRtl = rtlDetect.isRtlLang(abp.localization.currentLanguage.name);

        if (isRtl) {
            document.documentElement.setAttribute('dir', 'rtl');
        }

        const cssPostfix = isRtl ? '-rtl' : '';
        const styleLoaderService = new StyleLoaderService();

        let styleUrls = [

            // 20230608RBP - We stopped including the metronic theme style bundle as a dynamic bundle
            // and moved theme styles bundling into angular.json so we can take advantage of HMR for development when overriding theme styles.
            // FBP doesn't have theme switching capability and also doesn't support RTL language so it shouldn't be issue
            // Having to regenerate theme bundle via "npm run create-dynamic-bundles" was very expensive
            // see: https://docs.aspnetzero.com/en/aspnet-core-angular/v10.5.0/Infrastructure-Angular-Bundling-Minifying-Compiling
            // AppConsts.appBaseUrl +
            //     '/assets/metronic/themes/' +
            //     theme +
            //     '/css/style.bundle' +
            //     cssPostfix.replace('-', '.') +
            //     '.min.css',
            AppConsts.appBaseUrl + '/assets/primeng/datatable/css/primeng.datatable' + cssPostfix + '.min.css',
            AppConsts.appBaseUrl + '/assets/common/styles/metronic-customize.min.css',
            AppConsts.appBaseUrl + '/assets/common/styles/themes/' + theme + '/metronic-customize.min.css',
            AppConsts.appBaseUrl + '/assets/common/styles/metronic-customize-angular.min.css',
        ].concat(DynamicResourcesHelper.getAdditionalThemeAssets());

        styleLoaderService.loadArray(styleUrls);

        if (isRtl) {
            styleLoaderService.load(AppConsts.appBaseUrl + '/assets/common/styles/abp-zero-template-rtl.min.css');
        }

        return Promise.resolve(true);
    }

    static getAdditionalThemeAssets(): string[] {
        let assetContributor = ThemeAssetContributorFactory.getCurrent();
        if (!assetContributor) {
            return [];
        }

        return assetContributor.getAssetUrls();
    }
}
