import React, { useMemo, useState } from 'react';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { RecurringPlannerKeys } from '../constants';
import { datestampToMidnightDate, generateSortIdByTime } from '../../../foundation/calendarEvents/timestampUtils';
import { useSortableList } from '../../../foundation/sortedLists/services/SortableListProvider';
import { PLANNER_STORAGE_ID, RecurringEvent } from '../../../foundation/calendarEvents/types';
import { View } from 'react-native';
import globalStyles from '../../../foundation/theme/globalStyles';
import SortableList from '../../../foundation/sortedLists/components/list/SortableList';
import { generateTimeIconConfig, handleDragEnd, handleEventInput } from '../../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../../foundation/sortedLists/commonProps';
import { ItemStatus } from '../../../foundation/sortedLists/constants';
import DatePicker from 'react-native-date-picker';
import { isItemTextfield } from '../../../foundation/sortedLists/utils';
import { useDeleteScheduler } from '../../../foundation/sortedLists/services/DeleteScheduler';

interface SortedRecurringPlannerProps {
    plannerKey: RecurringPlannerKeys;
}

const RecurringPlanner = ({ plannerKey }: SortedRecurringPlannerProps) => {
    const genericDate = datestampToMidnightDate('2000-01-01');

    const { 
        currentTextfield, 
        setCurrentTextfield 
    } = useSortableList();

    const {isItemDeleting} = useDeleteScheduler();

    const [timeModalOpen, setTimeModalOpen] = useState(false);

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
        storageKey: plannerKey
    });

    return (
        <View style={globalStyles.blackFilledSpace}>
            <SortableList<RecurringEvent, never, never>
                items={SortedEvents.items}
                listId={plannerKey}
                fillSpace
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                onSaveTextfield={(item) => SortedEvents.persistItemToStorage({ ...item, status: ItemStatus.STATIC })}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)} // TODO: is this needed? Is the list refetched each time?
                onContentClick={SortedEvents.toggleItemEdit}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items) as RecurringEvent}
                getRightIconConfig={(item) => generateTimeIconConfig(item, toggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
                emptyLabelConfig={{
                    label: `No recurring ${plannerKey} plans`,
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

export default RecurringPlanner;