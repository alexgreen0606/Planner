import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { textfieldItemAtom } from '@/atoms/textfieldData';
import { useCalendarData } from '@/hooks/useCalendarData';
import usePlanner from '@/hooks/usePlanner';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { plannerToolbarIconConfig } from '@/lib/constants/plannerToolbar';
import { EListItemType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { deleteAllRecurringEventsFromPlanner, resetRecurringEventsInPlanner } from '@/storage/plannerStorage';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, getTodayDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuView } from '@react-native-menu/menu';
import { usePathname } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import { deletePlannerEventsFromStorageAndCalendar, generateNewPlannerEventAndSaveToStorage, generatePlannerEventTimeIconConfig, updatePlannerEventIndexWithChronologicalCheck, updatePlannerEventValueWithSmartTimeDetect } from '../../utils/plannerUtils';
import DayBanner from '../banners/DayBanner';
import Card from '../Card';
import GenericIcon from '../icon';
import DragAndDropList from './components/DragAndDropList';

//

type TPlannerCardProps = {
    datestamp: string;
    forecast?: WeatherForecast;
};

enum EEditAction {
    EDIT_TITLE = 'EDIT_TITLE',
    TOGGLE_HIDE_RECURRING = 'TOGGLE_HIDE_RECURRING',
    RESET_RECURRING = 'RESET_RECURRING',
    DELETE_RECURRING = 'DELETE_RECURRING'
}

const PlannerCard = ({
    datestamp,
    forecast
}: TPlannerCardProps) => {
    const pathname = usePathname();

    const [textfieldItem] = useAtom(textfieldItemAtom);
    const calendarEventData = useAtomValue(calendarEventDataAtom);

    const {
        handleGetDeletingItemsByType: onGetDeletingItems,
        handleToggleScheduleItemDelete: onToggleScheduleItemDelete
    } = useDeleteScheduler<IPlannerEvent>();

    const { calendarChips } = useCalendarData(datestamp);

    const {
        planner,
        visibleEventIds,
        isEditingTitle,
        hasTitle,
        isRecurringHidden,
        handleEditTitle: onEditTitle,
        handleToggleEditTitle: onToggleEditTitle,
        handleToggleHideAllRecurring: onToggleHideAllRecurring
    } = usePlanner(datestamp);

    const [collapsed, setCollapsed] = useState(true);

    const customGetIsEventDeleting = useCallback((planEvent: IPlannerEvent | undefined) =>
        planEvent ? onGetDeletingItems(EListItemType.EVENT).some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and it's not from today
            deleteItem.listId !== getTodayDatestamp()
        ) : false,
        [onGetDeletingItems]
    );

    const eventStorage = useMMKV({ id: EStorageId.EVENT });

    const isCalendarLoading = calendarEventData.plannersMap[datestamp] === undefined;
    const isTimeModalOpen = pathname.includes('timeModal');

    // =============
    // 1. Reactions
    // =============

    // Reveal all recurring events when the textfield item belongs to this planner.
    useEffect(() => {
        // TEXTFIELD ITEM listId
        if (textfieldItem?.listId === datestamp && isRecurringHidden) {
            onToggleHideAllRecurring();
        }
    }, [textfieldItem?.listId, isRecurringHidden]);

    // Expand this list if the textfield item belongs to this planner.
    useEffect(() => {
        // TEXTFIELD ITEM listId
        if (textfieldItem?.listId === datestamp && collapsed) {
            setCollapsed(false);
        }
    }, [textfieldItem?.listId]);

    // ==================
    // 2. Event Handlers
    // ==================

    function handleAction(action: EEditAction) {
        switch (action) {
            case EEditAction.EDIT_TITLE:
                onToggleEditTitle();
                break;
            case EEditAction.DELETE_RECURRING:
                deleteAllRecurringEventsFromPlanner(datestamp);
                break;
            case EEditAction.RESET_RECURRING:
                resetRecurringEventsInPlanner(datestamp);
                break;
            case EEditAction.TOGGLE_HIDE_RECURRING:
                onToggleHideAllRecurring();
            default:
                return;
        }
    }

    async function handleToggleCollapsed() {
        if (textfieldItem) {
            // if (textfieldItem.value.trim() !== '')
            //     await SortedEvents.saveItem(textfieldItem);
            // setTextfieldItem(null);


            // TODO: set item to STATIC
        }
        setCollapsed(curr => !curr);
    }

    // =======
    // 3. UI
    // =======

    if (isCalendarLoading) return null;

    return (
        <Card
            header={
                <DayBanner
                    planner={planner}
                    forecast={forecast}
                    eventChipSets={calendarChips}
                    collapsed={collapsed}
                    isEditingTitle={isEditingTitle}
                    onEditTitle={onEditTitle}
                    onToggleEditTitle={onToggleEditTitle}
                    onToggleCollapsed={handleToggleCollapsed}
                />
            }
            footer={
                <View className='flex-row justify-end'>
                    <MenuView
                        title={`${getDayOfWeekFromDatestamp(datestamp)}, ${getMonthDateFromDatestamp(datestamp)}`}
                        onPressAction={({ nativeEvent }) => {
                            handleAction(nativeEvent.event as EEditAction);
                        }}
                        actions={[
                            {
                                id: EEditAction.EDIT_TITLE,
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
                                        id: EEditAction.TOGGLE_HIDE_RECURRING,
                                        title: `${isRecurringHidden ? 'Show' : 'Hide'} Recurring`,
                                        titleColor: 'rgba(250,180,100,0.5)',
                                        image: Platform.select({
                                            ios: isRecurringHidden ? 'eye' : 'eye.slash'
                                        }),
                                        imageColor: '#FFFFFF'
                                    },
                                    {
                                        id: EEditAction.RESET_RECURRING,
                                        title: 'Reset Recurring',
                                        subtitle: 'Customized recurring events will be reset.',
                                        titleColor: 'rgb(255,97,101)',
                                        image: Platform.select({
                                            ios: 'arrow.trianglehead.2.counterclockwise.rotate.90'
                                        }),
                                        imageColor: '#FFFFFF',
                                    },
                                    {
                                        id: EEditAction.DELETE_RECURRING,
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
            contentHeight={(visibleEventIds.length + 2) * LIST_ITEM_HEIGHT + 60}
        >
            <DragAndDropList<IPlannerEvent>
                listId={datestamp}
                itemIds={visibleEventIds}
                listType={EListItemType.EVENT}
                storage={eventStorage}
                hideKeyboard={isTimeModalOpen}
                emptyLabelConfig={{
                    label: 'No plans',
                    className: 'h-20 flex justify-center items-center'
                }}
                toolbarIconSet={plannerToolbarIconConfig}
                onValueChange={updatePlannerEventValueWithSmartTimeDetect}
                onIndexChange={updatePlannerEventIndexWithChronologicalCheck}
                onCreateItem={generateNewPlannerEventAndSaveToStorage}
                onDeleteItem={(event) => deletePlannerEventsFromStorageAndCalendar([event])}
                onGetRightIconConfig={generatePlannerEventTimeIconConfig}
                onGetLeftIconConfig={(item) => generateCheckboxIconConfig(customGetIsEventDeleting(item), onToggleScheduleItemDelete)}
                customOnGetIsDeleting={customGetIsEventDeleting}
            />
        </Card>
    );
}

export default PlannerCard;
