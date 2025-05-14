import React from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import CustomText from './CustomText';
import { DateTime } from 'luxon';

interface DateValueProps {
    isoTimestamp: string;
    concise?: boolean;
    platformColor?: string;
}

const DateValue = ({ isoTimestamp, concise, platformColor = 'systemTeal' }: DateValueProps) => {
    const dayFormat = concise ? 'MMM d' : 'MMMM d';
    const yearFormat = concise ? 'yyyy' : 'yyyy';
    const date = DateTime.fromISO(isoTimestamp);
    const monthDay = date.toFormat(dayFormat);
    const year = date.toFormat(yearFormat);

    // Compute 11 months from now
    const elevenMonthsLater = DateTime.now().plus({ months: 11 });

    // Only show year if date is more than 11 months away
    const showYear = date > elevenMonthsLater;

    return concise ?
        <View style={styles.time}>
            <CustomText type='time' style={{ flexDirection: 'row', color: PlatformColor(platformColor) }}>
                {monthDay.toUpperCase()}
            </CustomText>
            {showYear && (
                <View style={styles.conciseYear}>
                    <CustomText type='indicator'>
                        {year}
                    </CustomText>
                </View>
            )}
        </View>
        :
        <View style={styles.time}>
            <CustomText type='time' style={{ marginRight: showYear ? 2 : 0, color: PlatformColor(platformColor) }}>
                {monthDay}
            </CustomText>
            {showYear && (
                <CustomText type='indicator'>
                    {year}
                </CustomText>
            )}
        </View>
};

const styles = StyleSheet.create({
    time: {
        position: 'relative',
        flexDirection: 'row'
    },
    conciseYear: {
        position: 'absolute',
        top: '80%',
        right: 0
    }
});

export default DateValue;