import { HEADER_HEIGHT } from '@/lib/constants/miscLayout';
import { datestampToDayOfWeek, datestampToMonthDate } from '@/utils/dateUtils';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import CustomText from '../text/CustomText';
import WeatherDisplay from '../weather';
import { useMMKV, useMMKVObject } from 'react-native-mmkv';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { EStorageId } from '@/lib/enums/EStorageId';

// ✅ 

type TodayBannerProps = {
    timestamp: string; // YYYY-MM-DD
};

const TodayBanner = ({ timestamp }: TodayBannerProps) => {

    // TODO: load in weather data
    const high = 47;
    const low = 32;
    const weatherCode = 0;
    const currentTemp = 37;

    const storage = useMMKV({ id: EStorageId.PLANNER });
    const [today, setToday] = useMMKVObject<TPlanner>(timestamp, storage);

    useEffect(() => {
        if (today) {
            setToday({ ...today, title: "" });
        }
    }, []);

    return (
        <View
            className='flex-row items-center justify-between w-full relative'
            style={{ height: HEADER_HEIGHT }}
        >

            {/* Date */}
            <View className='relative'>
                <CustomText variant='pageLabel'>
                    {today?.title || "Today's Plans"}
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