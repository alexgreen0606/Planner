import { SFSymbol } from 'expo-symbols';

// ✅

export type TWeatherData = {
  datestamp: string;
  condition: string;
  high: number;
  low: number;
  symbol: SFSymbol;
};
