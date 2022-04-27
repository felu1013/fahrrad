/**
 * Das Modul besteht aus der Klasse {@linkcode FahrradValidationService}
 * @packageDocumentation
 */

import Ajv2020 from 'ajv/dist/2020.js';
import { type Fahrrad } from '../entity/index.js';
import { type FormatValidator } from 'ajv/dist/types';
import { Injectable } from '@nestjs/common';
import ajvErrors from 'ajv-errors';
import formatsPlugin from 'ajv-formats';
import { getLogger } from '../../logger/index.js';
import { jsonSchema } from './jsonSchema.js';

@Injectable()
export class FahrradValidationService {
    #ajv = new Ajv2020({
        allowUnionTypes: true,
        allErrors: true,
    });

    readonly #logger = getLogger(FahrradValidationService.name);

    constructor() {
        // https://github.com/ajv-validator/ajv-formats#formats
        formatsPlugin(this.#ajv, ['date', 'email', 'uri']);
        ajvErrors(this.#ajv);
        this.#ajv.addFormat('MODELL', {
            type: 'string',
            validate: this.#validateModell,
        });
    }

    #checkChars(chars: string[]) {
        /* eslint-disable @typescript-eslint/no-magic-numbers, unicorn/no-for-loop, security/detect-object-injection */
        let sum = 0;
        let check: number | string;

        if (chars.length === 9) {
            chars.reverse();
            for (let i = 0; i < chars.length; i++) {
                sum += (i + 2) * Number.parseInt(chars[i] ?? '', 10);
            }
            check = 11 - (sum % 11); // eslint-disable-line @typescript-eslint/no-extra-parens
            if (check === 10) {
                check = 'X';
            } else if (check === 11) {
                check = '0';
            }
        } else {
            for (let i = 0; i < chars.length; i++) {
                sum += ((i % 2) * 2 + 1) * Number.parseInt(chars[i] ?? '', 10); // eslint-disable-line @typescript-eslint/no-extra-parens
            }
            check = 10 - (sum % 10); // eslint-disable-line @typescript-eslint/no-extra-parens
            if (check === 10) {
                check = '0';
            }
        }
        return check;
        /* eslint-enable @typescript-eslint/no-magic-numbers, unicorn/no-for-loop, security/detect-object-injection */
    }

    // https://github.com/ajv-validator/ajv-formats/issues/14#issuecomment-826340298
    #validateModell: FormatValidator<string> = (subject: string) => {
        // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
        /* eslint-disable max-len, unicorn/no-unsafe-regex, security/detect-unsafe-regex, regexp/no-super-linear-backtracking */
        const regex =
            /^(?:Modell(?:-1[03])?:? )?(?=[\dX]{10}$|(?=(?:\d+[- ]){3})[- \dX]{13}$|97[89]\d{10}$|(?=(?:\d+[- ]){4})[- \d]{17}$)(?:97[89][- ]?)?\d{1,5}[- ]?\d+[- ]?\d+[- ]?[\dX]$/u; //NOSONAR
        /* eslint-enable max-len, unicorn/no-unsafe-regex, security/detect-unsafe-regex, regexp/no-super-linear-backtracking */
        if (regex.test(subject)) {
            const chars = subject
                .replace(/[ -]|^Modell(?:-1[03])?:?/gu, '')
                .split(''); // eslint-disable-line unicorn/prefer-spread

            const last = chars.pop();

            const check = this.#checkChars(chars);

            // eslint-disable-next-line eqeqeq
            if (check == last) {
                return true;
            }
        }
        return false;
    };

    /**
     * Funktion zur Validierung, wenn neue Fahrräder angelegt oder vorhandene Fahrräder
     * aktualisiert bzw. überschrieben werden sollen
     */
    validate(fahrrad: Fahrrad) {
        const validate = this.#ajv.compile<Fahrrad>(jsonSchema);
        validate(fahrrad);
        // nullish coalescing
        const errors = validate.errors ?? [];
        const messages = errors
            .map((error) => error.message)
            .filter((msg) => msg !== undefined);
        this.#logger.debug(
            'validate: errors=%o, messages=%o',
            errors,
            messages,
        );
        return messages as string[];
    }
}
