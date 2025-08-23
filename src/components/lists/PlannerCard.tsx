import { useCalendarData } from '@/hooks/useCalendarData';
import usePlanner from '@/hooks/usePlanner';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { plannerToolbarIconConfig } from '@/lib/constants/plannerToolbar';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { getTodayDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import { createPlannerEventInStorageAndFocusTextfield, createPlannerEventTimeIconConfig, deletePlannerEventsFromStorageAndCalendar, updateDeviceCalendarEventByPlannerEvent } from '../../utils/plannerUtils';
import DayBanner from '../banners/DayBanner';
import Card from '../Card';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

type TPlannerCardProps = {
    datestamp: string;
    forecast?: WeatherForecast;
};

const PlannerCard = ({
    datestamp,
    forecast
}: TPlannerCardProps) => {
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const [collapsed, setCollapsed] = useState(true);

    const {
        onGetDeletingItemsByStorageIdCallback: onGetDeletingItems,
        onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete
    } = useDeleteScheduler<IPlannerEvent>();

    const { calendarChips } = useCalendarData(datestamp);

    const {
        planner,
        visibleEventIds,
        isEditingTitle,
        isPlannerFocused,
        isLoading,
        onEditTitle,
        OverflowIcon,
        onCloseTextfield,
        onToggleEditTitle,
        onUpdatePlannerEventValueWithTimeParsing,
        onUpdatePlannerEventIndexWithChronologicalCheck
    } = usePlanner(datestamp, eventStorage);

    // Expand the planner if the textfield item belongs to this planner.
    useEffect(() => {
        if (isPlannerFocused && collapsed) {
            handleToggleCollapsed();
        }
    }, [isPlannerFocused]);

    const handleGetIsEventDeletingCallback = useCallback((planEvent: IPlannerEvent | undefined) =>
        planEvent ? onGetDeletingItems(EStorageId.PLANNER_EVENT).some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and it's not from today
            deleteItem.listId !== getTodayDatestamp()
        ) : false,
        [onGetDeletingItems]
    );

    function handleToggleCollapsed() {
        if (isPlannerFocused) {
            onCloseTextfield();
        }

        setCollapsed(curr => !curr);
    }

    if (isLoading) return null;

    return (
        <Card
            header={
                <DayBanner
                    planner={planner}
                    forecast={forecast}
                    eventChipSets={calendarChips}
                    collapsed={collapsed}
                    isEditingTitle={isEditingTitle}
                    onEditTitle={onEditTitle}
                    onToggleEditTitle={onToggleEditTitle}
                    onToggleCollapsed={handleToggleCollapsed}
                />
            }
            footer={
                <View className='flex-row justify-end'>
                    <OverflowIcon />
                </View>
            }
            collapsed={collapsed}
            contentHeight={(visibleEventIds.length + 2) * LIST_ITEM_HEIGHT + 60}
        >
            <DragAndDropList<IPlannerEvent>
                listId={datestamp}
                itemIds={visibleEventIds}
                storageId={EStorageId.PLANNER_EVENT}
                storage={eventStorage}
                emptyLabelConfig={{
                    label: 'No plans',
                    className: 'h-20 flex justify-center items-center'
                }}
                toolbarIconSet={plannerToolbarIconConfig}
                onValueChange={onUpdatePlannerEventValueWithTimeParsing}
                onIndexChange={onUpdatePlannerEventIndexWithChronologicalCheck}
                onCreateItem={createPlannerEventInStorageAndFocusTextfield}
                onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
                onSaveToExternalStorage={updateDeviceCalendarEventByPlannerEvent}
                onGetRightIconConfig={createPlannerEventTimeIconConfig}
                onGetLeftIconConfig={(item) => generateCheckboxIconConfig(handleGetIsEventDeletingCallback(item), onToggleScheduleItemDelete)}
                onGetIsDeletingCustomCallback={handleGetIsEventDeletingCallback}
            />
        </Card>
    );
}

export default PlannerCard;
