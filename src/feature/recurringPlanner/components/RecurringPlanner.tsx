import { PLANNER_STORAGE_ID } from '@/constants/storageIds';
import { EItemStatus } from '@/enums/EItemStatus';
import { ERecurringPlannerKeys } from '@/enums/ERecurringPlannerKeys';
import SortableList from '@/feature/sortedList';
import { IRecurringEvent } from '@/types/listItems/IRecurringEvent';
import { datestampToMidnightDate, generateSortIdByTime } from '@/utils/calendarUtils/timestampUtils';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useDeleteScheduler } from '../../../services/DeleteScheduler';
import { useScrollContainer } from '../../../services/ScrollContainerProvider';
import { generateTimeIconConfig, handleDragEnd, handleEventInput } from '../../../utils/calendarUtils/sharedListProps';
import { generateCheckboxIconConfig } from '../../sortedList/commonProps';
import useSortedList from '../../sortedList/hooks/useSortedList';
import { isItemTextfield } from '../../sortedList/utils';

interface SortedRecurringPlannerProps {
    plannerKey: ERecurringPlannerKeys;
}

const RecurringPlanner = ({ plannerKey }: SortedRecurringPlannerProps) => {
    const genericDate = datestampToMidnightDate('2000-01-01');

    const {
        currentTextfield,
        setCurrentTextfield
    } = useScrollContainer();

    const { isItemDeleting } = useDeleteScheduler();

    const [timeModalOpen, setTimeModalOpen] = useState(false);

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
        storageKey: plannerKey
    });

    return (
        <View
            className='flex-1'
            style={{ backgroundColor: PlatformColor('systemBackground') }}
        >
            <SortableList<IRecurringEvent, never, never>
                items={SortedEvents.items}
                listId={plannerKey}
                fillSpace
                getTextfieldKey={item => `${item.id}-${item.sortId}-${item.startTime}`}
                onSaveTextfield={(item) => SortedEvents.persistItemToStorage({ ...item, status: EItemStatus.STATIC })}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)} // TODO: is this needed? Is the list refetched each time?
                onContentClick={SortedEvents.toggleItemEdit}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items) as IRecurringEvent}
                getRightIconConfig={(item) => generateTimeIconConfig(item, toggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
                emptyLabelConfig={{
                    label: `No recurring ${plannerKey} plans`,
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

export default RecurringPlanner;