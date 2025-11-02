import { TPlannerChip } from "@/lib/types/planner/TPlannerChip";
import { jotaiStore } from "app/_layout";
import { Linking } from "react-native";
import { getTodayDatestamp } from "./dateUtils";
import { setWeatherDataForDatestampAtom } from "@/atoms/weatherAtoms";
import { TWeatherData } from "@/lib/types/externalData/TWeatherData";

const weatherIconMap: Record<
  string,
  { icon: string }
> = {
  clear: {
    icon: "sun.max.fill",
  },
  mostlyClear: {
    icon: "sun.max.fill",
  },
  partlyCloudy: {
    icon: "cloud.sun.fill",
  },
  mostlyCloudy: {
    icon: "cloud.fill",
  },
  cloudy: {
    icon: "smoke.fill",
  },
  foggy: {
    icon: "cloud.fog.fill",
  },
  haze: {
    icon: "sun.haze.fill",
  },
  rain: {
    icon: "cloud.rain.fill",
  },
  heavyRain: {
    icon: "cloud.heavyrain.fill",
  },
  thunderstorms: {
    icon: "cloud.bolt.rain.fill",
  },
  drizzle: {
    icon: "cloud.drizzle.fill",
  },
  snow: {
    icon: "cloud.snow.fill",
  },
  heavySnow: {
    icon: "snowflake",
  },
  sleet: {
    icon: "cloud.sleet.fill",
  },
  hail: {
    icon: "cloud.hail.fill",
  },
  wind: {
    icon: "wind",
  },
  hot: {
    icon: "sun.max.trianglebadge.exclamationmark.fill",
  },
  cold: {
    icon: "thermometer.snowflake",
  },
  tornado: {
    icon: "tornado",
  },
  hurricane: {
    icon: "hurricane",
  },
};


async function saveWeatherDataToStore(datestamp: string, data: TWeatherData) {
  jotaiStore.set(setWeatherDataForDatestampAtom, { datestamp, data });
}

export async function loadWeatherToStore(datestamp: string) {

  // TODO: add in verification to weather app being openable
  // TODO: get actual weather here

  const newData: TWeatherData = {
    datestamp,
    symbol: "cloud.sun.fill",
    high: 72,
    low: 56,
    condition: 'Partly Cloudy'
  };

  saveWeatherDataToStore(datestamp, newData);
}
