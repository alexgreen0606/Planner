import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import DayBanner from '../banner/DayBanner';
import { persistEvent, deleteEvent, buildPlanner } from '../../storage/plannerStorage';
import TimeModal, { TimeModalProps } from '../modal/TimeModal';
import CustomText from '../../../../foundation/components/text/CustomText';
import Time from '../info/Time';
import { Event, extractTimeValue, generateSortIdByTimestamp, PLANNER_STORAGE_ID } from '../../timeUtils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/components/icons/GenericIcon';
import colors from '../../../../foundation/theme/colors';
import Card from '../../../../foundation/components/card/Card';
import Chip from '../info/Chip';
import { WeatherForecast } from '../../../../foundation/weather/types';
import SortableList from '../../../../foundation/sortedLists/components/list/SortableList';
import { isItemDeleting, isItemTextfield, ItemStatus } from '../../../../foundation/sortedLists/utils';

interface SortablePlannerProps {
    timestamp: string;
    birthdays: string[];
    holidays: string[];
    forecast: WeatherForecast;
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
            customStorageHandlers: {
                create: persistEvent,
                update: persistEvent,
                delete: deleteEvent
            }
        }
    );

    return (
        <Card
            header={<DayBanner forecast={forecast} timestamp={timestamp} />}
            footer={
                <View style={{
                    ...globalStyles.verticallyCentered,
                    width: '100%',
                    flexWrap: 'wrap',
                }}>
                    {allDayEvents.map((allDayEvent, i) =>
                        <Chip
                            label={allDayEvent}
                            iconConfig={{
                                type: 'megaphone',
                                size: 10,
                                color: colors.red
                            }}
                            color={colors.red}
                            key={`${allDayEvent}-${timestamp}`}
                        />
                    )}
                    {holidays.map(holiday =>
                        <Chip
                            label={holiday}
                            iconConfig={{
                                type: 'globe',
                                size: 10,
                                color: colors.purple
                            }}
                            color={colors.purple}
                            key={holiday}
                        />
                    )}
                    {birthdays.map(birthday =>
                        <Chip
                            label={birthday}
                            iconConfig={{
                                type: 'birthday',
                                size: 10,
                                color: colors.green
                            }}
                            color={colors.green}
                            key={birthday}
                        />
                    )}
                </View>
            }
        >

            {/* Collapse Control */}
            {SortedEvents.items.length > 15 && !collapsed && (
                <View>
                    <TouchableOpacity style={{ ...globalStyles.verticallyCentered, paddingLeft: 8, paddingTop: 8 }} onPress={toggleCollapsed}>
                        <GenericIcon
                            type='chevron-down'
                            color={colors.grey}
                            size={16}
                        />
                        <CustomText
                            type='label'
                            style={{
                                color: colors.grey,
                            }}
                        >
                            {collapsed ? 'View ' : 'Hide '}
                            {SortedEvents.items.filter(item => item.status !== ItemStatus.NEW).length} plans
                        </CustomText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Planner List */}
            <SortableList<Event, never, TimeModalProps>
                listId={timestamp}
                items={SortedEvents.items}
                getLeftIconConfig={item => ({
                    icon: {
                        type: isItemDeleting(item) ? 'circle-filled' : 'circle',
                        color: isItemDeleting(item) ? colors.blue : colors.grey
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
                        color: colors.grey
                    },
                    onClick: toggleTimeModal,
                    customIcon: item.timeConfig ? <Time allDay={item.timeConfig.allDay} timeValue={item.timeConfig.startTime} /> : undefined
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
                <TouchableOpacity style={{ ...globalStyles.verticallyCentered, paddingLeft: 8 }} onPress={toggleCollapsed}>
                    <GenericIcon
                        type={collapsed ? 'chevron-right' : 'chevron-up'}
                        color={colors.grey}
                        size={16}
                    />
                    <CustomText
                        type='label'
                        style={{ color: colors.grey }}
                    >
                        {collapsed ? 'View ' : 'Hide '}
                        {SortedEvents.items.filter(item => item.status !== ItemStatus.NEW).length} plans
                    </CustomText>
                </TouchableOpacity>
            )}
        </Card>
    );
};

export default SortedPlanner;
