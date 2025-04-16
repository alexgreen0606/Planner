import React, { useEffect, useState } from 'react';
import useSortedList from '../../foundation/sortedLists/hooks/useSortedList';
import { StyleSheet, View } from 'react-native';
import CustomText from '../../foundation/components/text/CustomText';
import SortableList from '../../foundation/sortedLists/components/list/SortableList';
import { BIRTHDAY_STORAGE_ID } from './constants';
import { getTodayDatestamp } from '../../foundation/calendarEvents/timestampUtils';
import Card from '../../foundation/components/Card';
import CollapseControl from '../../foundation/sortedLists/components/CollapseControl';
import { extractNameFromBirthdayText, openBirthdayMessage } from './utils';
import AgeValue from './components/AgeValue';
import { Birthday } from './types';
import { markBirthdayContacted } from './storage/birthdayStorage';

interface BirthdayChecklistProps {
    birthdays: Birthday[]; // stores the accurate list of today's birthdays
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

    useEffect(() => {
        BirthdayList.refetchItems();
    }, [birthdays]);

    const BirthdayList = useSortedList<Birthday, Birthday[]>({
        storageId: BIRTHDAY_STORAGE_ID,
        storageKey: todayDatestamp,
        getItemsFromStorageObject,
        noReload: true
    });

    return BirthdayList.items.length > 0 &&
        <View style={styles.card}>
            <Card header={
                <CustomText type='header'>
                    Birthday Wishes
                </CustomText>
            }
            >

                {/* Collapse Control */}
                <CollapseControl
                    itemCount={BirthdayList.items.length}
                    itemName='birthday'
                    onClick={toggleCollapsed}
                    display={true}
                    collapsed={collapsed}
                />

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

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: 16,
        marginTop: 8,
        width: '100%'
    }
});

export default BirthdayCard;
