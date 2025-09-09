import useIsPlannerEventDeleting from '@/hooks/useIsPlannerEventDeleting';
import usePlanner from '@/hooks/usePlanner';
import useGetPlannerEventToggle from '@/hooks/usePlannerEventToggle';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import { createPlannerEventInStorageAndFocusTextfield, createPlannerEventTimeIcon, deletePlannerEventsFromStorageAndCalendar, updateDeviceCalendarEventByPlannerEvent } from '../../utils/plannerUtils';
import DayBanner from '../banners/DayBanner';
import Card from '../Card';
import DragAndDropList from './components/DragAndDropList';
import { THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import usePlannerEventTimeParser from '@/hooks/usePlannerEventTimeParser';

// ✅ 

type TPlannerCardProps = {
    datestamp: string;
};

const PlannerCard = ({
    datestamp
}: TPlannerCardProps) => {
    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const [collapsed, setCollapsed] = useState(true);

    const {
        planner,
        isEditingTitle,
        isPlannerFocused,
        isLoadingCalendarData,
        onEditTitle,
        OverflowIcon,
        onCloseTextfield,
        onToggleEditTitle,
        onUpdatePlannerEventIndexWithChronologicalCheck
    } = usePlanner(datestamp, eventStorage);

    const { onUpdatePlannerEventValueWithTimeParsing } = usePlannerEventTimeParser(datestamp, eventStorage);

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

    if (isLoadingCalendarData) return null;

    return (
        <Card
            header={
                <DayBanner
                    planner={planner}
                    collapsed={collapsed}
                    isEditingTitle={isEditingTitle}
                    onEditTitle={onEditTitle}
                    onToggleEditTitle={onToggleEditTitle}
                    onToggleCollapsed={handleToggleCollapsed}
                />
            }
            footer={
                <View className='flex-row justify-end h-6'>
                    <OverflowIcon />
                </View>
            }
            collapsed={collapsed}
            contentHeight={planner.eventIds.length ? planner.eventIds.length * LIST_ITEM_HEIGHT + THIN_LINE_HEIGHT : 80}
        >
            <DragAndDropList<IPlannerEvent>
                listId={datestamp}
                itemIds={planner.eventIds}
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
