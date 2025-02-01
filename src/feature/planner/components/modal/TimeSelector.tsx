import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { TimeSelectorOptions } from '../../../../foundation/planners/timeUtils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import { Color } from '../../../../foundation/theme/colors';

interface TimeSelectorProps {
    onChange: (newTimeValue: string) => void;
    options: TimeSelectorOptions;
    initialTimeValue: string;
};

const TimeSelector = ({
    onChange,
    options,
    initialTimeValue
}: TimeSelectorProps) => {
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);
    const [indicator, setIndicator] = useState('AM');

    useEffect(() => {
        let [initialHourString, initialMinuteString] = initialTimeValue.split(':');
        const initialHour = Number(initialHourString);
        const initialMinute = Number(initialMinuteString);

        setHour(initialHour >= 12 ? initialHour - 12 : initialHour);
        setMinute(initialMinute);
        setIndicator(initialHour >= 12 ? 'PM' : 'AM');
    }, []);

    useEffect(() => {
        onChange(`${String(indicator === 'PM' && hour !== 12 ? hour + 12 : hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }, [hour, minute, indicator]);

    return (
        <View style={styles.container}>
            <Picker style={styles.scrollWheel}
                selectedValue={hour}
                onValueChange={(itemValue) => setHour(Number(itemValue))}
                itemStyle={styles.wheelItem}
                selectionColor={Color.BLUE}
            >
                {options.hour.map(hourOption => (
                    <Picker.Item
                        color={hour === hourOption ? Color.BLUE : Color.DIM}
                        key={hourOption}
                        label={String(hourOption === 0 ? 12 : hourOption)}
                        value={hourOption}
                    />
                ))}
            </Picker>
            <Picker style={styles.scrollWheel}
                selectedValue={minute}
                itemStyle={styles.wheelItem}
                onValueChange={(itemValue) => setMinute(itemValue)}
            >
                {options.minute.map(minuteOption => (
                    <Picker.Item
                        color={minute === minuteOption ? Color.BLUE : Color.DIM}
                        key={minuteOption}
                        label={String(minuteOption).padStart(2, '0')}
                        value={minuteOption}
                    />
                ))}
            </Picker>
            <Picker style={styles.scrollWheel}
                selectedValue={indicator}
                onValueChange={(itemValue) => setIndicator(itemValue)}
                itemStyle={styles.wheelItem}
            >
                {options.indicator.map(ind => (
                    <Picker.Item
                        color={indicator === ind ? Color.BLUE : Color.DIM}
                        key={ind}
                        label={ind}
                        value={ind}
                    />
                ))}
            </Picker>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...globalStyles.spacedApart,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: Color.DIM,
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 16
    },
    scrollWheel: {
        width: '33%'
    },
    wheelItem: {
        fontSize: 14,
        color: Color.DIM,
    },
});

export default TimeSelector;
