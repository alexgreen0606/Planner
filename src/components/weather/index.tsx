import React from 'react';
import {
    Linking,
    PlatformColor,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import { weatherCodeToFontistoIcon } from '../../utils/weatherUtils';
import CustomText from '../text/CustomText';
import SlowFadeInView from '../SlowFadeInView';

// ✅ 

type WeatherDisplayProps = {
    weatherCode: number;
    high?: number;
    low?: number;
    currentTemp?: number;
};

const WeatherDisplay = ({
    weatherCode,
    high,
    low,
    currentTemp,
}: WeatherDisplayProps) => {

    function handleOpenWeatherApp() {
        try {
            Linking.openURL('weather://');
        } catch (error) { }
    }

    // ------------- Current Temperature Layout -------------
    if (currentTemp !== undefined) {
        return (
            <SlowFadeInView>
                <TouchableOpacity activeOpacity={1} onPress={handleOpenWeatherApp}>
                    <View className="flex-row gap-2 justify-between items-center">
                        <CustomText variant="currentTemp">{Math.round(currentTemp)}°</CustomText>
                        <View className="mx-4">
                            <SFSymbol
                                name={weatherCodeToFontistoIcon(weatherCode)}
                                size={24}
                                multicolor
                                resizeMode="center"
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            </SlowFadeInView>
        );
    }

    // ------------- High/Low Temperature Layout -------------
    if (high !== undefined && low !== undefined) {
        return (
            <SlowFadeInView>
                <TouchableOpacity activeOpacity={1} onPress={handleOpenWeatherApp}>
                    <View className="flex-row gap-1.5 items-center">
                        <CustomText variant="highTemp">{Math.round(high)}°</CustomText>
                        <View
                            className='h-full'
                            style={{
                                width: StyleSheet.hairlineWidth,
                                backgroundColor: PlatformColor('systemGray')
                            }}
                        />
                        <CustomText variant="lowTemp">{Math.round(low)}°</CustomText>
                        <View className="mx-4">
                            <SFSymbol
                                name={weatherCodeToFontistoIcon(weatherCode)}
                                size={20}
                                multicolor
                                resizeMode="center"
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            </SlowFadeInView>
        );
    }

    // ------------- Fallback in case neither layout's requirements are met -------------
    return null;
};

export default WeatherDisplay;
