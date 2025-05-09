import React, { useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getTodayDatestamp } from '../../../../utils/timestampUtils';

interface DateRangeSelectorProps {
    startDate: string | null;
    endDate: string | null;
    onChange: (startDate: string | null, endDate: string | null) => void;
}

const DateRangeSelector = ({
    startDate,
    endDate,
    onChange
}: DateRangeSelectorProps) => {
    const [monthIndex, setMonthIndex] = useState(0);

    const handleDayPress = (day: { dateString: string }) => {
        const { dateString } = day;

        if (startDate === dateString) {
            // Deselect if clicking the start date when it's the only selection
            onChange(null, null);
        } else if (!startDate) {
            // Start new range
            onChange(dateString, dateString);
        } else if (!endDate || startDate === endDate) {
            // Set end date
            if (dateString < startDate) {
                onChange(dateString, startDate);
            } else {
                onChange(startDate, dateString);
            }
        } else {
            // Adjust the existing range
            if (dateString < startDate) {
                onChange(dateString, endDate);
            } else {
                onChange(startDate, dateString);
            }
        }
    };

    const getMarkedDates = () => {
        const marks: any = {};

        if (startDate && !endDate) {
            marks[startDate] = { selected: true, startingDay: true, endingDay: true, color: PlatformColor('systemBlue'), textColor: 'white' };
        }

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            let current = new Date(start);

            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                marks[dateStr] = {
                    color: PlatformColor('systemBlue'),
                    textColor: 'white',
                    startingDay: dateStr === startDate,
                    endingDay: dateStr === endDate
                };
                current.setDate(current.getDate() + 1);
            }
        }

        return marks;
    };

    return (
        <View style={{ width: '100%' }}>
            <Calendar
                onDayPress={handleDayPress}
                markedDates={getMarkedDates()}
                style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                }}
                markingType='period'
                minDate={getTodayDatestamp()}
                hideExtraDays
                disableLeftArrow={monthIndex <= 0}
                onPressArrowLeft={(subtract: () => void) => {
                    setMonthIndex(curr => curr - 1)
                    subtract();
                }}
                onPressArrowRight={(add: () => void) => {
                    setMonthIndex(curr => curr + 1)
                    add();
                }}
                theme={{
                    backgroundColor: 'transparent',
                    calendarBackground: 'transparent',
                    textSectionTitleColor: PlatformColor('secondaryLabel'),
                    selectedDayBackgroundColor: PlatformColor('systemBlue'),
                    selectedDayTextColor: 'white',
                    todayTextColor: PlatformColor('systemBlue'),
                    dayTextColor: PlatformColor('label'),
                    textDisabledColor: PlatformColor('tertiaryLabel'),
                    monthTextColor: 'white',
                    arrowColor: PlatformColor('systemBlue'),
                    disabledArrowColor: PlatformColor('tertiaryLabel')
                }}
            />
        </View>
    );
};

export default DateRangeSelector;