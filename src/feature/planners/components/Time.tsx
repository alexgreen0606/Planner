import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme/theme';

interface TimeProps {
    timeValue: string; // HH:MM
}

const Time = ({ timeValue: timeValue }: TimeProps) => {
    const [time, setTime] = useState('');
    const [indicator, setIndicator] = useState('');

    // Calculate the time, minutes, and indicator for the given time
    useEffect(() => {
        let [hour, minute] = timeValue.split(':').map(Number);
        setIndicator(hour >= 12 ? 'PM' : 'AM');
        hour = hour >= 12 ? hour - 12 : hour;
        hour = hour === 0 ? 12 : hour;
        setTime(`${hour}${minute !== 0 ? `:${minute}` : ''}`);
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.time}>{time}</Text>
            <Text style={styles.indicator}>{indicator}</Text>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
    },
    time: {
        fontSize: 16,
        color: theme.colors.primary
    },
    indicator: {
        marginLeft: 2,
        fontSize: 10,
        color: theme.colors.secondary
    }
});

export default Time;