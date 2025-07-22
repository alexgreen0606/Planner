import { MotiView } from 'moti';
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

    // =======================
    // 1. Event Handler
    // =======================

    function handleOpenWeatherApp() {
        try {
            Linking.openURL('weather://');
        } catch (error) { }
    }

    // =======================
    // 2. UI
    // =======================

    // ------------- Current temperature layout -------------
    if (currentTemp !== undefined) {
        return (
            <TouchableOpacity activeOpacity={1} onPress={handleOpenWeatherApp}>
                <View className="flex-row gap-2 justify-between items-center">
                    <CustomText variant="standard">{Math.round(currentTemp)}°</CustomText>
                    <View className="mx-2">
                        <SFSymbol
                            name={weatherCodeToFontistoIcon(weatherCode)}
                            size={18}
                            multicolor
                            resizeMode="center"
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // ------------- High/low temperature layout -------------
    if (high !== undefined && low !== undefined) {
        return (
            <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    type: 'timing',
                    duration: 2000,
                }}
            >
                <TouchableOpacity activeOpacity={1} onPress={handleOpenWeatherApp}>
                    <View className="flex-row gap-1 items-center">
                        <CustomText variant="highTemp">{Math.round(high)}°</CustomText>
                        <View
                            style={{
                                width: StyleSheet.hairlineWidth,
                                height: '80%',
                                backgroundColor: PlatformColor('systemGray3'),
                            }}
                        />
                        <CustomText variant="lowTemp">{Math.round(low)}°</CustomText>
                        <View className="ml-4 mr-3">
                            <SFSymbol
                                name={weatherCodeToFontistoIcon(weatherCode)}
                                size={20}
                                multicolor
                                resizeMode="center"
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            </MotiView>
        );
    }

    // ------------- Fallback in case neither layout's requirements are met -------------
    return null;
};

export default WeatherDisplay;
