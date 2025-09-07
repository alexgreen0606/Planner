import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import CustomText from './CustomText';

// ✅ 

type TTimeValueProps = {
    eventId?: string;
    timeValue?: string | null;
    isoTimestamp?: string | null;
    endEvent?: boolean;
    startEvent?: boolean;
    concise?: boolean;
    platformColor?: string;
    disabled?: boolean;
};

const TimeValue = ({
    eventId,
    timeValue,
    isoTimestamp,
    endEvent,
    startEvent,
    concise,
    platformColor = 'systemTeal',
    disabled
}: TTimeValueProps) => {
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [indicator, setIndicator] = useState('');

    useEffect(() => {
        let date: DateTime | null = null;

        if (isoTimestamp) {
            date = DateTime.fromISO(isoTimestamp);
        } else if (timeValue) {
            date = DateTime.fromFormat(timeValue, 'HH:mm');
        }

        if (date && date.isValid) {
            const rawHour = date.hour;
            const rawMinute = date.minute;
            const isPM = rawHour >= 12;

            const adjustedHour = rawHour % 12 === 0 ? 12 : rawHour % 12;
            const paddedMinute = rawMinute > 0 ? `:${String(rawMinute).padStart(2, '0')}` : '';

            setHour(String(adjustedHour));
            setMinute(paddedMinute);
            setIndicator(isPM ? 'PM' : 'AM');
        } else {
            setHour('');
            setMinute('');
            setIndicator('');
        }
    }, [timeValue, isoTimestamp]);

    // ------------- Concise Time Layout -------------
    if (concise) {
        return (
            <View className='flex-row relative'>
                <CustomText variant='listTime' customStyle={{ color: PlatformColor(disabled ? 'tertiaryLabel' : platformColor) }}>
                    {hour}{minute}
                </CustomText>
                <CustomText variant='listPmAmIndicator' customStyle={disabled ? { color: PlatformColor('tertiaryLabel') } : undefined}>
                    {indicator}
                </CustomText>
                {(startEvent || endEvent) && (
                    <CustomText
                        variant='listMultiDayIndicator'
                        className='-translate-x-1/2'
                    >
                        {startEvent ? 'START' : 'END'}
                    </CustomText>
                )}
            </View>
        )
    }

    // ------------- Standard Time Layout -------------
    return (
        <View className='flex-row relative'>
            <CustomText variant='time' customStyle={{ color: PlatformColor(platformColor) }}>
                {hour}{minute}
            </CustomText>
            <CustomText variant='pmAmIndicator'>
                {indicator}
            </CustomText>
        </View>
    )
};

export default TimeValue;
