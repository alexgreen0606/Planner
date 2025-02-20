import React from 'react';
import { View } from 'react-native';
import { WeatherForecast } from '../../../foundation/weather/weatherUtils';
import globalStyles from '../../../foundation/theme/globalStyles';
import WeatherDisplay from '../../../foundation/weather/components/WeatherDisplay';
import LabelSublabel from '../../../foundation/components/text/LabelSublabel';
import { datestampToDayOfWeek, datestampToMonthDate, getTomorrowDatestamp } from '../../../foundation/calendarEvents/timestampUtils';

interface DayBannerProps {
    timestamp: string; // YYYY-MM-DD
    forecast?: WeatherForecast;
}

const DayBanner = ({
    timestamp,
    forecast
}: DayBannerProps) =>
    <View style={globalStyles.spacedApart}>

        {/* Date */}
        <LabelSublabel
            subLabel={datestampToMonthDate(timestamp)}
            label={getTomorrowDatestamp() === timestamp ? 'Tomorrow' : datestampToDayOfWeek(timestamp)}
            upperSublabel={getTomorrowDatestamp() === timestamp ? datestampToDayOfWeek(timestamp) : undefined}
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

export default DayBanner;