import { type GenericJsonSchema } from './GenericJsonSchema.js';

export const MAX_GEWICHT = 30;
export const MAX_PREIS = 9999;

export const jsonSchema: GenericJsonSchema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://acme.com/fahrrad.json#',
    title: 'Fahrrad',
    description: 'Eigenschaften eines Fahrrads: Typen und Constraints',
    type: 'object',
    properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        _id: { type: 'object' },
        __v: {
            type: 'number',
            minimum: 0,
        },
        /* eslint-enable @typescript-eslint/naming-convention */
        version: {
            type: 'number',
            minimum: 0,
        },
        modell: {
            type: 'string',
            pattern: '^\\w.*',
        },
        gewicht: {
            type: 'number',
            minimum: 1,
            maximum: MAX_GEWICHT,
        },
        art: {
            type: 'string',
            enum: ['MOUNTAINBIKE', 'RENNRAD', 'TREKKINGRAD', ''],
        },
        marke: {
            type: 'string',
            pattern: '^\\w.*',
        },
        preis: {
            type: 'number',
            minimum: 0,
            maximum: MAX_PREIS,
        },
    },
    required: ['modell', 'art', 'marke'],
    additionalProperties: false,
    errorMessage: {
        properties: {
            version: 'Die Versionsnummer muss mindestens 0 sein',
            modell: 'Ein Modell muss mit einem Buchstaben, einer Ziffer oder _ beginnen',
            gewicht: 'Das Gewicht muss zwischen 0 und 30 liegen',
            art: 'Die Art eines Fahrrads muss RENNRAD, MOUNTAINBIKE oder TREKKINGRAD sein',
            marke: 'Die Marke muss mit einem Buchstaben, einer Ziffer oder _ beginnen',
            preis: 'Der Preis muss zwischen 0 und 9999 liegen',
        },
    },
};
