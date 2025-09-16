import ThinLine from '@/components/ThinLine';
import { ETimeSelectorMode } from '@/lib/enums/ETimeSelectorMode';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import TimeSelector from './TimeSelector';

// ✅ 

type TTimeRangeSelectorProps = {
    startIso: string;
    endIso: string;
    allDay?: boolean;
    multiDay?: boolean;
    triggerOpenField?: ETimeSelectorMode;
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
    triggerOpenField,
    onChange
}: TTimeRangeSelectorProps) => {
    const [selectorMode, setSelectorMode] = useState<ETimeSelectorMode | null>(null);

    const startDate: Date = useMemo(
        () => DateTime.fromISO(startIso).toJSDate(),
        [startIso]
    );

    const endDate: Date = useMemo(
        () => DateTime.fromISO(endIso).toJSDate(),
        [endIso]
    );

    const showEndTime = endIso && multiDay;
    const showTimes = !allDay;

    // Reset the times to midnight when the events become all-day.
    useEffect(() => {
        if (allDay) {
            resetTimesToMidnight();
            setSelectorMode(null);
        }
    }, [allDay]);

    // Trigger a field focused by the parent component.
    useEffect(() => {
        if (triggerOpenField) {
            setSelectorMode(triggerOpenField);
        }
    }, [triggerOpenField]);

    // ==================
    // 1. Event Handlers
    // ==================

    function handleToggleSelectorMode(newMode: ETimeSelectorMode) {
        if (newMode === selectorMode) {
            setSelectorMode(null);
        } else {
            setSelectorMode(newMode);
        }
    }

    function handleChange(event: DateTimePickerEvent) {
        const { timestamp } = event.nativeEvent;

        const inputDate = DateTime.fromMillis(timestamp);
        const currentStartDate = DateTime.fromISO(startIso);
        const currentEndDate = DateTime.fromISO(endIso);

        let newStartDate = currentStartDate;
        let newEndDate = currentEndDate;

        const enforceEndLaterThanStart = () => {
            // If end date is earlier than start date, shift the end date to be on the same day as the start.
            if (newEndDate.startOf('day') < newStartDate.startOf('day')) {
                newEndDate = newStartDate.set({
                    hour: currentEndDate.hour,
                    minute: currentEndDate.minute,
                    second: 0,
                    millisecond: 0
                });
            }
            // If the end date is still earlier than the start, set the times equal.
            if (newEndDate < newStartDate) {
                newEndDate = newStartDate;
            }
        };

        switch (selectorMode) {
            case ETimeSelectorMode.START_DATE:
                newStartDate = inputDate.set({
                    hour: currentStartDate.hour,
                    minute: currentStartDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();

                if (showTimes) {
                    setSelectorMode(ETimeSelectorMode.START_TIME);
                } else if (showEndTime) {
                    setSelectorMode(ETimeSelectorMode.END_DATE);
                }

                break;
            case ETimeSelectorMode.START_TIME:
                newStartDate = currentStartDate.set({
                    hour: inputDate.hour,
                    minute: inputDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();
                break;
            case ETimeSelectorMode.END_DATE:
                newEndDate = inputDate.set({
                    hour: currentEndDate.hour,
                    minute: currentEndDate.minute,
                    second: 0,
                    millisecond: 0
                });
                enforceEndLaterThanStart();

                if (showTimes) {
                    setSelectorMode(ETimeSelectorMode.END_TIME);
                }

                break;
            case ETimeSelectorMode.END_TIME:
                newEndDate = currentEndDate.set({
                    hour: inputDate.hour,
                    minute: inputDate.minute,
                    second: 0,
                    millisecond: 0
                });
                break;
        }

        const newStartIso = newStartDate.toUTC().toISO()!;
        const newEndIso = newEndDate.toUTC().toISO()!;
        onChange(newStartIso, newEndIso);
    }

    // ===================
    // 2. Helper Function
    // ===================

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

    return (
        <View>

            {/* Start */}
            <TimeSelector
                label='Start'
                date={startDate}
                isoTimestamp={startIso}
                showTime={showTimes}
                dateMode={ETimeSelectorMode.START_DATE}
                timeMode={ETimeSelectorMode.START_TIME}
                currentSelectorMode={selectorMode}
                onToggleMode={handleToggleSelectorMode}
                onChange={handleChange}
            />

            {/* Separator */}
            {showEndTime && <ThinLine overflow />}

            {/* End */}
            {showEndTime && (
                <TimeSelector
                    label='End'
                    date={endDate}
                    isoTimestamp={endIso}
                    showTime={showTimes}
                    dateMode={ETimeSelectorMode.END_DATE}
                    timeMode={ETimeSelectorMode.END_TIME}
                    currentSelectorMode={selectorMode}
                    onToggleMode={handleToggleSelectorMode}
                    onChange={handleChange}
                    minimumDate={startDate}
                />
            )}

        </View>
    )
};

export default TimeRangeSelector;