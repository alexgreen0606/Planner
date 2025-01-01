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
    name: 'lightning' | 'day-sunny' | 'day-cloudy' | 'cloudy' | 'weather-fog' | 'day-rain' | 'rain' | 'snowflake-8',
    color: string;
  }
>;

const weatherColors = {
  grey: 'rgb(210,210,200)',
  white: 'rgb(160, 200, 240)',
  yellow: 'rgb(250, 220, 120)',
  blue: 'rgb(90, 190, 220)'
};

export const weatherCodeToFontistoIcon = (code: number): WeatherIconMap[number] => {
  const weatherIconMap: WeatherIconMap = {
    0: { type: 'Fontisto', name: 'day-sunny', color: weatherColors.yellow },
    1: { type: 'Fontisto', name: 'day-cloudy', color: weatherColors.yellow },
    2: { type: 'Fontisto', name: 'day-cloudy', color: weatherColors.yellow },
    3: { type: 'Fontisto', name: 'cloudy', color: weatherColors.grey },
    45: { type: 'MaterialCommunityIcons', name: 'weather-fog', color: weatherColors.grey },
    48: { type: 'MaterialCommunityIcons', name: 'weather-fog', color: weatherColors.grey },
    51: { type: 'Fontisto', name: 'day-rain', color: weatherColors.blue },
    53: { type: 'Fontisto', name: 'rain', color: weatherColors.blue },
    55: { type: 'Fontisto', name: 'rain', color: weatherColors.blue },
    61: { type: 'Fontisto', name: 'day-rain', color: weatherColors.blue },
    63: { type: 'Fontisto', name: 'rain', color: weatherColors.blue },
    65: { type: 'Fontisto', name: 'rain', color: weatherColors.blue },
    71: { type: 'Fontisto', name: 'snowflake-8', color: weatherColors.white },
    73: { type: 'Fontisto', name: 'snowflake-8', color: weatherColors.white },
    75: { type: 'Fontisto', name: 'snowflake-8', color: weatherColors.white },
    77: { type: 'Fontisto', name: 'snowflake-8', color: weatherColors.white },
    81: { type: 'Fontisto', name: 'day-rain', color: weatherColors.blue },
    82: { type: 'Fontisto', name: 'rain', color: weatherColors.blue },
    85: { type: 'Fontisto', name: 'rain', color: weatherColors.blue },
    86: { type: 'Fontisto', name: 'snowflake-8', color: weatherColors.white },
    95: { type: 'Fontisto', name: 'lightning', color: weatherColors.yellow },
  };

  return weatherIconMap[code] || weatherIconMap[0];
};

