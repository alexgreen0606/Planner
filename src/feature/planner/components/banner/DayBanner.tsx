import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WeatherForecast } from '../../../../foundation/weather/utils';
import { timestampToDayOfWeek, timestampToMonthDate } from '../../../../foundation/time/utils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import CustomText from '../../../../foundation/components/text/CustomText';
import WeatherDisplay from '../../../../foundation/weather/components/WeatherDisplay';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
    forecast?: WeatherForecast;
}

const DayBanner = ({ timestamp, forecast }: DayBannerProps) => {

    return (
        <View style={globalStyles.spacedApart}>

            {/* Date */}
            <View style={styles.dayContainer}>
                <CustomText type='header'>{timestampToDayOfWeek(timestamp)}</CustomText>
                <CustomText type='soft' style={styles.date}>{timestampToMonthDate(timestamp)}</CustomText>
            </View>

            {/* Weather */}
            {forecast && (
                <WeatherDisplay
                    high={forecast.temperatureMax}
                    low={forecast.temperatureMin}
                    weatherCode={forecast.weatherCode}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    dayContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    date: {
        marginLeft: 5,
        marginBottom: 2,
    },
});

export default DayBanner;