import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { FontAwesome } from '@expo/vector-icons';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { usePlannerContext } from '../services/PlannerProvider';
import { Event, TimeConfig } from '../types';
import DayBanner from './DayBanner';
import { createEvent, deleteEvent, getPlanner, getPlannerStorageKey, savePlanner } from '../storage/plannerStorage';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
import { isValidTimestamp } from '../utils';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';
import TimeModal from './TimeModal';
import CustomText from '../../../foundation/ui/text';
import Time from './Time';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../../../enums';

interface SortablePlannerProps {
    plannerId: string;
    manualSaveTrigger?: boolean;
};

const SortablePlanner = ({
    plannerId,
    manualSaveTrigger
}: SortablePlannerProps) => {
    const isRecurringPlanner = plannerId === RECURRING_WEEKDAY_PLANNER;
    const { colors } = useTheme();
    const { focusedPlanner, setFocusedPlanner } = usePlannerContext();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(isValidTimestamp(plannerId));
    const [planner, setPlanner] = useState<Event[]>([]);
    const [recurringPlanner, setRecurringPlanner] = useState<Event[]>([]);
    const storage = useMMKV({ id: StorageIds.PLANNER_STORAGE });
    const skipStorageSync = useRef(false);

    const customCreateNewItem = (event: Event) => {
        skipStorageSync.current = true;
        return createEvent(event);
    }

    const storageUpdates = {
        create: customCreateNewItem,
        update: createEvent,
        delete: deleteEvent
    }

    const formatNewEvent = (newEvent: Event) => {
        return {
            ...newEvent,
            plannerId
        }
    }

    const SortedList = useSortedList<Event>(planner, undefined, formatNewEvent, storageUpdates);

    const toggleCollapsed = () => setCollapsed(curr => !curr);
    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    /**
     * Moves the textfield to its new position, and sets this as the focused planner within
     * the context.
     */
    const customMoveTextfield = (parentSortId: number | null) => {
        let customParentSortId = parentSortId;
        if (collapsed)
            customParentSortId = SortedList.current[SortedList.current.length - 1].sortId;
        SortedList.moveTextfield(customParentSortId);
        setFocusedPlanner(plannerId);
    };

    /**
     * Initializes edit mode for the clicked item, and sets this as the focused planner within
     * the context.
     */
    const customBeginEditItem = (item: Event) => {
        SortedList.beginEditItem(item);
        setFocusedPlanner(plannerId);
    };

    /**
     * Schedules the item for delete, and sets this as the focused planner within
     * the context.
     */
    const customToggleDeleteItem = (item: Event) => {
        SortedList.toggleDeleteItem(item);
        setFocusedPlanner(plannerId);
    };

    /**
     * If the list is collapsed, we filter out the recurring events.
     */
    const filterPlanner = useCallback(() => {
        if (collapsed) {
            const recurringWeekdayPlannerIds = recurringPlanner?.map(event => event.id) ?? [];
            return SortedList.current.filter(item => !recurringWeekdayPlannerIds.includes(item.id)).slice(0, 3);
        } else {
            return SortedList.current;
        }
    }, [collapsed, SortedList, recurringPlanner, planner]);

    // Load in the initial planners
    useEffect(() => {
        const loadPlanners = async () => {
            const loadedPlanner = await getPlanner(plannerId);
            const loadedRecurringPlanner = await getPlanner(RECURRING_WEEKDAY_PLANNER);
            setPlanner(loadedPlanner);
            setRecurringPlanner(loadedRecurringPlanner);
        };
        loadPlanners();
    }, []);

    // Sync the sorted list with storage
    useMMKVListener(async (key) => {
        if (key === getPlannerStorageKey(plannerId)) {
            if (!skipStorageSync) {
                const loadedPlanner = await getPlanner(plannerId);
                setPlanner(loadedPlanner);
            } else {
                skipStorageSync.current = false;
            }
        } else if (key === getPlannerStorageKey(RECURRING_WEEKDAY_PLANNER)) {
            const loadedRecurringPlanner = await getPlanner(RECURRING_WEEKDAY_PLANNER);
            setRecurringPlanner(loadedRecurringPlanner);
        }
    }, storage)

    // Manually triggers the list to update
    useEffect(() => {
        if (manualSaveTrigger)
            savePlanner(plannerId, SortedList.current.filter(event => event.status === ItemStatus.STATIC));
    }, [manualSaveTrigger])

    /**
     * When a different planner on the screen is focused, save this list's current textfield
     * and reset the items that are pending delete.
     */
    useEffect(() => {
        if (focusedPlanner.timestamp !== plannerId) {
            SortedList.saveTextfield();
        } else {
            setCollapsed(false);
        }

        SortedList.rescheduleAllDeletes();
    }, [focusedPlanner]);

    const renderItem = useCallback((item: Event, drag: any) =>
        item.status && [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status) ?
            <ListTextfield
                key={`${item.id}-${item.sortId}-${timeModalOpen}-${item.status}-${item.timeConfig?.startDate}-${item.timeConfig?.endDate}`}
                item={item}
                onChange={(text) => { SortedList.updateItem({ ...item, value: text }) }}
                onSubmit={() => SortedList.saveTextfield(ShiftTextfieldDirection.BELOW)}
            /> :
            <TouchableOpacity
                onLongPress={drag}
                onPress={() => customBeginEditItem(item)}
                style={styles.listItem}
            >
                <CustomText
                    type='list'
                    style={{
                        color: item.status && [ItemStatus.DELETE].includes(item.status) ?
                            colors.outline : colors.secondary,
                        textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
                    }}
                >
                    {item.value}
                </CustomText>
            </TouchableOpacity>
        , [SortedList.current, timeModalOpen]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<Event>) => {
        const isTextfield = !!item.status && [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
        const isItemDeleting = item.status === ItemStatus.DELETE;
        const iconStyle = plannerId === RECURRING_WEEKDAY_PLANNER ? 'trash' : isItemDeleting ? 'dot-circle-o' : 'circle-thin';

        const hasTime = !item?.timeConfig?.allDay && !!item.timeConfig?.startDate;


        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={styles.row}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={isItemDeleting ? colors.secondary : colors.outline}
                        onPress={() => customToggleDeleteItem(item)}
                    />
                    {renderItem(item, drag)}
                    {!item?.timeConfig?.allDay && !!item.timeConfig?.startDate && (
                        <Time timestamp={item.timeConfig?.startDate} />
                    )}
                    {!hasTime && isTextfield && (
                        <FontAwesome
                            name='clock-o'
                            size={20}
                            color={colors.outline}
                            onPress={() => setTimeModalOpen(true)}
                        />
                    )}
                </View>
                <ClickableLine onPress={() => customMoveTextfield(item.sortId)} />
                {isTextfield && (
                    <TimeModal
                        open={timeModalOpen}
                        toggleModalOpen={toggleTimeModal}
                        event={item}
                        timestamp={plannerId}
                        onSaveItem={(timeConfig: TimeConfig) => {
                            const newEvent: Event = {
                                ...item,
                                timeConfig
                            };
                            SortedList.updateItem(newEvent);
                            toggleTimeModal();
                        }}
                    />
                )}
            </View>
        )
    }, [SortedList.current, timeModalOpen, collapsed, planner]);

    return (
        <View style={{ width: '100%' }}>
            {isValidTimestamp(plannerId) && (
                <DayBanner timestamp={plannerId} />
            )}
            <View style={{ width: '100%', marginBottom: 37 }}>
                <ClickableLine onPress={() => customMoveTextfield(-1)} />
                <DraggableFlatList
                    data={filterPlanner()}
                    scrollEnabled={false}
                    onDragEnd={SortedList.endDragItem}
                    onDragBegin={SortedList.beginDragItem}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRow}
                />
                {
                    !!SortedList.current.length &&
                    !SortedList.getFocusedItem() &&
                    isValidTimestamp(plannerId) &&
                    SortedList.current.length > 3 && (
                        <TouchableOpacity onPress={toggleCollapsed} style={{ width: '100%', justifyContent: 'flex-start', flexDirection: 'row' }}>
                            <FontAwesome
                                name={collapsed ? 'chevron-up' : 'chevron-down'}
                                size={12}
                                color={colors.outline}
                                style={{ marginHorizontal: 8 }}
                            />
                            {collapsed && (
                                <CustomText type='collapseText'>
                                    {SortedList.current.length - (filterPlanner().length)} more
                                </CustomText>
                            )}
                        </TouchableOpacity>
                    )}
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