import { PLANNER_STORAGE_ID } from '@/constants/storageIds';
import { EItemStatus } from '@/enums/EItemStatus';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import useSortedList from '@/hooks/useSortedList';
import { deleteRecurringWeekdayEvent, generateRecurringWeekdayPlanner, saveRecurringWeekdayEvent } from '@/storage/recurringEventStorage';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { datestampToMidnightDate } from '@/utils/dateUtils';
import { generateCheckboxIconConfig, isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime, generateTimeIconConfig, handleEventInput } from '@/utils/plannerUtils';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import SortableList from '../sortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';

const RECURRING_WEEKDAY_PLANNER_KEY = 'RECURRING_WEEKDAY_PLANNER_KEY';

const RecurringWeekdayPlanner = () => {
    const genericDate = datestampToMidnightDate('2000-01-01');

    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IRecurringEvent>();

    const { isItemDeleting } = useDeleteScheduler<IRecurringEvent>();

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
        if (textfieldItem?.startTime) {
            const timedDate = new Date(genericDate);
            const [hour, minute] = textfieldItem.startTime.split(':').map(Number);
            timedDate.setHours(hour, minute);
            return timedDate;
        } else {
            return genericDate;
        }
    }, [textfieldItem]);

    function onSaveEventTime(date: Date) {
        if (!textfieldItem) return;
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        textfieldItem.startTime = formattedTime;
        textfieldItem.sortId = generateSortIdByTime(textfieldItem, SortedEvents.items);
        setTextfieldItem({ ...textfieldItem, startTime: formattedTime });
        toggleTimeModal(textfieldItem);
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
        },
        initializeListItem: initializeEvent
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
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                saveTextfieldAndCreateNew={(item, refId, isChildId) => SortedEvents.saveTextfieldAndCreateNew(
                    item ? { ...item, status: EItemStatus.STATIC } : null,
                    refId,
                    isChildId
                )}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onDragEnd={SortedEvents.persistItemToStorage}
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
                title={`"${textfieldItem?.value}" Time`}
                minuteInterval={5}
                theme='dark'
                open={timeModalOpen && Boolean(textfieldItem)}
                date={textfieldDateObject}
                onConfirm={onSaveEventTime}
                onCancel={() => toggleTimeModal(textfieldItem!)}
            />
        </View>
    );
};

export default RecurringWeekdayPlanner;