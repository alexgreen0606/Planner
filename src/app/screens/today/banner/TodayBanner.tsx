import React from 'react';
import { View } from 'react-native';
import globalStyles from '../../../../foundation/theme/globalStyles';
import WeatherDisplay from '../../../../feature/weather';
import LabelSublabel from '../../../../foundation/components/text/LabelSublabel';
import { datestampToDayOfWeek, datestampToMonthDate } from '../../../../foundation/calendarEvents/timestampUtils';
import { BANNER_HEIGHT } from '../../../../foundation/components/constants';

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
        <View style={{ height: BANNER_HEIGHT }}>
            <View style={globalStyles.pageLabelContainer}>

                <View style={globalStyles.verticallyCentered}>

                    {/* Date */}
                    <LabelSublabel
                        label="Today's Plans"
                        subLabel={datestampToMonthDate(timestamp)}
                        upperSublabel={datestampToDayOfWeek(timestamp)}
                        type='large'
                    />
                </View>

                {/* Weather */}
                <WeatherDisplay
                    low={low}
                    high={high}
                    currentTemp={currentTemp}
                    weatherCode={weatherCode}
                />
            </View>
        </View>
    );
};

export default TodayBanner;