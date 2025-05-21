import { usePathname } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { TIME_MODAL_PATHNAME } from '../../../app/(modals)/TimeModal';
import BadgeNumber from '../../components/BadgeNumber';
import Card from '../../components/Card';
import EventChip, { EventChipProps } from '../../components/EventChip';
import { generatePlanner } from '../../utils/calendarUtils';
import { buildPlannerEvents, deleteEventsLoadChips, generateEventToolbar, generateTimeIconConfig, handleDragEnd, handleEventInput, openTimeModal, saveEventLoadChips } from '../../utils/plannerUtils';
import SortableList from '../sortedList';
import DayBanner from './DayBanner';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { useTimeModal } from '@/services/TimeModalProvider';
import { PLANNER_STORAGE_ID } from '@/constants/storageIds';
import { TPlanner } from '@/types/planner/TPlanner';
import { LIST_ITEM_HEIGHT } from '@/constants/layout';
import { useReloadScheduler } from '@/services/ReloadScheduler';
import { getTodayDatestamp, isoToDatestamp } from '@/utils/dateUtils';
import useSortedList from '@/hooks/useSortedList';
import { useDeleteScheduler } from '@/services/DeleteScheduler';
import { useScrollContainer } from '@/services/ScrollContainer';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { ToolbarProps } from '../sortedList/ListItemToolbar';

interface PlannerCardProps {
    datestamp: string;
    calendarEvents: IPlannerEvent[];
    eventChips: EventChipProps[];
    forecast?: WeatherForecast;
    loadAllExternalData: () => Promise<void>;
};

interface ColorCount {
    color?: string;
    count: number;
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

const PlannerCard = ({
    datestamp,
    calendarEvents,
    eventChips,
    forecast,
    loadAllExternalData
}: PlannerCardProps) => {

    const {
        currentTextfield,
        setCurrentTextfield,
    } = useScrollContainer();

    const { onOpen } = useTimeModal();

    const pathname = usePathname();

    const isTimeModalOpen = pathname === TIME_MODAL_PATHNAME;

    const { reloadPage } = useReloadScheduler();

    const { getDeletingItems } = useDeleteScheduler();

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
            setCurrentTextfield
        );
    }

    async function handleSaveEvent(planEvent: IPlannerEvent): Promise<string | undefined> {
        return await saveEventLoadChips(planEvent, loadAllExternalData, SortedEvents.items);
    }

    async function handleDeleteEvents(planEvents: IPlannerEvent[]) {
        await deleteEventsLoadChips(planEvents, loadAllExternalData);

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
        const eventColorCounts = getColorCounts(eventChips);
        if (SortedEvents.items.length > 0) {
            eventColorCounts.push({
                count: SortedEvents.items.length
            })
        }
        return eventColorCounts;
    }, [eventChips, SortedEvents.items.length]);

    return (
        <Card
            header={
                <DayBanner
                    planner={SortedEvents.storageObject as TPlanner}
                    toggleCollapsed={toggleCollapsed}
                    forecast={forecast}
                />
            }
            footer={eventChips.length > 0 &&
                <View className='flex-row gap-2 items-center flex-wrap w-full'>
                    {eventChips.map(allDayEvent =>
                        <EventChip
                            key={`${allDayEvent.label}-${datestamp}`}
                            {...allDayEvent}
                        />
                    )}
                </View>
            }
            badges={collapsed &&
                <View className='flex-row items-center gap-1'>
                    {badgesConfig.map((config) => (
                        <BadgeNumber key={`chip-color-${config.color}`} {...config} />
                    ))}
                </View>
            }
            collapsed={collapsed}
            contentHeight={
                ((SortedEvents.items.length + 1) * LIST_ITEM_HEIGHT) +
                (eventChips.length * LIST_ITEM_HEIGHT) +
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
