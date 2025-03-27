import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from '../../../components/text/CustomText';
import { isoToMonthDate } from '../../timestampUtils';

interface DateValue {
    timestamp: string;
    disabled?: boolean;
}

const DateValue = ({ timestamp }: DateValue) => {
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [year, setYear] = useState('')

    useEffect(() => {
        const [newMonth, newDay] = isoToMonthDate(timestamp).split(' ');
        const newYear = timestamp.split('-')[0];
        setMonth(newMonth.slice(0, 3).toUpperCase());
        setDay(newDay);
        setYear(newYear);
    }, [timestamp])

    return (
        <View style={styles.container}>
            <CustomText type='day' style={styles.hour}>{day}</CustomText>
            <View style={styles.details}>
                <CustomText type='month' style={styles.minute}>{month}</CustomText>
                <CustomText type='indicator' style={styles.indicator}>{year}</CustomText>
            </View>
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
        height: '100%',
        marginLeft: 2
    },
    minute: {
        height: '50%',
        paddingTop: 2,
        letterSpacing: 1.6,
        textAlignVertical: 'bottom'
    },
    indicator: {
        height: '50%',
        textAlignVertical: 'bottom',
        textAlign: 'right',
        letterSpacing: .2,
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

export default DateValue;