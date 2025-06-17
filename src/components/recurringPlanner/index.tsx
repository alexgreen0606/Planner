import { RECURRING_EVENT_STORAGE_ID } from '@/lib/constants/storage';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/providers/ScrollContainer';
import { deleteRecurringEvents, deleteRecurringWeekdayEvents, saveRecurringEvent, saveRecurringWeekdayEvent } from '@/storage/recurringPlannerStorage';
import { datestampToMidnightDate } from '@/utils/dateUtils';
import { generateCheckboxIconConfig, isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime, generateTimeIconConfig, handleEventValueUserInput } from '@/utils/plannerUtils';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { IconType } from '../icon';
import SortableList from '../sortedList';
import { ERecurringPlannerKey } from '@/lib/enums/ERecurringPlannerKey';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';

interface SortedRecurringPlannerProps {
    plannerKey: string;
}

const RecurringPlanner = ({ plannerKey }: SortedRecurringPlannerProps) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IRecurringEvent>();
    const { isItemDeleting } = useDeleteScheduler<IRecurringEvent>();
    const { focusPlaceholder } = useScrollContainer();

    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const textfieldDateObject: Date = useMemo(() => {
        const genericDate = datestampToMidnightDate('2000-01-01');
        if (textfieldItem?.startTime) {
            const timedDate = new Date(genericDate);
            const [hour, minute] = textfieldItem.startTime.split(':').map(Number);
            timedDate.setHours(hour, minute);
            return timedDate;
        } else {
            return genericDate;
        }
    }, [textfieldItem]);

    const isWeekdayEvent = plannerKey === ERecurringPlannerKey.WEEKDAYS;

    async function toggleTimeModal(item: IRecurringEvent) {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    }

    function handleSaveEventTime(date: Date) {
        if (!textfieldItem) return;

        focusPlaceholder();

        const newItem = { ...textfieldItem };
        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        newItem.startTime = formattedTime;
        newItem.sortId = generateSortIdByTime(newItem, SortedEvents.items);

        setTextfieldItem(newItem);
        setTimeModalOpen(false);
    }

    function generateToolbar(event: IRecurringEvent) {
        return {
            item: event,
            open: !timeModalOpen && isItemTextfield(event),
            iconSets: [[{
                type: 'clock' as IconType,
                onClick: () => toggleTimeModal(event)
            }]]
        }
    }

    const SortedEvents = useSortedList<IRecurringEvent, IRecurringEvent[]>({
        storageId: RECURRING_EVENT_STORAGE_ID,
        storageKey: plannerKey,
        storageConfig: {
            createItem: isWeekdayEvent ? saveRecurringWeekdayEvent : saveRecurringEvent,
            updateItem: isWeekdayEvent ? saveRecurringWeekdayEvent : saveRecurringEvent,
            deleteItems: isWeekdayEvent ? deleteRecurringWeekdayEvents : deleteRecurringEvents
        }
    });

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >
            <SortableList<IRecurringEvent>
                items={SortedEvents.items}
                listId={plannerKey}
                fillSpace
                isLoading={SortedEvents.isLoading}
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onDragEnd={SortedEvents.persistItemToStorage}
                onContentClick={SortedEvents.toggleItemEdit}
                getToolbarProps={generateToolbar}
                hideKeyboard={timeModalOpen}
                handleValueChange={(text, item) => handleEventValueUserInput(text, item, SortedEvents.items) as IRecurringEvent}
                getRightIconConfig={(item) => generateTimeIconConfig(item, toggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
                emptyLabelConfig={{
                    label: `No recurring ${isWeekdayEvent ? 'weekday' : plannerKey} plans`,
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
                onConfirm={handleSaveEventTime}
                onCancel={() => toggleTimeModal(textfieldItem!)}
            />
        </View>
    );
};

export default RecurringPlanner;