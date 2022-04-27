import {
    FahrradFileController,
    FahrradGetController,
    FahrradWriteController,
} from './rest/index.js';
import {
    FahrradFileService,
    FahrradReadService,
    FahrradValidationService,
    FahrradWriteService,
} from './service/index.js';
import {
    FahrradMutationResolver,
    FahrradQueryResolver,
} from './graphql/index.js';
import { collectionName, fahrradSchema } from './entity/index.js';
import { AuthModule } from '../security/auth/auth.module.js';
import { DbModule } from '../db/db.module.js';
import { MailModule } from '../mail/mail.module.js';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung von
 * Fahrrädern.
 * @packageDocumentation
 */

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für Mongoose.
 */
@Module({
    imports: [
        MailModule,
        MongooseModule.forFeature([
            {
                name: collectionName,
                schema: fahrradSchema,
                collection: collectionName,
            },
        ]),
        AuthModule,
        DbModule,
    ],
    controllers: [
        FahrradGetController,
        FahrradWriteController,
        FahrradFileController,
    ],
    //Provider sind z.B. Service Klassen für DI
    providers: [
        FahrradReadService,
        FahrradWriteService,
        FahrradFileService,
        FahrradValidationService,
        FahrradQueryResolver,
        FahrradMutationResolver,
    ],
    // Export der Provider für die DI in adneren Modulen
    exports: [
        FahrradReadService,
        FahrradWriteService,
        FahrradValidationService,
        FahrradFileService,
    ],
})
export class FahrradModule {}
