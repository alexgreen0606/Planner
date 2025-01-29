import React from 'react';
import { View, StyleSheet } from 'react-native';
import globalStyles from '../../../../foundation/theme/globalStyles';
import { timestampToDayOfWeek, timestampToMonthDate } from '../../../../foundation/time/utils';
import colors from '../../../../foundation/theme/colors';
import GenericIcon from '../../../../foundation/components/icon/GenericIcon';
import CustomText from '../../../../foundation/components/text/CustomText';
import WeatherDisplay from '../../../../foundation/weather/components/WeatherDisplay';

interface TodayBannerProps {
    timestamp: string; // YYYY-MM-DD
}

const TodayBanner = ({ timestamp }: TodayBannerProps) => {
    // TODO: load in weather data
    const high = 47;
    const low = 32;
    const weatherCode = 0;

    return (
        <View style={globalStyles.pageLabelContainer}>

            <View style={globalStyles.verticallyCentered}>
                <GenericIcon
                    type='coffee'
                    size={26}
                    color={colors.blue}
                />

                {/* Date */}
                <View style={styles.dayContainer}>
                    <CustomText type='pageLabel'>{timestampToDayOfWeek(timestamp)}</CustomText>
                    <CustomText type='soft'>{timestampToMonthDate(timestamp)}</CustomText>
                </View>
            </View>

            {/* Weather */}
            <WeatherDisplay
                low={low}
                high={high}
                weatherCode={weatherCode}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    dayContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
});

export default TodayBanner;