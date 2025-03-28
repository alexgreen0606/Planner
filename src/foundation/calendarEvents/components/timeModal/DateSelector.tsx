import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import globalStyles from '../../../theme/globalStyles';
import CustomText from '../../../components/text/CustomText';
import DateValue from '../values/DateValue';
import { isoToDatestamp, isoToTimeValue } from '../../timestampUtils';
import TimeValue from '../values/TimeValue';

enum SelectorMode {
    DATE = 'date',
    TIME = 'time'
}

export interface DateSelectorProps {
    onDateChange: (newDate: Date) => void;
    date: Date;
    label: string;
    allDay: boolean;
}

const DateSelector = ({
    onDateChange,
    date,
    label,
    allDay
}: DateSelectorProps) => {
    const [mode, setMode] = useState<SelectorMode | null>(null);

    function toggleMode(newMode: SelectorMode) {
        if (mode === newMode) {
            setMode(null);
        } else {
            setMode(newMode);
        }
    }

    useEffect(() => {
        if (allDay && !!mode) {
            setMode(SelectorMode.DATE)
        }
    }, [allDay]);

    return (
        <View style={{ display: 'flex', alignItems: 'center' }}>
            <View style={globalStyles.spacedApart}>
                <CustomText type='standard'>{label}</CustomText>
                <View style={{ ...globalStyles.verticallyCentered, transform: 'scale(1.1)', paddingRight: 16 }}>
                    {!allDay && (
                        <TouchableOpacity disabled={allDay} onPress={() => toggleMode(SelectorMode.TIME)} style={{ height: 25 }}>
                            <TimeValue timeValue={isoToTimeValue(date.toISOString())} />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => toggleMode(SelectorMode.DATE)} style={{ height: 25 }}>
                        <DateValue timestamp={isoToDatestamp(date.toISOString())} />
                    </TouchableOpacity>
                </View>
            </View>
            {mode && (
                <DatePicker
                    mode={mode}
                    theme='dark'
                    date={date}
                    onDateChange={onDateChange}
                    minuteInterval={5}
                />
            )}
        </View>
    );
};

export default DateSelector;