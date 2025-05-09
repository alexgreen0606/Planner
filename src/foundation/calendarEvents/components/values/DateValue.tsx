import React from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import CustomText from '../../../components/text/CustomText';
import { DateTime } from 'luxon';

interface DateValueProps {
    isoTimestamp: string;
    concise?: boolean;
    platformColor?: string;
}

const DateValue = ({ isoTimestamp, concise, platformColor = 'label' }: DateValueProps) => {
    const dayFormat = concise ? 'MMM d' : 'MMMM d';
    const yearFormat = concise ? 'yy' : 'yyyy';
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
                {monthDay}
            </CustomText>
            {showYear && (
                <View style={styles.conciseYear}>
                    <CustomText type='indicator2'>
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
                <CustomText type='indicator2'>
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
        bottom: 0,
        left: '100%',
        transform: 'translateX(-8px)',
        opacity: 0.8,
    }
});

export default DateValue;