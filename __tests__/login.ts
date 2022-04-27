import { type AxiosInstance, type AxiosResponse } from 'axios';
import { type GraphQLRequest, type GraphQLResponse } from 'apollo-server-types';
import { httpsAgent, loginPath } from './testserver.js';
import { type LoginResult } from '../src/security/auth/service/index.js';
import dotenv from 'dotenv';

const usernameDefault = 'admin';

dotenv.config();
const { env } = process;
const { USER_PASSWORD } = env;
const passwordDefault = USER_PASSWORD!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

export const loginRest = async (
    axiosInstance: AxiosInstance,
    username = usernameDefault,
    password = passwordDefault,
) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const response: AxiosResponse<LoginResult> = await axiosInstance.post(
        loginPath,
        `username=${username}&password=${password}`,
        { headers, httpsAgent },
    );
    return response.data.token;
};

export const loginGraphQL = async (
    axiosInstance: AxiosInstance,
    username: string = usernameDefault,
    password: string = passwordDefault,
): Promise<string> => {
    const body: GraphQLRequest = {
        query: `
            mutation {
                login(
                    username: "${username}",
                    password: "${password}"
                ) {
                    token
                }
            }
        `,
    };

    const response: AxiosResponse<GraphQLResponse> = await axiosInstance.post(
        'graphql',
        body,
        { httpsAgent },
    );

    const data = response.data.data!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    return data.login.token; // eslint-disable-line @typescript-eslint/no-unsafe-return
};
