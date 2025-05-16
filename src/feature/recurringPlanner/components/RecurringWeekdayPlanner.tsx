import { PLANNER_STORAGE_ID } from '@/constants/storageIds';
import { EItemStatus } from '@/enums/EItemStatus';
import SortableList from '@/feature/sortedList';
import { generateCheckboxIconConfig } from '@/feature/sortedList/commonProps';
import useSortedList from '@/feature/sortedList/hooks/useSortedList';
import { isItemTextfield } from '@/feature/sortedList/utils';
import { useDeleteScheduler } from '@/services/DeleteScheduler';
import { useScrollContainer } from '@/services/ScrollContainer';
import { deleteRecurringWeekdayEvent, generateRecurringWeekdayPlanner, saveRecurringWeekdayEvent } from '@/storage/recurringEventStorage';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { generateTimeIconConfig, handleDragEnd, handleEventInput } from '@/utils/calendarUtils/sharedListProps';
import { datestampToMidnightDate, generateSortIdByTime } from '@/utils/calendarUtils/timestampUtils';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import DatePicker from 'react-native-date-picker';

const RECURRING_WEEKDAY_PLANNER_KEY = 'RECURRING_WEEKDAY_PLANNER_KEY';

const RecurringWeekdayPlanner = () => {
    const genericDate = datestampToMidnightDate('2000-01-01');

    const {
        currentTextfield,
        setCurrentTextfield
    } = useScrollContainer();

    const { isItemDeleting } = useDeleteScheduler();

    const [timeModalOpen, setTimeModalOpen] = useState(false);

    function initializeEvent(event: IRecurringEvent): IRecurringEvent {
        return {
            ...event,
            isWeekdayEvent: true
        }
    };

    async function toggleTimeModal(item: IRecurringEvent) {
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

    const SortedEvents = useSortedList<IRecurringEvent, IRecurringEvent[]>({
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
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >

            <SortableList<IRecurringEvent, never, never>
                items={SortedEvents.items}
                listId={RECURRING_WEEKDAY_PLANNER_KEY}
                fillSpace
                initializeItem={initializeEvent}
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                onSaveTextfield={(item) => SortedEvents.persistItemToStorage({ ...item, status: EItemStatus.STATIC })}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)} // TODO: is this needed? Is the list refetched each time?
                onContentClick={SortedEvents.toggleItemEdit}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items) as IRecurringEvent}
                getRightIconConfig={(item) => generateTimeIconConfig(item, toggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
                emptyLabelConfig={{
                    label: `No recurring weekday plans`,
                    className: 'flex-1'
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