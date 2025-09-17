import React from 'react';
import {
    Linking,
    PlatformColor,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import CustomText from '../text/CustomText';
import SlowFadeInView from '../SlowFadeInView';
import { getRandomWeatherChip } from '@/utils/weatherUtils';
import useAppTheme from '@/hooks/useAppTheme';
import { SymbolView } from 'expo-symbols';

// ✅ 

type WeatherDisplayProps = {
    high?: number;
    low?: number;
};

const WeatherDisplay = ({
    high = 79,
    low = 23,
}: WeatherDisplayProps) => {

    const { weatherBackground } = useAppTheme();

    function handleOpenWeatherApp() {
        try {
            Linking.openURL('weather://');
        } catch (error) { }
    }

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
                    <View className="px-4 w-10 h-10 rounded-3xl items-center justify-center" style={{
                        backgroundColor: weatherBackground
                    }}>
                        <SymbolView
                            type='multicolor'
                            // @ts-ignore
                            name={getRandomWeatherChip().icon}
                            size={20}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </SlowFadeInView>
    )
};

export default WeatherDisplay;
