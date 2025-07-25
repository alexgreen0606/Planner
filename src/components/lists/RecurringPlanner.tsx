import useSortedList from '@/hooks/useSortedList';
import { useTextfieldItemAs } from '@/hooks/useTextfieldItemAs';
import { EListType } from '@/lib/enums/EListType';
import { ERecurringPlannerKey } from '@/lib/enums/ERecurringPlannerKey';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IRecurringEvent } from '@/lib/types/listItems/IRecurringEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { upsertRecurringEvent, upsertRecurringWeekdayEvent } from '@/storage/recurringPlannerStorage';
import { getIsoRoundedDown5Minutes } from '@/utils/dateUtils';
import { generateCheckboxIconConfig, isItemTextfield } from '@/utils/listUtils';
import { generateSortIdByTime, generateTimeIconConfig, handleNewEventValue } from '@/utils/plannerUtils';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { IconType } from '../icon';
import { ToolbarIcon } from './components/ListToolbar';
import SortableList from './components/SortableList';

// ✅ 

type SortedRecurringPlannerProps = {
    plannerKey: ERecurringPlannerKey;
};

const RecurringPlanner = ({ plannerKey }: SortedRecurringPlannerProps) => {
    const { handleGetIsItemDeleting: getIsItemDeleting, handleToggleScheduleItemDelete: toggleScheduleItemDelete } = useDeleteScheduler<IRecurringEvent>();
    const [textfieldItem, setTextfieldItem] = useTextfieldItemAs<IRecurringEvent>();

    const [showTimeInToolbarForUntimedEvent, setShowTimeInToolbarForUntimedEvent] = useState(false);

    const textfieldDate = useMemo(() => {
        if (textfieldItem?.startTime) {
            const [hour, minute] = textfieldItem.startTime.split(':').map(Number);
            const dateTime = DateTime.local().set({ hour, minute, second: 0, millisecond: 0 });
            return dateTime.toJSDate();
        } else {
            return DateTime.fromISO(getIsoRoundedDown5Minutes()).toJSDate();
        }
    }, [textfieldItem?.startTime]);

    const isWeekdayPlanner = plannerKey === ERecurringPlannerKey.WEEKDAYS;
    const listType = isWeekdayPlanner ? EListType.RECURRING_WEEKDAY : EListType.RECURRING;

    const toolbarIcons: ToolbarIcon<IRecurringEvent>[][] = [[{
        type: 'clock' as IconType,
        onClick: () => { textfieldItem && handleShowEventTime(textfieldItem) },
        customIcon: textfieldItem?.startTime || showTimeInToolbarForUntimedEvent ? (
            <DateTimePicker
                mode='time'
                minuteInterval={5}
                value={textfieldDate}
                onChange={handleTimeChangeUpdateSortId}
            />
        ) : undefined
    }]];

    // ===================
    // 1. List Generation
    // ===================

    const SortedEvents = useSortedList<IRecurringEvent, IRecurringEvent[]>({
        storageId: EStorageId.RECURRING_EVENT,
        storageKey: plannerKey,
        onSaveItemToStorage: isWeekdayPlanner ? upsertRecurringWeekdayEvent : upsertRecurringEvent,
        listType,
        onHandleListChange: () => setShowTimeInToolbarForUntimedEvent(false)
    });

    // ==================
    // 2. Event Handlers
    // ==================

    function handleTimeChangeUpdateSortId(event: DateTimePickerEvent) {
        if (!textfieldItem) return;

        const { timestamp } = event.nativeEvent;

        const selected = DateTime.fromMillis(timestamp);
        const updatedCountdown: IRecurringEvent = {
            ...textfieldItem,
            startTime: selected.toFormat('HH:mm')
        };
        updatedCountdown.sortId = generateSortIdByTime(updatedCountdown, SortedEvents.items);

        setTextfieldItem(updatedCountdown);
    }

    async function handleShowEventTime(item: IRecurringEvent) {
        if (!isItemTextfield(item)) {
            // If this isn't the textfield, make it so.
            await SortedEvents.toggleItemEdit(item);
        }

        setShowTimeInToolbarForUntimedEvent(true);
    }

    // ======
    // 3. UI
    // ======

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
                onSaveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
                onDragEnd={SortedEvents.saveItem}
                onContentClick={SortedEvents.toggleItemEdit}
                toolbarIconSet={toolbarIcons}
                onValueChange={(text, item) => handleNewEventValue(text, item, SortedEvents.items) as IRecurringEvent}
                onGetRightIconConfig={(item) => generateTimeIconConfig(item, handleShowEventTime)}
                onGetLeftIconConfig={(item) => generateCheckboxIconConfig(item, toggleScheduleItemDelete, getIsItemDeleting(item, listType))}
                emptyLabelConfig={{
                    label: `No recurring ${isWeekdayPlanner ? 'weekday' : plannerKey} plans`,
                    className: 'flex-1'
                }}
            />
        </View>
    );
};

export default RecurringPlanner;