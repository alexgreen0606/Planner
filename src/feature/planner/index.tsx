import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import DayBanner from './components/DayBanner';
import globalStyles from '../../foundation/theme/globalStyles';
import EventChip, { EventChipProps } from '../../foundation/calendarEvents/components/EventChip';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { buildPlanner } from '../../foundation/calendarEvents/storage/plannerStorage';
import { WeatherForecast } from '../weather/utils';
import { useSortableList } from '../../foundation/sortedLists/services/SortableListProvider';
import { generateEventToolbar, generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../foundation/calendarEvents/sharedListProps';
import { generateCheckboxIconConfig } from '../../foundation/sortedLists/commonProps';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../foundation/calendarEvents/types';
import Card from '../../foundation/components/Card';
import CollapseControl from '../../foundation/sortedLists/components/CollapseControl';
import { ItemStatus } from '../../foundation/sortedLists/constants';
import { TimeModalProps } from '../../foundation/calendarEvents/components/timeModal/TimeModal';
import { deleteEventsLoadChips, saveEventLoadChips, toggleTimeModal } from '../../foundation/calendarEvents/sharedListUtils';
import { ToolbarProps } from '../../foundation/sortedLists/components/ListItemToolbar';
import { useDeleteScheduler } from '../../foundation/sortedLists/services/DeleteScheduler';

interface PlannerCardProps {
    datestamp: string;
    forecast?: WeatherForecast;
    eventChips: EventChipProps[];
    loadAllExternalData: () => Promise<void>;
    calendarEvents: PlannerEvent[];
};

const PlannerCard = ({
    datestamp,
    forecast,
    eventChips,
    loadAllExternalData,
    calendarEvents
}: PlannerCardProps) => {
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const {
        currentTextfield,
        setCurrentTextfield,
    } = useSortableList();

    const {
        isItemDeleting
    } = useDeleteScheduler();

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

    async function handleSaveEvent(planEvent: PlannerEvent): Promise<string | undefined> {
        return await saveEventLoadChips(planEvent, loadAllExternalData, SortedEvents.items);
    }

    async function handleDeleteEvent(planEvents: PlannerEvent[]) {
        await deleteEventsLoadChips(planEvents, loadAllExternalData, SortedEvents.items);
    }

    const getItemsFromStorageObject = (planner: PlannerEvent[]) => {
        return buildPlanner(datestamp, planner, calendarEvents);
    };

    useEffect(() => {
        SortedEvents.refetchItems();
    }, [calendarEvents])

    const SortedEvents = useSortedList<PlannerEvent, PlannerEvent[]>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        storageConfig: {
            create: handleSaveEvent,
            update: (updatedEvent) => { handleSaveEvent(updatedEvent) },
            delete: handleDeleteEvent
        },
        noReload: true
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
            <SortableList<PlannerEvent, ToolbarProps<PlannerEvent>, TimeModalProps>
                listId={datestamp}
                items={SortedEvents.items}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                hideList={collapsed}
                onContentClick={SortedEvents.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
                getModal={(item) => generateTimeModalConfig(item, timeModalOpen, handleToggleTimeModal, datestamp, SortedEvents.items, setCurrentTextfield)}
                getRightIconConfig={(item) => generateTimeIconConfig(item, handleToggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isItemDeleting(item))}
                getToolbar={(event) => generateEventToolbar(event, handleToggleTimeModal, timeModalOpen)}
                onSaveTextfield={async (updatedItem) => {
                    await SortedEvents.persistItemToStorage(updatedItem);
                    if (updatedItem.timeConfig?.allDay) loadAllExternalData();
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
