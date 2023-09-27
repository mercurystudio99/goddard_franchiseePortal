import { environment as dev } from './environment.dev';
import { environment as qa } from './environment.qa';
import { environment as production } from './environment.production';
import { tokenizedOrDefault } from './tokenized-or-default';

// 20220105RBP - WORKAROUND: CI/CD uses the same artifact for each environment
// so need provide config based on tokenized '#{{ENVIRONMENT}}#'

export const environment = getEnvironmentConfig(tokenizedOrDefault('#{{ENVIRONMENT}}#', 'production'));

function getEnvironmentConfig(environment: string) {
    switch(environment) {
        case 'qa':
            return qa;
        case 'production':
            return production;
        default:
            return dev;
    }
}

