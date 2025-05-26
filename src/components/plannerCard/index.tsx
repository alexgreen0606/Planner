import { usePathname } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { TIME_MODAL_PATHNAME } from '../../../app/(modals)/TimeModal';
import BadgeNumber from '../../components/BadgeNumber';
import Card from '../../components/Card';
import EventChip, { EventChipProps } from '../../components/EventChip';
import { generatePlanner } from '../../utils/calendarUtils';
import { buildPlannerEvents, deleteEventsReloadData, generateEventToolbar, generateTimeIconConfig, handleDragEnd, handleEventInput, openTimeModal, saveEventReloadData } from '../../utils/plannerUtils';
import SortableList from '../sortedList';
import DayBanner from './DayBanner';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { useTimeModal } from '@/services/TimeModalProvider';
import { PLANNER_STORAGE_ID } from '@/constants/storageIds';
import { TPlanner } from '@/types/planner/TPlanner';
import { LIST_ITEM_HEIGHT } from '@/constants/layout';
import { getTodayDatestamp, isoToDatestamp } from '@/utils/dateUtils';
import useSortedList from '@/hooks/useSortedList';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { ToolbarProps } from '../sortedList/ListItemToolbar';
import { calendarChipsByDate, calendarPlannerByDate } from '@/atoms/calendarEvents';
import { useAtom } from 'jotai';
import { useTextfieldData } from '@/hooks/useTextfieldData';
import { GenericIconProps } from '../GenericIcon';
import BadgeIcon from '../BadgeIcon';
import { useReloadScheduler } from '@/hooks/useReloadScheduler';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';

interface PlannerCardProps {
    datestamp: string;
    forecast?: WeatherForecast;
};

interface ColorCount {
    color?: string;
    count: number;
}

interface IconColors {
    color?: string;
    iconConfig: GenericIconProps;
}

function getColorCounts(chips: EventChipProps[]): ColorCount[] {
    const colorMap: Record<string, number> = {};

    for (const chip of chips) {
        const { color } = chip;
        colorMap[color] = (colorMap[color] || 0) + 1;
    }

    return Object.entries(colorMap)
        .sort(([colorA], [colorB]) => colorA.localeCompare(colorB)) // Alphabetical sort
        .map(([color, count]) => ({ color, count }));
}

function getIcons(chips: EventChipProps[]): IconColors[] {
    const colorMap: Record<string, any> = {};

    for (const chip of chips) {
        const { color, iconConfig } = chip;
        colorMap[color] = iconConfig
    }

    return Object.entries(colorMap)
        .sort(([colorA], [colorB]) => colorA.localeCompare(colorB)) // Alphabetical sort
        .map(([color, iconConfig]) => ({ color, iconConfig }));
}

const PlannerCard = ({
    datestamp,
    forecast
}: PlannerCardProps) => {

    const [calendarEvents] = useAtom(calendarPlannerByDate(datestamp));
    const [calendarChips] = useAtom(calendarChipsByDate(datestamp));

    const { currentTextfield, setCurrentTextfield } = useTextfieldData<IPlannerEvent>();

    const { onOpen } = useTimeModal();

    const pathname = usePathname();

    const isTimeModalOpen = pathname === TIME_MODAL_PATHNAME;

    const { reloadPage } = useReloadScheduler();

    const { getDeletingItems } = useDeleteScheduler<IPlannerEvent>();

    const [collapsed, setCollapsed] = useState(true);

    // ------------- Utility Functions -------------

    const isEventDeleting = useCallback((planEvent: IPlannerEvent) => {
        const deletingItems = getDeletingItems();
        return deletingItems.some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and is rooted in this planner (deleting multi-day start events should not mark the end event as deleting)
            deleteItem.listId === datestamp
        );
    }, [getDeletingItems]);

    async function toggleCollapsed() {
        if (currentTextfield) {
            if (currentTextfield.value.trim() !== '')
                await SortedEvents.persistItemToStorage(currentTextfield);
            setCurrentTextfield(undefined);
        }
        setCollapsed(curr => !curr);
    };

    // ------------- List Management Utils -------------

    async function handleOpenTimeModal(item: IPlannerEvent) {
        await openTimeModal(
            item,
            SortedEvents.toggleItemEdit,
            onOpen,
            SortedEvents.items,
            SortedEvents.saveTextfieldAndCreateNew
        );
    }

    async function handleSaveEvent(planEvent: IPlannerEvent): Promise<string | undefined> {
        return await saveEventReloadData(planEvent, SortedEvents.items);
    }

    async function handleDeleteEvents(planEvents: IPlannerEvent[]) {
        await deleteEventsReloadData(planEvents);

        if (planEvents.some(event =>
            event.timeConfig && (isoToDatestamp(event.timeConfig.startTime) === getTodayDatestamp())
        )) {
            // Reload today's planner to remove the deleted chip
            reloadPage('/');
        }
    }

    const getItemsFromStorageObject = (planner: TPlanner) => {
        return buildPlannerEvents(datestamp, planner, calendarEvents);
    };

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        initializedStorageObject: generatePlanner(datestamp),
        storageConfig: {
            create: handleSaveEvent,
            update: (updatedEvent) => { handleSaveEvent(updatedEvent) },
            delete: handleDeleteEvents
        },
        reloadTriggers: [calendarEvents],
        reloadOnNavigate: true
    });

    const badgesConfig = useMemo(() => {
        const eventColorCounts = getIcons(calendarChips);
        return eventColorCounts;
    }, [calendarChips, SortedEvents.items.length]);

    return (
        <Card
            header={
                <DayBanner
                    planner={SortedEvents.storageObject as TPlanner}
                    toggleCollapsed={toggleCollapsed}
                    forecast={forecast}
                />
            }
            footer={calendarChips.length > 0 &&
                <View className='flex-row gap-2 items-center flex-wrap w-full'>
                    {calendarChips.map((allDayEvent, i) =>
                        <EventChip
                            key={`${datestamp}-chip-${i}`}
                            {...allDayEvent}
                        />
                    )}
                </View>
            }
            badges={collapsed &&
                <View className='flex-row items-center gap-2'>
                    {badgesConfig.map((config, i) => (
                        <BadgeIcon
                            key={`${datestamp}-badge-${i}`}
                            {...config}
                        />
                    ))}
                    {SortedEvents.items.length > 0 && (
                        <BadgeNumber count={SortedEvents.items.length} />
                    )}
                </View>
            }
            collapsed={collapsed}
            contentHeight={
                ((SortedEvents.items.length + 1) * LIST_ITEM_HEIGHT) +
                (calendarChips.length * LIST_ITEM_HEIGHT) +
                LIST_ITEM_HEIGHT
            }
        >
            <SortableList<IPlannerEvent, ToolbarProps<IPlannerEvent>, never>
                listId={datestamp}
                items={SortedEvents.items}
                saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onContentClick={SortedEvents.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${isTimeModalOpen}`}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
                getRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isEventDeleting(item))}
                getToolbar={(event) => generateEventToolbar(event, handleOpenTimeModal, isTimeModalOpen)}
                customIsItemDeleting={isEventDeleting}
                emptyLabelConfig={{
                    label: 'No Plans',
                    className: 'h-20 flex justify-center items-center'
                }}
            />
        </Card>
    );
};

export default PlannerCard;
