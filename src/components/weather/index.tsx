import React from 'react';
import {
    Linking,
    PlatformColor,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SFSymbol } from 'react-native-sfsymbols';
import CustomText from '../text/CustomText';
import SlowFadeInView from '../SlowFadeInView';
import { getRandomWeatherChip } from '@/utils/weatherUtils';

// ✅ 

type WeatherDisplayProps = {
    high?: number;
    low?: number;
};

const WeatherDisplay = ({
    high = 79,
    low = 23,
}: WeatherDisplayProps) => {

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
                    <View className="mx-4">
                        <SFSymbol
                            name={getRandomWeatherChip().icon}
                            size={20}
                            multicolor
                            resizeMode="center"
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </SlowFadeInView>
    )
};

export default WeatherDisplay;
