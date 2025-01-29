import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from '../../components/text/CustomText';

interface TimeProps {
    timeValue: string; // HH:MM
    allDay: boolean;
}

const TimeValue = ({ timeValue, allDay }: TimeProps) => {
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [indicator, setIndicator] = useState('');

    // Calculate the time, minutes, and indicator for the given time
    useEffect(() => {
        let [hour, minute] = timeValue.split(':').map(Number);
        const minuteString = String(minute).padStart(2, '0');
        setIndicator(hour >= 12 ? 'PM' : 'AM');
        hour = hour >= 12 ? hour - 12 : hour;
        hour = hour === 0 ? 12 : hour;
        setHour(String(hour));
        setMinute(minute !== 0 ? `:${minuteString}` : '')
    }, [timeValue])

    return !allDay ? (
        <View style={styles.container}>
            <CustomText type='hour' style={styles.hour}>{hour}</CustomText>
            <View style={styles.details}>
                <CustomText type='minute' style={styles.minute}>{minute}</CustomText>
                <CustomText type='indicator' style={styles.indicator}>{indicator}</CustomText>
            </View>
        </View>
    ) : (
        <View>
            <CustomText type='minute' style={styles.all}>ALL</CustomText>
            <CustomText type='minute' style={styles.day}>DAY</CustomText>
        </View>
    )
};


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    hour: {
        height: '100%'
    },
    details: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
    },
    minute: {
        height: '50%',
        paddingTop: 2,
        textAlignVertical: 'bottom'
    },
    indicator: {
        height: '50%',
        textAlignVertical: 'bottom',
        textAlign: 'right',
    },
    all: {
        height: '50%',
        textAlign: 'center',
        letterSpacing: .6,
    },
    day: {
        height: '50%',
        textAlign: 'center',
    }
});

export default TimeValue;