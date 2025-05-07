import React from 'react';
import { View, StyleSheet } from 'react-native';
import CustomText from '../../../components/text/CustomText';
import { LIST_CONTENT_HEIGHT } from '../../../sortedLists/constants';

interface DateValue {
    timestamp?: string;
    date?: Date;
}

const DateValue = ({ timestamp, date }: DateValue) => {
    const dateObject = date || (timestamp ? new Date(timestamp) : new Date());
    const month = dateObject.toLocaleString(undefined, { month: 'short' }).slice(0, 3).toUpperCase();
    const day = dateObject.toLocaleString(undefined, { day: 'numeric' });
    const year = dateObject.toLocaleString(undefined, { year: 'numeric' });

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
        height: LIST_CONTENT_HEIGHT
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