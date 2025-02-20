import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { ListItem } from '../types';

interface ListTextfieldProps<T extends ListItem> {
    item: T;
    onChange: (newText: string) => void;
    onSubmit: () => void;
}

const ListTextfield = <T extends ListItem>({
    item,
    onChange,
    onSubmit,
}: ListTextfieldProps<T>) =>
    <TextInput
        mode="flat"
        autoFocus
        value={item.value}
        onChangeText={onChange}
        selectionColor="white"
        style={styles.textInput}
        theme={{
            colors: {
                text: 'white',
                primary: 'transparent',
            },
        }}
        underlineColor='transparent'
        textColor='white'
        onSubmitEditing={onSubmit}
        contentStyle={{ paddingLeft: 8 }}
    />

const styles = StyleSheet.create({
    textInput: {
        backgroundColor: 'transparent',
        color: 'white',
        paddingVertical: 1,
        flex: 1,
        height: 25,
        fontSize: 16
    },
});

export default ListTextfield;
