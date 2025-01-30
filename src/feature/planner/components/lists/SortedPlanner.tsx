import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import DayBanner from '../banner/DayBanner';
import TimeModal, { TimeModalProps } from '../modal/TimeModal';
import CustomText from '../../../../foundation/components/text/CustomText';
import TimeValue from '../../../../foundation/planners/components/TimeValue';
import { Event, extractTimeValue, generateSortIdByTimestamp, PLANNER_STORAGE_ID } from '../../../../foundation/planners/timeUtils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/components/icon/GenericIcon';
import Colors from '../../../../foundation/theme/colors';
import Card from '../../../../foundation/components/card/Card';
import EventChip from '../../../../foundation/planners/components/EventChip';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { isItemDeleting, isItemTextfield, ItemStatus } from '../../../../foundation/sortedLists/utils';
import { buildPlanner, deleteEvent, persistEvent } from '../../../../foundation/planners/storage/plannerStorage';
import { WeatherForecast } from '../../../../foundation/weather/utils';

interface SortablePlannerProps {
    timestamp: string;
    birthdays: string[];
    holidays: string[];
    forecast?: WeatherForecast;
    allDayEvents: string[];
    reloadChips: () => void;
};

const SortedPlanner = ({
    timestamp,
    birthdays,
    holidays,
    forecast,
    allDayEvents,
    reloadChips
}: SortablePlannerProps) => {
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const toggleCollapsed = () => setCollapsed(curr => !curr);

    const toggleTimeModal = async (item: Event) => {
        if (!isItemTextfield(item))
            await SortedEvents.toggleItemEdit(item);
        setTimeModalOpen(curr => !curr);
    };

    // Stores the current planner and all handler functions to update it
    const SortedEvents = useSortedList<Event, Event[]>(
        timestamp,
        PLANNER_STORAGE_ID,
        (planner) => buildPlanner(timestamp, planner),
        undefined,
        {
            create: persistEvent,
            update: persistEvent,
            delete: deleteEvent
        }
    );

    return (
        <Card
            header={<DayBanner forecast={forecast} timestamp={timestamp} />}
            footer={
                <View style={styles.wrappedChips}>
                    {allDayEvents.map((allDayEvent) =>
                        <EventChip
                            label={allDayEvent}
                            iconConfig={{
                                type: 'megaphone',
                                size: 10,
                            }}
                            color={Colors.RED}
                            key={`${allDayEvent}-${timestamp}`}
                        />
                    )}
                    {holidays.map(holiday =>
                        <EventChip
                            label={holiday}
                            iconConfig={{
                                type: 'globe',
                                size: 10,
                            }}
                            color={Colors.PURPLE}
                            key={holiday}
                        />
                    )}
                    {birthdays.map(birthday =>
                        <EventChip
                            label={birthday}
                            iconConfig={{
                                type: 'birthday',
                                size: 10,
                            }}
                            color={Colors.GREEN}
                            key={birthday}
                        />
                    )}
                </View>
            }
        >

            {/* Collapse Control */}
            {SortedEvents.items.length > 15 && !collapsed && (
                <TouchableOpacity style={styles.upperCollapseControl} onPress={toggleCollapsed}>
                    <GenericIcon
                        type='chevron-down'
                        color={Colors.GREY}
                        size={16}
                    />
                    <CustomText type='soft'>
                        {collapsed ? 'View ' : 'Hide '}
                        {SortedEvents.items.filter(item => item.status !== ItemStatus.NEW).length} plans
                    </CustomText>
                </TouchableOpacity>
            )}

            {/* Planner List */}
            <SortableList<Event, never, TimeModalProps>
                listId={timestamp}
                items={SortedEvents.items}
                getLeftIconConfig={item => ({
                    icon: {
                        type: isItemDeleting(item) ? 'circle-filled' : 'circle',
                        color: isItemDeleting(item) ? Colors.BLUE : Colors.GREY
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
                        const { timeConfig, updatedText } = extractTimeValue(text);
                        if (timeConfig) {
                            const eventsWithItem = item.status === ItemStatus.EDIT ?
                                SortedEvents.items : [...SortedEvents.items, item];
                            newEvent.timeConfig = timeConfig;
                            newEvent.value = updatedText;
                            newEvent.sortId = generateSortIdByTimestamp(newEvent, eventsWithItem);
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
                            const newSortId = generateSortIdByTimestamp(updatedItem, updatedItems, initialSortId);
                            updatedItem.sortId = newSortId;
                            if (newSortId === initialSortId) {

                                // The item has a time conflict. Cancel drag.
                                SortedEvents.refetchItems();
                            }
                        }
                    }
                    await SortedEvents.persistItemToStorage(updatedItem);
                }}
                getRightIconConfig={item => ({
                    hideIcon: !item.timeConfig && !isItemTextfield(item),
                    icon: {
                        type: 'clock',
                        color: Colors.GREY
                    },
                    onClick: toggleTimeModal,
                    customIcon: item.timeConfig ? <TimeValue allDay={item.timeConfig.allDay} timeValue={item.timeConfig.startTime} /> : undefined
                })}
                getModal={(item: Event) => ({
                    component: TimeModal,
                    props: {
                        open: timeModalOpen,
                        toggleModalOpen: toggleTimeModal,
                        timestamp,
                        onSave: (updatedItem: Event) => {
                            const eventsWithItem = updatedItem.status === ItemStatus.EDIT ?
                                SortedEvents.items : [...SortedEvents.items, updatedItem];
                            updatedItem.sortId = generateSortIdByTimestamp(updatedItem, eventsWithItem);
                            toggleTimeModal(updatedItem);
                            return updatedItem;
                        },
                        item
                    },
                })}
                emptyLabelConfig={{
                    label: 'No Plans',
                }}
            />

            {/* Collapse Control */}
            {!!SortedEvents.items.length && (
                <TouchableOpacity style={styles.lowerCollapseControl} onPress={toggleCollapsed}>
                    <GenericIcon
                        type={collapsed ? 'chevron-right' : 'chevron-up'}
                        color={Colors.GREY}
                        size={16}
                    />
                    <CustomText type='soft'>
                        {collapsed ? 'View ' : 'Hide '}
                        {SortedEvents.items.filter(item => item.status !== ItemStatus.NEW).length} plans
                    </CustomText>
                </TouchableOpacity>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    upperCollapseControl: {
        ...globalStyles.verticallyCentered,
        paddingLeft: 8,
        paddingTop: 8
    },
    lowerCollapseControl: {
        ...globalStyles.verticallyCentered,
        paddingLeft: 8
    },
    wrappedChips: {
        ...globalStyles.verticallyCentered,
        width: '100%',
        flexWrap: 'wrap',
    }
});

export default SortedPlanner;
