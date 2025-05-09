// import React, { useEffect, useState } from 'react';
// import { View, StyleSheet, PlatformColor } from 'react-native';
// import CustomText from '../../../components/text/CustomText';
// import { isoToTimeValue, isTimestampValid } from '../../timestampUtils';
// import { LIST_CONTENT_HEIGHT } from '../../../sortedLists/constants';
// import { useFonts } from 'expo-font';

// interface TimeProps {
//     timeValue: string; // HH:MM
//     allDay?: boolean;
//     endEvent?: boolean;
//     startEvent?: boolean;
//     disabled?: boolean;
// }

// const TimeValue = ({
//     timeValue,
//     allDay,
//     endEvent,
//     startEvent
// }: TimeProps) => {
//     const [hour, setHour] = useState('');
//     const [minute, setMinute] = useState('');
//     const [indicator, setIndicator] = useState('');

//     // Calculate the time, minutes, and indicator for the given time
//     useEffect(() => {
//         const timeString = isTimestampValid(timeValue) ? isoToTimeValue(timeValue) : timeValue;
//         let [hour, minute] = timeString.split(':').map(Number);
//         const minuteString = String(minute).padStart(2, '0');
//         setIndicator(hour >= 12 ? 'PM' : 'AM');
//         hour = hour >= 12 ? hour - 12 : hour;
//         hour = hour === 0 ? 12 : hour;
//         setHour(String(hour));
//         setMinute(minute !== 0 ? `:${minuteString}` : '');
//     }, [timeValue])

//     return !allDay ? (
//         <View style={{ position: 'relative', height: LIST_CONTENT_HEIGHT, width: 26 }}>
//             <View style={{ position: 'absolute', height: LIST_CONTENT_HEIGHT, overflow: 'visible', top: endEvent || startEvent ? -4 : 0, left: 0 }}>
//                 <View style={styles.container}>
//                     <CustomText type='hour' style={{ fontFamily: 'Coiny' }}>{hour}</CustomText>
//                     <View style={styles.details}>
//                         <CustomText type='minute' style={styles.minute}>{minute}</CustomText>
//                         <CustomText type='indicator' style={styles.indicator}>{indicator}</CustomText>
//                     </View>
//                 </View>
//                 {endEvent && (
//                     <CustomText style={styles.endIndicator} type='indicator'>
//                         END
//                     </CustomText>
//                 )}
//                 {startEvent && (
//                     <CustomText style={styles.endIndicator} type='indicator'>
//                         START
//                     </CustomText>
//                 )}
//             </View>
//         </View>
//     ) : (
//         <View style={{ position: 'relative' }}>
//             <CustomText type='minute' style={styles.all}>ALL</CustomText>
//             <CustomText type='minute' style={styles.day}>DAY</CustomText>
//         </View>
//     )
// };


// const styles = StyleSheet.create({
//     container: {
//         flexDirection: 'row',
//     },
//     hour: {
//         height: '100%'
//     },
//     details: {
//         justifyContent: 'center',
//         alignItems: 'center',
//         height: '100%'
//     },
//     minute: {
//         height: '50%',
//         paddingTop: 2,
//         textAlignVertical: 'bottom'
//     },
//     endIndicator: {
//         color: PlatformColor('systemYellow'),
//         width: '100%',
//         textAlign: 'center',
//         bottom: 4,
//     },
//     indicator: {
//         height: '50%',
//         textAlignVertical: 'bottom',
//         textAlign: 'center',
//     },
//     all: {
//         height: '50%',
//         textAlign: 'center',
//         letterSpacing: .6,
//     },
//     day: {
//         height: '50%',
//         textAlign: 'center',
//     }
// });

// export default TimeValue;
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PlatformColor } from 'react-native';
import CustomText from '../../../components/text/CustomText';
import { isoToTimeValue, isTimestampValid } from '../../timestampUtils';
import { LIST_CONTENT_HEIGHT } from '../../../sortedLists/constants';
import { useFonts } from 'expo-font';
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

    // Calculate the time, minutes, and indicator for the given time
    // useEffect(() => {
    //     const timeString = isTimestampValid(timeValue) ? isoToTimeValue(timeValue) : timeValue;
    //     let [hour, minute] = timeString.split(':').map(Number);
    //     const minuteString = String(minute).padStart(2, '0');
    //     setIndicator(hour >= 12 ? 'PM' : 'AM');
    //     hour = hour >= 12 ? hour - 12 : hour;
    //     hour = hour === 0 ? 12 : hour;
    //     setHour(String(hour));
    //     setMinute(minute !== 0 ? `:${minuteString}` : '');
    // }, [timeValue])

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