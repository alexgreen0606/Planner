import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import CustomText from '../../../components/text/CustomText';
import { DateTime } from 'luxon';

interface TimeProps {
    timeValue?: string; // HH:MM
    isoTimestamp?: string;
    allDay?: boolean;
    endEvent?: boolean;
    startEvent?: boolean;
    disabled?: boolean;
    isShortMode?: boolean;
    platformColor?: string;
}

const TimeValue = ({
    timeValue,
    isoTimestamp,
    allDay,
    endEvent,
    startEvent,
    isShortMode,
    platformColor = 'label'
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

    return isShortMode ?
        <View style={styles.time}>
            <CustomText type='time' style={{color: PlatformColor(platformColor)}}>
                {hour}{minute}
            </CustomText>
            <View style={[styles.indicator, isShortMode ? styles.short : styles.long]}>
                <CustomText type='indicator2'>
                    {indicator}
                </CustomText>
            </View>
        </View> :
        <View style={styles.time}>
            <CustomText type='time' style={{color: PlatformColor(platformColor)}}>
                {hour}{minute}
            </CustomText>
            <CustomText type='indicator2'>
                {indicator}
            </CustomText>
        </View>
};


const styles = StyleSheet.create({
    time: {
        position: 'relative',
        flexDirection: 'row'
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        opacity: 0.8,
        left: '100%'
    },
    short: {
        transform: 'translateX(-50%)'
    },
    long: {}
});

export default TimeValue;