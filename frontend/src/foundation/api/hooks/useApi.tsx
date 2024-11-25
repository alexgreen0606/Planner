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
    fetchData: (payload?: P | Req) => Promise<D | null>;
}

export function useApi<P = void, Req = P, Res = Req, D = Res>(
    config: ApiHookConfig<P, Req, Res, D>
): ApiHookResult<P, Req, D> {
    const { formatPayload, formatResponse, api, endpoint, ...axiosConfig } = config;
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<D | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async (payload?: P | Req) => {
        setLoading(true);
        let requestData: Req | P | undefined = payload;
        if (formatPayload && (payload !== undefined)) {
            requestData = formatPayload(payload as P);
        }

        try {
            const url = apiMap[api] + endpoint
            const payloadNew = { ...axiosConfig, data: requestData, url }
            const response = await axios(payloadNew);
            const formattedData = formatResponse
                ? formatResponse(response.data)
                : (response.data as D);
            setData(formattedData);
            return formattedData;
        } catch (err) {
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { loading, data, error, fetchData };
}
