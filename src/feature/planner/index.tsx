import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import DayBanner from './components/DayBanner';
import globalStyles from '../../foundation/theme/globalStyles';
import EventChip, { EventChipProps } from '../../foundation/calendarEvents/components/EventChip';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { buildPlannerEvents } from '../../foundation/calendarEvents/storage/plannerStorage';
import { WeatherForecast } from '../weather/utils';
import { useSortableList } from '../../foundation/sortedLists/services/SortableListProvider';
import { generateEventToolbar, generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { Planner, PLANNER_STORAGE_ID, PlannerEvent } from '../../foundation/calendarEvents/types';
import Card from '../../foundation/components/Card';
import { TimeModalProps } from '../../foundation/calendarEvents/components/timeModal/TimeModal';
import { deleteEventsLoadChips, saveEventLoadChips, toggleTimeModal } from '../../foundation/calendarEvents/sharedListUtils';
import { ToolbarProps } from '../../foundation/sortedLists/components/ListItemToolbar';
import { useDeleteScheduler } from '../../foundation/sortedLists/services/DeleteScheduler';
import { generatePlanner } from '../../foundation/calendarEvents/calendarUtils';
import EventCountChip from './components/EventCountChip';
import { LIST_ITEM_HEIGHT } from '../../foundation/sortedLists/constants';

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
    } = useSortableList();

    const { pendingDeleteItems } = useDeleteScheduler();

    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(true);

    // Reload the list whenever the calendar events change
    useEffect(() => {
        SortedEvents.refetchItems();
    }, [calendarEvents]);

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

    async function handleToggleTimeModal(planEvent: PlannerEvent) {
        await toggleTimeModal(planEvent, SortedEvents.toggleItemEdit, setTimeModalOpen);
    };

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
        noReload: true
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
                <EventCountChip count={SortedEvents.items.length} />
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
            <SortableList<PlannerEvent, ToolbarProps<PlannerEvent>, TimeModalProps>
                listId={datestamp}
                items={SortedEvents.items}
                hideList={collapsed}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onContentClick={SortedEvents.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
                getModal={(item) => generateTimeModalConfig(item, timeModalOpen, handleToggleTimeModal, datestamp, SortedEvents.items, setCurrentTextfield)}
                getRightIconConfig={(item) => generateTimeIconConfig(item, handleToggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isEventDeleting(item))}
                getToolbar={(event) => generateEventToolbar(event, handleToggleTimeModal, timeModalOpen)}
                customIsItemDeleting={isEventDeleting}
                onSaveTextfield={async (updatedItem) => {
                    await SortedEvents.persistItemToStorage(updatedItem);
                    if (updatedItem.timeConfig?.allDay) loadAllExternalData(); // TODO: is this needed?
                }}
                emptyLabelConfig={{
                    label: 'No Plans',
                    style: { height: LIST_ITEM_HEIGHT, paddingBottom: 8 }
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
