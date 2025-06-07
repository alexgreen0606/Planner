import { RECURRING_EVENT_STORAGE_ID } from '@/constants/storage';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { useScrollContainer } from '@/services/ScrollContainer';
import { deleteRecurringEvents, saveRecurringEvent } from '@/storage/recurringPlannerStorage';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { datestampToMidnightDate } from '@/utils/dateUtils';
import { generateCheckboxIconConfig, isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime, generateTimeIconConfig, handleEventValueUserInput } from '@/utils/plannerUtils';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { IconType } from '../GenericIcon';
import SortableList from '../sortedList';

interface SortedRecurringPlannerProps {
    weekday: string;
}

const RecurringPlanner = ({ weekday }: SortedRecurringPlannerProps) => {
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

    async function toggleTimeModal(item: IRecurringEvent) {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    }

    function onSaveEventTime(date: Date) {
        if (!textfieldItem) return;

        focusPlaceholder();

        const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        textfieldItem.startTime = formattedTime;
        textfieldItem.sortId = generateSortIdByTime(textfieldItem, SortedEvents.items);
        setTextfieldItem({ ...textfieldItem, startTime: formattedTime });
        toggleTimeModal(textfieldItem);
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
        storageKey: weekday,
        storageConfig: {
            createItem: saveRecurringEvent,
            updateItem: saveRecurringEvent,
            deleteItems: deleteRecurringEvents
        }
    });

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >
            <SortableList<IRecurringEvent>
                items={SortedEvents.items}
                listId={weekday}
                fillSpace
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
                    label: `No recurring ${weekday} plans`,
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

export default RecurringPlanner;