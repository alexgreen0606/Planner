import React, { useState } from 'react';
import { View } from 'react-native';
import Card from '../../foundation/components/Card';
import CustomText from '../../foundation/components/text/CustomText';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { getTodayDatestamp } from '../../utils/timestampUtils';
import AgeValue from './components/AgeValue';
import { BIRTHDAY_STORAGE_ID } from './constants';
import { markBirthdayContacted } from './storage';
import { Birthday } from './types';
import { extractNameFromBirthdayText, openBirthdayMessage } from './utils';

// TODO: complete refactor and styling

interface BirthdayChecklistProps {
    birthdays: Birthday[];
};

const BirthdayCard = ({ birthdays }: BirthdayChecklistProps) => {
    const todayDatestamp = getTodayDatestamp();
    const [collapsed, setCollapsed] = useState(false);

    function toggleCollapsed() {
        setCollapsed(curr => !curr);
    }

    async function getItemsFromStorageObject() {
        return birthdays;
    }

    async function contactBirthdayPerson(birthday: Birthday) {
        const personName = extractNameFromBirthdayText(birthday.value);
        if (personName) {
            await openBirthdayMessage(personName);
        }
        markBirthdayContacted(birthday);
    }

    const BirthdayList = useSortedList<Birthday, Birthday[]>({
        storageId: BIRTHDAY_STORAGE_ID,
        storageKey: todayDatestamp,
        getItemsFromStorageObject,
        reloadTriggers: [birthdays]
    });

    return BirthdayList.items.length > 0 &&
        <View className='px-4 mt-2 w-full'>
            <Card header={
                <CustomText type='header'>
                    Birthday Wishes
                </CustomText>
            }>
                {/* Birthday List */}
                <SortableList<Birthday, never, never>
                    listId={BIRTHDAY_STORAGE_ID}
                    staticList
                    disableDrag
                    hideList={collapsed}
                    items={BirthdayList.items}
                    onDeleteItem={BirthdayList.deleteSingleItemFromStorage}
                    onContentClick={() => { }}
                    getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
                    onSaveTextfield={() => { }}
                    getRowTextPlatformColor={(birthday) => birthday.contacted ? 'secondaryLabel' : 'label'}
                    getLeftIconConfig={item => ({
                        icon: {
                            type: item.contacted ? 'messageFilled' : 'message',
                            platformColor: item.contacted ? 'secondaryLabel' : 'systemGreen',
                        },
                        onClick: () => contactBirthdayPerson(item)
                    })}
                    getRightIconConfig={(birthday) => ({
                        customIcon: <AgeValue contacted={birthday.contacted} age={birthday.age} />
                    })}
                />
            </Card>
        </View>
};

export default BirthdayCard;
