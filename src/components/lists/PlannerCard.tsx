import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { textfieldItemAtom } from '@/atoms/textfieldData';
import { useCalendarData } from '@/hooks/useCalendarData';
import useSortedList from '@/hooks/useSortedList';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { deleteAllRecurringEventsFromPlanner, resetRecurringEventsInPlanner, toggleHideAllRecurringEventsInPlanner, upsertEventToStorageAndCalendarCheckRecurring } from '@/storage/plannerStorage';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, getTodayDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuView } from '@react-native-menu/menu';
import { usePathname } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { generateEmptyPlanner, generatePlannerEventTimeIconConfig, generatePlannerToolbarIconSet, syncPlannerWithExternalDataAndUpdateStorage, updateEventValueWithSmartTimeDetect } from '../../utils/plannerUtils';
import DayBanner from '../banners/DayBanner';
import Card from '../Card';
import GenericIcon from '../icon';
import SortableList from './components/SortableList';

// ✅ 

type PlannerCardProps = {
    datestamp: string;
    forecast?: WeatherForecast;
};

enum EditAction {
    EDIT_TITLE = 'EDIT_TITLE',
    TOGGLE_HIDE_RECURRING = 'TOGGLE_HIDE_RECURRING',
    RESET_RECURRING = 'RESET_RECURRING',
    DELETE_RECURRING = 'DELETE_RECURRING'
}

const PlannerCard = ({
    datestamp,
    forecast
}: PlannerCardProps) => {
    const { handleGetDeletingItemsByType: getDeletingItems, handleToggleScheduleItemDelete: toggleScheduleItemDelete } = useDeleteScheduler<IPlannerEvent>();
    const { calendarEvents, calendarChips } = useCalendarData(datestamp);
    const [textfieldItem, setTextfieldItem] = useAtom(textfieldItemAtom);
    const calendarEventData = useAtomValue(calendarEventDataAtom);
    const pathname = usePathname();

    const [collapsed, setCollapsed] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const isCalendarLoading = useMemo(
        () => calendarEventData.plannersMap[datestamp] === undefined,
        [calendarEventData]
    );

    const isTimeModalOpen = useMemo(
        () => pathname.includes('timeModal'),
        [pathname]
    );

    const isEventDeleting = useCallback((planEvent: IPlannerEvent) =>
        getDeletingItems(listType).some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and it's not from today
            deleteItem.listId !== getTodayDatestamp()
        ),
        [getDeletingItems]
    );

    const getItemsFromStorageObject = useCallback((planner: TPlanner) =>
        syncPlannerWithExternalDataAndUpdateStorage(planner, calendarEvents),
        [calendarEvents]
    );

    const listType = EListType.PLANNER;

    // ===================
    // 1. List Generation
    // ===================

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: EStorageId.PLANNER,
        storageKey: datestamp,
        listType,
        onGetItemsFromStorageObject: getItemsFromStorageObject,
        initializedStorageObject: generateEmptyPlanner(datestamp),
        onSaveItemToStorage: upsertEventToStorageAndCalendarCheckRecurring
    });
    // ===================

    const planner = SortedEvents.storageObject;
    const hasTitle = (planner?.title.length ?? 0) > 0;
    const isRecurringHidden = planner?.hideRecurring;

    // ------------- Events visible to the user (hide recurring when needed) -------------
    const visibleEvents = useMemo(() => {
        if (!isRecurringHidden) return SortedEvents.items;
        return SortedEvents.items.filter(event => !event.recurringCloneId && !event.recurringId);
    }, [SortedEvents.items, isRecurringHidden]);

    // =============
    // 2. Reactions
    // =============

    // Reveal all recurring events when the textfield item belongs to this planner.
    useEffect(() => {
        if (textfieldItem?.listId === datestamp && isRecurringHidden) {
            toggleHideAllRecurringEventsInPlanner(datestamp);
        }
    }, [textfieldItem?.listId, isRecurringHidden]);

    // Expand this list if the textfield item belongs to this planner.
    useEffect(() => {
        if (textfieldItem?.listId === datestamp && collapsed) {
            setCollapsed(false);
        }
    }, [textfieldItem?.listId]);

    // ==================
    // 3. Event Handlers
    // ==================

    function handleAction(action: EditAction) {
        switch (action) {
            case EditAction.EDIT_TITLE:
                setIsEditingTitle(true);
                break;
            case EditAction.DELETE_RECURRING:
                deleteAllRecurringEventsFromPlanner(datestamp);
                break;
            case EditAction.RESET_RECURRING:
                resetRecurringEventsInPlanner(datestamp);
                break;
            case EditAction.TOGGLE_HIDE_RECURRING:
                toggleHideAllRecurringEventsInPlanner(datestamp);
            default:
                return;
        }
    }

    async function handleToggleScheduleEventDelete(event: IPlannerEvent) {
        toggleScheduleItemDelete(event);

        // If this is the textfield, save it.
        if (event.id === textfieldItem?.id) {
            await SortedEvents.saveItem(textfieldItem);
            setTextfieldItem(null);
        }
    }

    async function handleToggleCollapsed() {
        if (textfieldItem) {
            if (textfieldItem.value.trim() !== '')
                await SortedEvents.saveItem(textfieldItem);
            setTextfieldItem(null);
        }
        setCollapsed(curr => !curr);
    }

    // =======
    // 4. UI
    // =======

    if (isCalendarLoading) return null;

    return (
        <Card
            header={
                <DayBanner
                    planner={planner ?? generateEmptyPlanner(datestamp)}
                    forecast={forecast}
                    eventChipSets={calendarChips ?? []}
                    collapsed={collapsed}
                    onToggleCollapsed={handleToggleCollapsed}
                    isEditingTitle={isEditingTitle}
                    onEndEditTitle={() => setIsEditingTitle(false)}
                />
            }
            footer={
                <View className='flex-row justify-end'>
                    <MenuView
                        title={`${getDayOfWeekFromDatestamp(datestamp)}, ${getMonthDateFromDatestamp(datestamp)}`}
                        onPressAction={({ nativeEvent }) => {
                            handleAction(nativeEvent.event as EditAction);
                        }}
                        actions={[
                            {
                                id: EditAction.EDIT_TITLE,
                                title: `${hasTitle ? 'Edit' : 'Add'} Planner Title`,
                                titleColor: '#FFFFFF',
                                image: Platform.select({
                                    ios: hasTitle ? 'pencil' : 'plus'
                                }),
                                imageColor: '#FFFFFF'
                            },
                            {
                                id: 'recurring',
                                title: 'Manage Recurring',
                                titleColor: '#FFFFFF',
                                subtitle: 'Hide, delete, and sync events.',
                                image: Platform.select({
                                    ios: 'repeat'
                                }),
                                imageColor: '#FFFFFF',
                                subactions: [
                                    {
                                        id: EditAction.TOGGLE_HIDE_RECURRING,
                                        title: `${isRecurringHidden ? 'Show' : 'Hide'} Recurring`,
                                        titleColor: 'rgba(250,180,100,0.5)',
                                        image: Platform.select({
                                            ios: isRecurringHidden ? 'eye' : 'eye.slash'
                                        }),
                                        imageColor: '#FFFFFF'
                                    },
                                    {
                                        id: EditAction.RESET_RECURRING,
                                        title: 'Reset Recurring',
                                        subtitle: 'Customized recurring events will be reset.',
                                        titleColor: 'rgb(255,97,101)',
                                        image: Platform.select({
                                            ios: 'arrow.trianglehead.2.counterclockwise.rotate.90'
                                        }),
                                        imageColor: '#FFFFFF',
                                    },
                                    {
                                        id: EditAction.DELETE_RECURRING,
                                        title: 'Delete Recurring',
                                        attributes: {
                                            destructive: true
                                        },
                                        image: Platform.select({
                                            ios: 'trash'
                                        }),
                                        imageColor: 'rgb(255,66,69)'
                                    }
                                ],
                            }
                        ]}
                        shouldOpenOnLongPress={false}
                    >
                        <GenericIcon size='l' type='more' platformColor='systemBlue' />
                    </MenuView>
                </View>
            }
            collapsed={collapsed}
            contentHeight={(SortedEvents.items.length + 2) * LIST_ITEM_HEIGHT + 60}
        >
            <SortableList<IPlannerEvent>
                listId={datestamp}
                items={visibleEvents}
                listType={listType}
                onSaveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
                onDragEnd={SortedEvents.saveItem}
                onContentClick={SortedEvents.toggleItemEdit}
                hideKeyboard={isTimeModalOpen}
                onValueChange={(text, item) => updateEventValueWithSmartTimeDetect(text, item, SortedEvents.items, datestamp)}
                onGetRightIconConfig={generatePlannerEventTimeIconConfig}
                onGetLeftIconConfig={(item) => generateCheckboxIconConfig(isEventDeleting(item), handleToggleScheduleEventDelete)}
                toolbarIconSet={generatePlannerToolbarIconSet()}
                customOnGetIsDeleting={isEventDeleting}
                emptyLabelConfig={{
                    label: 'No plans',
                    className: 'h-20 flex justify-center items-center'
                }}
            />
        </Card>
    );
}

export default PlannerCard;
