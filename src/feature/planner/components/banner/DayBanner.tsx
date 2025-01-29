import React from 'react';
import { View } from 'react-native';
import { WeatherForecast } from '../../../../foundation/weather/utils';
import { timestampToDayOfWeek, timestampToMonthDate } from '../../../../foundation/planners/timeUtils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import WeatherDisplay from '../../../../foundation/weather/components/WeatherDisplay';
import LabelSublabel from '../../../../foundation/components/text/LabelSublabel';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
    forecast?: WeatherForecast;
}

const DayBanner = ({ timestamp, forecast }: DayBannerProps) => {

    return (
        <View style={globalStyles.spacedApart}>

            {/* Date */}
            <LabelSublabel
                label={timestampToDayOfWeek(timestamp)}
                subLabel={timestampToMonthDate(timestamp)}
                type='medium'
            />

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

export default DayBanner;