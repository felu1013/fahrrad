/**
 * Das Modul besteht aus dem Schema für _Mongoose_.
 * @packageDocumentation
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { type ObjectID } from 'bson';
import { dbConfig } from '../../config/index.js';
import mongoose from 'mongoose';

/**
 * Alias-Typ für gültige Strings bei Arten.
 */
export type FahrradArt = 'MOUNTAINBIKE' | 'RENNRAD' | 'TREKKINGRAD';

mongoose.SchemaType.set('debug', true);

// Mongoose ist von Valeri Karpov, der auch den Begriff "MEAN-Stack" gepraegt hat:
// http://thecodebarbarian.com/2013/04/29//easy-web-prototyping-with-mongodb-and-nodejs

/**
 * Document-Klasse für _Mongoose_
 */

const MONGOOSE_OPTIONS: mongoose.SchemaOptions = {
    //createdAt und updatedAt als automatisch gepflegte Felder
    timestamps: true,

    // http://thecodebarbarian.com/whats-new-in-mongoose-5-10-optimistic-concurrency.html
    optimisticConcurrency: true,

    // sequentielle Aufrufe von createIndex() beim Starten der Anwendung
    autoIndex: dbConfig.autoIndex,
};

// Ein Schema in Mongoose definiert die Struktur und Methoden fuer die
// Dokumente in einer Collection, die aus Dokumenten im BSON-Format besteht.
// Ein Property im Schema definiert eine Property fuer jedes Dokument.
// Ein Schematyp (String, Number, Boolean, Date, Array, ObjectId) legt den Typ
// der Property fest.
// https://mongoosejs.com/docs/schematypes.html

/**
 * Das Schema für Mongoose, das dem Schema bei einem relationalen DB-System
 * entspricht, welches durch `CREATE TABLE`, `CREATE INDEX` usw. entsteht.
 */

@Schema(MONGOOSE_OPTIONS)
export class Fahrrad {
    @Prop({ type: String, required: true, unique: true })
    @ApiProperty({ example: 'Das Modell', type: String })
    readonly modell: string | null | undefined;

    @Prop({ type: Number, min: 0, max: 50 })
    @ApiProperty({ example: 13.3, type: Number })
    readonly gewicht: number | null | undefined;

    @Prop({ type: String, enum: ['MOUNTAINBIKE', 'RENNRAD', 'TREKKINGRAD'] })
    @ApiProperty({ example: 'Mountainbike', type: String })
    readonly art: FahrradArt | '' | null | undefined;

    @Prop({ type: String, required: true })
    @ApiProperty({ example: 'Cube', type: String })
    readonly marke: string | null | undefined;

    @Prop({ type: Number, required: true })
    @ApiProperty({ example: 2000, type: Number })
    readonly preis: number | undefined;
}

//Optimistische Synchronisation durch das Feld __v für die Versionsnummer
const optimistic = (schema: mongoose.Schema<mongoose.Document<Fahrrad>>) => {
    schema.pre<
        mongoose.Query<mongoose.Document<Fahrrad>, mongoose.Document<Fahrrad>>
    >('findOneAndUpdate', function () {
        const update = this.getUpdate(); // eslint-disable-line @typescript-eslint/no-invalid-this
        if (update === null) {
            return;
        }

        const updateDoc = update as mongoose.Document<Fahrrad>;
        if (updateDoc.__v !== null) {
            delete updateDoc.__v;
        }

        for (const key of ['$set', '$setOnInsert']) {
            /* eslint-disable security/detect-object-injection */
            // @ts-expect-error siehe https://mongoosejs.com/docs/guide.html#versionKey
            const updateKey = update[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
            // Optional Chaining
            if (updateKey?.__v !== null) {
                delete updateKey.__v;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                if (Object.entries(updateKey).length === 0) {
                    // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
                    delete update[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
                }
            }
            /* eslint-enable security/detect-object-injection */
        }
        // @ts-expect-error $inc ist in _UpdateQuery<TSchema> enthalten
        update.$inc = update.$inc || {}; // eslint-disable-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment
        // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
        update.$inc.__v = 1;
    });
};

//Schema ppassend zur Entity Klasse erzeugen
export const fahrradSchema = SchemaFactory.createForClass(Fahrrad);

//Indexe anlegen (max. 3 bei Atlas)
//hier: aufsteigend (1) sowie "unique"
fahrradSchema.index({ modell: 1 }, { unique: true, name: 'modell' });
fahrradSchema.index({ marke: 1 }, { name: 'marke' });

// Document: _id? (vom Type ObjectID) und __v? als Properties
export type FahrradDocument = Fahrrad &
    mongoose.Document<ObjectID, any, Fahrrad> & { _id: ObjectID; __v: number }; // eslint-disable-line @typescript-eslint/naming-convention
fahrradSchema.plugin(optimistic);

export const modelName = 'Fahrrad';
export const collectionName = modelName;

export const exactFilterProperties = ['art', 'marke', 'preis', 'gewicht'];
