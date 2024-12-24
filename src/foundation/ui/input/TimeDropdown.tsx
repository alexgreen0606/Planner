import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AutocompleteInput from 'react-native-autocomplete-input';
import { Text, TextInput } from 'react-native-paper';
import { theme } from '../../../theme/theme';

export interface DropdownOption {
    value: string;
    label: string;
}

interface TimeDropdownProps {
    onChange: (newTimestamp: string | undefined) => void;
    options: DropdownOption[];
    placeholder: string;
    dropdownInFocus: string;
    beginFocus: () => void;
    endFocus: () => void;
    currTimestamp: string | undefined;
    minOptionIndex: number
};

const TimeDropdown = ({
    onChange,
    options,
    placeholder,
    dropdownInFocus,
    beginFocus,
    endFocus,
    currTimestamp,
    minOptionIndex
}: TimeDropdownProps) => {
    const [userInput, setUserInput] = useState('');
    const [currOptions, setCurrOptions] = useState(options);
    const [currSelection, setCurrSelection] = useState<DropdownOption | undefined>(
        undefined
    );

    useEffect(() => {
        setCurrSelection(options.find(option => option.value === currTimestamp));
    }, [currTimestamp]);

    const filterOptions = () => {
        const normalizedInput = userInput.replace(/:/g, '').toLowerCase().trim();
        let newOptions = [...options];
        newOptions?.splice(0, minOptionIndex);
        newOptions = newOptions.filter((option) => {
            const normalizedLabel = option.label.replace(/:/g, '').toLowerCase().trim();

            // Show 30-minute intervals if no specific input is provided
            if (!normalizedInput.length) {
                const [hour, minute] = option.label.split(':');
                return parseInt(minute, 10) === 0; // Filter to 30-minute intervals
            }

            // Show all matching options if the user types something specific
            return normalizedLabel.includes(normalizedInput);
        });
        setCurrOptions(newOptions);
    }

    useEffect(() => {
        filterOptions();
    }, [userInput, minOptionIndex])

    const renderDropdownOption = ({ item }: { item: any }) => {
        if (dropdownInFocus !== placeholder) {
            return null;
        }

        return (
            <Text
                onPress={() => onChange(item.value)}
                style={styles.option}
            >
                {item.label}
            </Text>
        )
    }


    return (
        <AutocompleteInput
            data={currOptions}
            value={userInput}
            onChangeText={(text) => {
                setUserInput(text)
            }}
            flatListProps={{
                keyExtractor: (item: any) => `${placeholder}-${item.value}-${dropdownInFocus}`,
                renderItem: renderDropdownOption,
                style: styles.flatList,
            }}
            renderTextInput={() =>
                <TextInput
                    mode="flat"
                    autoFocus={dropdownInFocus === placeholder}
                    value={currSelection?.label || userInput}
                    onChangeText={(text) => {
                        setUserInput(text);
                        onChange(undefined);
                    }}
                    selectionColor="white"
                    style={styles.input}
                    placeholder={placeholder}
                    onFocus={beginFocus}
                    onBlur={endFocus}
                    theme={{
                        colors: {
                            text: 'white',
                            primary: 'transparent',
                        },
                    }}
                    underlineColor='transparent'
                    textColor='white'
                    onSubmitEditing={() => { }}
                />
            }
        />
    );
};

const styles = StyleSheet.create({
    input: {
        backgroundColor: 'transparent',
        color: 'white',
        paddingTop: 1,
        paddingBottom: 1,
        width: '100%',
        height: 25,
        fontSize: 16,
        borderColor: 'transparent'
    },
    flatList: {
        maxHeight: 140,
        borderColor: theme.colors.background,
        backgroundColor: 'transparent',
    },
    option: {
        backgroundColor: theme.colors.background,
        color: theme.colors.secondary,
        height: 25,
        textAlign: 'center',
    }
});

export default TimeDropdown;
