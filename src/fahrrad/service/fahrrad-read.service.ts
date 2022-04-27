/**
 * Das Modul besteht aus der Klasse {@linkcode AuthService} für die
 * Authentifizierung.
 * @packageDocumentation
 */

import {
    type FahrradDocument,
    exactFilterProperties,
    modelName,
} from '../entity/index.js';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { ObjectId } from 'bson';
import { getLogger } from '../../logger/index.js';
import mongoose from 'mongoose';

// API-Dokumentation zu Mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

/* eslint-disable unicorn/no-useless-undefined */

/**
 * Die Klasse 'FahrradReadService' implementiert das Lesen für Fahrräder und greift
 *  mit _Mongoose_ auf MongoDB zu
 */
@Injectable()
export class FahrradReadService {
    readonly #fahrradModel: mongoose.Model<FahrradDocument>;

    readonly #logger = getLogger(FahrradReadService.name);

    constructor(
        @InjectModel(modelName) fahrradModel: mongoose.Model<FahrradDocument>,
    ) {
        this.#fahrradModel = fahrradModel;
    }

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C# und Mono<> aus Project Reactor
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Fahrrad asynchrom anhand seiner ID suchen
     * @param id ID des gesuchten Fahrrads
     * @returns Das gefundene Fahrrad vom Typ {@linkcode Fahrrad} oder undefined
     *          in einem Promise aus ES2015
     */
    async findById(idStr: string) {
        this.#logger.debug('findById: idStr=%s', idStr);

        // Ein Fahrrad zur gegebenen ID asynchron mit Mongoose suchen
        // Pattern "Active Record"
        // Resultat ist null, falls nichts gefunden wird
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document,
        // so dass u.a. der virtuelle getter "id" auch nicht mehr vorhanden ist.
        // ObjectID: 12-Byte Binaerwert, d.h. 24-stellinger HEX-String
        if (!ObjectId.isValid(idStr)) {
            this.#logger.debug('findById: Ungueltige ObjectId');
            return undefined;
        }

        const id = new ObjectId(idStr);
        const fahrrad = await this.#fahrradModel.findById(id);
        this.#logger.debug('findById: fahrrad=%o', fahrrad);

        return fahrrad || undefined;
    }

    /**
     * Fahrräder asynchron suchen
     * @param filter Die DB Query als JSON Objekt
     * @returns Ein Json Array mit den gefundenen Fahrrädern, oder leeres Array
     */
    // eslint-disable-next-line max-lines-per-function
    async find(filter?: mongoose.FilterQuery<FahrradDocument> | undefined) {
        this.#logger.debug('find: filter=%o', filter);

        //alle Fahrräder asynchron suchen und aufsteigend nach modell sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { titel: 'a', rating: 5 } => [{ titel: 'x'}, {rating: 5}]
        if (filter === undefined || Object.entries(filter).length === 0) {
            return this.#findAll();
        }

        // { modell: 'a', Moutainbike: true }
        // Rest Properties
        const { modell, MOUNTAINBIKE, RENNRAD, ...dbFilter } = filter; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

        if (this.#checkInvalidProperty(dbFilter)) {
            return [];
        }

        // Fahrräder zur Query (= JSON-Objekt durch Express) asynchron suchen
        // Modell in der Query: Teilstring des Modells,
        // d.h. "LIKE" als regulaerer Ausdruck
        // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
        // NICHT /.../, weil das Muster variabel sein muss
        // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdruck
        // RegExp statt RE2 wegen Mongoose
        if (
            modell !== undefined &&
            modell !== null &&
            typeof modell === 'string'
        ) {
            dbFilter.modell =
                // TODO Komplexitaet des regulaeren Ausrucks analysieren
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                modell.length < 10
                    ? new RegExp(modell, 'iu') // eslint-disable-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                    : modell;
        }

        // z.B. { javascript: true, typscript: true }
        const art = [];
        if (MOUNTAINBIKE === 'true') {
            art.push('MOUNTAINBIKE');
        }
        if (RENNRAD === 'true') {
            art.push('RENNRAD');
        }
        if (art.length === 0) {
            if (Array.isArray(dbFilter.schlagwoerter)) {
                dbFilter.schlagwoerter.splice(0);
            }
        } else {
            dbFilter.art = art;
        }
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // Model<Document>.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        const fahrraeder = await this.#fahrradModel.find(
            dbFilter as mongoose.FilterQuery<FahrradDocument>,
        );
        this.#logger.debug('find: fahrraeder=%o', fahrraeder);

        return fahrraeder;
    }

    async #findAll() {
        this.#logger.debug('#findAll');
        // Lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        const fahrraeder = await this.#fahrradModel.find().sort('modell');
        this.#logger.debug('#findAll: fahrraeder=%o', fahrraeder);
        return fahrraeder;
    }

    #checkInvalidProperty(dbFilter: Record<string, string>) {
        const filterKeys = Object.keys(dbFilter);
        const result = filterKeys.some(
            (key) => !exactFilterProperties.includes(key),
        );
        this.#logger.debug('#checkInvalidProperty: result=%o', result);
        return result;
    }
}

/* eslint-enable unicorn/no-useless-undefined */
