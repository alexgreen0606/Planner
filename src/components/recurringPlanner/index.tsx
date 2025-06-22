import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/providers/ScrollContainer';
import { deleteRecurringEvents, deleteRecurringWeekdayEvents, saveRecurringEvent, saveRecurringWeekdayEvent } from '@/storage/recurringPlannerStorage';
import { datestampToMidnightDate } from '@/utils/dateUtils';
import { generateCheckboxIconConfig, isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime, generateTimeIconConfig, handleEventValueUserInput } from '@/utils/plannerUtils';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { IconType } from '../icon';
import DateTimePicker from '@react-native-community/datetimepicker';
import SortableList from '../sortedList';
import { ERecurringPlannerKey } from '@/lib/enums/ERecurringPlannerKey';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';

interface SortedRecurringPlannerProps {
    plannerKey: string;
}

const RecurringPlanner = ({ plannerKey }: SortedRecurringPlannerProps) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IRecurringEvent>();
    const { getIsItemDeleting, toggleScheduleItemDelete } = useDeleteScheduler<IRecurringEvent>();
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

    const isWeekdayPlanner = plannerKey === ERecurringPlannerKey.WEEKDAYS;

    const listType = isWeekdayPlanner ? EListType.RECURRING_WEEKDAY : EListType.RECURRING;

    async function toggleTimeModal(item: IRecurringEvent) {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    }

    function toggleScheduleEventDelete(event: IRecurringEvent) {
        toggleScheduleItemDelete(event, listType);
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
        storageId: EStorageId.RECURRING_EVENT,
        storageKey: plannerKey,
        storageConfig: {
            createItem: isWeekdayPlanner ? saveRecurringWeekdayEvent : saveRecurringEvent,
            updateItem: isWeekdayPlanner ? saveRecurringWeekdayEvent : saveRecurringEvent
        },
        listType
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
                listType={listType}
                isLoading={SortedEvents.isLoading}
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
                onDragEnd={SortedEvents.persistItemToStorage}
                onContentClick={SortedEvents.toggleItemEdit}
                getToolbarProps={generateToolbar}
                hideKeyboard={timeModalOpen}
                handleValueChange={(text, item) => handleEventValueUserInput(text, item, SortedEvents.items) as IRecurringEvent}
                getRightIconConfig={(item) => generateTimeIconConfig(item, toggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, toggleScheduleEventDelete, getIsItemDeleting(item, listType))}
                emptyLabelConfig={{
                    label: `No recurring ${isWeekdayPlanner ? 'weekday' : plannerKey} plans`,
                    className: 'flex-1'
                }}
            />
            <DateTimePicker
                mode='time'
                title={`"${textfieldItem?.value}" Time`}
                minuteInterval={5}
                // open={timeModalOpen && Boolean(textfieldItem)}
                value={textfieldDateObject}
            // onConfirm={handleSaveEventTime}
            // onCancel={() => toggleTimeModal(textfieldItem!)}
            />
        </View>
    );
};

export default RecurringPlanner;