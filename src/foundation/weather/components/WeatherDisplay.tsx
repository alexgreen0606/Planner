import React from 'react';
import { StyleSheet, View } from 'react-native';
import CustomText from '../../components/text/CustomText';
import { weatherCodeToFontistoIcon } from '../utils';
import globalStyles from '../../theme/globalStyles';
import { SFSymbol } from 'react-native-sfsymbols';
import { Color } from '../../theme/colors';

interface WeatherDisplayProps {
    weatherCode: number;
    high: number;
    low: number;
}

const WeatherDisplay = ({ weatherCode, high, low }: WeatherDisplayProps) =>
    <View style={styles.weatherContainer}>
        <CustomText type='highTemp'>{Math.round(high)}°</CustomText>
        <View style={styles.divider} />
        <CustomText type='lowTemp'>{Math.round(low)}°</CustomText>
        <View style={styles.icon}>
            <SFSymbol
                name={weatherCodeToFontistoIcon(weatherCode)}
                size={20}
                multicolor
                resizeMode='center'
            />
        </View>
    </View>

const styles = StyleSheet.create({
    weatherContainer: {
        ...globalStyles.verticallyCentered,
        gap: 4,
        height: '100%'
    },
    divider: {
        width: StyleSheet.hairlineWidth,
        height: '80%',
        backgroundColor: Color.DIM,
    },
    icon: {
        marginLeft: 16,
        marginRight: 12
    }
});

export default WeatherDisplay;
