import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { TimeObject } from '../../../feature/planners/utils';
import globalStyles from '../../../theme/globalStyles';
import colors from '../../../theme/colors';

interface TimeSelectorProps {
    onChange: (newTimeValue: string) => void;
    options: TimeObject;
    initialTimeValue: string;
};

const TimeSelector = ({
    onChange,
    options,
    initialTimeValue
}: TimeSelectorProps) => {
    const [hour, setHour] = useState('0');
    const [minute, setMinute] = useState('00');
    const [indicator, setIndicator] = useState('PM');

    useEffect(() => {
        let [initialHour, initialMinute] = initialTimeValue.split(':');
        initialHour = initialHour.replace(/^0+/, '');
        initialMinute = initialMinute.padStart(2, '0')

        setHour(String(Number(initialHour) >= 12 ? Number(initialHour) - 12 : initialHour));
        setMinute(initialMinute);
        setIndicator(Number(initialHour) >= 12 ? 'PM' : 'AM');
    }, []);

    useEffect(() => {
        console.log(hour, minute, indicator)
        onChange(`${indicator === 'PM' ? Number(hour) + 12 : hour}:${minute}`);
    }, [hour, minute, indicator]);

    return (
        <View style={{ ...globalStyles.spacedApart }}>
            <Picker style={{ width: '30%' }}
                selectedValue={hour}
                onValueChange={(itemValue) => setHour(itemValue.toString())}
                itemStyle={styles.item}
                selectionColor={colors.blue}
            >
                {options.hour.map(hourOption => (
                    <Picker.Item
                        color={hour === hourOption ? colors.blue : colors.grey}
                        key={hourOption}
                        label={`${hourOption === '0' ? '12' : hourOption}`}
                        value={hourOption}
                    />
                ))}
            </Picker>
            <Picker style={{ width: '30%' }}
                selectedValue={minute}
                itemStyle={styles.item}
                onValueChange={(itemValue) => setMinute(itemValue)}
            >
                {options.minute.map(minuteOption => (
                    <Picker.Item
                        color={minute === minuteOption ? colors.blue : colors.grey}
                        key={minuteOption}
                        label={minuteOption}
                        value={minuteOption}
                    />
                ))}
            </Picker>
            <Picker style={{ width: '35%' }}
                selectedValue={indicator}
                onValueChange={(itemValue) => setIndicator(itemValue)}
                itemStyle={styles.item}
            >
                {options.indicator.map(ind => (
                    <Picker.Item
                        color={indicator === ind ? colors.blue : colors.grey}
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
    item: {
        fontSize: 14,
        color: colors.grey,
    },
    flatList: {
        maxHeight: 140,
        borderColor: colors.background,
        backgroundColor: 'transparent',
    },
    option: {
        backgroundColor: colors.background,
        color: colors.white,
        height: 25,
        textAlign: 'center',
    }
});

export default TimeSelector;
