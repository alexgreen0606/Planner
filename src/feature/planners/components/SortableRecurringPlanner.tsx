import React, { useCallback, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useSortedList from '../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ShiftTextfieldDirection } from '../../../foundation/sortedLists/enums';
import { Event, TimeConfig } from '../types';
import { buildPlanner, savePlannerToStorage } from '../storage/plannerStorage';
import { RECURRING_WEEKDAY_PLANNER } from '../enums';
import ClickableLine from '../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../foundation/sortedLists/components/ListTextfield';
import TimeModal from './TimeModal';
import CustomText from '../../../foundation/ui/text';
import Time from './Time';
import { generateSortIdByTimestamp } from '../utils';
import GenericIcon from '../../../foundation/ui/icons/GenericIcon';

interface SortableRecurringPlannerProps {
    manualSaveTrigger: string;
};

const SortableRecurringPlanner = ({
    manualSaveTrigger
}: SortableRecurringPlannerProps) => {
    const { colors } = useTheme();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [planner, setPlanner] = useState<Event[]>([]);

    const formatNewEvent = (newEvent: Event) => ({
        ...newEvent,
        plannerId: RECURRING_WEEKDAY_PLANNER,
        recurringConfig: {
            recurringId: newEvent.id
        }
    } as Event)

    const SortedPlanner = useSortedList<Event>(planner, undefined, formatNewEvent);

    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Load in the planner
    useEffect(() => {
        const loadPlanners = async () => {
            const loadedPlanner = await buildPlanner(RECURRING_WEEKDAY_PLANNER);
            setPlanner(loadedPlanner);
        };
        loadPlanners();
    }, []);

    // Manually triggers the list to update
    useEffect(() => {
        savePlannerToStorage(
            RECURRING_WEEKDAY_PLANNER,
            SortedPlanner.current
                .filter(event => !!event.value.length)
                .map(event => ({
                    ...event,
                    status: ItemStatus.STATIC
                })));
    }, [manualSaveTrigger])

    const renderItem = useCallback((item: Event, drag: any) =>
        item.status && [ItemStatus.EDIT, ItemStatus.NEW].includes(item.status) ?
            <ListTextfield
                key={`${item.id}-${item.sortId}-${item.timeConfig?.startTime}`}
                item={item}
                onChange={(text) => { SortedPlanner.updateItem({ ...item, value: text }) }}
                onSubmit={() => SortedPlanner.saveTextfield(ShiftTextfieldDirection.BELOW)}
            /> :
            <TouchableOpacity
                onLongPress={drag}
                onPress={() => SortedPlanner.beginEditItem(item)}
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
        , [SortedPlanner.current, timeModalOpen]);

    const renderRow = useCallback(({ item, drag }: RenderItemParams<Event>) => {
        const isTextfield = !!item.status && [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
        const isItemDeleting = item.status === ItemStatus.DELETE;

        return (
            <View style={{ backgroundColor: item.status === 'DRAG' ? colors.background : undefined }}>
                <View style={styles.row}>
                    {!isTextfield && (
                    <TouchableOpacity onPress={() => SortedPlanner.toggleDeleteItem(item)}>
                        <GenericIcon
                            type='MaterialCommunityIcons'
                            name={isItemDeleting ? 'trash-can' : 'trash-can-outline'}
                            size={20}
                            color={isItemDeleting ? colors.secondary : colors.outline}
                        />
                    </TouchableOpacity>
                    )}
                    {renderItem(item, drag)}
                    {!item?.timeConfig?.allDay && !!item.timeConfig?.startTime ? (
                        <TouchableOpacity onPress={() => {
                            SortedPlanner.beginEditItem(item)
                            setTimeModalOpen(true);
                        }}>
                            <Time timestamp={item.timeConfig?.startTime} />
                        </TouchableOpacity>
                    ) : isTextfield && (
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
                <ClickableLine onPress={() => SortedPlanner.moveTextfield(item.sortId)} />
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
                            newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedPlanner.current);
                            SortedPlanner.updateItem(newEvent);
                            toggleTimeModal();
                        }}
                    />
                )}
            </View>
        )
    }, [SortedPlanner.current, timeModalOpen, planner]);

    return (
        <View style={{ width: '100%' }}>
            <View style={{ width: '100%', marginBottom: 37 }}>
                <ClickableLine onPress={() => SortedPlanner.moveTextfield(-1)} />
                <DraggableFlatList
                    data={SortedPlanner.current}
                    scrollEnabled={false}
                    onDragEnd={SortedPlanner.endDragItem}
                    onDragBegin={SortedPlanner.beginDragItem}
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