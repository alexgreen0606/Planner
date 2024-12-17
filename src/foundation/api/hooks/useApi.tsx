import { useState } from 'react';
import axios, { AxiosRequestConfig } from 'axios';

const apiMap = {
    backend: 'http://localhost:8000',
    weather: 'https://api.open-meteo.com/v1'
} as const;

type RequireFormatPayload<P = void, Req = void> =
    P extends Req
    ? undefined
    : (payload: P) => Req;

interface ApiHookConfig<P = void, Req = void, Res = any, D = Res> extends AxiosRequestConfig {
    formatPayload?: RequireFormatPayload<P, Req>;
    formatResponse?: (response: Res) => D;
    api: keyof typeof apiMap;
    endpoint: string;
}

interface ApiHookResult<P = void, Req = void, D = any> {
    loading: boolean;
    data: D | null;
    error: Error | null;
    callApi: (payload?: P | Req, customEndpoint?: string) => Promise<D | null>;
}

export function useApi<P = void, Req = P, Res = Req, D = Res>(
    config: ApiHookConfig<P, Req, Res, D>
): ApiHookResult<P, Req, D> {
    const { formatPayload, formatResponse, api, endpoint, ...axiosConfig } = config;
    const [data, setData] = useState<D | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const callApi = async (payload?: P | Req, customEndpoint?: string) => {
        setLoading(true);
        setError(null);
        let requestData: Req | P | undefined = payload;
        if (formatPayload && (payload !== undefined)) {
            requestData = formatPayload(payload as P);
        }

        const url = apiMap[api] + (customEndpoint || endpoint)
        return await axios({
            ...axiosConfig,
            data: requestData,
            url
        })
            .then(response => {
                const formattedData = formatResponse
                    ? formatResponse(response.data)
                    : (response.data as D);
                setData(formattedData);
                return formattedData;
            })
            .catch(err => {
                setError(err);
                throw err;
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return { data, error, callApi, loading };
}
