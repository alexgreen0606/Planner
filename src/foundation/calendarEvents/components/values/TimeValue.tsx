import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import CustomText from '../../../components/text/CustomText';
import { isoToTimeValue, isTimestampValid } from '../../timestampUtils';
import { LIST_CONTENT_HEIGHT } from '../../../sortedLists/constants';

interface TimeProps {
    timeValue: string; // HH:MM
    allDay?: boolean;
    endEvent?: boolean;
    startEvent?: boolean;
    disabled?: boolean;
}

const TimeValue = ({
    timeValue,
    allDay,
    endEvent,
    startEvent
}: TimeProps) => {
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [indicator, setIndicator] = useState('');

    // Calculate the time, minutes, and indicator for the given time
    useEffect(() => {
        const timeString = isTimestampValid(timeValue) ? isoToTimeValue(timeValue) : timeValue;
        let [hour, minute] = timeString.split(':').map(Number);
        const minuteString = String(minute).padStart(2, '0');
        setIndicator(hour >= 12 ? 'PM' : 'AM');
        hour = hour >= 12 ? hour - 12 : hour;
        hour = hour === 0 ? 12 : hour;
        setHour(String(hour));
        setMinute(minute !== 0 ? `:${minuteString}` : '');
    }, [timeValue])

    return !allDay ? (
        <View style={{ position: 'relative', height: LIST_CONTENT_HEIGHT, width: 26 }}>
            <View style={{ position: 'absolute', height: LIST_CONTENT_HEIGHT, overflow: 'visible', top: endEvent || startEvent ? -4 : 0, left: 0 }}>
                <View style={styles.container}>
                    <CustomText type='hour' style={styles.hour}>{hour}</CustomText>
                    <View style={styles.details}>
                        <CustomText type='minute' style={styles.minute}>{minute}</CustomText>
                        <CustomText type='indicator' style={styles.indicator}>{indicator}</CustomText>
                    </View>
                </View>
                {endEvent && (
                    <CustomText style={styles.endIndicator} type='indicator'>
                        END
                    </CustomText>
                )}
                {startEvent && (
                    <CustomText style={styles.endIndicator} type='indicator'>
                        START
                    </CustomText>
                )}
            </View>
        </View>
    ) : (
        <View style={{ position: 'relative' }}>
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
    endIndicator: {
        color: PlatformColor('systemYellow'),
        width: '100%',
        textAlign: 'center',
        bottom: 4,
    },
    indicator: {
        height: '50%',
        textAlignVertical: 'bottom',
        textAlign: 'center',
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