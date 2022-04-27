/**
 * Das Modul besteht aus Interfaces, Klassen und Funktionen für Fahrräder als
 * _Entity_ gemäß _Domain Driven Design_. Dazu gehört auch die Validierung
 * @packageDocumentation
 */

export {
    Fahrrad,
    type FahrradArt,
    type FahrradDocument,
    fahrradSchema,
    collectionName,
    exactFilterProperties,
    modelName,
} from './fahrrad.js';
