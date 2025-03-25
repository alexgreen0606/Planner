import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import DayBanner from './components/DayBanner';
import globalStyles from '../../foundation/theme/globalStyles';
import EventChip, { EventChipProps } from '../../foundation/calendarEvents/components/EventChip';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { buildPlanner } from '../../foundation/calendarEvents/storage/plannerStorage';
import { WeatherForecast } from '../weather/utils';
import { useSortableListContext } from '../../foundation/sortedLists/services/SortableListProvider';
import { generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../foundation/calendarEvents/types';
import Card from '../../foundation/components/Card';
import CollapseControl from '../../foundation/sortedLists/components/CollapseControl';
import { ItemStatus } from '../../foundation/sortedLists/constants';
import { TimeModalProps } from '../../foundation/calendarEvents/components/TimeModal';
import { deleteEventsLoadChips, saveEventLoadChips, toggleTimeModal } from '../../foundation/calendarEvents/sharedListUtils';

interface PlannerCardProps {
    timestamp: string;
    forecast?: WeatherForecast;
    eventChips: EventChipProps[];
    reloadChips: () => void;
    calendarEvents: PlannerEvent[]
};

const PlannerCard = ({
    timestamp: datestamp,
    forecast,
    eventChips,
    reloadChips,
    calendarEvents
}: PlannerCardProps) => {

    const {
        currentTextfield,
        setCurrentTextfield,
        loadingData,
        pendingDeleteItems
    } = useSortableListContext();

    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    async function toggleCollapsed() {
        if (currentTextfield) {
            if (currentTextfield.value.trim() !== '')
                await SortedEvents.persistItemToStorage(currentTextfield);
            setCurrentTextfield(undefined);
        }
        setCollapsed(curr => !curr);
    };

    async function handleToggleTimeModal(planEvent: PlannerEvent) {
        await toggleTimeModal(planEvent, SortedEvents.toggleItemEdit, setTimeModalOpen);
    };

    async function handleSaveEvent(planEvent: PlannerEvent) {
        await saveEventLoadChips(planEvent, reloadChips, SortedEvents.items);
    }

    async function handleDeleteEvent(planEvents: PlannerEvent[]) {
        await deleteEventsLoadChips(planEvents, reloadChips, SortedEvents.items);
    }

    function getItemsFromStorageObject(planner: PlannerEvent[]) {
        return buildPlanner(datestamp, planner, calendarEvents);
    }

    useEffect(() => {
        if (loadingData) {
            reloadChips();
        }
    }, [loadingData]);

    const SortedEvents = useSortedList<PlannerEvent, PlannerEvent[]>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        storageConfig: {
            create: handleSaveEvent,
            update: handleSaveEvent,
            delete: handleDeleteEvent
        }
    });

    return (
        <Card
            header={<DayBanner forecast={forecast} timestamp={datestamp} />}
            footer={eventChips.length > 0 ?
                <View style={styles.wrappedChips}>
                    {eventChips.map(allDayEvent =>
                        <EventChip
                            key={`${allDayEvent.label}-${datestamp}`}
                            {...allDayEvent}
                        />
                    )}
                </View> : undefined
            }
        >

            {/* Collapse Control */}
            <CollapseControl
                itemCount={SortedEvents.items.filter(item => item.status !== ItemStatus.NEW).length}
                itemName='plan'
                onClick={toggleCollapsed}
                display={!!SortedEvents.items.length}
                collapsed={collapsed}
            />

            {/* Planner List */}
            <SortableList<PlannerEvent, never, TimeModalProps>
                listId={datestamp}
                items={SortedEvents.items}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                hideList={collapsed}
                isItemDeleting={SortedEvents.isItemDeleting}
                onContentClick={SortedEvents.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
                getModal={(item) => generateTimeModalConfig(item, timeModalOpen, handleToggleTimeModal, datestamp, SortedEvents.items)}
                getRightIconConfig={(item) => generateTimeIconConfig(item, handleToggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, pendingDeleteItems)}
                onSaveTextfield={async (updatedItem) => {
                    await SortedEvents.persistItemToStorage(updatedItem);
                    if (updatedItem.timeConfig?.allDay) reloadChips();
                }}
                emptyLabelConfig={{
                    label: 'No Plans',
                    style: { height: 40, paddingBottom: 8 }
                }}
            />

            {/* Collapse Control */}
            <CollapseControl
                itemCount={SortedEvents.items.filter(item => item.status !== ItemStatus.NEW).length}
                itemName='plan'
                onClick={toggleCollapsed}
                display={SortedEvents.items.length > 15 && !collapsed}
                collapsed={collapsed}
                bottomOfListControl
            />

        </Card>
    );
};

const styles = StyleSheet.create({
    wrappedChips: {
        ...globalStyles.verticallyCentered,
        width: '100%',
        flexWrap: 'wrap',
    }
});

export default PlannerCard;
