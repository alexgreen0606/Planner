import { jotaiStore } from 'app/_layout'

import { setWeatherForDatestampAtom } from '@/atoms/weatherAtoms'
import { TWeatherData } from '@/lib/types/externalData/TWeatherData'

async function saveWeatherDataToStore(datestamp: string, data: TWeatherData) {
  jotaiStore.set(setWeatherForDatestampAtom, { datestamp, data })
}

export async function loadWeatherToStore(datestamp: string) {
  // TODO: add in verification to weather app being openable
  // TODO: get actual weather here

  const newData: TWeatherData = {
    datestamp,
    symbol: 'cloud.sun.fill',
    high: 72,
    low: 56,
    condition: 'Partly Cloudy',
  }

  saveWeatherDataToStore(datestamp, newData)
}
