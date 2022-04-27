/**
 * Das Modul besteht aus der Klasse {@linkcode AuthService} für die
 * Authentifizierung.
 * @packageDocumentation
 */

import {
    type CreateError,
    type FahrradNotExists,
    type ModellExists,
    type UpdateError,
    type VersionInvalid,
    type VersionOutdated,
} from './errors';
import {
    type Fahrrad,
    type FahrradDocument,
    modelName,
} from '../entity/index.js';
import { FahrradValidationService } from './fahrrad-validation.service.js';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service.js';
import { ObjectID } from 'bson';
import RE2 from 're2';
import { getLogger } from '../../logger/index.js';
import mongoose from 'mongoose';

/**
 * Die Klasse 'FahrradWriteService' implementiert den Anwendungskern für das
 * Schreiben von Fahrrädern und greift mit _Mongoose_ auf MongoDB zu
 */
@Injectable()
export class FahrradWriteService {
    private static readonly UPDATE_OPTIONS: mongoose.QueryOptions = {
        new: true,
    };

    private static readonly VERSION_PATTERN = new RE2('^"\\d*"');

    readonly #fahrradModel: mongoose.Model<FahrradDocument>;

    readonly #validationService: FahrradValidationService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(FahrradWriteService.name);

    constructor(
        @InjectModel(modelName) fahrradModel: mongoose.Model<FahrradDocument>,
        validationService: FahrradValidationService,
        mailService: MailService,
    ) {
        this.#fahrradModel = fahrradModel;
        this.#validationService = validationService;
        this.#mailService = mailService;
    }

    /**
     * Ein neues Fahrrad soll angelegt werden
     * @param fahrrad das neu abzulegende Fahrrad
     * @returns Die ID des neu angelegten Fahrrads oder im Fehlerfall
     * {@linkcode CreateError}
     */
    async create(fahrrad: Fahrrad): Promise<CreateError | ObjectID> {
        this.#logger.debug('create: fahrrad=%o', fahrrad);
        const validateResult = await this.#validateCreate(fahrrad);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const fahrradDocument = new this.#fahrradModel(fahrrad);
        const saved = await fahrradDocument.save();
        const id = saved._id;

        await this.#sendmail(saved);

        this.#logger.debug('create: id=%s', id);
        return id;
    }

    /**
     * Ein vorhandenes Fahrrad aktualisieren
     * @param fahrrad Das zu aktualisierende Fahrrad
     * @param id Die ID des Fahrrads
     * @param version Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     * oder im Fehlerfall {@linkcode UpdateError}
     */
    async update(
        id: string,
        fahrrad: Fahrrad,
        version: string,
    ): Promise<UpdateError | number> {
        this.#logger.debug(
            'update: id=%s, fahrrad=%o, version=%s',
            id,
            fahrrad,
            version,
        );
        if (!ObjectID.isValid(id)) {
            this.#logger.debug('update: Keine gueltige ObjectID');
            return { type: 'FahrradNotExists', id };
        }

        const validateResult = await this.#validateUpdate(fahrrad, id, version);
        if (validateResult !== undefined) {
            return validateResult;
        }

        const options = FahrradWriteService.UPDATE_OPTIONS;
        const updated = await this.#fahrradModel.findByIdAndUpdate(
            new ObjectID(id),
            fahrrad,
            options,
        );
        if (updated === null) {
            this.#logger.debug('update: Kein Fahrrad mit id=%s', id);
            return { type: 'FahrradNotExists', id };
        }

        const versionUpdated = updated.__v as number;
        this.#logger.debug('update: versionUpdated=%s', versionUpdated);

        return versionUpdated;
    }

    /**
     * Ein Fahrrad asynchron anhand seiner ID löschen
     * @param id Die ID des Fahrrads
     * @returns true, falls das Fahrrad vorhanden war und gelöscht wurde, sonst false
     */
    async delete(idStr: string) {
        this.#logger.debug('delete: idStr=%s', idStr);
        if (!ObjectID.isValid(idStr)) {
            this.#logger.debug('delete: Keine gueltige ObjectID');
            return false;
        }

        const deleted = await this.#fahrradModel
            .findByIdAndDelete(new ObjectID(idStr))
            .lean<Fahrrad | null>();
        this.#logger.debug('delete: deleted=%o', deleted);
        return deleted !== null;
    }

    async #validateCreate(fahrrad: Fahrrad): Promise<CreateError | undefined> {
        const messages = this.#validationService.validate(fahrrad);
        if (messages.length > 0) {
            this.#logger.debug('#validateCreate: messages=%o', messages);
            return { type: 'ConstraintViolations', messages };
        }

        const { modell } = fahrrad;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (await this.#fahrradModel.exists({ modell })) {
            return { type: 'ModellExists', modell };
        }

        this.#logger.debug('#validateCreate: ok');
        return undefined;
    }

    async #sendmail(fahrrad: FahrradDocument) {
        const subject = `Neues Fahrrad ${fahrrad.id as string}`;
        const body = `Das Fahrrad mit dem Modell <strong>${fahrrad.modell}</strong> ist angelegt`;
        await this.#mailService.sendmail(subject, body);
    }

    async #validateUpdate(
        fahrrad: Fahrrad,
        id: string,
        versionStr: string,
    ): Promise<UpdateError | undefined> {
        const result = this.#validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        this.#logger.debug(
            '#validateUpdate: fahrrad=%o, version=%s',
            fahrrad,
            version,
        );

        const messages = this.#validationService.validate(fahrrad);
        if (messages.length > 0) {
            return { type: 'ConstraintViolations', messages };
        }

        const resultModell = await this.#checkModellExists(fahrrad);
        if (resultModell !== undefined && resultModell.id !== id) {
            return resultModell;
        }

        const resultIdAndVersion = await this.#checkIdAndVersion(id, version);
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        this.#logger.debug('#validateUpdate: ok');
        return undefined;
    }

    #validateVersion(version: string | undefined): VersionInvalid | number {
        if (
            version === undefined ||
            !FahrradWriteService.VERSION_PATTERN.test(version)
        ) {
            const error: VersionInvalid = { type: 'VersionInvalid', version };
            this.#logger.debug('#validateVersion: VersionInvalid=%o', error);
            return error;
        }

        return Number.parseInt(version.slice(1, -1), 10);
    }

    async #checkModellExists(
        fahrrad: Fahrrad,
    ): Promise<ModellExists | undefined> {
        const { modell } = fahrrad;

        const result = await this.#fahrradModel.findOne(
            {
                modell,
            },
            {
                _id: true,
            },
        );
        if (result !== null) {
            const id = result._id.toString();
            this.#logger.debug('checkModellExists: id=%s', id);
            return { type: 'ModellExists', modell, id };
        }

        this.#logger.debug('#checkTitelExists: ok');
        return undefined;
    }

    async #checkIdAndVersion(
        id: string,
        version: number,
    ): Promise<FahrradNotExists | VersionOutdated | undefined> {
        const fahrradDb = await this.#fahrradModel.findById(id);
        if (fahrradDb === null) {
            const result: FahrradNotExists = { type: 'FahrradNotExists', id };
            this.#logger.debug(
                '#checkIdAndVersion: FahrradNotExists=%o',
                result,
            );
            return result;
        }

        const versionDb = (fahrradDb.__v ?? 0) as number;
        if (version < versionDb) {
            const result: VersionOutdated = {
                type: 'VersionOutdated',
                id,
                version,
            };
            this.#logger.debug(
                '#checkIdAndVersion: VersionOutdated=%o',
                result,
            );
            return result;
        }

        return undefined;
    }
}
