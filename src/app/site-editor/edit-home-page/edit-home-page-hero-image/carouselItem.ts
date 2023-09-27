import { OriginalAsset } from '@app/shared/common/apis/generated/content';

export interface CarouselItem {
    slideNumber: number;
    rendition: OriginalAsset | undefined;
}
