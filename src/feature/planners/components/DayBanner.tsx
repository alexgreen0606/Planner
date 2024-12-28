import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import useWeather from '../../../foundation/weather/hooks/useWeather';
import { weatherCodeToFontistoIcon } from '../../../foundation/weather/utils';
import { timestampToDayOfWeek, timestampToMonthDate } from '../utils';
import globalStyles from '../../../theme/globalStyles';
import GenericIcon from '../../../foundation/ui/icons/GenericIcon';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
}

const DayBanner = ({ timestamp }: DayBannerProps) => {
    const { colors } = useTheme();
    const { forecast, loading } = useWeather(timestamp);

    console.log(forecast)

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
            height: '100%'
        },
        highTemp: {
            fontSize: 18,
            color: colors.secondary,
        },
        divider: {
            width: StyleSheet.hairlineWidth,
            height: '80%',
            backgroundColor: colors.outline,
            marginHorizontal: 4,
        },
        lowTemp: {
            fontSize: 14,
            color: colors.outline,
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
                    <View
                        style={{ marginLeft: 8 }}
                    >
                        <GenericIcon
                            type={weatherCodeToFontistoIcon(forecast.weatherCode).type}
                            name={weatherCodeToFontistoIcon(forecast.weatherCode).name}
                            size={18}
                            color={colors.secondary}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

export default DayBanner;