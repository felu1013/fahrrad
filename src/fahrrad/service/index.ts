/**
 * Das Modul besteht aus den Klassen {@linkcode FahrradReadService},
 * {@linkcode FahrradWriteService} und {@linkcode FahrradFileService}, um
 * Fahrräder und ihre zugehörige Binärdatei in MongoDB abzuspeichern, auszulesen,
 * zu ändern und zu löschen einschließlich der Klassen für die Fehlerbehandlung
 */

export { FahrradFileService } from './fahrrad-file.service.js';
export { FahrradValidationService } from './fahrrad-validation.service.js';
export { FahrradReadService } from './fahrrad-read.service.js';
export { FahrradWriteService } from './fahrrad-write.service.js';
export {
    type ConstraintViolations,
    type ModellExists,
    type CreateError,
    type VersionInvalid,
    type VersionOutdated,
    type FahrradNotExists,
    type UpdateError,
    type FileNotFound,
    type MultipleFiles,
    type InvalidContentType,
    type FileFindError,
} from './errors.js';
export { MAX_GEWICHT, MAX_PREIS, jsonSchema } from './jsonSchema.js';
