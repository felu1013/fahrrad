/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der REST-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    ApiBearerAuth,
    ApiHeader,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiParam,
    ApiProperty,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    Param,
    Query,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    Fahrrad,
    type FahrradArt,
    type FahrradDocument,
} from '../entity/index.js';
import { JwtAuthGuard, RolesGuard } from '../../security/index.js';
import { Request, Response } from 'express';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { FahrradReadService } from '../service/fahrrad-read.service.js';
import { type ObjectID } from 'bson';
import { getBaseUri } from './getBaseUri.js';
import { paths } from '../../config/index.js';

// TypeScript
interface Link {
    href: string;
}
interface Links {
    self: Link;
    // optional
    list?: Link;
    add?: Link;
    update?: Link;
    remove?: Link;
}

// Interface für Get Request mit Links für HATEOAS
// DTO = data transfer object
export interface FahrradDTO extends Fahrrad {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
}

export interface FahrraederDTO {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        fahrraeder: FahrradDTO[];
    };
}

/**
 * Klasse für `FahrradGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `FahrradController` hat dieselben Properties wie die Basisklasse
 * `Fahrrad` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich..
 */
export class FahrradQuery extends Fahrrad {
    @ApiProperty({ required: false })
    declare readonly modell: string | undefined;

    @ApiProperty({ required: false })
    declare readonly gewicht: number | undefined;

    @ApiProperty({ required: false })
    declare readonly art: FahrradArt | undefined;

    @ApiProperty({ required: false })
    declare readonly marke: string | undefined;

    @ApiProperty({ required: false })
    declare readonly preis: number | undefined;

    @ApiProperty({ example: true, type: Boolean, required: false })
    readonly javascript: boolean | undefined;

    @ApiProperty({ example: true, type: Boolean, required: false })
    readonly typescript: boolean | undefined;
}

/**
 * Die Controller Klasse für die Verwaltung der Fahrräder
 */
// Decorator in TypeScript
@Controller(paths.api)
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('REST-API')
@ApiBearerAuth()
// Klassen ab ES 2015
export class FahrradGetController {
    // readonly in TypeScript
    // private ab ES2019
    readonly #service: FahrradReadService;

    readonly #logger = getLogger(FahrradGetController.name);

    // Dependency Injection bzw Constructor Injection
    // constuctor(private readonly service: FahrradReadService {}
    constructor(service: FahrradReadService) {
        this.#service = service;
    }

    /**
     * Ein Fahrrad wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Fahrrad gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Fahrrads gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird das gefundene
     * Fahrrad im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es kein Fahrrad zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param id Pfad-Parameter `id`
     * @param req Request-Objekt von Express mit Pfadparameter, Query-String,
     *            Request-Header und Request-Body.
     * @param version Versionsnummer im Request-Header bei `If-None-Match`
     * @param accept Content-Type bzw. MIME-Type
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // vgl Kotlin: Schluesselwort "suspend"
    // eslint-disable-next-line max-params, max-lines-per-function
    @Get(':id')
    @ApiOperation({ summary: 'Fahrrad mit der ID suchen' })
    @ApiParam({
        name: 'id',
        description: 'Z.B. 000000000000000000000001',
    })
    @ApiHeader({
        name: 'If-None-Match',
        description: 'Header für bedingte Get-Requests, z.B. "0"',
        required: false,
    })
    @ApiOkResponse({ description: 'Das Fahrrad wurde gefunden' })
    @ApiNotFoundResponse({ description: 'Kein Fahrrad zur ID gefunden' })
    @ApiResponse({
        status: HttpStatus.NOT_MODIFIED,
        description: 'Das Fahrrad wurde bereits heruntergeladen',
    })
    async findById(
        @Param('id') id: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ) {
        this.#logger.debug('findById: id=%s, version=%s', id, version);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('findById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        let fahrrad: FahrradDocument | undefined;
        try {
            // wie in Kotlin Aufruf einer suspend function
            fahrrad = await this.#service.findById(id);
        } catch (err) {
            // err ist implizit vom Typ "unknown"
            // Exception einer export async function bei der Ausführung fangen
            this.#logger.error('findById: error=%o', err);
            return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        if (fahrrad === undefined) {
            this.#logger.debug('findById: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }
        this.#logger.debug('findById(): fahrrad=%o', fahrrad);

        // Etags
        const versionDb = fahrrad.__v as number;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('findById: NOT_MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('findById: verionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}`);

        // HATEOAS mit Atom Links und HAL
        const fahrradDTO = this.#toDTO(fahrrad, req, id);
        this.#logger.debug('findById: fahrradDTO', fahrradDTO);
        return res.json(fahrradDTO);
    }

    /**
     * Fahrräder werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Fahrrad gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Fahrrädern, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Fahrrad zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Fahrräder ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @ApiOperation({ summary: 'Fahrräder mit Suchkriterien suchen' })
    @ApiOkResponse({ description: 'Eine evtl leere Liste mit Fahrrädern' })
    async find(
        @Query() query: FahrradQuery,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        this.#logger.debug('find: query=%o', query);

        if (req.accepts(['json', 'html']) === false) {
            this.#logger.debug('find: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const fahrraeder = await this.#service.find(query);
        this.#logger.debug('find: %o', fahrraeder);
        if (fahrraeder.length === 0) {
            this.#logger.debug('find: NOT_FOUND');
            return res.sendStatus(HttpStatus.NOT_FOUND);
        }

        // HATEOAS: Atom Links je Fahrrad
        const fahrraederDTO = fahrraeder.map((fahrrad) => {
            const id = (fahrrad.id as ObjectID).toString();
            return this.#toDTO(fahrrad, req, id, false);
        });
        this.#logger.debug('find: fahrraederDTO=%o', fahrraederDTO);

        const result: FahrraederDTO = {
            _embedded: { fahrraeder: fahrraederDTO },
        };
        return res.json(result).send();
    }

    // eslint-disable-next-line max-params
    #toDTO(fahrrad: FahrradDocument, req: Request, id: string, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toDTO: baseUri=%s', baseUri);
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toDTO: fahrrad=%o, links=%o', fahrrad, links);
        const fahrradDTO: FahrradDTO = {
            modell: fahrrad.modell,
            gewicht: fahrrad.gewicht,
            art: fahrrad.art,
            marke: fahrrad.marke,
            preis: fahrrad.preis,
            _links: links,
        };
        return fahrradDTO;
    }
}
