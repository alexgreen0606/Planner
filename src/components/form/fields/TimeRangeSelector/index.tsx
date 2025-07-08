import { mountedDatestampsAtom } from '@/atoms/mountedDatestamps';
import ThinLine from '@/components/ThinLine';
import { ETimeSelectorMode } from '@/lib/enums/ETimeSelectorMode';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import TimeSelector from './TimeSelector';

type TimeRangeSelectorProps = {
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
    onChange,
    allDay,
    multiDay,
    triggerOpenField
}: TimeRangeSelectorProps) => {
    const { today } = useAtomValue(mountedDatestampsAtom);

    const [selectorMode, setSelectorMode] = useState<ETimeSelectorMode | null>(null);

    const todayMidnight: Date = useMemo(() => {
        return DateTime.local().startOf('day').toJSDate();
    }, [today]);

    const startDate: Date = useMemo(() => {
        return DateTime.fromISO(startIso).toJSDate();
    }, [startIso]);

    const endDate: Date = useMemo(() => {
        return DateTime.fromISO(endIso).toJSDate();
    }, [endIso]);

    const showEndTime = endIso && multiDay;
    const showTimes = !allDay;

    // ---------- Utility Functions ----------

    function toggleSelectorMode(newMode: ETimeSelectorMode) {
        if (newMode === selectorMode) {
            setSelectorMode(null);
        } else {
            setSelectorMode(newMode);
        }
    }

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

    // ---------- Reactions ----------

    useEffect(() => {
        if (allDay) {
            resetTimesToMidnight();
            setSelectorMode(null);
        }
    }, [allDay]);

    useEffect(() => {
        if (triggerOpenField) {
            setSelectorMode(triggerOpenField);
        }
    }, [triggerOpenField]);

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
                onToggleMode={toggleSelectorMode}
                onChange={handleChange}
                minimumDate={todayMidnight}
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
                    onToggleMode={toggleSelectorMode}
                    onChange={handleChange}
                    minimumDate={startDate}
                />
            )}

        </View>
    )
};

export default TimeRangeSelector;
