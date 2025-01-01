import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useWeather from '../../../foundation/weather/hooks/useWeather';
import { weatherCodeToFontistoIcon } from '../../../foundation/weather/utils';
import { timestampToDayOfWeek, timestampToMonthDate } from '../utils';
import globalStyles from '../../../theme/globalStyles';
import GenericIcon from '../../../foundation/ui/icons/GenericIcon';
import colors from '../../../theme/colors';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
}

const DayBanner = ({ timestamp }: DayBannerProps) => {
    const { forecast, loading } = useWeather(timestamp);

    return (
        <View style={{...globalStyles.spacedApart, paddingHorizontal: 16, paddingTop: 8 }}>

            {/* Date */}
            <View style={styles.dayContainer}>
                <Text style={styles.dayOfWeek}>{timestampToDayOfWeek(timestamp)}</Text>
                <Text style={styles.date}>{timestampToMonthDate(timestamp)}</Text>
            </View>

            {/* Weather */}
            {!loading && forecast && (
                <View style={styles.weatherContainer}>
                    <Text style={styles.highTemp}>{Math.round(forecast.temperatureMax)}°</Text>
                    <View style={styles.divider} />
                    <Text style={styles.lowTemp}>{Math.round(forecast.temperatureMin)}°</Text>
                    <View
                        style={{ marginLeft: 8 }}
                    >
                        <GenericIcon
                            type={weatherCodeToFontistoIcon(forecast.weatherCode).type}
                            name={weatherCodeToFontistoIcon(forecast.weatherCode).name}
                            size={18}
                            color={weatherCodeToFontistoIcon(forecast.weatherCode).color}
                        />
                    </View>
                </View>
            )}
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