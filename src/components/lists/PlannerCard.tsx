import useCalendarData from '@/hooks/useCalendarData';
import useIsPlannerEventDeleting from '@/hooks/useIsPlannerEventDeleting';
import usePlanner from '@/hooks/usePlanner';
import useGetPlannerEventToggle from '@/hooks/usePlannerEventToggle';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { WeatherForecast } from '@/utils/weatherUtils';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import { createPlannerEventInStorageAndFocusTextfield, createPlannerEventTimeIcon, deletePlannerEventsFromStorageAndCalendar, updateDeviceCalendarEventByPlannerEvent } from '../../utils/plannerUtils';
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

    useEffect(() => {
        if (isPlannerFocused && collapsed) {
            handleToggleCollapsed();
        }
    }, [isPlannerFocused]);

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
                onValueChange={onUpdatePlannerEventValueWithTimeParsing}
                onIndexChange={onUpdatePlannerEventIndexWithChronologicalCheck}
                onCreateItem={createPlannerEventInStorageAndFocusTextfield}
                onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
                onSaveToExternalStorage={updateDeviceCalendarEventByPlannerEvent}
                onGetRightIcon={createPlannerEventTimeIcon}
                onGetLeftIcon={useGetPlannerEventToggle}
                onGetIsItemDeletingCustom={useIsPlannerEventDeleting}
            />
        </Card>
    );
}

export default PlannerCard;
