/**
 * Goddard School Features API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: v1
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { TransportationStop } from './transportationStop';
import { SchoolFeature } from './schoolFeature';


export interface SchoolFeaturesModel { 
    id?: string | null;
    schoolNumber?: string | null;
    schoolId?: string | null;
    isActive?: boolean;
    features?: Array<SchoolFeature> | null;
    transportationStops?: Array<TransportationStop> | null;
}

