import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import DayBanner from '../banner/DayBanner';
import PlannerEventTimeModal, { PlannerEventTimeModalProps } from '../modal/TimeModal';
import TimeValue from '../../../../foundation/calendar/components/TimeValue';
import { extractTimeValue, generateSortIdByTime } from '../../../../foundation/calendar/dateUtils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import Card from '../../../../foundation/ui/card/Card';
import EventChip, { EventChipProps } from '../../../../foundation/calendar/components/EventChip';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { isItemDeleting, isItemTextfield, ItemStatus } from '../../../../foundation/sortedLists/sortedListUtils';
import { buildPlanner, deleteEvent, saveEvent } from '../../../../foundation/calendar/storage/plannerStorage';
import { WeatherForecast } from '../../../../foundation/weather/weatherUtils';
import { Color } from '../../../../foundation/theme/colors';
import { useSortableListContext } from '../../../../foundation/sortedLists/services/SortableListProvider';
import CollapseControl from '../../../../foundation/sortedLists/components/collapseControl/CollapseControl';
import { PLANNER_STORAGE_ID, PlannerEvent } from '../../../../foundation/calendar/calendarUtils';

interface SortablePlannerProps {
    timestamp: string;
    forecast?: WeatherForecast;
    eventChips: EventChipProps[];
    reloadChips: () => void;
};

const SortedPlanner = ({
    timestamp,
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
        timestamp,
        PLANNER_STORAGE_ID,
        (planner) => buildPlanner(timestamp, planner),
        undefined,
        {
            create: saveEvent,
            update: saveEvent,
            delete: deleteEvent
        }
    );

    return (
        <Card
            header={<DayBanner forecast={forecast} timestamp={timestamp} />}
            footer={eventChips.length > 0 ?
                <View style={styles.wrappedChips}>
                    {eventChips.map(allDayEvent =>
                        <EventChip
                            key={`${allDayEvent.label}-${timestamp}`}
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
                listId={timestamp}
                items={SortedEvents.items}
                getLeftIconConfig={item => ({
                    icon: {
                        type: isItemDeleting(item) ? 'circle-filled' : 'circle',
                        color: isItemDeleting(item) ? Color.BLUE : Color.DIM
                    },
                    onClick: SortedEvents.toggleItemDelete
                })}
                onDeleteItem={SortedEvents.deleteItemFromStorage}
                hideList={collapsed}
                onContentClick={SortedEvents.toggleItemEdit}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                handleValueChange={(text, item) => {
                    const newEvent = {
                        ...item,
                        value: text,
                    };
                    if (!item.timeConfig) {
                        const { timeConfig, updatedText } = extractTimeValue(text, timestamp);
                        if (timeConfig) {
                            newEvent.timeConfig = timeConfig;
                            newEvent.value = updatedText;
                            const updatedList = [...SortedEvents.items];
                            const itemCurrentIndex = SortedEvents.items.findIndex(item => item.id === newEvent.id);
                            if (itemCurrentIndex !== -1) {
                                updatedList[itemCurrentIndex] = newEvent;
                            } else {
                                updatedList.push(newEvent);
                            }
                            newEvent.sortId = generateSortIdByTime(newEvent, updatedList);
                        }
                    }
                    return newEvent;
                }}
                onSaveTextfield={async (updatedItem) => {
                    await SortedEvents.persistItemToStorage(updatedItem);
                    if (updatedItem.timeConfig?.allDay)
                        reloadChips();
                }}
                onDragEnd={async (updatedItem) => {
                    if (updatedItem.timeConfig) {
                        const currentItemIndex = SortedEvents.items.findIndex(item => item.id === updatedItem.id);
                        if (currentItemIndex !== -1) {
                            const initialSortId = SortedEvents.items[currentItemIndex].sortId;
                            const updatedItems = [...SortedEvents.items]
                            updatedItems[currentItemIndex] = updatedItem;
                            const newSortId = generateSortIdByTime(updatedItem, updatedItems);
                            updatedItem.sortId = newSortId;
                            if (newSortId === initialSortId) {
                                // The item has a time conflict. Cancel drag.
                                SortedEvents.refetchItems();
                                return;
                            }
                        }
                    }
                    await SortedEvents.persistItemToStorage(updatedItem);
                }}
                getRightIconConfig={item => ({
                    hideIcon: !item.timeConfig && !isItemTextfield(item),
                    icon: {
                        type: 'clock',
                        color: Color.DIM
                    },
                    onClick: toggleTimeModal,
                    customIcon: item.timeConfig ? <TimeValue allDay={item.timeConfig.allDay} timeValue={item.timeConfig.startTime} /> : undefined
                })}
                getModal={(item: PlannerEvent) => ({
                    component: PlannerEventTimeModal,
                    props: {
                        open: timeModalOpen,
                        toggleModalOpen: toggleTimeModal,
                        timestamp,
                        onSave: (updatedItem: PlannerEvent) => {
                            const updatedList = [...SortedEvents.items];
                            const itemCurrentIndex = SortedEvents.items.findIndex(item => item.id === updatedItem.id);
                            if (itemCurrentIndex !== -1) {
                                updatedList[itemCurrentIndex] = updatedItem;
                            } else {
                                updatedList.push(updatedItem);
                            }
                            updatedItem.sortId = generateSortIdByTime(updatedItem, updatedList);
                            toggleTimeModal(updatedItem);
                            return updatedItem;
                        },
                        item
                    },
                })}
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
