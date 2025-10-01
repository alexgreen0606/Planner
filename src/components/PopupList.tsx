import { EPopupActionType } from "@/lib/enums/EPopupActionType";
import { TPopupAction } from "@/lib/types/TPopupAction";
import {
    Button,
    ContextMenu,
    Host,
    Image,
    Submenu,
    Switch
} from "@expo/ui/swift-ui";
import React, { ReactNode, useMemo } from "react";
import { PlatformColor } from "react-native";
import GlassIconButton from "./icon/GlassButtonIcon";

// ✅ 

type TPopupListProps = {
    actions: TPopupAction[];
    wrapButton?: boolean;
};

const PopupList = ({ actions, wrapButton }: TPopupListProps) => {

    const renderMenuAction = (
        option: TPopupAction,
        index: number
    ): ReactNode | null => {
        if (option.hidden) return null;

        switch (option.type) {
            case EPopupActionType.BUTTON:
                return (
                    <Button
                        key={index}
                        systemImage={option.systemImage ? option.systemImage : option.value ? 'checkmark' : undefined}
                        role={option.destructive ? "destructive" : undefined}
                        onPress={option.onPress}
                        color={option.color}
                    >
                        {option.title}
                    </Button>
                );

            case EPopupActionType.SWITCH:
                return (
                    <Switch
                        key={index}
                        value={option.value}
                        label={option.title}
                        variant="checkbox"
                        onValueChange={option.onPress}
                    />
                );

            case EPopupActionType.SUBMENU:
                if (option.items.some((item) => !item.hidden)) {
                    return (
                        <Submenu
                            key={index}
                            button={
                                <Button systemImage={option.systemImage}>{option.title}</Button>
                            }
                        >
                            {option.items?.map((subItem: any, subIndex: number) =>
                                renderMenuAction(subItem, subIndex)
                            )}
                        </Submenu>
                    );
                } else {
                    return null;
                }

            default:
                return null;
        }
    };

    const actionTsx = useMemo(() => actions.map((option, index) =>
        renderMenuAction(option, index)
    ), [actions]);

    if (!actionTsx.some(Boolean)) {
        return wrapButton ? (
            <GlassIconButton systemImage="ellipsis" disabled />
        ) : (
            <Host style={{ width: 35, height: 35 }}>
                <Image systemName="ellipsis" color={PlatformColor('tertiaryLabel') as unknown as string} />
            </Host>
        )
    }

    return (
        <Host>
            <ContextMenu>
                <ContextMenu.Items>
                    {actionTsx}
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                    {wrapButton ? (
                        <GlassIconButton systemImage="ellipsis" disabled />
                    ) : (
                        <Host style={{ width: 35, height: 35 }}>
                            <Image systemName="ellipsis" color={PlatformColor('label') as unknown as string} />
                        </Host>
                    )}
                </ContextMenu.Trigger>
            </ContextMenu>
        </Host>
    )
};

export default PopupList;