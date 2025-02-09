import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import DayBanner from '../banner/DayBanner';
import { PlannerEventTimeModalProps } from '../modal/TimeModal';
import globalStyles from '../../../../foundation/theme/globalStyles';
import Card from '../../../../foundation/ui/card/Card';
import EventChip, { EventChipProps } from '../../../../foundation/calendar/components/EventChip';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { isItemTextfield, ItemStatus } from '../../../../foundation/sortedLists/sortedListUtils';
import { buildPlanner, deleteEvent, saveEvent } from '../../../../foundation/calendar/storage/plannerStorage';
import { WeatherForecast } from '../../../../foundation/weather/weatherUtils';
import { useSortableListContext } from '../../../../foundation/sortedLists/services/SortableListProvider';
import CollapseControl from '../../../../foundation/sortedLists/components/collapseControl/CollapseControl';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../../../foundation/calendar/calendarUtils';
import { generateCheckboxIconConfig, generateTimeIconConfig, generateTimeModalConfig, handleDragEnd, handleEventInput } from '../../../../foundation/calendar/sharedListProps';

interface SortablePlannerProps {
    timestamp: string;
    forecast?: WeatherForecast;
    eventChips: EventChipProps[];
    reloadChips: () => void;
};

const SortedPlanner = ({
    timestamp: datestamp,
    forecast,
    eventChips,
    reloadChips
}: SortablePlannerProps) => {
    const { currentTextfield, setCurrentTextfield } = useSortableListContext();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapsed = async () => {
        if (currentTextfield) {
            if (currentTextfield.value.trim() !== '')
                await SortedEvents.persistItemToStorage(currentTextfield);
            setCurrentTextfield(undefined);
        }
        setCollapsed(curr => !curr);
    };

    const toggleTimeModal = async (item: PlannerEvent) => {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    };

    // Stores the current planner and all handler functions to update it
    const SortedEvents = useSortedList<PlannerEvent, PlannerEvent[]>(
        datestamp,
        PLANNER_STORAGE_ID,
        (planner) => buildPlanner(datestamp, planner),
        undefined,
        {
            create: saveEvent,
            update: saveEvent,
            delete: deleteEvent
        }
    );

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
            <SortableList<PlannerEvent, never, PlannerEventTimeModalProps>
                listId={datestamp}
                items={SortedEvents.items}
                onDragEnd={(item) => handleDragEnd(item, SortedEvents.items, SortedEvents.refetchItems, SortedEvents.persistItemToStorage)}
                onDeleteItem={SortedEvents.deleteItemFromStorage}
                hideList={collapsed}
                onContentClick={SortedEvents.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                handleValueChange={(text, item) => handleEventInput(text, item, SortedEvents.items, datestamp)}
                getModal={(item) => generateTimeModalConfig(item, timeModalOpen, toggleTimeModal, datestamp, SortedEvents.items)}
                getRightIconConfig={(item) => generateTimeIconConfig(item, toggleTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete)}
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

export default SortedPlanner;
