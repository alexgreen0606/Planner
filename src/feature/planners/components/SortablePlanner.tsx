import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Checkbox, useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { theme } from '../../../theme/theme';
import { FontAwesome } from '@expo/vector-icons';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { usePlannerContext } from '../services/PlannerProvider';
import { Event, TimeDialog } from '../types';
import DayBanner from './DayBanner';
import { getPlanner, savePlanner } from '../storage/plannerStorage';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
import { isValidTimestamp } from '../utils';
import Modal from '../../../foundation/ui/modal/Modal';
import globalStyles from '../../../theme/globalStyles';
import { generateTimeOptions } from '../utils';
import TimeDropdown from '../../../foundation/ui/input/TimeDropdown';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';
import TimeModal from './TimeModal';
import CustomText from '../../../foundation/ui/text';

/***
 * UPCOMING CHANGES
 * 
 * Time Modal Includes:
 *  - flag for calendar inclusion
 *  - flag for all day (default true)
 *  - box for start time
 *  - box for end time
 * 
 */

interface SortablePlannerProps {
    plannerId: string;
    manualSaveTrigger?: boolean;
};

const SortablePlanner = ({
    plannerId,
    manualSaveTrigger
}: SortablePlannerProps) => {
    const { colors } = useTheme();
    const { focusedPlanner, setFocusedPlanner } = usePlannerContext();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(isValidTimestamp(plannerId));
    const planner = useMemo(() => getPlanner(plannerId), []);
    const recurringWeekdayPlanner = useMemo(() => getPlanner(RECURRING_WEEKDAY_PLANNER), []);
    const customSavePlanner = (manualSaveTrigger !== undefined) ? undefined : (newItems: Event[]) => savePlanner(plannerId, newItems);
    const SortedList = useSortedList<Event>(planner, customSavePlanner);

    const toggleCollapsed = () => setCollapsed(curr => !curr);
    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    useEffect(() => {
        if (manualSaveTrigger)
            savePlanner(plannerId, SortedList.current);
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

    /**
     * Moves the textfield to its new position, and sets this as the focused planner within
     * the context.
     */
    const customMoveTextfield = (parentSortId: number | null) => {
        SortedList.moveTextfield(parentSortId);
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

    const renderItem = useCallback((item: Event, drag: any) =>
        item.status && [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status) ?
            <ListTextfield
                key={`${item.id}-${item.sortId}`}
                item={item}
                onChange={(text) => { SortedList.updateItem({ ...item, value: text }) }}
                onSubmit={() => SortedList.saveTextfield(ShiftTextfieldDirection.BELOW)}
            /> :
            <Text
                onLongPress={drag}
                onPress={() => customBeginEditItem(item)}
                style={{
                    ...styles.listItem,
                    color: item.status && [ItemStatus.DELETE].includes(item.status) ?
                        colors.outline : colors.secondary,
                    textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
                }}
            >
                {item.value}
            </Text>
        , [SortedList.current]);

    /**
     * If the list is collapsed, we filter out the recurring events.
     */
    const getListContent = useCallback(() => {
        if (collapsed) {
            const recurringWeekdayPlannerIds = recurringWeekdayPlanner.map(event => event.id);
            return SortedList.current.filter(item => !recurringWeekdayPlannerIds.includes(item.id)).slice(0, 3);
        } else {
            return SortedList.current;
        }
    }, [collapsed, SortedList]);

    /***
     * UPCOMING CHANGES
     * 
     * Time Modal Includes:
     *  - flag for calendar inclusion
     *  - flag for all day (default true)
     *  - box for start time
     *  - box for end time
     * 
     */
    const renderRow = useCallback(({ item, drag, getIndex }: RenderItemParams<Event>) => {
        const isTextfield = !!item.status && [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
        const isItemDeleting = item.status === ItemStatus.DELETE;
        const iconStyle = isTextfield ? 'clock-o' : plannerId === RECURRING_WEEKDAY_PLANNER ? 'trash' : isItemDeleting ? 'dot-circle-o' : 'circle-thin';

        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={isItemDeleting ? colors.primary : colors.secondary}
                        onPress={() => isTextfield ? setTimeModalOpen(true) : customToggleDeleteItem(item)}
                    />
                    {renderItem(item, drag)}
                </View>
                <ClickableLine onPress={() => customMoveTextfield(item.sortId)} />
                {isTextfield && (
                    <TimeModal
                        open={timeModalOpen}
                        toggleModalOpen={toggleTimeModal}
                        onSave={() => { }}
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
                    data={getListContent()}
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
                                    {SortedList.current.length - (getListContent().length)} more
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
        backgroundColor: theme.colors.backdrop
    },

    listItem: {
        width: '100%',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 4,
        paddingBottom: 4,
        minHeight: 25,
        color: theme.colors.secondary,
        fontSize: 16,
    },
});

export default SortablePlanner;