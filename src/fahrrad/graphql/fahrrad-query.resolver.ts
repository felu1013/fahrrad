import { Args, Query, Resolver } from '@nestjs/graphql';
import { type Fahrrad, type FahrradDocument } from '../entity/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { FahrradReadService } from '../service/index.js';
import { UseInterceptors } from '@nestjs/common';
import { UserInputError } from 'apollo-server-express';

export type FahrradDTO = Fahrrad & {
    id: string;
    version: number;
};

export interface FahrradUpdateInput {
    id?: string;
    version?: number;
    fahrrad: Fahrrad;
}

interface Id {
    id: string;
}

@Resolver()
@UseInterceptors(ResponseTimeInterceptor)
export class FahrradQueryResolver {
    readonly #service: FahrradReadService;

    readonly #logger = getLogger(FahrradQueryResolver.name);

    constructor(service: FahrradReadService) {
        this.#service = service;
    }

    @Query('fahrrad')
    async findById(@Args() id: Id) {
        const idStr = id.id;
        this.#logger.debug('findById: id=%s', idStr);

        const fahrrad = await this.#service.findById(idStr);
        if (fahrrad === undefined) {
            throw new UserInputError(
                `Es wurde kein Fahrrad mit der ID ${idStr} gefunden`,
            );
        }
        const fahrradDTO = this.#toFahrradDTO(fahrrad);
        this.#logger.debug('findById: fahrradDTO=%o', fahrradDTO);
        return fahrradDTO;
    }

    @Query('fahrraeder')
    async find(@Args() modell: { modell: string } | undefined) {
        const modellStr = modell?.modell;
        this.#logger.debug('find: modell=%s', modellStr);
        const suchkriterium =
            modellStr === undefined ? {} : { modell: modellStr };
        const fahrraeder = await this.#service.find(suchkriterium);
        if (fahrraeder.length === 0) {
            throw new UserInputError('Es wurden keine Fahrraeder gefunden');
        }

        const fahrraederDTO = fahrraeder.map((fahrrad) =>
            this.#toFahrradDTO(fahrrad),
        );
        this.#logger.debug('find: fahrraederDTO=%o', fahrraederDTO);
        return fahrraederDTO;
    }

    #toFahrradDTO(fahrrad: FahrradDocument) {
        const fahrradDTO: FahrradDTO = {
            id: fahrrad._id.toString(),
            version: fahrrad.__v as number,
            modell: fahrrad.modell,
            gewicht: fahrrad.gewicht,
            art: fahrrad.art,
            marke: fahrrad.marke,
            preis: fahrrad.preis,
        };
        return fahrradDTO;
    }
}
