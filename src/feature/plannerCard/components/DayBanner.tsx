import React from 'react';
import { PlatformColor, TouchableOpacity, View } from 'react-native';
import { WeatherForecast } from '../../weather/utils';
import globalStyles from '../../../theme/globalStyles';
import WeatherDisplay from '../../weather';
import { datestampToMonthDate, getTomorrowDatestamp } from '../../../foundation/calendarEvents/timestampUtils';
import { Planner } from '../../../foundation/calendarEvents/types';
import CustomText from '../../../foundation/components/text/CustomText';

interface DayBannerProps {
    planner: Planner;
    toggleCollapsed: () => void;
    forecast?: WeatherForecast;
}

const DayBanner = ({
    planner,
    toggleCollapsed,
    forecast
}: DayBannerProps) => planner &&
    <TouchableOpacity onPress={toggleCollapsed} style={globalStyles.spacedApart}>

        {/* Date */}
        <View>
            <View style={{ flexDirection: 'row' }}>
                {getTomorrowDatestamp() === planner.datestamp && (
                    <CustomText type='subHeader' style={{ color: PlatformColor('label') }}>
                        {planner.title}{' '}
                    </CustomText>
                )}
                <CustomText type='subHeader'>
                    {datestampToMonthDate(planner.datestamp)}
                </CustomText>
            </View>
            <CustomText type='header'>
                {getTomorrowDatestamp() === planner.datestamp ? 'Tomorrow' : planner.title}
            </CustomText>
        </View>

        {/* Weather */}
        {forecast && (
            <WeatherDisplay
                high={forecast.temperatureMax}
                low={forecast.temperatureMin}
                weatherCode={forecast.weatherCode}
            />
        )}
    </TouchableOpacity>

export default DayBanner;