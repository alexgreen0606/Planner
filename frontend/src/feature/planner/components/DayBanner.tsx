import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import useWeather from '../../../foundation/weather/hooks/useWeather';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
}

const DayBanner = ({ timestamp }: DayBannerProps) => {
    const { colors } = useTheme();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const date = new Date(timestamp + 'T00:00:00');
    const dayOfWeek = date.getDay();
    const monthDay = `${months[date.getMonth()]} ${date.getDate()}`;

    const { forecast, loading } = useWeather(timestamp);

    const styles = StyleSheet.create({
        container: {
            width: '100%',
            paddingHorizontal: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
        },
        dayContainer: {
            flexDirection: 'row',
            alignItems: 'flex-end',
        },
        dayOfWeek: {
            fontSize: 25,
            color: colors.primary,
        },
        date: {
            fontSize: 12.5,
            color: colors.secondary,
            marginLeft: 5,
            marginBottom: 3, // Adjust this to align the bottom of the text
        },
        tempContainer: {
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
            marginHorizontal: 5,
        },
        lowTemp: {
            fontSize: 14,
            color: colors.primary,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.dayContainer}>
                <Text style={styles.dayOfWeek}>{daysOfWeek[dayOfWeek]}</Text>
                <Text style={styles.date}>{monthDay}</Text>
            </View>
            {!loading && forecast && (
                <View style={styles.tempContainer}>
                    <Text style={styles.highTemp}>{Math.round(forecast.temperatureMax)}°</Text>
                    <View style={styles.divider} />
                    <Text style={styles.lowTemp}>{Math.round(forecast.temperatureMin)}°</Text>
                </View>
            )}
        </View>
    );
};

export default DayBanner;