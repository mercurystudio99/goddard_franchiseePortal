import { OriginalAsset } from '../apis/generated/content';

/**
 * wrapper class to extend some common functions over OriginalAsset
 */
export class Rendition {
    _asset?: OriginalAsset;

    constructor(asset?: OriginalAsset) {
        this._asset = asset;
    }

    matchesIcon(icon: string): boolean {
        return this._asset?.contentPath.includes(icon);
    }
}
