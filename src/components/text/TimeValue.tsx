import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import CustomText from './CustomText';
import { DateTime } from 'luxon';

interface TimeProps {
    timeValue?: string; // HH:MM
    isoTimestamp?: string;
    allDay?: boolean;
    endEvent?: boolean;
    startEvent?: boolean;
    concise?: boolean;
    platformColor?: string;
}

const TimeValue = ({
    timeValue,
    isoTimestamp,
    allDay,
    endEvent,
    startEvent,
    concise,
    platformColor = 'systemTeal'
}: TimeProps) => {
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

    return allDay ? (
        <View className='flex items-center'>
            <CustomText type='conciseTime'>
                ALL
            </CustomText>
            <CustomText type='conciseTime'>
                DAY
            </CustomText>
        </View>
    ) : concise ? (
        <View className='flex-row relative'>
            <CustomText type='conciseTime' style={{ color: PlatformColor(platformColor) }}>
                {hour}{minute}
            </CustomText>
            <View className='w-[1px]' />
            <CustomText type='conciseIndicator'>
                {indicator}
            </CustomText>
            {(startEvent || endEvent) && (
                <View className='absolute top-full left-1/2 -translate-x-1/2 items-center'>
                    <CustomText type='tinyIndicator'>
                        {startEvent ? 'START' : 'END'}
                    </CustomText>
                </View>
            )}
        </View>
    ) : (
        <View className='flex-row relative'>
            <CustomText type='time' style={{ color: PlatformColor(platformColor) }}>
                {hour}{minute}
            </CustomText>
            <CustomText type='indicator'>
                {indicator}
            </CustomText>
        </View>
    );
};


const styles = StyleSheet.create({
    indicator: {
        position: 'absolute',
        bottom: 0,
        opacity: 0.8,
        left: '100%'
    },
    short: {
        transform: 'translateX(-50%)'
    },
});

export default TimeValue;