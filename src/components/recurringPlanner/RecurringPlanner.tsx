import { RECURRING_EVENT_STORAGE_ID } from '@/constants/storage';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { datestampToMidnightDate } from '@/utils/dateUtils';
import { generateCheckboxIconConfig, isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime, generateTimeIconConfig, handleEventValueUserInput } from '@/utils/plannerUtils';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import SortableList from '../sortedList';
import { EItemStatus } from '@/enums/EItemStatus';
import { deleteRecurringEvents, saveRecurringEvent } from '@/storage/recurringPlannerStorage';

interface SortedRecurringPlannerProps {
    weekday: string;
}

const RecurringPlanner = ({ weekday }: SortedRecurringPlannerProps) => {
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IRecurringEvent>();
    const { isItemDeleting } = useDeleteScheduler<IRecurringEvent>();

    const [timeModalOpen, setTimeModalOpen] = useState(false);

    const genericDate = datestampToMidnightDate('2000-01-01');

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

    function handleDeleteItem(item: IRecurringEvent) {
        SortedEvents.persistItemToStorage({ ...item, status: EItemStatus.HIDDEN });
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
            <SortableList<IRecurringEvent, never, never>
                items={SortedEvents.items}
                listId={weekday}
                fillSpace
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
                onDeleteItem={handleDeleteItem}
                onDragEnd={SortedEvents.persistItemToStorage}
                onContentClick={SortedEvents.toggleItemEdit}
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