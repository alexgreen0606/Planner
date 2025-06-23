import { HEADER_HEIGHT } from '@/lib/constants/layout';
import { datestampToDayOfWeek, datestampToMonthDate } from '@/utils/dateUtils';
import React from 'react';
import { View } from 'react-native';
import CustomText from '../text/CustomText';
import WeatherDisplay from '../weather';

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
        <View
            className='flex-row items-center justify-between w-full relative'
            style={{ height: HEADER_HEIGHT }}
        >

            {/* Date */}
            <View className='relative'>
                <CustomText variant='pageLabel'>
                    Today's Plans
                </CustomText>
                <View className='absolute bottom-full translate-y-3 flex-row'>
                    <CustomText variant='detail'>
                        {datestampToDayOfWeek(timestamp)}{' '}
                    </CustomText>
                    <CustomText variant='softDetail'>
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

export default TodayBanner;