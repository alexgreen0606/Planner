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
    77: 'Snow grains',
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
  'lightning' | 'day-showers' | 'day-sunny' | 'day-cloudy' | 'cloudy' | 'fog' | 'day-rain' | 'rain' | 'snowflake-8' | 'day-snow'
>;

export const weatherCodeToFontistoIcon = (code: number): WeatherIconMap[number] => {
  const weatherIconMap: WeatherIconMap = {
    0: 'day-sunny',
    1: 'day-cloudy',
    2: 'day-cloudy',
    3: 'cloudy',
    45: 'fog',
    48: 'fog',
    51: 'day-rain',
    53: 'rain',
    55: 'rain',
    61: 'day-rain',
    63: 'rain',
    65: 'rain',
    71: 'day-snow',
    73: 'snowflake-8',
    75: 'snowflake-8',
    77: 'snowflake-8',
    81: 'day-showers',
    82: 'rain',
    85: 'rain',
    86: 'day-snow',
    95: 'lightning',
  };

  return weatherIconMap[code] || weatherIconMap[0];
};

