import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
    type CreateError,
    FahrradWriteService,
    type UpdateError,
} from '../service/index.js';
import {
    JwtAuthGraphQlGuard,
    Roles,
    RolesGraphQlGuard,
} from '../../security/index.js';
import { ResponseTimeInterceptor, getLogger } from '../../logger/index.js';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { Fahrrad } from '../entity/index.js';
import { type ObjectId } from 'bson';
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
@UseGuards(JwtAuthGraphQlGuard, RolesGraphQlGuard)
@UseInterceptors(ResponseTimeInterceptor)
export class FahrradMutationResolver {
    readonly #service: FahrradWriteService;

    readonly #logger = getLogger(FahrradMutationResolver.name);

    constructor(service: FahrradWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async create(@Args() input: Fahrrad) {
        this.#logger.debug('createFahrrad: input=%o', input);
        const result = await this.#service.create(input);
        this.#logger.debug('createFahrrad: result=%o', result);
        if (Object.prototype.hasOwnProperty.call(result, 'type')) {
            throw new UserInputError(
                this.#errorMsgCreateFahrrad(result as CreateError),
            );
        }
        return (result as ObjectId).toString();
    }

    @Mutation()
    @Roles('admin', 'mitarbeiter')
    async update(@Args() fahrradDTO: FahrradUpdateInput) {
        this.#logger.debug('updateFahrrad: fahrradDTO=%o', fahrradDTO);
        const { id, version, fahrrad } = fahrradDTO;
        const versionStr = `"${(version ?? 0).toString()}"`;

        const result = await this.#service.update(id!, fahrrad, versionStr); // eslint-disable-line @typescript-eslint/no-non-null-assertion
        if (typeof result === 'object') {
            throw new UserInputError(this.#errorMsgUpdateFahrrad(result));
        }
        this.#logger.debug('updateFahrrad: result=%d', result);
        return result;
    }

    @Mutation()
    @Roles('admin')
    async delete(@Args() id: Id) {
        const idStr = id.id;
        this.#logger.debug('deleteFahrrad: id=%s', idStr);
        const result = await this.#service.delete(idStr);
        this.#logger.debug('deleteFahrrad: result=%s', result);
        return result;
    }

    #errorMsgCreateFahrrad(err: CreateError) {
        switch (err.type) {
            case 'ConstraintViolations':
                return err.messages.join(' ');
            case 'ModellExists':
                return `Das Modell "${err.modell}" existiert bereits`;
            default:
                return 'Unbekannter Fehler';
        }
    }

    #errorMsgUpdateFahrrad(err: UpdateError) {
        switch (err.type) {
            case 'ConstraintViolations':
                return err.messages.join(' ');
            case 'ModellExists':
                return `Das Modell "${err.modell}" existiert bereits`;
            case 'FahrradNotExists':
                return `Es gibt kein Fahrrad mit der ID ${err.id}`;
            case 'VersionInvalid':
                return `"${err.version}" ist keine gueltige Versionsnummer`;
            case 'VersionOutdated':
                return `Die Versionsnummer "${err.version}" ist nicht mehr aktuell`;
            default:
                return 'Unbekannter Fehler';
        }
    }
}
