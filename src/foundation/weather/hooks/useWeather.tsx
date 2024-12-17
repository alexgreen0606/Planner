import { useState, useEffect } from 'react';
import { fetchWeatherApi } from 'openmeteo';
import { WeatherForecast } from '../types';
import { weatherCodeToString } from '../utils';

interface UseWeatherReturn {
    forecast: WeatherForecast | null;
    loading: boolean;
    error: string | null;
}

const useWeather = (date: string): UseWeatherReturn => {
    const [forecast, setForecast] = useState<WeatherForecast | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWeatherData = async () => {
            try {
                const params = {
                    latitude: 43.0731,
                    longitude: -89.4012,
                    daily: [
                        "weather_code",
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "precipitation_sum",
                        "precipitation_probability_max"
                    ],
                    temperature_unit: "fahrenheit",
                    precipitation_unit: "inch",
                    timezone: "America/Chicago",
                    start_date: date,
                    end_date: date
                };

                const url = "https://api.open-meteo.com/v1/forecast";
                
                const responses = await fetchWeatherApi(url, params);
                

                // Process first location
                const response = responses[0];
                const utcOffsetSeconds = response.utcOffsetSeconds();
                const daily = response.daily()!;

                // Ensure we have data for the requested date
                if (daily.time() < 0) {
                    setError('No weather data available for the requested date');
                    return;
                }

                const formattedForecast: WeatherForecast = {
                    date: new Date((Number(daily.time()) + utcOffsetSeconds) * 1000).toISOString().split('T')[0],
                    weatherCode: daily.variables(0)!.valuesArray()![0],
                    weatherDescription: weatherCodeToString(daily.variables(0)!.valuesArray()![0]),
                    temperatureMax: Math.floor(daily.variables(1)!.valuesArray()![0]),
                    temperatureMin: Math.floor(daily.variables(2)!.valuesArray()![0]),
                    precipitationSum: Number(daily.variables(3)!.valuesArray()![0].toFixed(2)),
                    precipitationProbabilityMax: daily.variables(4)!.valuesArray()![0],
                };

                setForecast(formattedForecast);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchWeatherData();
    }, []);

    return {
        forecast,
        loading,
        error,
    };
};

export default useWeather;
