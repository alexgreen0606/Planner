import React from 'react';
import { View, StyleSheet } from 'react-native';
import { weatherCodeToFontistoIcon, WeatherForecast } from '../../../../foundation/weather/utils';
import { timestampToDayOfWeek, timestampToMonthDate } from '../../../../foundation/planners/timeUtils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import colors from '../../../../foundation/theme/colors';
import AppleIcon from '../../../../foundation/components/icons/AppleIcon';
import CustomText from '../../../../foundation/components/text/CustomText';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
    forecast: WeatherForecast;
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
            <View style={styles.weatherContainer}>
                <CustomText type='highTemp'>{Math.round(forecast.temperatureMax)}°</CustomText>
                <View style={styles.divider} />
                <CustomText type='lowTemp'>{Math.round(forecast.temperatureMin)}°</CustomText>
                <View style={styles.icon}>
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
    date: {
        marginLeft: 5,
        marginBottom: 2,
    },
    weatherContainer: {
        ...globalStyles.verticallyCentered,
        gap: 0,
        height: '100%'
    },
    divider: {
        width: StyleSheet.hairlineWidth,
        height: '80%',
        backgroundColor: colors.grey,
        marginHorizontal: 4,
    },
    icon: {
        marginLeft: 16,
        marginRight: 12
    }
});

export default DayBanner;