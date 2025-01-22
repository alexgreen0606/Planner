import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../../../foundation/theme/colors';

interface TimeProps {
    timeValue: string; // HH:MM
    allDay: boolean;
}

const Time = ({ timeValue, allDay }: TimeProps) => {
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
            <Text style={styles.hour}>{hour}</Text>
            <View style={styles.details}>
                <Text style={styles.minute}>{minute}</Text>
                <Text style={styles.indicator}>{indicator}</Text>
            </View>
        </View>
    ) : (
        <View>
            <Text style={styles.all}>ALL</Text>
            <Text style={styles.day}>DAY</Text>
        </View>
    )
};


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    hour: {
        fontSize: 24,
        fontFamily: 'Jersey15-Regular',
        color: colors.orange,
        height: 25
    },
    details: {
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
    },
    minute: {
        fontSize: 14,
        paddingTop: 2,
        fontFamily: 'Jersey15-Regular',
        color: colors.orange,
        height: '50%',
        textAlignVertical: 'bottom'
    },
    indicator: {
        fontSize: 7.5,
        height: '50%',
        color: colors.white,
        textAlignVertical: 'bottom',
        width: '100%',
        textAlign: 'right',
        fontWeight: 600
    },
    all: {
        height: '50%',
        fontSize: 15,
        color: colors.orange,
        textAlign: 'center',
        letterSpacing: .6,
        fontFamily: 'Jersey15-Regular',
    },
    day: {
        height: '50%',
        fontSize: 15,
        color: colors.orange,
        textAlign: 'center',
        fontFamily: 'Jersey15-Regular',
    }
});

export default Time;