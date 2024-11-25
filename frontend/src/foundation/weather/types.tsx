export interface WeatherForecast {
  date: string;
  weatherCode: number;
  weatherDescription: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
}

export interface ForecastResponse {
  daily: {
    time: Date[];
    weatherCode: number[];
    temperature2mMax: number[];
    temperature2mMin: number[];
    precipitationSum: number[];
    precipitationProbabilityMax: number[];
  };
}