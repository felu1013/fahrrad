export type {
    FahrradDTO,
    FahrraederDTO,
} from '../src/fahrrad/rest/fahrrad-get.controller';
export type { Fahrrad } from '../src/fahrrad/entity/index.js';
export type { FahrradDTO as FahrradDTOGraphQL } from '../src/fahrrad/graphql/fahrrad-query.resolver.js';
export { MAX_GEWICHT, MAX_PREIS } from '../src/fahrrad/service/index.js';
export { loginGraphQL, loginRest } from './login.js';
export {
    apiPath,
    createTestserver,
    host,
    httpsAgent,
    loginPath,
    port,
    shutdownTestserver,
} from './testserver.js';
