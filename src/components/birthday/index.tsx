import CustomText from '@/components/text/CustomText';
import { getTodayDatestamp } from '@/utils/dateUtils';
import React, { useState } from 'react';
import { View } from 'react-native';
import Card from '@/components/Card';
import { BIRTHDAY_STORAGE_ID } from '@/constants/storageIds';
import { markBirthdayContacted } from '@/storage/birthdayStorage';
import useSortedList from '../../hooks/useSortedList';
import { extractNameFromBirthdayText, openBirthdayMessage } from '../../utils/birthdayUtils';
import { IBirthday } from '@/types/listItems/IBirthday';
import AgeValue from '../text/AgeValue';
import SortableList from '../sortedList';

// TODO: complete refactor and styling

interface BirthdayChecklistProps {
    birthdays: IBirthday[];
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

    async function contactBirthdayPerson(birthday: IBirthday) {
        const personName = extractNameFromBirthdayText(birthday.value);
        if (personName) {
            await openBirthdayMessage(personName);
        }
        markBirthdayContacted(birthday);
    }

    const BirthdayList = useSortedList<IBirthday, IBirthday[]>({
        storageId: BIRTHDAY_STORAGE_ID,
        storageKey: todayDatestamp,
        getItemsFromStorageObject,
        reloadTriggers: [birthdays]
    });

    return BirthdayList.items.length > 0 &&
        <View className='px-4 mt-2 w-full'>
            <Card 
            contentHeight={10}
            collapsed={false}
            header={
                <CustomText type='header'>
                    Birthday Wishes
                </CustomText>
            }>
                {/* Birthday List */}
                <SortableList<IBirthday, never, never>
                    listId={BIRTHDAY_STORAGE_ID}
                    saveTextfieldAndCreateNew={BirthdayList.saveTextfieldAndCreateNew}
                    isLoading={collapsed}
                    items={BirthdayList.items}
                    onDragEnd={() => {}}
                    onDeleteItem={BirthdayList.deleteSingleItemFromStorage}
                    onContentClick={() => { }}
                    getTextfieldKey={(item) => `${item.id}-${item.sortId}`}
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
