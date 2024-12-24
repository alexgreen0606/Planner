import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { FontAwesome } from '@expo/vector-icons';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { Event, TimeConfig } from '../types';
import { getPlanner, saveRecurringPlanner } from '../storage/plannerStorage';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';
import TimeModal from './TimeModal';
import CustomText from '../../../foundation/ui/text';
import Time from './Time';

interface SortableRecurringPlannerProps {
    manualSaveTrigger: boolean;
};

const SortableRecurringPlanner = ({
    manualSaveTrigger
}: SortableRecurringPlannerProps) => {
    const { colors } = useTheme();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [planner, setPlanner] = useState<Event[]>([]);

    const formatNewEvent = (newEvent: Event) => {
        return {
            ...newEvent,
            plannerId: RECURRING_WEEKDAY_PLANNER
        }
    }

    const SortedList = useSortedList<Event>(planner, undefined, formatNewEvent);

    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Load in the planner
    useEffect(() => {
        const loadPlanners = async () => {
            const loadedPlanner = await getPlanner(RECURRING_WEEKDAY_PLANNER);
            setPlanner(loadedPlanner);
        };
        loadPlanners();
    }, []);

    // Manually triggers the list to update
    useEffect(() => {
        if (manualSaveTrigger)
            saveRecurringPlanner(SortedList.current.filter(event => event.status === ItemStatus.STATIC));
    }, [manualSaveTrigger])

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
                onPress={() => SortedList.beginEditItem(item)}
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
        const iconStyle = 'trash';

        const hasTime = !item?.timeConfig?.allDay && !!item.timeConfig?.startDate;

        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={styles.row}>
                    <FontAwesome
                        name={iconStyle}
                        size={20}
                        color={isItemDeleting ? colors.secondary : colors.outline}
                        onPress={() =>SortedList.toggleDeleteItem(item)}
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
                <ClickableLine onPress={() => SortedList.moveTextfield(item.sortId)} />
                {isTextfield && (
                    <TimeModal
                        open={timeModalOpen}
                        toggleModalOpen={toggleTimeModal}
                        event={item}
                        timestamp={RECURRING_WEEKDAY_PLANNER}
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
    }, [SortedList.current, timeModalOpen, planner]);

    return (
        <View style={{ width: '100%' }}>
            <View style={{ width: '100%', marginBottom: 37 }}>
                <ClickableLine onPress={() => SortedList.moveTextfield(-1)} />
                <DraggableFlatList
                    data={SortedList.current}
                    scrollEnabled={false}
                    onDragEnd={SortedList.endDragItem}
                    onDragBegin={SortedList.beginDragItem}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRow}
                />
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

export default SortableRecurringPlanner;