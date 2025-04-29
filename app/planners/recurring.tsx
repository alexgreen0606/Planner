import React, { useMemo, useState } from 'react';
import { PlatformColor, StyleSheet, View } from 'react-native';
import { RecurringPlannerKeys } from '../../src/feature/recurringPlanners/constants';
import CustomText from '../../src/foundation/components/text/CustomText';
import globalStyles from '../../src/foundation/theme/globalStyles';
import { Dropdown } from 'react-native-element-dropdown';
import GenericIcon from '../../src/foundation/components/GenericIcon';
import RecurringWeekdayPlanner from '../../src/feature/recurringPlanners/components/RecurringWeekdayPlanner';
import RecurringPlanner from '../../src/feature/recurringPlanners/components/RecurringPlanner';


const RecurringPlanners = () => {
    const recurringPlannerOptions = useMemo(() => {
        return Object.values(RecurringPlannerKeys).map(key => {
            return {
                label: key,
                value: [key]
            }
        })
    }, []);


    const [selectedRecurring, setSelectedRecurring] = useState({ label: 'Weekdays', value: [RecurringPlannerKeys.WEEKDAYS] });


    const renderDropdownItem = (item: { label: string, value: string }) => {
        return (
            <View style={styles.dropdownItem}>
                <CustomText type='standard'>
                    {item.label}
                </CustomText>
            </View>
        )
    }

    return (
        <View style={globalStyles.blackFilledSpace}>

            {/* Recurring */}
            <View style={styles.dropdownContainer} >
                <Dropdown
                    data={recurringPlannerOptions}
                    maxHeight={300}
                    labelField="label"
                    valueField="value"
                    value={selectedRecurring}
                    containerStyle={{ backgroundColor: PlatformColor('systemBlue'), borderWidth: 0 }}
                    onChange={setSelectedRecurring}
                    selectedTextStyle={styles.selectedTextStyle}
                    style={styles.dropdown}
                    renderItem={renderDropdownItem}
                />
                <GenericIcon
                    type='add'
                    platformColor='secondaryLabel'
                />
            </View>
            <View style={{ ...styles.planners, flex: 1, paddingHorizontal: 0 }}>
                {selectedRecurring.value.map((key) => (
                    key === RecurringPlannerKeys.WEEKDAYS ?
                        <RecurringWeekdayPlanner key='weekday-recurring-planner' /> :
                        <RecurringPlanner key={`${key}-planner`} plannerKey={key} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    recurringModal: {
        height: 600
    },
    planners: {
        padding: 8,
        gap: 26,
    },
    selectedTextStyle: {
        color: PlatformColor('secondaryLabel'),
        fontSize: 14,
        fontWeight: 800
    },
    dropdownContainer: {
        ...globalStyles.spacedApart,
        paddingVertical: 8,
        paddingHorizontal: 16
    },
    dropdown: {
        width: '40%',
        padding: 4,
    },
    dropdownItem: {
        backgroundColor: PlatformColor('systemBackground'),
        borderColor: PlatformColor('systemGray3'),
        borderBottomWidth: StyleSheet.hairlineWidth,
        padding: 8,
    }
});

export default RecurringPlanners;
