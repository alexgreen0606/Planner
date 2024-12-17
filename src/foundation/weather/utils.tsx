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