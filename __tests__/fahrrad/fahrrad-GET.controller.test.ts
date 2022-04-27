/* eslint-disable no-underscore-dangle, @typescript-eslint/no-non-null-assertion */
import {
    type FahrraederDTO,
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    port,
    shutdownTestserver,
} from '../index.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';
import each from 'jest-each';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const modellVorhanden = ['a', 't', 'g'];
const modellNichtVorhanden = ['xx', 'yy'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /api', () => {
    let client: AxiosInstance;

    beforeAll(async () => {
        await createTestserver();
        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Alle Fahrraeder', async () => {
        // given

        // when
        const response: AxiosResponse<FahrraederDTO> = await client.get(
            apiPath,
        );

        // then
        const { status, headers, data } = response;

        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { fahrraeder } = data._embedded;

        fahrraeder
            .map((fahrrad) => fahrrad._links.self.href)
            .forEach((selfLink) => {
                expect(selfLink).toEqual(
                    expect.stringContaining(`/${apiPath}`),
                );
            });
    });

    each(modellVorhanden).test(
        'Fahrraeder mit einem Modell, das "%s" enthaelt',
        async (teilModell: string) => {
            // given
            const params = { modell: teilModell };

            // when
            const response: AxiosResponse<FahrraederDTO> = await client.get(
                apiPath,
                { params },
            );

            // then
            const { status, headers, data } = response;

            expect(status).toBe(HttpStatus.OK);
            expect(headers['content-type']).toMatch(/json/iu);
            expect(data).toBeDefined();

            const { fahrraeder } = data._embedded;

            // Jedes Fahrrad hat ein Modell mit dem Teilstring 'a'
            fahrraeder
                .map((fahrrad) => fahrrad.modell!)
                .forEach((modell: string) =>
                    expect(modell.toLowerCase()).toEqual(
                        expect.stringContaining(teilModell),
                    ),
                );
        },
    );

    each(modellNichtVorhanden).test(
        'Keine Fahrraeder mit einem Modell, der "%s" enthaelt',
        async (teilModell: string) => {
            // given
            const params = { modell: teilModell };

            // when
            const response: AxiosResponse<string> = await client.get(apiPath, {
                params,
            });

            // then
            const { status, data } = response;

            expect(status).toBe(HttpStatus.NOT_FOUND);
            expect(data).toMatch(/^not found$/iu);
        },
    );

    test('Keine Fahrraeder zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const response: AxiosResponse<string> = await client.get(apiPath, {
            params,
        });

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NOT_FOUND);
        expect(data).toMatch(/^not found$/iu);
    });
});
/* eslint-enable no-underscore-dangle, @typescript-eslint/no-non-null-assertion */
