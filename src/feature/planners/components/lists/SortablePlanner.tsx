import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import useSortedList from '../../../../foundation/sortedLists/hooks/useSortedList';
import { ItemStatus, ListStorageMode, ShiftTextfieldDirection } from '../../../../foundation/sortedLists/enums';
import { usePlannerContext } from '../../services/PlannerProvider';
import { Event, TimeConfig } from '../../types';
import DayBanner from '../banner/DayBanner';
import { persistEvent, deleteEvent, buildPlanner, getPlannerStorageKey } from '../../storage/plannerStorage';
import ClickableLine from '../../../../foundation/ui/separators/ClickableLine';
import ListTextfield from '../../../../foundation/sortedLists/components/ListTextfield';
import TimeModal from '../modal/TimeModal';
import CustomText from '../../../../foundation/ui/text/CustomText';
import Time from '../info/Time';
import { useMMKV, useMMKVListener } from 'react-native-mmkv';
import { StorageIds } from '../../../../enums';
import { extractTimeValue, generateSortIdByTimestamp } from '../../utils';
import globalStyles from '../../../../foundation/theme/globalStyles';
import GenericIcon from '../../../../foundation/ui/icons/GenericIcon';
import colors from '../../../../foundation/theme/colors';
import Card from '../../../../foundation/ui/card';
import EmptyLabel from '../../../../foundation/sortedLists/components/EmptyLabel';
import Chip from '../info/Chip';
import { WeatherForecast } from '../../../../foundation/weather/types';
import DraggableList from '../../../../foundation/sortedLists/components/DraggableList';

interface SortablePlannerProps {
    timestamp: string;
    birthdays: string[];
    holidays: string[];
    forecast: WeatherForecast;
    allDayEvents: string[];
};

const SortablePlanner = ({
    timestamp,
    birthdays,
    holidays,
    forecast,
    allDayEvents
}: SortablePlannerProps) => {
    const { focusedPlanner, setFocusedPlanner } = usePlannerContext();
    const [timeModalOpen, setTimeModalOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    // const [planner, setPlanner] = useState<Event[]>([]);
    // const plannerStorage = useMMKV({ id: StorageIds.PLANNER_STORAGE });
    // const skipStorageSync = useRef(true);

    const toggleCollapsed = () => {
        SortedPlanner.saveTextfield();
        setCollapsed(curr => !curr);
    };
    const toggleTimeModal = () => setTimeModalOpen(curr => !curr);

    // Creates a new event in storage, and ensures the component re-render is skipped
    // const customCreateNewItem = (event: Event) => {
    //     // skipStorageSync.current = true;
    //     persistEvent(event);
    // };

    // Creates a new textfield linked to this planner
    const initializeNewEvent = (newEvent: Event) => {
        return {
            ...newEvent,
            plannerId: timestamp
        }
    };

    // Stores the current planner and all handler functions to update it
    const SortedPlanner = useSortedList<Event, Event[]>(
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

    // Load in the initial planner and recurring weekday planner
    // useEffect(() => {
    //     const loadPlanner = async () => {
    //         const loadedPlanner = await buildPlanner(timestamp);
    //         const allDayEvents = loadedPlanner.filter(event => event.timeConfig?.allDay);
    //         setAllDayEvents(allDayEvents);
    //         // const filteredPlanner = loadedPlanner.filter(event => !event.recurringConfig?.deleted && !event.timeConfig?.allDay);
    //         // setPlanner(filteredPlanner);
    //     };
    //     loadPlanner();
    // }, []);

    // Sync the sorted planner with storage
    // useMMKVListener(async (key) => {
    //     if (key === getPlannerStorageKey(timestamp)) {
    //         if (!skipStorageSync) {
    //             const loadedPlanner = await buildPlanner(timestamp);
    //             setPlanner(loadedPlanner);
    //         } else {
    //             skipStorageSync.current = false;
    //         }
    //     }
    // }, plannerStorage);

    // TODO: update synchronous when other textfield becomes focused

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
            customParentSortId = SortedPlanner.items[SortedPlanner.items.length - 1]?.sortId || -1;
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
    // const renderRow = ({ item, drag }: RenderItemParams<Event>) => {
    // const renderRow = (item: Event) => {
    //     const isItemEditing = [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status);
    //     const isItemDeleting = item.status === ItemStatus.DELETE;
    //     const iconStyle = isItemDeleting ? 'circle' : 'circle-thin';
    //     return <>
    //         {/* <View style={globalStyles.background}>
    //              <View style={globalStyles.listRow}> */}

    //         {/* Toggle Delete Icon */}
    //         {/* <TouchableOpacity onPress={() => customToggleDeleteItem(item)}>
    //                     <GenericIcon
    //                         type='FontAwesome'
    //                         name={iconStyle}
    //                         size={20}
    //                         color={isItemDeleting ? colors.blue : colors.grey}
    //                     />
    //                 </TouchableOpacity> */}

    //         {/* Event Data */}
    //         {isItemEditing ?
    //             <ListTextfield
    //                 key={`${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${timeModalOpen}`}
    //                 item={item}
    //                 onChange={(text) => {
    //                     const newEvent = {
    //                         ...item,
    //                         value: text,
    //                     };
    //                     if (!item.timeConfig?.isCalendarEvent) {
    //                         const { timeConfig, updatedText } = extractTimeValue(text);
    //                         if (timeConfig) {
    //                             newEvent.timeConfig = timeConfig;
    //                             newEvent.value = updatedText;
    //                             newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedPlanner.items);
    //                         }
    //                     }
    //                     SortedPlanner.updateItem(newEvent);
    //                 }}
    //                 onSubmit={() => SortedPlanner.saveTextfield(ShiftTextfieldDirection.BELOW)}
    //             /> :
    //             <TouchableOpacity
    //                 // onLongPress={drag}
    //                 onPress={() => customBeginEditItem(item)}
    //                 style={globalStyles.listItem}
    //             >
    //                 <CustomText
    //                     type='standard'
    //                     style={{
    //                         color: item.status && [ItemStatus.DELETE].includes(item.status) ?
    //                             colors.grey : colors.white,
    //                         textDecorationLine: item.status === ItemStatus.DELETE ? 'line-through' : undefined
    //                     }}
    //                 >
    //                     {item.value}
    //                 </CustomText>
    //             </TouchableOpacity>
    //         }

    //         {/* Time */}
    //         {/* {!!item.timeConfig?.startTime ? (
    //                     <TouchableOpacity onPress={() => {
    //                         SortedPlanner.beginEditItem(item)
    //                         toggleTimeModal();
    //                     }}>
    //                         <Time timeValue={item.timeConfig?.startTime} />
    //                     </TouchableOpacity>
    //                 ) : isItemEditing && !!item.value.length && (
    //                     <TouchableOpacity onPress={toggleTimeModal}>
    //                         <GenericIcon
    //                             type='MaterialCommunityIcons'
    //                             name='clock-plus-outline'
    //                             size={20}
    //                             color={colors.grey}
    //                         />
    //                     </TouchableOpacity>
    //                 )} */}
    //         {/* </View> */}

    //         {/* Separator Line */}
    //         {/* <ClickableLine onPress={() => customMoveTextfield(item.sortId)} /> */}

    //         {/* Time Modal */}
    //         {isItemEditing && (
    //             <TimeModal
    //                 open={timeModalOpen}
    //                 toggleModalOpen={toggleTimeModal}
    //                 event={item}
    //                 timestamp={timestamp}
    //                 onSaveItem={(timeConfig: TimeConfig) => {
    //                     const newEvent = {
    //                         ...item,
    //                         timeConfig
    //                     };
    //                     newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedPlanner.items);
    //                     SortedPlanner.updateItem(newEvent);
    //                     toggleTimeModal();
    //                 }}
    //             />
    //         )}
    //         {/* </View> */}
    //         {/* ) */}
    //     </>
    // };

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
            {SortedPlanner.items.length > 5 && !collapsed && (
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
                            {SortedPlanner.items.filter(item => item.status !== ItemStatus.NEW).length} plans
                        </CustomText>
                    </TouchableOpacity>
                    <ClickableLine onPress={toggleCollapsed} />
                </View>
            )}

            {/* Planner List */}
            {/* <DraggableFlatList
                data={collapsed ? [] : SortedPlanner.current}
                onDragEnd={SortedPlanner.endDragItem}
                onDragBegin={SortedPlanner.beginDragItem}
                keyExtractor={(item) => item.id} // nope
                scrollEnabled={false} // nope
                renderItem={renderRow}
            /> */}

            {/* Planner List */}
            {!collapsed && (
                <DraggableList<Event>
                    items={SortedPlanner.items}
                    beginDrag={() => { }}
                    endDrag={() => { }}
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
                                newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedPlanner.items);
                            }
                        }
                        SortedPlanner.updateItem(newEvent);
                    }}
                    onSubmitTextfield={() => SortedPlanner.saveTextfield(ShiftTextfieldDirection.BELOW)}
                    onRowClick={(item) => customBeginEditItem(item)}
                    renderRightIcon={item => ({
                        hideIcon: (item.status === ItemStatus.STATIC && !item.timeConfig?.startTime) || (item.status !== ItemStatus.STATIC && !item.value.length),
                        icon: {
                            type: 'MaterialCommunityIcons',
                            name: 'clock-plus-outline',
                            color: colors.grey
                        },
                        onClick: !!item.timeConfig?.startTime ? () => {
                            SortedPlanner.beginEditItem(item)
                            toggleTimeModal();
                        } : toggleTimeModal,
                        customIcon: !!item.timeConfig?.startTime ? <Time timeValue={item.timeConfig?.startTime} /> : undefined
                    })}
                    handleSeparatorClick={(item) => customMoveTextfield(item.sortId)}
                    renderItemModal={(item) => [ItemStatus.NEW, ItemStatus.EDIT].includes(item.status) && (
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
                                newEvent.sortId = generateSortIdByTimestamp(newEvent, SortedPlanner.items);
                                SortedPlanner.updateItem(newEvent);
                                toggleTimeModal();
                            }}
                        />
                    )}
                />
            )}

            {/* Collapse Control */}
            {!!SortedPlanner.items.length ? (
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
                        {SortedPlanner.items.filter(item => item.status !== ItemStatus.NEW).length} plans
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

export default SortablePlanner;