import { IconType } from "../ui/icons/GenericIcon";

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
    type: IconType,
    name: 'lightning' | 'day-sunny' | 'day-cloudy' | 'cloudy' | 'weather-fog' | 'day-rain' | 'rain' | 'snowflake-8'
  }
>;

export const weatherCodeToFontistoIcon = (code: number): WeatherIconMap[number] => {
  const weatherIconMap: WeatherIconMap = {
    0: { type: 'Fontisto', name: 'day-sunny' },
    1: { type: 'Fontisto', name: 'day-cloudy' },
    2: { type: 'Fontisto', name: 'day-cloudy' },
    3: { type: 'Fontisto', name: 'cloudy' },
    45: { type: 'MaterialCommunityIcons', name: 'weather-fog' },
    48: { type: 'MaterialCommunityIcons', name: 'weather-fog' },
    51: { type: 'Fontisto', name: 'day-rain' },
    53: { type: 'Fontisto', name: 'rain' },
    55: { type: 'Fontisto', name: 'rain' },
    61: { type: 'Fontisto', name: 'day-rain' },
    63: { type: 'Fontisto', name: 'rain' },
    65: { type: 'Fontisto', name: 'rain' },
    71: { type: 'Fontisto', name: 'snowflake-8' },
    73: { type: 'Fontisto', name: 'snowflake-8' },
    75: { type: 'Fontisto', name: 'snowflake-8' },
    77: { type: 'Fontisto', name: 'snowflake-8' },
    81: { type: 'Fontisto', name: 'day-rain' },
    82: { type: 'Fontisto', name: 'rain' },
    85: { type: 'Fontisto', name: 'rain' },
    86: { type: 'Fontisto', name: 'snowflake-8' },
    95: { type: 'Fontisto', name: 'lightning' },
  };

  return weatherIconMap[code] || weatherIconMap[0];
};

