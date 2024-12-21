import React from 'react';
import { StyleSheet } from 'react-native';
import { Autocomplete, AutocompleteScrollView } from 'react-native-paper-autocomplete';
import { theme } from '../../../theme/theme';

export interface DropdownOption {
    value: string;
    label: string;
}

interface TimeDropdownProps {
    value: DropdownOption | undefined;
    onChange: (newVal: DropdownOption | undefined) => void;
    options: DropdownOption[];
    placeholder: string;
}

const TimeDropdown = ({
    value,
    onChange,
    options,
    placeholder
}: TimeDropdownProps) => {
    return (
        <AutocompleteScrollView>
            <Autocomplete
                onChange={(newVal) => onChange(newVal)}
                value={value}
                options={options}
                inputProps={{
                    placeholder: placeholder,
                    style: {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.secondary,
                    },
                    caretHidden: true,
                    textColor: theme.colors.secondary,
                    placeholderTextColor: theme.colors.secondary,
                }}
                style={styles.input}
                filterOptions={(options, { inputValue }) => {
                    const normalizedInput = inputValue.replace(/:/g, '');
                    return options?.filter((option) =>
                        option.label.replace(/:/g, '').toLowerCase().includes(normalizedInput.toLowerCase())
                    );
                }}
            />
        </AutocompleteScrollView>
    );
};

const styles = StyleSheet.create({
    input: {
        backgroundColor: theme.colors.background,
        color: theme.colors.secondary,
        width: '100%',
        fontSize: 16
    },
});

export default TimeDropdown;
