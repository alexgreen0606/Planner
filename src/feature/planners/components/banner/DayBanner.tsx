import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { weatherCodeToFontistoIcon } from '../../../../foundation/weather/utils';
import { timestampToDayOfWeek, timestampToMonthDate } from '../../utils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import colors from '../../../../foundation/theme/colors';
import AppleIcon from '../../../../foundation/ui/icons/AppleIcon';
import { WeatherForecast } from '../../../../foundation/weather/types';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
    forecast: WeatherForecast;
}

const DayBanner = ({ timestamp, forecast }: DayBannerProps) => {

    return (
        <View style={{ ...globalStyles.spacedApart }}>

            {/* Date */}
            <View style={styles.dayContainer}>
                <Text style={styles.dayOfWeek}>{timestampToDayOfWeek(timestamp)}</Text>
                <Text style={styles.date}>{timestampToMonthDate(timestamp)}</Text>
            </View>

            {/* Weather */}
            <View style={styles.weatherContainer}>
                <Text style={styles.highTemp}>{Math.round(forecast.temperatureMax)}°</Text>
                <View style={styles.divider} />
                <Text style={styles.lowTemp}>{Math.round(forecast.temperatureMin)}°</Text>
                <View
                    style={{ marginLeft: 32 }}
                >
                    <AppleIcon
                        config={{
                            ...weatherCodeToFontistoIcon(forecast.weatherCode),
                            size: 20
                        }}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    dayContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    dayOfWeek: {
        fontSize: 22,
        color: colors.white
    },
    date: {
        fontSize: 12.5,
        color: colors.blue,
        marginLeft: 5,
        marginBottom: 2,
    },
    weatherContainer: {
        ...globalStyles.verticallyCentered,
        height: '100%'
    },
    highTemp: {
        fontSize: 18,
        color: colors.white,
    },
    divider: {
        width: StyleSheet.hairlineWidth,
        height: '80%',
        backgroundColor: colors.grey,
        marginHorizontal: 4,
    },
    lowTemp: {
        fontSize: 14,
        color: colors.grey,
    },
});

export default DayBanner;