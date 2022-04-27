/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { type Fahrrad } from '../../fahrrad/entity/index.js';
import { ObjectID } from 'bson';

// eslint-disable-next-line @typescript-eslint/naming-convention
type FahrradIdVersion = Fahrrad & { _id: ObjectID; __v: number };

/* eslint-disable @typescript-eslint/naming-convention */
export const testdaten: FahrradIdVersion[] = [
    // -------------------------------------------------------------------------
    // L e s e n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000001'),
        modell: 'Stereo 120',
        gewicht: 12.3,
        art: 'MOUNTAINBIKE',
        marke: 'Cube',
        preis: 2500,
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000002'),
        modell: 'Stereo 140',
        gewicht: 13.3,
        art: 'MOUNTAINBIKE',
        marke: 'Cube',
        preis: 3500,
        __v: 0,
    },
    {
        _id: new ObjectID('000000000000000000000003'),
        modell: 'Stereo 150',
        gewicht: 14.5,
        art: 'MOUNTAINBIKE',
        marke: 'Cube',
        preis: 5000,
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // A e n d e r n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000004'),
        modell: 'Trekking',
        gewicht: 17,
        art: 'TREKKINGRAD',
        marke: 'Ortler',
        preis: 1700,
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // L o e s c h e n
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000005'),
        modell: 'Endurace',
        gewicht: 8.5,
        art: 'RENNRAD',
        marke: 'Canyon',
        preis: 1300,
        __v: 0,
    },
    // -------------------------------------------------------------------------
    // z u r   f r e i e n   V e r f u e g u n g
    // -------------------------------------------------------------------------
    {
        _id: new ObjectID('000000000000000000000006'),
        modell: 'Ams',
        gewicht: 10,
        art: 'MOUNTAINBIKE',
        marke: 'Cube',
        preis: 4000,
        __v: 0,
    },
];
/* eslint-enable @typescript-eslint/naming-convention */
