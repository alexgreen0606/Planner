import React, { useEffect, useState } from 'react';
import { PlatformColor, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getTodayDatestamp } from '../timestampUtils';

interface CalendarSelectProps {
    handleDatesChange: (dates: string[]) => void;
    clearSelection: boolean;
}

const CalendarSelect = ({
    handleDatesChange,
    clearSelection
}: CalendarSelectProps) => {
    const [monthIndex, setMonthIndex] = useState(0);
    const [range, setRange] = useState<{ startDate: string | null, endDate: string | null }>({
        startDate: null,
        endDate: null,
    });

    useEffect(() => {
        if (clearSelection) {
            setRange({
                startDate: null,
                endDate: null
            });
            handleDatesChange([]);
        }
    }, [clearSelection])

    const handleDayPress = (day: { dateString: string }) => {
        const { dateString } = day;
        const { startDate, endDate } = range;
        let newRange;

        if (startDate === dateString) {
            newRange = { startDate: null, endDate: null };
        } else if (!startDate) {
            // Start new range
            newRange = { startDate: dateString, endDate: dateString };
        } else if (!endDate) {
            // Set end date
            if (dateString < startDate) {
                newRange = { startDate: dateString, endDate: startDate };
            } else {
                newRange = { startDate, endDate: dateString };
            }
        } else {
            // Adjust the existing range
            if (dateString < startDate) {
                newRange = { startDate: dateString, endDate };
            } else {
                newRange = { startDate, endDate: dateString };
            }
        }

        setRange(newRange);
        handleDatesChange(newRange.startDate ? getDateRangeArray(newRange.startDate, newRange.endDate) : []);
    };

    const getDateRangeArray = (start: string, end: string): string[] => {
        const dates: string[] = [];
        const startDate = new Date(start);
        const endDate = new Date(end);
        const curr = new Date(startDate);

        while (curr <= endDate) {
            dates.push(curr.toISOString().split('T')[0]);
            curr.setDate(curr.getDate() + 1);
        }

        return dates;
    };



    const getMarkedDates = () => {
        const marks: any = {};
        const { startDate, endDate } = range;

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
            disableLeftArrow={monthIndex === 0}
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
    );
};

const styles = StyleSheet.create({

});

export default CalendarSelect;
