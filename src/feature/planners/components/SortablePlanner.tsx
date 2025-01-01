import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ListStorageMode, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { usePlannerContext } from '../services/PlannerProvider';
import { Event, TimeConfig } from '../types';
import DayBanner from './DayBanner';
import { persistEvent, deleteEvent, buildPlanner, getPlannerStorageKey } from '../storage/plannerStorage';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';
import TimeModal from './TimeModal';
import CustomText from '../../../foundation/ui/text';
import Time from './Time';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../../../enums';
import { generateSortIdByTimestamp } from '../utils';
import globalStyles from '../../../theme/globalStyles';
import HolidayChip from './HolidayChip';
import GenericIcon from '../../../foundation/ui/icons/GenericIcon';
import BirthdayChip from './BirthdayChip';
import colors from '../../../theme/colors';

interface SortablePlannerProps {
    timestamp: string;
};

const SortablePlanner = ({
    timestamp
}: SortablePlannerProps) => {
    const { focusedPlanner, setFocusedPlanner } = usePlannerContext();

    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [planner, setPlanner] = useState<Event[]>([]);
    const plannerStorage = useMMKV({ id: StorageIds.PLANNER_STORAGE });
    const skipStorageSync = useRef(true);

    const toggleCollapsed = () => {
        SortedPlanner.saveTextfield();
        setCollapsed(curr => !curr);
    }
    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Creates a new event in storage, and ensures the component re-render is skipped
    const customCreateNewItem = (event: Event) => {
        skipStorageSync.current = true;
        return persistEvent(event);
    };

    // Creates a new textfield linked to this planner
    const initializeNewEvent = (newEvent: Event) => {
        return {
            ...newEvent,
            plannerId: timestamp
        }
    };

    // Stores the current planner and all handler functions to update it
    const SortedPlanner = useSortedList<Event>(
        planner,
        {
            storageMode: ListStorageMode.ITEM_SYNC,
            storageUpdates: {
                create: customCreateNewItem,
                update: persistEvent,
                delete: deleteEvent
            },
            initializeNewItem: initializeNewEvent
        },
    );

    // Load in the initial planner and recurring weekday planner
    useEffect(() => {
        const loadPlanner = async () => {
            const loadedPlanner = await buildPlanner(timestamp);
            setPlanner(loadedPlanner.filter(event => !event.recurringConfig?.deleted));
        };
        loadPlanner();
    }, []);

    // Sync the sorted planner with storage
    useMMKVListener(async (key) => {
        if (key === getPlannerStorageKey(timestamp)) {
            if (!skipStorageSync) {
                const loadedPlanner = await buildPlanner(timestamp);
                setPlanner(loadedPlanner);
            } else {
                skipStorageSync.current = false;
            }
        }
    }, plannerStorage);

    /**
     * When a different planner on the screen is focused, save this list's current textfield
     * and reset the items that are pending delete.
     */
    useEffect(() => {
        if (focusedPlanner.timestamp !== timestamp) {
            SortedPlanner.saveTextfield();
        } else {
            setCollapsed(false);
        }

        SortedPlanner.rescheduleAllDeletes();
    }, [focusedPlanner]);

    /**
     * Moves the textfield to its new position, and sets this as the focused planner within
     * the context.
     */
    const customMoveTextfield = (parentSortId: number | null, grabLastItem?: boolean) => {
        let customParentSortId = parentSortId;
        if (grabLastItem)
            customParentSortId = SortedPlanner.current[SortedPlanner.current.length - 1]?.sortId || -1;
        SortedPlanner.createOrMoveTextfield(customParentSortId);
        setFocusedPlanner(timestamp);
    };

    /**
     * Initializes edit mode for the clicked item, and sets this as the focused planner within
     * the context.
     */
    const customBeginEditItem = (item: Event) => {
        SortedPlanner.beginEditItem(item);
        setFocusedPlanner(timestamp);
    };

    /**
     * Schedules the item for delete, and sets this as the focused planner within
     * the context.
     */
    const customToggleDeleteItem = (item: Event) => {
        SortedPlanner.toggleDeleteItem(item);
        setFocusedPlanner(timestamp);
    };

    /**
     * Displays a row representing an event within the planner. A row includes
     * an icon for toggling its delete, the row's data and controls for changing
     * the event's time.
     * @param param0 - the item data and the drag function for sorting
     */
    const renderRow = ({ item, drag }: RenderItemParams<Event>) => {
        const isItemEditing = [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
        const isItemDeleting = item.status === ItemStatus.DELETE;
        const iconStyle = isItemDeleting ? 'circle' : 'circle-thin';
        return (
            <View style={globalStyles.background}>
                <View style={globalStyles.listRow}>

                    {/* Toggle Delete Icon */}
                    <TouchableOpacity onPress={() => customToggleDeleteItem(item)}>
                        <GenericIcon
                            type='FontAwesome'
                            name={iconStyle}
                            size={20}
                            color={isItemDeleting ? colors.blue : colors.grey}
                        />
                    </TouchableOpacity>

                    {/* Event Data */}
                    {isItemEditing ?
                        <ListTextfield
                            key={`${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                            item={item}
                            onChange={(text) => { SortedPlanner.updateItem({ ...item, value: text }) }}
                            onSubmit={() => SortedPlanner.saveTextfield(ShiftTextfieldDirection.BELOW)}
                        /> :
                        <TouchableOpacity
                            onLongPress={drag}
                            onPress={() => customBeginEditItem(item)}
                            style={globalStyles.listItem}
                        >
                            <CustomText
                                type='standard'
                                style={{
                                    color: item.status && [ItemStatus.DELETE].includes(item.status) ?
                                        colors.grey : colors.white,
                                    textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
                                }}
                            >
                                {item.value}
                            </CustomText>
                        </TouchableOpacity>
                    }

                    {/* Time */}
                    {!item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? (
                        <TouchableOpacity onPress={() => {
                            SortedPlanner.beginEditItem(item)
                            toggleTimeModal();
                        }}>
                            <Time timeValue={item.timeConfig?.startTime} />
                        </TouchableOpacity>
                    ) : isItemEditing && !!item.value.length && (
                        <TouchableOpacity onPress={toggleTimeModal}>
                            <GenericIcon
                                type='MaterialCommunityIcons'
                                name='clock-plus-outline'
                                size={20}
                                color={colors.grey}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Separator Line */}
                <ClickableLine onPress={() => customMoveTextfield(item.sortId)} />

                {/* Time Modal */}
                {isItemEditing && (
                    <TimeModal
                        open={timeModalOpen}
                        toggleModalOpen={toggleTimeModal}
                        event={item}
                        timestamp={timestamp}
                        onSaveItem={(timeConfig: TimeConfig) => {
                            const newEvent: Event = {
                                ...item,
                                timeConfig
                            };
                            newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedPlanner.current);
                            SortedPlanner.updateItem(newEvent);
                            toggleTimeModal();
                        }}
                    />
                )}
            </View>
        )
    };

    return (
        <View style={{ width: '100%' }}>

            {/* Date Details */}
            <DayBanner timestamp={timestamp} />

            {/* Separator Line */}
            <ClickableLine onPress={() => collapsed ? setCollapsed(false) : customMoveTextfield(-1)} />

            {/* Planner Event List */}
            <DraggableFlatList
                data={collapsed ? [] : SortedPlanner.current}
                nestedScrollEnabled
                onDragEnd={SortedPlanner.endDragItem}
                onDragBegin={SortedPlanner.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
                style={{ maxHeight: 420 }}
            />

            {/* Collapse Control */}
            {!!SortedPlanner.current.length ? (
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
                        {SortedPlanner.current.filter(item => item.status !== ItemStatus.NEW).length} plans
                    </CustomText>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={{ ...globalStyles.verticallyCentered, paddingLeft: 8, gap: 8 }} onPress={() => customMoveTextfield(-1)}>
                    <GenericIcon
                        type='Fontisto'
                        name='plus-a'
                        color={colors.grey}
                        size={10}
                    />
                    <CustomText
                        type='label'
                        style={{
                            color: colors.grey,
                        }}
                    >
                        Add plans
                    </CustomText>
                </TouchableOpacity>
            )}

            {/* Separator Line */}
            <ClickableLine onPress={toggleCollapsed} />

            {/* All Day Event Chips */}
            <View style={{ ...globalStyles.spacedApart, paddingHorizontal: 16, paddingBottom: 8 }}>
                <View style={{ flex: 1 }}>
                    <HolidayChip timestamp={timestamp} />
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <BirthdayChip timestamp={timestamp} />
                </View>
            </View>
        </View>
    );
};

export default SortablePlanner;