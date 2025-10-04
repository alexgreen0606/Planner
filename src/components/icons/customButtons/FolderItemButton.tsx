import { EFolderItemType } from '@/lib/enums/EFolderItemType';
import { IFolderItem } from '@/lib/types/listItems/IFolderItem';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useRef, useState } from 'react';
import { PlatformColor, TouchableOpacity } from 'react-native';

// ✅ 

type TFolderItemButtonProps = {
    item: IFolderItem;
    disabled?: boolean;
    onClick: () => void;
};

const FolderItemButton = ({
    item,
    disabled,
    onClick
}: TFolderItemButtonProps) => {
    const isInitialMount = useRef(true);
    const [bounceTrigger, setBounceTrigger] = useState(false);

    // Trigger the bounce animation whenever the color or type changes.
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        setBounceTrigger(true);
        const timeout = setTimeout(() => setBounceTrigger(false), 0);

        return () => clearTimeout(timeout);
    }, [item.type, item.platformColor]);

    return (
        <TouchableOpacity disabled={disabled} onPress={onClick}>
            <SymbolView
                name={item.type === EFolderItemType.FOLDER ? 'folder.fill' : 'list.bullet'}
                type='palette'
                animationSpec={bounceTrigger ? {
                    effect: { type: 'bounce' },
                    repeating: false
                } : undefined}
                size={24}
                tintColor={PlatformColor(disabled ? 'tertiaryColor' : item.platformColor)}
            />
        </TouchableOpacity>
    );
};

export default FolderItemButton;