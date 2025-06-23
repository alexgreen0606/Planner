import React from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import CustomText from './CustomText';
import { DateTime } from 'luxon';

interface DateValueProps {
    isoTimestamp: string;
    concise?: boolean;
    platformColor?: string;
}

const DateValue = ({ isoTimestamp, concise, platformColor = 'systemTeal' }: DateValueProps) => {
    const dayFormat = concise ? 'MMM d' : 'MMMM d';
    const yearFormat = concise ? 'yyyy' : 'yyyy';
    const date = DateTime.fromISO(isoTimestamp);
    const monthDay = date.toFormat(dayFormat);
    const year = date.toFormat(yearFormat);

    // Compute 11 months from now
    const elevenMonthsLater = DateTime.now().plus({ months: 11 });

    // Only show year if date is more than 11 months away
    const showYear = date > elevenMonthsLater;

    return concise ?
        <View className='relative flex-row w-fit'>
            <CustomText variant='conciseDate' customStyle={{ color: PlatformColor(platformColor) }}>
                {monthDay.toUpperCase()}
            </CustomText>
            {showYear && (
                <View className='absolute top-[80%] left-0'>
                    <CustomText variant='standard'>
                        {year}
                    </CustomText>
                </View>
            )}
        </View>
        :
        <View className='relative flex-row'>
            <CustomText
                variant='date'
                customStyle={{
                    marginRight: showYear ? 2 : 0,
                    color: PlatformColor(platformColor)
                }}
            >
                {monthDay}
            </CustomText>
            {showYear && (
                <CustomText variant='standard'>
                    {year}
                </CustomText>
            )}
        </View>
};

export default DateValue;