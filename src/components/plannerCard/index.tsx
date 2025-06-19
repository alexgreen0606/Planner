import { textfieldItemAtom } from '@/atoms/textfieldData';
import { useCalendarData } from '@/hooks/useCalendarData';
import useSortedList from '@/hooks/useSortedList';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/layout';
import { PLANNER_STORAGE_ID } from '@/lib/constants/storage';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { deleteAllRecurringEvents, deletePlannerEvents, resetRecurringEvents, savePlannerEvent, toggleHideAllRecurringEvents } from '@/storage/plannerStorage';
import { datestampToDayOfWeek, datestampToMonthDate } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuView } from '@react-native-menu/menu';
import { usePathname, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import Card from '../../components/Card';
import { buildPlannerEvents, generateEventToolbar, generatePlanner, generateTimeIconConfig, handleEventValueUserInput, openTimeModal } from '../../utils/plannerUtils';
import GenericIcon from '../icon';
import SortableList from '../sortedList';
import DayBanner from './DayBanner';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { EDeleteFunctionKey } from '@/lib/enums/EDeleteFunctionKeys';

enum EditAction {
    EDIT_TITLE = 'EDIT_TITLE',
    TOGGLE_HIDE_RECURRING = 'TOGGLE_HIDE_RECURRING',
    RESET_RECURRING = 'RESET_RECURRING',
    DELETE_RECURRING = 'DELETE_RECURRING'
}

interface PlannerCardProps {
    datestamp: string;
    forecast?: WeatherForecast;
}

const PlannerCard = ({
    datestamp,
    forecast
}: PlannerCardProps) => {
    const { getDeletingItems } = useDeleteScheduler<IPlannerEvent>();
    const pathname = usePathname();
    const router = useRouter();

    const { calendarEvents, calendarChips } = useCalendarData(datestamp);

    const [textfieldItem, setTextfieldItem] = useAtom(textfieldItemAtom);

    const [collapsed, setCollapsed] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const isTimeModalOpen = useMemo(() =>
        pathname.includes('timeModal'),
        [pathname]
    );

    // ------------- Utility Functions -------------

    const isEventDeleting = useCallback((planEvent: IPlannerEvent) =>
        getDeletingItems(EDeleteFunctionKey.PLANNER_EVENT).some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and is rooted in this planner (deleting multi-day start events should not mark the end event as deleting)
            deleteItem.listId === datestamp
        ),
        [getDeletingItems]
    );

    async function toggleCollapsed() {
        if (textfieldItem) {
            if (textfieldItem.value.trim() !== '')
                await SortedEvents.persistItemToStorage(textfieldItem);
            setTextfieldItem(null);
        }
        setCollapsed(curr => !curr);
    }

    function handleOpenTimeModal(item: IPlannerEvent) {
        openTimeModal(datestamp, item, router);
    }

    // ------------- List Management Utils -------------

    function handleAction(action: EditAction) {
        switch (action) {
            case EditAction.EDIT_TITLE:
                setIsEditingTitle(true);
                break;
            case EditAction.DELETE_RECURRING:
                deleteAllRecurringEvents(datestamp);
                break;
            case EditAction.RESET_RECURRING:
                resetRecurringEvents(datestamp);
                break;
            case EditAction.TOGGLE_HIDE_RECURRING:
                toggleHideAllRecurringEvents(datestamp);
            default:
                return;
        }
    }

    const getItemsFromStorageObject = useCallback((planner: TPlanner) => {
        return buildPlannerEvents(datestamp, planner, calendarEvents);
    }, [calendarEvents]);

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        initializedStorageObject: generatePlanner(datestamp),
        storageConfig: {
            createItem: savePlannerEvent,
            updateItem: savePlannerEvent,
            deleteItems: deletePlannerEvents
        },
        deleteFunctionKey: EDeleteFunctionKey.PLANNER_EVENT
    });

    const planner = SortedEvents.storageObject;
    const hasTitle = (planner?.title.length ?? 0) > 0;
    const isRecurringHidden = planner?.hideRecurring;

    const visibleEvents = useMemo(() => {
        if (!isRecurringHidden) return SortedEvents.items;

        return SortedEvents.items.filter(event => !event.recurringCloneId && !event.recurringId);
    }, [SortedEvents.items, isRecurringHidden]);

    useEffect(() => {
        if ((textfieldItem?.listId === datestamp) && isRecurringHidden) {
            toggleHideAllRecurringEvents(datestamp);
        }
    }, [textfieldItem?.listId, isRecurringHidden]);

    return (
        <Card
            header={
                <DayBanner
                    planner={planner ?? generatePlanner(datestamp)}
                    forecast={forecast}
                    eventChipSets={calendarChips ?? []}
                    collapsed={collapsed}
                    toggleCollapsed={toggleCollapsed}
                    isEditingTitle={isEditingTitle}
                    endEditTitle={() => setIsEditingTitle(false)}
                />
            }
            footer={
                <View className='flex-row justify-end'>
                    <MenuView
                        title={datestampToDayOfWeek(datestamp) + ', ' + datestampToMonthDate(datestamp)}
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
                deleteFunctionKey={EDeleteFunctionKey.PLANNER_EVENT}
                saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
                onDragEnd={SortedEvents.persistItemToStorage}
                onDeleteItem={SortedEvents.deleteSingleItemFromStorage}
                onContentClick={SortedEvents.toggleItemEdit}
                hideKeyboard={isTimeModalOpen}
                getTextfieldKey={(item) => `${item.id}-${item.sortId}-${item.timeConfig?.startTime}-${isTimeModalOpen}`}
                handleValueChange={(text, item) => handleEventValueUserInput(text, item, SortedEvents.items, datestamp)}
                getRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, SortedEvents.toggleItemDelete, isEventDeleting(item))}
                getToolbarProps={(event) => generateEventToolbar(event, handleOpenTimeModal, isTimeModalOpen)}
                customGetIsDeleting={isEventDeleting}
                emptyLabelConfig={{
                    label: 'No Plans',
                    className: 'h-20 flex justify-center items-center'
                }}
            />
        </Card>
    )
}

export default PlannerCard;
