import { TPlannerChip } from "@/lib/types/planner/TPlannerChip";
import { jotaiStore } from "app/_layout";
import { Linking } from "react-native";
import { getTodayDatestamp } from "./dateUtils";
import { currentWeatherChipAtom } from "@/atoms/currentWeatherChip";

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

/**
 * Merges the current weather data with the current external planner data and sets it in the Jotai store.
 * 
 * @param newChip - The chip representing the current weather.
 */
async function saveWeatherDataToStore(newChip: TPlannerChip) {
  jotaiStore.set(currentWeatherChipAtom, newChip);
}

// TODO: remove this once implemented
export function getRandomWeatherChip(): { icon: string } {
  const values = Object.values(weatherIconMap);
  return values[Math.floor(Math.random() * values.length)];
}

export async function loadCurrentWeatherToStore() {

  const canOpenWeatherApp = true;

  const openWeatherApp = () => {
    try {
      Linking.openURL('weather://');
    } catch (error) { }
  };

  // TODO: add in verification to weather app being openable

  // TODO: get actual weather here
  const randomWeather = getRandomWeatherChip();

  const todayDatestamp = getTodayDatestamp();

  const newChip = {
    id: `${todayDatestamp}-weather-chip`,
    title: " Madison  64°",
    iconConfig: {
      name: randomWeather.icon,
      multicolor: true
    },
    onClick: openWeatherApp,
    hasClickAccess: canOpenWeatherApp,
    color: 'secondaryLabel',
  };

  saveWeatherDataToStore(newChip);
}
