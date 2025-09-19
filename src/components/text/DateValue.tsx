import { DateTime } from 'luxon';
import React from 'react';
import { PlatformColor, View } from 'react-native';
import CustomText from './CustomText';

// ✅ 

type TDateValueProps = {
    isoTimestamp: string;
    platformColor?: string;
    disabled?: boolean;
};

const DateValue = ({
    isoTimestamp,
    disabled,
    platformColor = 'systemTeal'
}: TDateValueProps) => {
    const dayFormat = 'MMM d';
    const yearFormat = 'yyyy';

    const date = DateTime.fromISO(isoTimestamp);
    const monthDay = date.toFormat(dayFormat);
    const year = date.toFormat(yearFormat);

    // Compute 11 months from now
    const elevenMonthsLater = DateTime.now().plus({ months: 11 });

    // Only show year if date is more than 11 months away
    const showYear = date > elevenMonthsLater;

    return (
        <View className='relative flex-row w-fit'>
            <CustomText
                variant='conciseDate'
                customStyle={{ color: PlatformColor(disabled ? 'tertiaryLabel' : platformColor) }}
            >
                {monthDay.toUpperCase()}
            </CustomText>
            {showYear && (
                <View className='absolute top-[80%]'>
                    <CustomText
                        variant='conciseDateYear'
                        customStyle={disabled ? { color: PlatformColor('tertiaryLabel') } : undefined}
                    >
                        {year}
                    </CustomText>
                </View>
            )}
        </View>
    )
};

export default DateValue;