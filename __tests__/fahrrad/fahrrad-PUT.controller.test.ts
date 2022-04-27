import {
    type Fahrrad,
    MAX_GEWICHT,
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    loginRest,
    port,
    shutdownTestserver,
} from '../index.js';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { HttpStatus } from '@nestjs/common';

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const geaendertesFahrrad: Fahrrad = {
    // marke wird nicht geaendet
    modell: 'Geaendert',
    gewicht: 14,
    art: 'MOUNTAINBIKE',
    marke: 'Foo_Marke',
    preis: 444.4,
};
const idVorhanden = '000000000000000000000001';

const geaendertesFahrradIdNichtVorhanden: Fahrrad = {
    modell: 'Nichtvorhanden',
    gewicht: 11.5,
    art: 'MOUNTAINBIKE',
    marke: 'marke',
    preis: 444.4,
};
const idNichtVorhanden = '999999999999999999999999';

const geaendertesFahrradInvalid: Record<string, unknown> = {
    modell: '?!$',
    gewicht: -1,
    art: 'UNSICHTBAR',
    marke: 'NO_MARKE',
    preis: 0.01,
};

// gewicht wird nicht geaendet
const veraltesFahrrad: Omit<Fahrrad, 'gewicht'> = {
    modell: 'Veraltet',
    art: 'RENNRAD',
    marke: 'Cube',
    preis: 4444.4,
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('PUT /api/:id', () => {
    let client: AxiosInstance;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json', // eslint-disable-line @typescript-eslint/naming-convention
    };

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await createTestserver();

        const baseURL = `https://${host}:${port}/`;
        client = axios.create({
            baseURL,
            headers,
            httpsAgent,
            validateStatus: (status) => status < 500, // eslint-disable-line @typescript-eslint/no-magic-numbers
        });
    });

    afterAll(async () => {
        await shutdownTestserver();
    });

    test('Vorhandenes Fahrrad aendern', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesFahrrad,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.NO_CONTENT);
        expect(data).toBe('');
    });

    test('Nicht-vorhandenes Fahrrad aendern', async () => {
        // given
        const url = `${apiPath}/${idNichtVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesFahrradIdNichtVorhanden,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toBe(
            `Es gibt kein Fahrrad mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenes Fahrrad aendern, aber mit ungueltigen Daten', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesFahrradInvalid,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
        expect(data).toEqual(
            expect.arrayContaining([
                'Ein Modell muss mit einem Buchstaben, einer Ziffer oder _ beginnen',
                `Das Gewicht muss zwischen 0 und ${MAX_GEWICHT} liegen`,
                'Die Art eines Fahrrads muss RENNRAD, MOUNTAINBIKE oder TREKKINGRAD sein',
            ]),
        );
    });

    test('Vorhandenes Fahrrad aendern, aber ohne Versionsnummer', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        delete headers['If-Match'];

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            geaendertesFahrrad,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_REQUIRED);
        expect(data).toBe('Header "If-Match" fehlt');
    });

    test('Vorhandenes Fahrrad aendern, aber mit alter Versionsnummer', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = await loginRest(client);
        headers.Authorization = `Bearer ${token}`;
        headers['If-Match'] = '"-1"';

        // when
        const response: AxiosResponse<string> = await client.put(
            url,
            veraltesFahrrad,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.PRECONDITION_FAILED);
        expect(data).toEqual(expect.stringContaining('Die Versionsnummer'));
    });

    test('Vorhandenes Fahrrad aendern, aber ohne Token', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        delete headers.Authorization;
        headers['If-Match'] = '"0"';

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaendertesFahrrad,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });

    test('Vorhandenes Fahrrad aendern, aber mit falschem Token', async () => {
        // given
        const url = `${apiPath}/${idVorhanden}`;
        const token = 'FALSCH';
        headers.Authorization = `Bearer ${token}`;

        // when
        const response: AxiosResponse<Record<string, any>> = await client.put(
            url,
            geaendertesFahrrad,
            { headers },
        );

        // then
        const { status, data } = response;

        expect(status).toBe(HttpStatus.FORBIDDEN);
        expect(data.statusCode).toBe(HttpStatus.FORBIDDEN);
    });
});
