import { usePathname } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TIME_MODAL_PATHNAME } from '../../../app/(modals)/TimeModal';
import BadgeNumber from '../../components/BadgeNumber';
import Card from '../../components/Card';
import EventChip, { EventChipProps } from '../../components/EventChip';
import { useTimeModal } from '../../modals/services/TimeModalProvider';
import globalStyles from '../../theme/globalStyles';
import { generatePlanner } from '../../utils/calendarUtils/calendarUtils';
import { generateEventToolbar, generateTimeIconConfig, handleDragEnd, handleEventInput } from '../../utils/calendarUtils/sharedListProps';
import { deleteEventsLoadChips, openTimeModal, saveEventLoadChips } from '../../utils/calendarUtils/sharedListUtils';
import { buildPlannerEvents } from '../../utils/calendarUtils/storage/plannerStorage';
import { Planner, PLANNER_STORAGE_ID, PlannerEvent } from '../../utils/calendarUtils/types';
import SortableList from '../sortedList';
import { generateCheckboxIconConfig } from '../sortedList/commonProps';
import { ToolbarProps } from '../sortedList/components/ListItemToolbar';
import { LIST_ITEM_HEIGHT } from '../sortedList/constants';
import useSortedList from '../sortedList/hooks/useSortedList';
import { useDeleteScheduler } from '../sortedList/services/DeleteScheduler';
import { useScrollContainer } from '../sortedList/services/ScrollContainerProvider';
import { WeatherForecast } from '../weather/utils';
import DayBanner from './components/DayBanner';

interface PlannerCardProps {
    datestamp: string;
    calendarEvents: PlannerEvent[];
    eventChips: EventChipProps[];
    forecast?: WeatherForecast;
    loadAllExternalData: () => Promise<void>;
};

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

    const { pendingDeleteItems } = useDeleteScheduler();

    const [collapsed, setCollapsed] = useState(true);

    // ------------- Utility Functions -------------

    function isEventDeleting(planEvent: PlannerEvent) {
        return pendingDeleteItems.some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and is rooted in this planner (deleting multi-day start events should not mark the end event as deleting)
            deleteItem.listId === datestamp
        );
    }

    async function toggleCollapsed() {
        if (currentTextfield) {
            if (currentTextfield.value.trim() !== '')
                await SortedEvents.persistItemToStorage(currentTextfield);
            setCurrentTextfield(undefined);
        }
        setCollapsed(curr => !curr);
    };

    // ------------- List Management Utils -------------

    async function handleOpenTimeModal(item: PlannerEvent) {
        await openTimeModal(
            item,
            SortedEvents.toggleItemEdit,
            onOpen,
            SortedEvents.items,
            setCurrentTextfield
        );
    }

    async function handleSaveEvent(planEvent: PlannerEvent): Promise<string | undefined> {
        return await saveEventLoadChips(planEvent, loadAllExternalData, SortedEvents.items);
    }

    async function handleDeleteEvent(planEvents: PlannerEvent[]) {
        await deleteEventsLoadChips(planEvents, loadAllExternalData, SortedEvents.items);
    }

    const getItemsFromStorageObject = (planner: Planner) => {
        return buildPlannerEvents(datestamp, planner, calendarEvents);
    };

    const SortedEvents = useSortedList<PlannerEvent, Planner>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        initializedStorageObject: generatePlanner(datestamp),
        storageConfig: {
            create: handleSaveEvent,
            update: (updatedEvent) => { handleSaveEvent(updatedEvent) },
            delete: handleDeleteEvent
        },
        reloadTriggers: [calendarEvents]
    });

    return (
        <Card
            header={
                <DayBanner
                    planner={SortedEvents.storageObject as Planner}
                    toggleCollapsed={toggleCollapsed}
                    forecast={forecast}
                />
            }
            badge={SortedEvents.items.length > 0 &&
                <BadgeNumber count={SortedEvents.items.length} />
            }
            footer={eventChips.length > 0 &&
                <View style={styles.chips}>
                    {eventChips.map(allDayEvent =>
                        <EventChip
                            key={`${allDayEvent.label}-${datestamp}`}
                            {...allDayEvent}
                        />
                    )}
                </View>
            }
        >
            <SortableList<PlannerEvent, ToolbarProps<PlannerEvent>, never>
                listId={datestamp}
                items={SortedEvents.items}
                isLoading={collapsed}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onContentClick={SortedEvents.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${isTimeModalOpen}`}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
                getRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isEventDeleting(item))}
                getToolbar={(event) => generateEventToolbar(event, handleOpenTimeModal, isTimeModalOpen)}
                customIsItemDeleting={isEventDeleting}
                onSaveTextfield={SortedEvents.persistItemToStorage}
                emptyLabelConfig={{
                    label: 'No Plans',
                    className: `h-[${LIST_ITEM_HEIGHT}px] pb-2`
                }}
            />
        </Card>
    );
};

const styles = StyleSheet.create({
    chips: {
        ...globalStyles.verticallyCentered,
        width: '100%',
        flexWrap: 'wrap',
    }
});

export default PlannerCard;
