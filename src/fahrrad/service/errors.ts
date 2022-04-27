/**
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Fahrrädern, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

/**
 * Klasse für fehlerhafte Fahrraddaten. Die Meldungstexte sind in der Property
 * `msg` gekapselt.
 */
export interface ConstraintViolations {
    readonly type: 'ConstraintViolations';
    readonly messages: string[];
}

/**
 * Klasse für ein bereits existierendes Modell
 */
export interface ModellExists {
    readonly type: 'ModellExists';
    readonly modell: string | null | undefined;
    readonly id?: string;
}

/**
 * Inion Type für Fehler beim Neuanlegen eines Fahrrads
 * - {@linkcode ConstraintViolations}
 * - {@linkcode ModellExists}
 */
export type CreateError = ConstraintViolations | ModellExists;

/**
 * Klasse für eine ungültige Versionsnummer beim Ändern
 */
export interface VersionInvalid {
    readonly type: 'VersionInvalid';
    readonly version: string | undefined;
}

/**
 * Klasse für eine veraltete Versionsnummer beim Ändern
 */
export interface VersionOutdated {
    readonly type: 'VersionOutdated';
    readonly id: string;
    readonly version: number;
}

/**
 * Klasse für ein nicht vorhandenes Fahrrad beim Ändern
 */
export interface FahrradNotExists {
    readonly type: 'FahrradNotExists';
    readonly id: string | undefined;
}

/**
 * Union Type für Fehler beim Ändern eines Fahrrads
 * - {@linkcode ConstraintViolations}
 * - {@linkcode FahrradNotExists}
 * - {@linkcode ModellExists}
 * - {@linkcode VersionInvalid}
 * - {@linkcode VersionOutdated}
 */
export type UpdateError =
    | ConstraintViolations
    | FahrradNotExists
    | ModellExists
    | VersionInvalid
    | VersionOutdated;

/**
 * Klasse für eine nicht vorhandene Binärdatei
 */
export interface FileNotFound {
    readonly type: 'FileNotFound';
    readonly filename: string;
}

/**
 * Klasse, falls es mehrere Binärdateien zu einem Fahrrad gibt
 */
export interface MultipleFiles {
    readonly type: 'MultipleFiles';
    readonly filename: string;
}

/**
 * Klasse, falls der ContentType nicht korrekt ist
 */
export interface InvalidContentType {
    type: 'InvalidContentType';
}

/**
 * Union Type für Fehler beim Lesen einer Binärdatei zu einem Fahrrad
 * - {@linkcode FahrradNotExists}
 * - {@linkcode FileNotFound}
 * - {@linkcode InvalidContentType}
 * - {@linkcode MultipleFiles}
 */
export type FileFindError =
    | FahrradNotExists
    | FileNotFound
    | InvalidContentType
    | MultipleFiles;
