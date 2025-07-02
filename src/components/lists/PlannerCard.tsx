import { calendarEventDataAtom } from '@/atoms/calendarEvents';
import { textfieldItemAtom } from '@/atoms/textfieldData';
import { useCalendarData } from '@/hooks/useCalendarData';
import useSortedList from '@/hooks/useSortedList';
import { LIST_ITEM_HEIGHT } from '@/lib/constants/layout';
import { EListType } from '@/lib/enums/EListType';
import { EStorageId } from '@/lib/enums/EStorageId';
import { IPlannerEvent } from '@/lib/types/listItems/IPlannerEvent';
import { TPlanner } from '@/lib/types/planner/TPlanner';
import { useDeleteScheduler } from '@/providers/DeleteScheduler';
import { deleteAllRecurringEventsFromPlanner, resetRecurringEventsInPlanner, saveEventToPlannerWithRecurringCheck, toggleHideAllRecurringEventsInPlanner } from '@/storage/plannerStorage';
import { datestampToDayOfWeek, datestampToMonthDate, getTodayDatestamp } from '@/utils/dateUtils';
import { generateCheckboxIconConfig } from '@/utils/listUtils';
import { WeatherForecast } from '@/utils/weatherUtils';
import { MenuView } from '@react-native-menu/menu';
import { usePathname, useRouter } from 'expo-router';
import { useAtom, useAtomValue } from 'jotai';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { buildEventToolbarIconSet, buildPlannerEvents, generatePlanner, generateTimeIconConfig, handleNewEventValue, openTimeModal } from '../../utils/plannerUtils';
import DayBanner from '../banners/DayBanner';
import Card from '../Card';
import GenericIcon from '../icon';
import SortableList from './components/SortableList';

interface PlannerCardProps {
    datestamp: string;
    forecast?: WeatherForecast;
}

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
    const { getDeletingItems, toggleScheduleItemDelete } = useDeleteScheduler<IPlannerEvent>();
    const { calendarEvents, calendarChips } = useCalendarData(datestamp);
    const [textfieldItem, setTextfieldItem] = useAtom(textfieldItemAtom);
    const calendarEventData = useAtomValue(calendarEventDataAtom);
    const pathname = usePathname();
    const router = useRouter();

    const [collapsed, setCollapsed] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const isCalendarLoading = useMemo(
        () => calendarEventData.plannersMap[datestamp] === undefined,
        [calendarEventData]
    );

    const isTimeModalOpen = useMemo(() =>
        pathname.includes('timeModal'),
        [pathname]
    );

    const listType = EListType.PLANNER;

    // ------------- Utility Functions -------------

    const isEventDeleting = useCallback((planEvent: IPlannerEvent) =>
        getDeletingItems(listType).some(deleteItem =>
            // The planner event is deleting
            deleteItem.id === planEvent.id &&
            // and it's not from today
            deleteItem.listId !== getTodayDatestamp()
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

    function handleOpenTimeModal() {
        openTimeModal(datestamp, textfieldItem, router);
    }

    // ------------- List Management Utils -------------

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

    async function toggleScheduleEventDelete(event: IPlannerEvent) {
        toggleScheduleItemDelete(event, listType);
        if (event.id === textfieldItem?.id) {
            await SortedEvents.persistItemToStorage(textfieldItem);
            setTextfieldItem(null);
        }
    }

    const getItemsFromStorageObject = useCallback((planner: TPlanner) =>
        buildPlannerEvents(datestamp, planner, calendarEvents),
        [calendarEvents]
    );

    const SortedEvents = useSortedList<IPlannerEvent, TPlanner>({
        storageId: EStorageId.PLANNER,
        storageKey: datestamp,
        getItemsFromStorageObject,
        initializedStorageObject: generatePlanner(datestamp),
        saveItemToStorage: saveEventToPlannerWithRecurringCheck,
        listType
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
            toggleHideAllRecurringEventsInPlanner(datestamp);
        }
    }, [textfieldItem?.listId, isRecurringHidden]);

    useEffect(() => {
        if (textfieldItem?.listId === datestamp && collapsed) {
            setCollapsed(false);
        }
    }, [textfieldItem]);

    return !isCalendarLoading && (
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
                        title={`${datestampToDayOfWeek(datestamp)}, ${datestampToMonthDate(datestamp)}`}
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
                saveTextfieldAndCreateNew={SortedEvents.saveTextfieldAndCreateNew}
                onDragEnd={SortedEvents.persistItemToStorage}
                onContentClick={SortedEvents.toggleItemEdit}
                hideKeyboard={isTimeModalOpen}
                handleValueChange={(text, item) => handleNewEventValue(text, item, SortedEvents.items, datestamp)}
                getRightIconConfig={(item) => generateTimeIconConfig(item, handleOpenTimeModal)}
                getLeftIconConfig={(item) => generateCheckboxIconConfig(item, toggleScheduleEventDelete, isEventDeleting(item))}
                toolbarIconSet={buildEventToolbarIconSet(handleOpenTimeModal)}
                customGetIsDeleting={isEventDeleting}
                emptyLabelConfig={{
                    label: 'No plans',
                    className: 'h-20 flex justify-center items-center'
                }}
            />
        </Card>
    )
}

export default PlannerCard;
