import useIsPlannerEventDeleting from '@/hooks/planners/useIsPlannerEventDeleting';
import usePlanner from '@/hooks/planners/usePlanner';
import usePlannerEventTimeParser from '@/hooks/planners/usePlannerEventTimeParser';
import useGetPlannerEventToggle from '@/hooks/planners/usePlannerEventToggle';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { THIN_LINE_HEIGHT } from '@/lib/constants/miscLayout';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { PlatformColor, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import { createPlannerEventInStorageAndFocusTextfield, createPlannerEventTimeIcon, deletePlannerEventsFromStorageAndCalendar, updateDeviceCalendarEventByPlannerEvent } from '../../utils/plannerUtils';
import DayBanner from '../banners/DayBanner';
import DragAndDropList from './components/DragAndDropList';

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
        onEditTitle,
        OverflowActionsIcon,
        onCloseTextfield,
        onToggleEditTitle,
        onUpdatePlannerEventIndexWithChronologicalCheck
    } = usePlanner(datestamp, eventStorage);

    const { onUpdatePlannerEventValueWithTimeParsing } = usePlannerEventTimeParser(datestamp, eventStorage);

    useEffect(() => {
        if (isPlannerFocused && collapsed) {
            handleToggleCollapsed(false);
        }
    }, [isPlannerFocused]);

    function handleToggleCollapsed(closeTextfield: boolean = true) {
        if (isPlannerFocused && closeTextfield) {
            onCloseTextfield();
        }

        setCollapsed(curr => !curr);
    }

    const contentHeight = planner.eventIds.length ? planner.eventIds.length * LIST_ITEM_HEIGHT + THIN_LINE_HEIGHT : 70;

    return (
        <View
            className='relative rounded-xl'
            style={{ backgroundColor: PlatformColor('systemGray6') }}
        >
            <DayBanner
                planner={planner}
                collapsed={collapsed}
                isEditingTitle={isEditingTitle}
                onEditTitle={onEditTitle}
                onToggleEditTitle={onToggleEditTitle}
                onToggleCollapsed={handleToggleCollapsed}
            />
            <MotiView
                className='overflow-hidden'
                animate={{
                    height: collapsed ? 0 : contentHeight + 36
                }}
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
                <View className='items-end h-6 p-2'>
                    <OverflowActionsIcon />
                </View>
            </MotiView>
        </View >
    )
};

export default PlannerCard;
