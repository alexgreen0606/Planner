import { calendarChipsByDate, calendarPlannerByDate } from '@/atoms/calendarEvents';
import { textfieldItemAtom } from '@/atoms/textfieldData';
import { LIST_ITEM_HEIGHT } from '@/constants/layout';
import { PLANNER_STORAGE_ID } from '@/constants/storage';
import { useDeleteScheduler } from '@/hooks/useDeleteScheduler';
import useSortedList from '@/hooks/useSortedList';
import { deleteAllRecurringEvents, resetRecurringEvents, toggleHideAllRecurringEvents } from '@/storage/plannerStorage';
import { IPlannerEvent } from '@/types/listItems/IPlannerEvent';
import { TPlanner } from '@/types/planner/TPlanner';
import { datestampToDayOfWeek, datestampToMonthDate } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuView } from '@react-native-menu/menu';
import { usePathname, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import Card from '../../components/Card';
import EventChip, { EventChipProps } from '../../components/EventChip';
import { generatePlanner } from '../../utils/calendarUtils';
import { buildPlannerEvents, deleteEventsReloadData, generateEventToolbar, generateTimeIconConfig, handleEventValueUserInput, openTimeModal, saveEventReloadData } from '../../utils/plannerUtils';
import GenericIcon, { GenericIconProps } from '../GenericIcon';
import SortableList from '../sortedList';
import DayBanner from './DayBanner';
import EventChipSets from '../EventChipSet';

enum EditAction {
    EDIT_TITLE = 'EDIT_TITLE',
    TOGGLE_HIDE_RECURRING = 'TOGGLE_HIDE_RECURRING',
    RESET_RECURRING = 'RESET_RECURRING',
    DELETE_RECURRING = 'DELETE_RECURRING'
}

export type EventChipSet = EventChipProps[];

// TODO: move to utils file and use EventChipProps[][] instead of Set type
export function getChipSets(chips: EventChipProps[]): EventChipSet[] {
    const chipMap: Record<string, EventChipSet> = {};

    for (const chip of chips) {
        const { color } = chip;
        if (!chipMap[color]) {
            chipMap[color] = [chip];
        } else {
            chipMap[color].push(chip);
        }
    }

    return Object.entries(chipMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, chips]) => chips);
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

    const [calendarEvents] = useAtom(calendarPlannerByDate(datestamp));
    const [calendarChips] = useAtom(calendarChipsByDate(datestamp));
    const [textfieldItem, setTextfieldItem] = useAtom(textfieldItemAtom);

    const [collapsed, setCollapsed] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const isTimeModalOpen = useMemo(() =>
        pathname.includes('timeModal'),
        [pathname]
    );

    const eventChipSets = useMemo(() => {
        return getChipSets(calendarChips);
    }, [calendarChips]);

    // ------------- Utility Functions -------------

    const isEventDeleting = useCallback((planEvent: IPlannerEvent) => {
        const deletingItems = getDeletingItems();
        return deletingItems.some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and is rooted in this planner (deleting multi-day start events should not mark the end event as deleting)
            deleteItem.listId === datestamp
        );
    }, [getDeletingItems]);

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

    function getItemsFromStorageObject(planner: TPlanner) {
        return buildPlannerEvents(datestamp, planner, calendarEvents);
    }

    async function handleDeleteEvents(planEvents: IPlannerEvent[]) {
        await deleteEventsReloadData(planEvents);
    }

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: PLANNER_STORAGE_ID,
        storageKey: datestamp,
        getItemsFromStorageObject,
        initializedStorageObject: generatePlanner(datestamp),
        storageConfig: {
            createItem: saveEventReloadData,
            updateItem: saveEventReloadData,
            deleteItems: handleDeleteEvents
        },
        reloadTriggers: [calendarEvents]
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

    return planner &&
        <Card
            header={
                <DayBanner
                    planner={planner}
                    toggleCollapsed={toggleCollapsed}
                    collapsed={collapsed}
                    forecast={forecast}
                    isEditingTitle={isEditingTitle}
                    endEditTitle={() => setIsEditingTitle(false)}
                    eventChipSets={eventChipSets}
                />
            }
            footer={
                <View className='flex-row justify-end'>
                    <MenuView
                        title={datestampToDayOfWeek(datestamp) + ' ' + datestampToMonthDate(datestamp)}
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
            contentHeight={
                ((SortedEvents.items.length + 1) * LIST_ITEM_HEIGHT) +
                (calendarChips.length * LIST_ITEM_HEIGHT) +
                LIST_ITEM_HEIGHT
            }
        >
            <SortableList<IPlannerEvent>
                listId={datestamp}
                items={visibleEvents}
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
                customIsItemDeleting={isEventDeleting}
                emptyLabelConfig={{
                    label: 'No Plans',
                    className: 'h-20 flex justify-center items-center'
                }}
            />
        </Card>
};

export default PlannerCard;
