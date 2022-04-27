/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */

import {
    type FahrradDTOGraphQL,
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idVorhanden = [
    '000000000000000000000001',
    '000000000000000000000002',
    '000000000000000000000003',
];

const modellVorhanden = ['Endurace', 'Ams', 'Trekking'];

const teilModellVorhanden = ['a', 't', 'g'];

const teilModellNichtVorhanden = ['Xyz', 'abc'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GraphQL Queries', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    each(idVorhanden).test(
        'Fahrrad zu vorhandener ID %s',
        async (id: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                {
                    fahrrad(id: "${id}") {
                        modell
                        art
                        gewicht
                        version
                    }
                }
            `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();
            expect(data.data).toBeDefined();

            const { fahrrad } = data.data!;
            const result: FahrradDTOGraphQL = fahrrad;

            expect(result.modell).toMatch(/^\w/u);
            expect(result.version).toBeGreaterThan(-1);
            expect(result.id).toBeUndefined();
        },
    );

    test('Fahrrad zu nicht-vorhandener ID', async () => {
        // given
        const id = '999999999999999999999999';
        const body: GraphQLRequest = {
            query: `
                {
                    fahrrad(id: "${id}") {
                        modell
                    }
                }
            `,
        };

        // when
        const response: AxiosResponse<GraphQLResponse> = await client.post(
            graphqlPath,
            body,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.fahrrad).toBeNull();

        const { errors } = data;

        expect(errors).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error!;

        expect(message).toBe(`Es wurde kein Fahrrad mit der ID ${id} gefunden`);
        expect(path).toBeDefined();
        expect(path!![0]).toBe('fahrrad');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    each(modellVorhanden).test(
        'Fahrrad zu vorhandenem Modell %s',
        async (modell: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        fahrraeder(modell: "${modell}") {
                            modell
                            art
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();

            expect(data.data).toBeDefined();

            const { fahrraeder } = data.data!;

            expect(fahrraeder).not.toHaveLength(0);

            const fahrraederArray: FahrradDTOGraphQL[] = fahrraeder;

            expect(fahrraederArray).toHaveLength(1);

            const [fahrrad] = fahrraederArray;

            expect(fahrrad!.modell).toBe(modell);
        },
    );

    each(teilModellVorhanden).test(
        'Fahrrad zu vorhandenem Teil-Modell %s',
        async (teilModell: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        fahrraeder(modell: "${teilModell}") {
                            modell
                            art
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.errors).toBeUndefined();
            expect(data.data).toBeDefined();

            const { fahrraeder } = data.data!;

            expect(fahrraeder).not.toHaveLength(0);

            (fahrraeder as FahrradDTOGraphQL[])
                .map((fahrrad) => fahrrad.modell!)
                .forEach((modell: string) =>
                    expect(modell.toLowerCase()).toEqual(
                        expect.stringContaining(teilModell),
                    ),
                );
        },
    );

    each(teilModellNichtVorhanden).test(
        'Fahrrad zu nicht vorhandenem Modell %s',
        async (teilModell: string) => {
            // given
            const body: GraphQLRequest = {
                query: `
                    {
                        fahrraeder(modell: "${teilModell}") {
                            modell
                            art
                        }
                    }
                `,
            };

            // when
            const response: AxiosResponse<GraphQLResponse> = await client.post(
                graphqlPath,
                body,
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data.data!.fahrraeder).toBeNull();

            const { errors } = data;

            expect(errors).toHaveLength(1);

            const [error] = errors!;
            const { message, path, extensions } = error!;

            expect(message).toBe('Es wurden keine Fahrraeder gefunden');
            expect(path).toBeDefined();
            expect(path!![0]).toBe('fahrraeder');
            expect(extensions).toBeDefined();
            expect(extensions!.code).toBe('BAD_USER_INPUT');
        },
    );
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion */
