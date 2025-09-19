import ThinLine from '@/components/ThinLine';
import { ETimeSelectorMode } from '@/lib/enums/ETimeSelectorMode';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import TimeSelector from './TimeSelector';

// ✅ 

type TTimeRangeSelectorProps = {
    startIso: string;
    endIso: string;
    allDay?: boolean;
    multiDay?: boolean;
    onChange: (
        start: string,
        end: string
    ) => void;
};

const TimeRangeSelector = ({
    startIso,
    endIso,
    allDay,
    multiDay,
    onChange
}: TTimeRangeSelectorProps) => {
    const startDate: Date = useMemo(
        () => DateTime.fromISO(startIso).toJSDate(),
        [startIso]
    );
    const endDate: Date = useMemo(
        () => DateTime.fromISO(endIso).toJSDate(),
        [endIso]
    );

    const showEndDate = endIso && multiDay;
    const showTimes = !allDay;

    // Reset the times to midnight when the events become all-day.
    useEffect(() => {
        if (allDay) {
            resetTimesToMidnight();
        }
    }, [allDay]);

    // ===============
    //  Event Handler
    // ===============

    function handleChange(date: Date, selectorMode: ETimeSelectorMode) {
        const inputDate = DateTime.fromJSDate(date);
        const currentStartDate = DateTime.fromISO(startIso);
        const currentEndDate = DateTime.fromISO(endIso);

        let newStartDate = currentStartDate;
        let newEndDate = currentEndDate;

        const enforceEndLaterThanStart = () => {
            if (newEndDate.toMillis() < newStartDate.toMillis()) {
                newEndDate = newStartDate;
            }
        };

        const enforceStartEarlierThanEnd = () => {
            if (newEndDate.toMillis() < newStartDate.toMillis()) {
                newStartDate = newEndDate;
            }
        };

        switch (selectorMode) {
            case ETimeSelectorMode.START_DATE:
                newStartDate = inputDate;
                enforceEndLaterThanStart();
                break;

            case ETimeSelectorMode.END_DATE:
                newEndDate = inputDate;
                enforceStartEarlierThanEnd();
                break;
        }

        const newStartIso = newStartDate.toUTC().toISO()!;
        const newEndIso = newEndDate.toUTC().toISO()!;
        onChange(newStartIso, newEndIso);
    }

    // =================
    //  Helper Function
    // =================

    function resetTimesToMidnight() {
        const newStartDate = DateTime.fromISO(startIso)
            .set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            });
        const newEndDate = DateTime.fromISO(endIso)
            .set({
                hour: 0,
                minute: 0,
                second: 0,
                millisecond: 0
            });

        const newStartIso = newStartDate.toUTC().toISO()!;
        const newEndIso = newEndDate.toUTC().toISO()!;
        onChange(newStartIso, newEndIso);
    }

    // ================
    //  User Interface
    // ================

    return (
        <View>

            {/* Start */}
            <TimeSelector
                label='Start'
                date={startDate}
                showTime={showTimes}
                onChange={(date) => handleChange(date, ETimeSelectorMode.START_DATE)}
            />

            {/* Separator */}
            {showEndDate && <ThinLine overflow />}

            {/* End */}
            {showEndDate && (
                <TimeSelector
                    label='End'
                    date={endDate}
                    showTime={showTimes}
                    onChange={(date) => handleChange(date, ETimeSelectorMode.END_DATE)}
                    minimumDate={startDate}
                />
            )}

        </View>
    )
};

export default TimeRangeSelector;