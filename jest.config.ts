// https://jestjs.io/docs/configuration
// https://kulshekhar.github.io/ts-jest/docs/guides/esm-support
// https://github.com/BenSjoberg/nest-esm-import-issue-example

import { type Config } from '@jest/types';

const jestConfig: Config.InitialOptions = {
    // Verzeichnis in node_modules mit einer Datei jest-preset.js
    preset: 'ts-jest',

    extensionsToTreatAsEsm: ['.ts', '.json'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1', // eslint-disable-line @typescript-eslint/naming-convention
    },
    // transform: {
    //     '^.+\\.(t|j)s$': 'ts-jest', // eslint-disable-line @typescript-eslint/naming-convention
    // },

    testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
    collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
    // coverageDirectory: 'coverage',
    testEnvironment: 'node',

    bail: true,
    coveragePathIgnorePatterns: [
        '<rootDir>/src/main.ts',
        '.*\\.module\\.ts$',
        '<rootDir>/src/health/',
    ],
    coverageReporters: ['text-summary', 'html'],
    errorOnDeprecated: true,
    testTimeout: 10_000,
    verbose: true,
};

export default jestConfig;
