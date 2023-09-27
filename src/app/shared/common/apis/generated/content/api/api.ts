export * from './assets.service';
import { AssetsService } from './assets.service';
export * from './components.service';
import { ComponentsService } from './components.service';
export * from './iconCards.service';
import { IconCardsService } from './iconCards.service';
export * from './schools.service';
import { SchoolsService } from './schools.service';
export const APIS = [AssetsService, ComponentsService, IconCardsService, SchoolsService];
