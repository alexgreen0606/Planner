import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../theme/theme';

interface TimeProps {
    timestamp: string;
}

const Time = ({ timestamp }: TimeProps) => {

    const date = new Date(timestamp);
    let hour = date.getHours();
    const indicator = hour >= 12 ? 'PM' : 'AM';
    hour = hour >= 12 ? hour - 12 : hour;
    hour = hour === 0 ? 12 : hour;
    const minutes = date.getMinutes();

    return (
        <View style={styles.parent}>
            <View style={styles.container}>
                <Text style={styles.time}>{`${hour}${minutes !== 0 ? `:${minutes}` : ''}`}</Text>
                <Text style={styles.indicator}>{indicator}</Text>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        justifyContent: 'flex-start',
        flexDirection: 'row',
    },
    parent: {
        justifyContent: 'center',
        marginLeft: 16
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