import { nodeConfig, paths } from '../src/config/index.js';
import { Agent } from 'node:https';
import { AppModule } from '../src/app.module.js';
import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

export const apiPath = paths.api;
export const loginPath = `${paths.auth}/${paths.login}`;

export const { host, port } = nodeConfig;

const { httpsOptions } = nodeConfig;

// -----------------------------------------------------------------------------
// T e s t s e r v e r   m i t   H T T P S
// -----------------------------------------------------------------------------
let testserver: INestApplication;

export const createTestserver = async () => {
    if (httpsOptions === undefined) {
        throw new Error('HTTPS wird nicht konfiguriert.');
    }

    testserver = await NestFactory.create(AppModule, {
        httpsOptions,
        logger: ['log'],
        // logger: ['debug'],
    });
    await testserver.listen(port);
    return testserver;
};

export const shutdownTestserver = async () => {
    try {
        await testserver.close();
    } catch {
        console.warn('Der Testserver wurde fehlerhaft beendet.');
    }
};

// fuer selbst-signierte Zertifikate
export const httpsAgent = new Agent({
    requestCert: true,
    rejectUnauthorized: false,
    ca: httpsOptions?.cert as Buffer,
});
