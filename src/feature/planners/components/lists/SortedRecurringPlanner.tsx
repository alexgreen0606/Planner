import React, { useEffect, useMemo, useState } from 'react';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import TimeValue from '../../../../foundation/calendar/components/TimeValue';
import {
    extractTimeValue,
    generateSortIdByTime,
    genericTimestampToMidnightDate
} from '../../../../foundation/calendar/dateUtils';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { isItemDeleting, isItemTextfield, ItemStatus } from '../../../../foundation/sortedLists/sortedListUtils';
import { useSortableListContext } from '../../../../foundation/sortedLists/services/SortableListProvider';
import { Color } from '../../../../foundation/theme/colors';
import { View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { PLANNER_STORAGE_ID, RECURRING_WEEKDAY_PLANNER_KEY, RecurringEvent } from '../../../../foundation/calendar/calendarUtils';

interface SortedRecurringPlannerProps {
    modalOpen: boolean;
}

const SortedRecurringPlanner = ({ modalOpen }: SortedRecurringPlannerProps) => {
    const genericDate = genericTimestampToMidnightDate('2000-01-01');
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const textfieldDateObject: Date = useMemo(() => {
        if (currentTextfield?.startTime) {
            const timedDate = new Date(genericDate);
            const [hour, minute] = currentTextfield.startTime.split(':').map(Number);
            timedDate.setHours(hour, minute);
            return timedDate;
        } else {
            return genericDate;
        }
    }, [currentTextfield]);

    const toggleTimeModal = async (item: RecurringEvent) => {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    };

    // Stores the current recurring weekday planner and all handler functions to update it
    const SortedEvents = useSortedList<RecurringEvent, RecurringEvent[]>(
        RECURRING_WEEKDAY_PLANNER_KEY,
        PLANNER_STORAGE_ID,
    );

    // Save the textfield when the modal closes
    useEffect(() => {
        if (!modalOpen && currentTextfield) {
            SortedEvents.persistItemToStorage({ ...currentTextfield, status: ItemStatus.STATIC });
            setCurrentTextfield(undefined);
        }
    }, [modalOpen]);

    function onSaveEventTime(date: Date) {
        if (!currentTextfield) return;
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        currentTextfield.startTime = formattedTime;
        const updatedList = [...SortedEvents.items];
        const itemCurrentIndex = SortedEvents.items.findIndex(item => item.id === currentTextfield.id);
        if (itemCurrentIndex !== -1) {
            updatedList[itemCurrentIndex] = currentTextfield;
        } else {
            updatedList.push(currentTextfield);
        }
        currentTextfield.sortId = generateSortIdByTime(currentTextfield, updatedList);
        setCurrentTextfield({ ...currentTextfield, startTime: formattedTime });
        toggleTimeModal(currentTextfield);
    };

    return (
        <View>
            <SortableList<RecurringEvent, never, never>
                items={SortedEvents.items}
                listId={RECURRING_WEEKDAY_PLANNER_KEY}
                getLeftIconConfig={item => ({
                    icon: {
                        type: 'trash',
                        color: isItemDeleting(item) ? Color.WHITE : Color.DIM
                    },
                    onClick: SortedEvents.toggleItemDelete
                })}
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                onSaveTextfield={(item) => SortedEvents.persistItemToStorage({ ...item, status: ItemStatus.STATIC })}
                onDeleteItem={SortedEvents.deleteItemFromStorage}
                onDragEnd={async (item) => { await SortedEvents.persistItemToStorage(item) }}
                onContentClick={SortedEvents.toggleItemEdit}
                getRightIconConfig={item => ({
                    hideIcon: item.status === ItemStatus.STATIC && !item.startTime,
                    icon: {
                        type: 'clock',
                        color: Color.DIM
                    },
                    onClick: toggleTimeModal,
                    customIcon: item.startTime ? <TimeValue allDay={false} timeValue={item.startTime} /> : undefined
                })}
                handleValueChange={(text, item) => {
                    const newEvent = {
                        ...item,
                        value: text,
                    };
                    if (!item.startTime) {
                        const { timeConfig, updatedText } = extractTimeValue(text);
                        if (timeConfig) {
                            newEvent.startTime = timeConfig.startTime;
                            newEvent.value = updatedText;
                            const updatedList = [...SortedEvents.items];
                            const itemCurrentIndex = SortedEvents.items.findIndex(item => item.id === currentTextfield.id);
                            if (itemCurrentIndex !== -1) {
                                updatedList[itemCurrentIndex] = newEvent;
                            } else {
                                updatedList.push(newEvent);
                            }
                            newEvent.sortId = generateSortIdByTime(newEvent, updatedList);
                        }
                    }
                    return newEvent;
                }}
                emptyLabelConfig={{
                    label: 'No recurring weekday plans',
                    style: { height: 400 }
                }}
            />
            <DatePicker
                modal
                mode='time'
                title={`"${currentTextfield?.value}" Time`}
                minuteInterval={5}
                theme='dark'
                open={timeModalOpen && currentTextfield}
                date={textfieldDateObject}
                onConfirm={onSaveEventTime}
                onCancel={() => toggleTimeModal(currentTextfield)}
            />
        </View>
    );
};

export default SortedRecurringPlanner;