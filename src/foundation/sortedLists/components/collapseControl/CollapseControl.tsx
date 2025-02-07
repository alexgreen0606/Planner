import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import GenericIcon from '../../../ui/icon/GenericIcon';
import CustomText from '../../../ui/text/CustomText';
import globalStyles from '../../../theme/globalStyles';
import { Color } from '../../../theme/colors';

export interface CollapseControlProps {
    onClick: () => void;
    itemName: string;
    display: boolean;
    collapsed: boolean;
    itemCount: number;
    bottomOfListControl?: boolean;
}

const CollapseControl = ({
    onClick,
    itemName,
    display,
    collapsed,
    itemCount,
    bottomOfListControl
}: CollapseControlProps) => {

    const styles = StyleSheet.create({
        container: {
            ...globalStyles.verticallyCentered,
            paddingHorizontal: 8,
            paddingBottom: collapsed || bottomOfListControl ? 4 : 0
        }
    });

    return display &&
        <TouchableOpacity style={styles.container} onPress={onClick}>
            <GenericIcon
                type={collapsed ? 'chevron-right' : bottomOfListControl ? 'chevron-up' : 'chevron-down'}
                color={Color.DIM}
                size={16}
            />
            <CustomText type='soft'>
                {collapsed ? 'View' : 'Hide'}
                {` ${itemCount} ${itemName}${itemCount > 1 ? 's' : ''}`}
            </CustomText>
        </TouchableOpacity>
}

export default CollapseControl;
