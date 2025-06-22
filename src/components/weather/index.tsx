import React from 'react';
import { StyleSheet, View, TouchableOpacity, Linking, PlatformColor } from 'react-native';
import CustomText from '../text/CustomText';
import { weatherCodeToFontistoIcon } from '../../utils/weatherUtils';
import { SFSymbol } from 'react-native-sfsymbols';
import { MotiView } from 'moti';

interface WeatherDisplayProps {
    weatherCode: number;
    high?: number;
    low?: number;
    currentTemp?: number;
}

const WeatherDisplay = ({
    weatherCode,
    high,
    low,
    currentTemp
}: WeatherDisplayProps) => {

    const openWeatherApp = () => {
        try {
            Linking.openURL('weather://');
        } catch (error) { }
    };

    // Current temperature layout
    if (currentTemp !== undefined) {
        return (
            <TouchableOpacity activeOpacity={1} onPress={openWeatherApp}>
                <View className='flex-row gap-2 justify-between items-center'>
                    <CustomText type='header'>{Math.round(currentTemp)}°</CustomText>
                    <View style={currentStyles.icon}>
                        <SFSymbol
                            name={weatherCodeToFontistoIcon(weatherCode)}
                            size={18}
                            multicolor
                            resizeMode='center'
                        />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // High/low temperature layout
    if (high !== undefined && low !== undefined) {
        return (
            <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    type: 'timing',
                    duration: 2000
                }}
            >
                <TouchableOpacity activeOpacity={1} onPress={openWeatherApp}>
                    <View className='flex-row gap-1 items-center'>
                        <CustomText type='highTemp'>{Math.round(high)}°</CustomText>
                        <View style={defaultStyles.divider} />
                        <CustomText type='lowTemp'>{Math.round(low)}°</CustomText>
                        <View style={defaultStyles.icon}>
                            <SFSymbol
                                name={weatherCodeToFontistoIcon(weatherCode)}
                                size={20}
                                multicolor
                                resizeMode='center'
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            </MotiView>
        );
    }

    // Fallback in case neither layout's requirements are met
    return null;
};

// Default layout styles (high/low temperatures)
const defaultStyles = StyleSheet.create({
    divider: {
        width: StyleSheet.hairlineWidth,
        height: '80%',
        backgroundColor: PlatformColor('systemGray3'),
    },
    icon: {
        marginLeft: 16,
        marginRight: 12
    }
});

// Current temperature layout styles
const currentStyles = StyleSheet.create({
    icon: {
        marginHorizontal: 8,
    }
});

export default WeatherDisplay;