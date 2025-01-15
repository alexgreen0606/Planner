import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../../foundation/sortedLists/enums';
import { usePlannerContext } from '../../services/PlannerProvider';
import { Event, TimeConfig } from '../../types';
import DayBanner from '../banner/DayBanner';
import { persistEvent, deleteEvent, getPlannerStorageKey } from '../../storage/plannerStorage';
import ClickableLine from '../../../../foundation/ui/separators/ClickableLine';
import TimeModal from '../modal/TimeModal';
import CustomText from '../../../../foundation/ui/text/CustomText';
import Time from '../info/Time';
import { StorageIds } from '../../../../enums';
import { extractTimeValue, generateSortIdByTimestamp } from '../../utils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/ui/icons/GenericIcon';
import colors from '../../../../foundation/theme/colors';
import Card from '../../../../foundation/ui/card';
import EmptyLabel from '../../../../foundation/sortedLists/components/EmptyLabel';
import Chip from '../info/Chip';
import { WeatherForecast } from '../../../../foundation/weather/types';
import SortableList from '../../../../foundation/sortedLists/components/SortableList';

interface SortablePlannerProps {
    timestamp: string;
    birthdays: string[];
    holidays: string[];
    forecast: WeatherForecast;
    allDayEvents: string[];
};

const SortedPlanner = ({
    timestamp,
    birthdays,
    holidays,
    forecast,
    allDayEvents
}: SortablePlannerProps) => {
    const { focusedPlanner, setFocusedPlanner } = usePlannerContext();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(true);

    const toggleCollapsed = () => {
        SortedEvents.saveTextfield();
        setCollapsed(curr => !curr);
    };
    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Creates a new textfield linked to this planner
    const initializeNewEvent = (newEvent: Event) => ({
        ...newEvent,
        plannerId: timestamp
    });

    // Stores the current planner and all handler functions to update it
    const SortedEvents = useSortedList<Event, Event[]>(
        getPlannerStorageKey(timestamp),
        StorageIds.PLANNER_STORAGE,
        (planner) => planner,
        (planner) => planner,
        initializeNewEvent,
        {
            create: persistEvent,
            update: persistEvent,
            delete: deleteEvent
        },
    );

    // TODO: update synchronous when other textfield becomes focused

    /**
     * When a different planner on the screen is focused, save this list's current textfield
     * and reset the items that are pending delete.
     */
    useEffect(() => {
        if (focusedPlanner.timestamp !== timestamp) {
            SortedEvents.saveTextfield();
        } else {
            setCollapsed(false);
        }

        SortedEvents.rescheduleAllDeletes();
    }, [focusedPlanner]);

    /**
     * Moves the textfield to its new position, and sets this as the focused planner within
     * the context.
     */
    const customMoveTextfield = (parentSortId: number | null, grabLastItem?: boolean) => {
        let customParentSortId = parentSortId;
        if (grabLastItem)
            customParentSortId = SortedEvents.items[SortedEvents.items.length - 1]?.sortId || -1;
        SortedEvents.createOrMoveTextfield(customParentSortId);
        setFocusedPlanner(timestamp);
    };

    /**
     * Initializes edit mode for the clicked item, and sets this as the focused planner within
     * the context.
     */
    const customBeginEditItem = (item: Event) => {
        SortedEvents.beginEditItem(item);
        setFocusedPlanner(timestamp);
    };

    /**
     * Schedules the item for delete, and sets this as the focused planner within
     * the context.
     */
    const customToggleDeleteItem = (item: Event) => {
        SortedEvents.toggleDeleteItem(item);
        setFocusedPlanner(timestamp);
    };

    return (
        <Card
            header={<DayBanner forecast={forecast} timestamp={timestamp} />}
            footer={
                <View style={{
                    ...globalStyles.verticallyCentered,
                    width: '100%',
                    flexWrap: 'wrap',
                    gap: 8
                }}>
                    {allDayEvents.map((allDayEvent, i) =>
                        <Chip
                            label={allDayEvent}
                            iconConfig={{
                                type: 'Entypo',
                                name: 'megaphone',
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
                                type: 'Entypo',
                                name: 'globe',
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
                                type: 'FontAwesome',
                                name: 'birthday-cake',
                                size: 10,
                                color: colors.green
                            }}
                            color={colors.green}
                            key={birthday}
                        />
                    )}
                </View>}
        >

            {/* Separator Line */}
            <ClickableLine onPress={() => collapsed ? setCollapsed(false) : customMoveTextfield(-1)} />

            {/* Collapse Control */}
            {SortedEvents.items.length > 5 && !collapsed && (
                <View>
                    <TouchableOpacity style={{ ...globalStyles.verticallyCentered, gap: 8, paddingLeft: 8 }} onPress={toggleCollapsed}>
                        <GenericIcon
                            type='Entypo'
                            name={'chevron-down'}
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
                    <ClickableLine onPress={toggleCollapsed} />
                </View>
            )}

            {/* Planner List */}
            {!collapsed && (
                <SortableList<Event>
                    items={SortedEvents.items}
                    endDrag={SortedEvents.endDragItem}
                    renderLeftIcon={item => ({
                        icon: {
                            type: 'FontAwesome',
                            name: item.status === ItemStatus.DELETE ? 'circle' : 'circle-thin',
                            color: item.status === ItemStatus.DELETE ? colors.blue : colors.grey
                        },
                        onClick: () => customToggleDeleteItem(item)
                    })}
                    extractTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                    onChangeTextfield={(text, item) => {
                        const newEvent = {
                            ...item,
                            value: text,
                        };
                        if (!item.timeConfig?.isCalendarEvent) {
                            const { timeConfig, updatedText } = extractTimeValue(text);
                            if (timeConfig) {
                                newEvent.timeConfig = timeConfig;
                                newEvent.value = updatedText;
                                newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedEvents.items);
                            }
                        }
                        SortedEvents.updateItem(newEvent);
                    }}
                    onSubmitTextfield={() => SortedEvents.saveTextfield(ShiftTextfieldDirection.BELOW)}
                    onRowClick={(item) => customBeginEditItem(item)}
                    renderRightIcon={item => ({
                        hideIcon: (item.status === ItemStatus.STATIC && !item.timeConfig?.startTime) || (item.status !== ItemStatus.STATIC && !item.value.length),
                        icon: {
                            type: 'MaterialCommunityIcons',
                            name: 'clock-plus-outline',
                            color: colors.grey
                        },
                        onClick: !!item.timeConfig?.startTime ? () => {
                            SortedEvents.beginEditItem(item)
                            toggleTimeModal();
                        } : toggleTimeModal,
                        customIcon: !!item.timeConfig?.startTime ? <Time timeValue={item.timeConfig?.startTime} /> : undefined
                    })}
                    handleSeparatorClick={(item) => customMoveTextfield(item.sortId)}
                    renderItemModal={(item) =>
                        <TimeModal
                            open={timeModalOpen}
                            toggleModalOpen={toggleTimeModal}
                            event={item}
                            timestamp={timestamp}
                            onSaveItem={(timeConfig: TimeConfig) => {
                                const newEvent = {
                                    ...item,
                                    timeConfig
                                };
                                newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedEvents.items);
                                SortedEvents.updateItem(newEvent);
                                toggleTimeModal();
                            }}
                        />
                    }
                />
            )}

            {/* Collapse Control */}
            {!!SortedEvents.items.length ? (
                <TouchableOpacity style={{ ...globalStyles.verticallyCentered, gap: 8, paddingLeft: 8 }} onPress={toggleCollapsed}>
                    <GenericIcon
                        type='Entypo'
                        name={collapsed ? 'chevron-right' : 'chevron-up'}
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
            ) : (
                <EmptyLabel
                    label='No Plans!'
                    iconConfig={{
                        type: 'MaterialCommunityIcons',
                        name: 'party-popper',
                        color: colors.grey,
                        size: 16
                    }}
                    onPress={() => customMoveTextfield(-1)}
                />
            )}

            {/* Separator Line */}
            <ClickableLine onPress={toggleCollapsed} />

        </Card>
    );
};

export default SortedPlanner;