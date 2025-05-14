import React from 'react';
import { StyleSheet, View, TouchableOpacity, Linking, PlatformColor } from 'react-native';
import CustomText from '../../components/text/CustomText';
import { weatherCodeToFontistoIcon } from './utils';
import globalStyles from '../../theme/globalStyles';
import { SFSymbol } from 'react-native-sfsymbols';

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
                <View style={currentStyles.container}>
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
            <TouchableOpacity activeOpacity={1} onPress={openWeatherApp}>
                <View style={defaultStyles.container}>
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
        );
    }

    // Fallback in case neither layout's requirements are met
    return null;
};

// Default layout styles (high/low temperatures)
const defaultStyles = StyleSheet.create({
    container: {
        ...globalStyles.verticallyCentered,
        gap: 4,
        flexDirection: 'row',
    },
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
    container: {
        ...globalStyles.verticallyCentered,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    icon: {
        marginHorizontal: 8,
    }
});

export default WeatherDisplay;