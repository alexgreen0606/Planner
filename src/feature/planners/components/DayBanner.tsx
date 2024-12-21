import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import useWeather from '../../../foundation/weather/hooks/useWeather';
import { Fontisto } from '@expo/vector-icons';
import { weatherCodeToFontistoIcon } from '../../../foundation/weather/utils';
import { timestampToDayOfWeek, timestampToMonthDate } from '../utils';
import globalStyles from '../../../theme/globalStyles';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
}

const DayBanner = ({ timestamp }: DayBannerProps) => {
    const { colors } = useTheme();
    const { forecast, loading } = useWeather(timestamp);

    const styles = StyleSheet.create({
        dayContainer: {
            flexDirection: 'row',
            alignItems: 'flex-end',
        },
        dayOfWeek: {
            fontSize: 22,
            color: colors.primary,
        },
        date: {
            fontSize: 12.5,
            color: colors.outline,
            marginLeft: 5,
            marginBottom: 2,
        },
        weatherContainer: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        highTemp: {
            fontSize: 18,
            color: colors.primary,
        },
        divider: {
            width: StyleSheet.hairlineWidth,
            height: '80%',
            backgroundColor: colors.outline,
            marginHorizontal: 4,
        },
        lowTemp: {
            fontSize: 12,
            color: colors.primary,
        },
    });

    return (
        <View style={globalStyles.spacedApart}>
            <View style={styles.dayContainer}>
                <Text style={styles.dayOfWeek}>{timestampToDayOfWeek(timestamp)}</Text>
                <Text style={styles.date}>{timestampToMonthDate(timestamp)}</Text>
            </View>
            {!loading && forecast && (
                <View style={styles.weatherContainer}>
                    <Text style={styles.highTemp}>{Math.round(forecast.temperatureMax)}°</Text>
                    <View style={styles.divider} />
                    <Text style={styles.lowTemp}>{Math.round(forecast.temperatureMin)}°</Text>
                    <Fontisto
                        // @ts-ignore
                        name={weatherCodeToFontistoIcon(forecast.weatherCode)}
                        size={18}
                        color={colors.secondary}
                        style={{ marginLeft: 12 }}
                    />
                </View>
            )}
        </View>
    );
};

export default DayBanner;