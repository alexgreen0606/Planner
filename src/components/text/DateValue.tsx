import { DateTime } from 'luxon';
import React from 'react';
import { PlatformColor, View } from 'react-native';
import CustomText from './CustomText';

// ✅ 

type DateValueProps = {
    isoTimestamp: string;
    concise?: boolean;
    platformColor?: string;
};

const DateValue = ({
    isoTimestamp,
    concise,
    platformColor = 'systemTeal'
}: DateValueProps) => {
    const dayFormat = concise ? 'MMM d' : 'MMMM d';
    const yearFormat = concise ? 'yyyy' : 'yyyy';

    const date = DateTime.fromISO(isoTimestamp);
    const monthDay = date.toFormat(dayFormat);
    const year = date.toFormat(yearFormat);
    const dayOfWeek = date.toFormat('ccc').toUpperCase();

    // Compute 11 months from now
    const elevenMonthsLater = DateTime.now().plus({ months: 11 });

    // Only show year if date is more than 11 months away
    const showYear = date > elevenMonthsLater;

    // ------------- Concise Date Layout -------------
    if (concise) {
        return (
            <View className='relative flex-row w-fit'>
                <CustomText variant='conciseDate' customStyle={{ color: PlatformColor(platformColor) }}>
                    {monthDay.toUpperCase()}
                </CustomText>
                {showYear && (
                    <View className='absolute top-[80%]'>
                        <CustomText variant='conciseDateYear'>
                            {year}
                        </CustomText>
                    </View>
                )}
            </View>
        )
    }

    // ------------- Standard Date Layout -------------
    return (
        <View className="relative">
            <CustomText
                className='-my-0.5'
                variant='date'
                customStyle={{
                    marginRight: showYear ? 2 : 0,
                    color: PlatformColor(platformColor)
                }}
            >
                {monthDay}
            </CustomText>
            <CustomText variant='weekday'>
                {dayOfWeek}
            </CustomText>
            {showYear && (
                <CustomText variant='year'>
                    {year}
                </CustomText>
            )}
        </View>
    )
};

export default DateValue;