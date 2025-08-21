import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { useTextfieldItemAs } from '@/hooks/textfields/useTextfieldItemAs';
import { useCalendarData } from '@/hooks/useCalendarData';
import usePlanner from '@/hooks/usePlanner';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/listConstants';
import { plannerToolbarIconConfig } from '@/lib/constants/plannerToolbar';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { getDayOfWeekFromDatestamp, getMonthDateFromDatestamp, getTodayDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuView } from '@react-native-menu/menu';
import { useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { useMMKV } from 'react-native-mmkv';
import { deletePlannerEventsFromStorageAndCalendar, generateNewPlannerEventAndSaveToStorage, generatePlannerEventTimeIconConfig, updatePlannerEventIndexWithChronologicalCheck, updatePlannerEventValueWithSmartTimeDetect } from '../../utils/plannerUtils';
import DayBanner from '../banners/DayBanner';
import Card from '../Card';
import GenericIcon from '../icon';
import DragAndDropList from './components/DragAndDropList';

// ✅ 

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

    const eventStorage = useMMKV({ id: EStorageId.PLANNER_EVENT });

    const { textfieldItem, onCloseTextfield } = useTextfieldItemAs<IPlannerEvent>(eventStorage);
    const calendarEventData = useAtomValue(calendarEventDataAtom);

    const {
        onGetDeletingItemsByStorageIdCallback: onGetDeletingItems,
        onToggleScheduleItemDeleteCallback: onToggleScheduleItemDelete
    } = useDeleteScheduler<IPlannerEvent>();

    const { calendarChips } = useCalendarData(datestamp);

    const {
        planner,
        visibleEventIds,
        isEditingTitle,
        hasTitle,
        isRecurringHidden,
        onEditTitle,
        onToggleEditTitle,
        onToggleHideAllRecurring,
        onResetRecurringEvents,
        onDeleteAllRecurringEvents
    } = usePlanner(datestamp);

    const [collapsed, setCollapsed] = useState(true);

    const customGetIsEventDeleting = useCallback((planEvent: IPlannerEvent | undefined) =>
        planEvent ? onGetDeletingItems(EStorageId.PLANNER_EVENT).some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and it's not from today
            deleteItem.listId !== getTodayDatestamp()
        ) : false,
        [onGetDeletingItems]
    );

    const overflowActions = [
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
    ];

    const isCalendarLoading = calendarEventData.plannersMap[datestamp] === undefined;

    // =============
    // 1. Reactions
    // =============

    // Reveal all recurring events when the textfield item belongs to this planner.
    useEffect(() => {
        if (textfieldItem?.listId === datestamp && isRecurringHidden) {
            onToggleHideAllRecurring();
        }
    }, [textfieldItem?.listId, isRecurringHidden]);

    // Expand this list if the textfield item belongs to this planner.
    useEffect(() => {
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
                onDeleteAllRecurringEvents();
                break;
            case EEditAction.RESET_RECURRING:
                onResetRecurringEvents();
                break;
            case EEditAction.TOGGLE_HIDE_RECURRING:
                onToggleHideAllRecurring();
            default:
                return;
        }
    }

    async function handleToggleCollapsed() {
        if (textfieldItem) {
            onCloseTextfield();
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
                        actions={overflowActions}
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
                storageId={EStorageId.PLANNER_EVENT}
                storage={eventStorage}
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
