/**
 * Das Modul enthält die Funktionen, um die DB-Verbindung beim Herunterfahren
 * des Servers zu schließen und um einen DB-Client für Datei-Upload und
 * -Download bereitzustellen.
 * @packageDocumentation
 */

import {
    Injectable,
    Logger,
    type OnApplicationShutdown,
    ShutdownSignal,
} from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { dbConfig } from '../config/db.js';
import mongoose from 'mongoose';

/**
 * Die Test-DB wird im Development-Modus neu geladen, nachdem die Module
 * initialisiert sind, was duch `OnApplicationBootstrap` realisiert wird.
 */
@Injectable()
export class DbService implements OnApplicationShutdown {
    // Logger von NestJS statt asynchronem Logging mit Pino bei Shutdown
    readonly #logger = new Logger(DbService.name);

    /**
     * DB-Verbindung beim Herunterfahren schließen. Siehe main.ts
     * @param signal z.B. `SIGINT`
     */
    async onApplicationShutdown(signal?: string) {
        this.#logger.log(`onApplicationShutdown: signal=${signal}`);
        if (signal === ShutdownSignal.SIGINT) {
            await mongoose.disconnect();
            this.#logger.log(
                'onApplicationShutdown: Die DB-Verbindung fuer MongoDB wird geschlossen',
            );
        }
    }

    /**
     * DB-Verbindung für Datei-Upload und -Download bereitstellen
     * @returns DB-Client
     */
    async connect() {
        const { url } = dbConfig;
        const client = new MongoClient(url);
        await client.connect();
        return client;
    }
}
