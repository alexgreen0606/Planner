import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { usePlannerContext } from '../services/PlannerProvider';
import { Event, TimeConfig } from '../types';
import DayBanner from './DayBanner';
import { persistEvent, deleteEvent, buildPlanner, getPlannerStorageKey } from '../storage/plannerStorage';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
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
import ThinLine from '../../../foundation/ui/separators/ThinLine';

interface SortablePlannerProps {
    timestamp: string;
};

const SortablePlanner = ({
    timestamp
}: SortablePlannerProps) => {
    const { colors } = useTheme();
    const { focusedPlanner, setFocusedPlanner } = usePlannerContext();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [planner, setPlanner] = useState<Event[]>([]);
    const [recurringPlanner, setRecurringPlanner] = useState<Event[]>([]);
    const storage = useMMKV({ id: StorageIds.PLANNER_STORAGE });
    const skipStorageSync = useRef(true);

    const customCreateNewItem = (event: Event) => {
        skipStorageSync.current = true;
        return persistEvent(event);
    }

    const generateNewEvent = (newEvent: Event) => {
        return {
            ...newEvent,
            plannerId: timestamp
        }
    }

    const SortedPlanner = useSortedList<Event>(
        planner,
        undefined,
        generateNewEvent,
        {
            create: customCreateNewItem,
            update: persistEvent,
            delete: deleteEvent
        }
    );

    // Load in the initial planners
    useEffect(() => {
        const loadPlanners = async () => {
            const loadedPlanner = await buildPlanner(timestamp);
            const loadedRecurringPlanner = await buildPlanner(RECURRING_WEEKDAY_PLANNER);
            setPlanner(loadedPlanner.filter(event => !event.recurringConfig?.deleted));
            setRecurringPlanner(loadedRecurringPlanner);
        };
        loadPlanners();
    }, []);

    // Sync the sorted list with storage
    useMMKVListener(async (key) => {
        if (key === getPlannerStorageKey(timestamp)) {
            if (!skipStorageSync) {
                const loadedPlanner = await buildPlanner(timestamp);
                setPlanner(loadedPlanner);
            } else {
                skipStorageSync.current = false;
            }
        } else if (key === getPlannerStorageKey(RECURRING_WEEKDAY_PLANNER)) {
            const loadedRecurringPlanner = await buildPlanner(RECURRING_WEEKDAY_PLANNER);
            setRecurringPlanner(loadedRecurringPlanner);
        }
    }, storage)

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

    const toggleCollapsed = () => setCollapsed(curr => !curr);
    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    /**
     * Moves the textfield to its new position, and sets this as the focused planner within
     * the context.
     */
    const customMoveTextfield = (parentSortId: number | null) => {
        let customParentSortId = parentSortId;
        if (collapsed)
            customParentSortId = SortedPlanner.current[SortedPlanner.current.length - 1]?.sortId || -1;
        SortedPlanner.moveTextfield(customParentSortId);
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
     * If the list is collapsed, we filter out the recurring events.
     */
    const filterPlanner = useCallback(() => {
        if (collapsed) {
            return []
            //SortedList.current.filter(item => !item.recurringConfig).slice(0, 3);
        } else {
            return SortedPlanner.current;
        }
    }, [collapsed, SortedPlanner, recurringPlanner, planner]);

    const renderItem = useCallback((item: Event, drag: any) =>
        item.status && [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status) ?
            <ListTextfield
                key={`${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
                item={item}
                onChange={(text) => { SortedPlanner.updateItem({ ...item, value: text }) }}
                onSubmit={() => SortedPlanner.saveTextfield(ShiftTextfieldDirection.BELOW)}
            /> :
            <TouchableOpacity
                onLongPress={drag}
                onPress={() => customBeginEditItem(item)}
                style={styles.listItem}
            >
                <CustomText
                    type='standard'
                    style={{
                        color: item.status && [ItemStatus.DELETE].includes(item.status) ?
                            colors.outline : colors.secondary,
                        textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
                    }}
                >
                    {item.value}
                </CustomText>
            </TouchableOpacity>
        , [SortedPlanner.current, timeModalOpen]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<Event>) => {
        const isTextfield = !!item.status && [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
        const isItemDeleting = item.status === ItemStatus.DELETE;
        const iconStyle = isItemDeleting ? 'circle' : 'circle-thin';

        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={styles.row}>
                    <TouchableOpacity onPress={() => customToggleDeleteItem(item)}>
                        <GenericIcon
                            type='FontAwesome'
                            name={iconStyle}
                            size={20}
                            color={colors.outline}
                        />
                    </TouchableOpacity>
                    {renderItem(item, drag)}
                    {!item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? (
                        <TouchableOpacity onPress={() => {
                            SortedPlanner.beginEditItem(item)
                            toggleTimeModal();
                        }}>
                            <Time timestamp={item.timeConfig?.startTime} />
                        </TouchableOpacity>
                    ) : isTextfield && !!item.value.length && (
                        <TouchableOpacity onPress={toggleTimeModal}>
                            <GenericIcon
                                type='MaterialCommunityIcons'
                                name='clock-plus-outline'
                                size={20}
                                color={colors.outline}
                            />
                        </TouchableOpacity>
                    )}
                </View>
                <ClickableLine onPress={() => customMoveTextfield(item.sortId)} />
                {isTextfield && (
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
    }, [SortedPlanner.current, timeModalOpen, collapsed, planner]);

    return (
        <View style={{ width: '100%' }}>
            <DayBanner timestamp={timestamp} />
            <ClickableLine onPress={() => null} />
            <View>
                {!!SortedPlanner.current.length ? (
                    <TouchableOpacity style={styles.row}
                        onPress={toggleCollapsed}>
                        <GenericIcon
                            type='Entypo'
                            name={collapsed ? 'chevron-right' : 'chevron-down'}
                            size={16}
                            color={colors.outline}
                        />
                        <View style={styles.listItem}>
                            <CustomText
                                type='collapseText'
                                style={{
                                    color: colors.outline,
                                    width: '100%',
                                    textAlign: 'right'
                                }}
                            >
                                {SortedPlanner.current.filter(item => item.status !== ItemStatus.NEW).length}
                            </CustomText>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => customMoveTextfield(-1)} style={styles.listItem}>
                        <CustomText
                            type='collapseText'
                            style={{
                                color: colors.outline,
                                width: '100%',
                                textAlign: 'center'
                            }}
                        >
                            no plans
                        </CustomText>
                    </TouchableOpacity>
                )}
            </View>
            <ClickableLine onPress={() => collapsed ? null : customMoveTextfield(-1)} />
            <DraggableFlatList
                data={filterPlanner()}
                scrollEnabled={false}
                onDragEnd={SortedPlanner.endDragItem}
                onDragBegin={SortedPlanner.beginDragItem}
                keyExtractor={(item) => item.id}
                renderItem={renderRow}
            />
            <View style={{ ...globalStyles.spacedApart }}>
                <View style={{ flex: 1 }}>
                    <BirthdayChip timestamp={timestamp} />
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <HolidayChip timestamp={timestamp} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    listItem: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        minHeight: 25,
        flex: 1
    },
});

export default SortablePlanner;