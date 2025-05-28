import { calendarChipsByDate, calendarPlannerByDate } from '@/atoms/calendarEvents';
import { LIST_ITEM_HEIGHT } from '@/constants/layout';
import { PLANNER_STORAGE_ID } from '@/constants/storageIds';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import useSortedList from '@/hooks/useSortedList';
import { useTextfieldData } from '@/hooks/useTextfieldData';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { TPlanner } from '@/types/planner/TPlanner';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { usePathname, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import BadgeNumber from '../../components/BadgeNumber';
import Card from '../../components/Card';
import EventChip, { EventChipProps } from '../../components/EventChip';
import { generatePlanner } from '../../utils/calendarUtils';
import { buildPlannerEvents, deleteEventsReloadData, generateEventToolbar, generateTimeIconConfig, handleEventInput, openTimeModal, saveEventReloadData } from '../../utils/plannerUtils';
import BadgeIcon from '../BadgeIcon';
import { GenericIconProps } from '../GenericIcon';
import SortableList from '../sortedList';
import { ToolbarProps } from '../sortedList/ListItemToolbar';
import DayBanner from './DayBanner';

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

    const pathname = usePathname();

    const isTimeModalOpen = pathname.includes('timeModal');

    const router = useRouter();

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

    function handleOpenTimeModal(item: IPlannerEvent) {
        openTimeModal(datestamp, item, router);
    }

    async function handleSaveEvent(event: IPlannerEvent) {
        const savedEvent = await saveEventReloadData(event);
        return savedEvent?.calendarId;
    }

    async function handleDeleteEvents(planEvents: IPlannerEvent[]) {
        await deleteEventsReloadData(planEvents);
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
            update: (updatedEvent) => { saveEventReloadData(updatedEvent) },
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
                onDragEnd={SortedEvents.persistItemToStorage}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onContentClick={SortedEvents.toggleItemEdit}
                hideKeyboard={isTimeModalOpen}
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
