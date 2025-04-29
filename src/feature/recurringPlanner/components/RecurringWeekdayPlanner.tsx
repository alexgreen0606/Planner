import React, { useMemo, useState } from 'react';
import { datestampToMidnightDate, generateSortIdByTime } from '../../../foundation/calendarEvents/timestampUtils';
import { PLANNER_STORAGE_ID, RecurringEvent } from '../../../foundation/calendarEvents/types';
import { useScrollContainer } from '../../../foundation/sortedLists/services/ScrollContainerProvider';
import { isItemTextfield } from '../../../foundation/sortedLists/utils';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { deleteRecurringWeekdayEvent, generateRecurringWeekdayPlanner, saveRecurringWeekdayEvent } from '../storage/recurringStorage';
import globalStyles from '../../../foundation/theme/globalStyles';
import { View } from 'react-native';
import SortableList from '../../../foundation/sortedLists/components/list/SortableList';
import { generateTimeIconConfig, handleDragEnd, handleEventInput } from '../../../foundation/calendarEvents/sharedListProps';
import { ItemStatus } from '../../../foundation/sortedLists/constants';
import { generateCheckboxIconConfig } from '../../../foundation/sortedLists/commonProps';
import DatePicker from 'react-native-date-picker';
import { useDeleteScheduler } from '../../../foundation/sortedLists/services/DeleteScheduler';

const RECURRING_WEEKDAY_PLANNER_KEY = 'RECURRING_WEEKDAY_PLANNER_KEY';

const RecurringWeekdayPlanner = () => {
    const genericDate = datestampToMidnightDate('2000-01-01');

    const {
        currentTextfield,
        setCurrentTextfield
    } = useScrollContainer();

    const { isItemDeleting } = useDeleteScheduler();

    const [timeModalOpen, setTimeModalOpen] = useState(false);

    function initializeEvent(event: RecurringEvent): RecurringEvent {
        return {
            ...event,
            isWeekdayEvent: true
        }
    };

    async function toggleTimeModal(item: RecurringEvent) {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    };

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

    const SortedEvents = useSortedList<RecurringEvent, RecurringEvent[]>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: RECURRING_WEEKDAY_PLANNER_KEY,
        getItemsFromStorageObject: generateRecurringWeekdayPlanner,
        storageConfig: {
            create: (event) => {
                saveRecurringWeekdayEvent(event);
                SortedEvents.refetchItems();
            },
            update: (event) => {
                saveRecurringWeekdayEvent(event);
                SortedEvents.refetchItems();
            },
            delete: (events) => {
                deleteRecurringWeekdayEvent(events);
                // Manually trigger reload - TODO: is this needed? Wont changing Monday refresh automatically?
                SortedEvents.refetchItems();
            },
        }
    });

    return (
        <View style={globalStyles.blackFilledSpace}>

            <SortableList<RecurringEvent, never, never>
                items={SortedEvents.items}
                listId={RECURRING_WEEKDAY_PLANNER_KEY}
                fillSpace
                initializeItem={initializeEvent}
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                onSaveTextfield={(item) => SortedEvents.persistItemToStorage({ ...item, status: ItemStatus.STATIC })}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)} // TODO: is this needed? Is the list refetched each time?
                onContentClick={SortedEvents.toggleItemEdit}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items) as RecurringEvent}
                getRightIconConfig={(item) => generateTimeIconConfig(item, toggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
                emptyLabelConfig={{
                    label: `No recurring weekday plans`,
                    style: { flex: 1 }
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

export default RecurringWeekdayPlanner;