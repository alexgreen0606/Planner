import Geolocation from "@react-native-community/geolocation";
import { WeatherForecast } from "./types";
import { fetchWeatherApi } from "openmeteo";

export const weatherCodeToString = (code: number): string => {
  const weatherMap: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grain',
    81: 'Slight rain showers',
    82: 'Moderate rain showers',
    85: 'Heavy rain showers',
    86: 'Slight snow showers',
    95: 'Thunderstorm',
  };

  return weatherMap[code] || 'Unknown weather';
};

type WeatherIconMap = Record<
  number,
  {
    name: any,
  }
>;

export const weatherCodeToFontistoIcon = (code: number): WeatherIconMap[number] => {
  switch (code) {
    case 0:
    case 1:
      return { name: 'sun.max.fill' }; // sunny
    case 2:
      return { name: 'cloud.sun.fill' }; // sunny with clouds
    case 3:
      return { name: 'cloud.fill' }; // cloudy
    case 45:
    case 48:
      return { name: 'cloud.fog.fill' }; // foggy
    case 51:
    case 61:
    case 81:
      return { name: 'cloud.sun.rain.fill' }; // rainy with sun
    case 53:
    case 55:
    case 63:
    case 65:
    case 82:
    case 85:
      return { name: 'cloud.rain.fill' }; // rain
    case 71:
    case 73:
    case 75:
    case 77:
    case 86:
      return { name: 'snowflake' }; // snow
    case 95:
      return { name: 'cloud.bolt.rain.fill' }; // thunderstorm
    default:
      throw new Error('Weather code not valid.')
  }
};

export const getWeather = async (timestamps: string[]): Promise<Record<string, WeatherForecast>> => {
  const forecast: Record<string, WeatherForecast> = {};

  // Properly typed wrapper for Geolocation.getCurrentPosition
  const getCurrentPosition = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        // @ts-ignore
        (position: GeolocationPosition) => resolve(position),
        (error: GeolocationPositionError) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });

  const info = await getCurrentPosition();

  const { latitude, longitude } = info.coords;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const params = {
    latitude,
    longitude,
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_probability_max"
    ],
    temperature_unit: "fahrenheit",
    precipitation_unit: "inch",
    timezone,
    start_date: timestamps[0],
    end_date: timestamps[timestamps.length - 1]
  };

  const url = "https://api.open-meteo.com/v1/forecast";

  const responses = await fetchWeatherApi(url, params);
  const response = responses[0];
  const daily = response.daily()!;

  // Ensure we have data for the requested date
  if (daily.time() < 0) {
    throw new Error('No weather data available for the requested date');
  }

  timestamps.forEach((timestamp, i) => {
    const formattedForecast: WeatherForecast = {
      date: timestamp,
      weatherCode: daily.variables(0)!.valuesArray()![i],
      weatherDescription: weatherCodeToString(daily.variables(0)!.valuesArray()![i]),
      temperatureMax: Math.floor(daily.variables(1)!.valuesArray()![i]),
      temperatureMin: Math.floor(daily.variables(2)!.valuesArray()![i]),
      precipitationSum: Number(daily.variables(3)!.valuesArray()![i].toFixed(2)),
      precipitationProbabilityMax: daily.variables(4)!.valuesArray()![i],
    };
    forecast[timestamp] = formattedForecast;
  })

  return forecast;
}