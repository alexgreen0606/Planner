import React from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import globalStyles from '../../theme/globalStyles';
import { datestampToDayOfWeek, datestampToMonthDate } from '../../foundation/calendarEvents/timestampUtils';
import WeatherDisplay from '../weather';
import CustomText from '../../foundation/components/text/CustomText';

interface TodayBannerProps {
    timestamp: string; // YYYY-MM-DD
}

const TodayBanner = ({ timestamp }: TodayBannerProps) => {
    // TODO: load in weather data
    const high = 47;
    const low = 32;
    const weatherCode = 0;
    const currentTemp = 37;

    return (
        <View style={globalStyles.pageLabelContainer}>

            {/* Date */}
            <View style={styles.pageLabel}>
                <CustomText type='pageLabel'>Today's Plans</CustomText>
                <View style={styles.date}>
                    <CustomText
                        type='subPageLabel'
                        style={{ color: PlatformColor('label') }}
                    >
                        {datestampToDayOfWeek(timestamp)}{' '}
                    </CustomText>
                    <CustomText
                        type='subPageLabel'
                        style={{ color: PlatformColor('secondaryLabel') }}
                    >
                        {datestampToMonthDate(timestamp)}
                    </CustomText>
                </View>
            </View>

            {/* Weather */}
            <WeatherDisplay
                low={low}
                high={high}
                currentTemp={currentTemp}
                weatherCode={weatherCode}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    pageLabel: {
        position: 'relative',
    },
    date: {
        position: 'absolute',
        left: 0,
        bottom: '100%',
        transform: 'translateY(16px)',
        display: 'flex',
        flexDirection: 'row',
    },
});

export default TodayBanner;