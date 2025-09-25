import { EPopupActionType } from "@/lib/enums/EPopupActionType";
import { TPopupAction } from "@/lib/types/TPopupAction";
import {
    Button,
    ContextMenu,
    Host,
    HStack,
    Image,
    Spacer,
    Submenu,
    Switch
} from "@expo/ui/swift-ui";
import React, { ReactNode, useMemo } from "react";
import GenericIcon from "./icon";
import GlassIconButton from "./icon/GlassButtonIcon";
import { View } from "react-native";

// ✅ 

type TPopupListProps = {
    label?: string;
    actions: TPopupAction[];
};

const PopupList = ({ label, actions }: TPopupListProps) => {

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

    // ==========
    //  Dropdown
    // ==========

    if (label) {
        return (
            <Host style={{ flex: 1 }}>
                <HStack>
                    <ContextMenu>
                        <ContextMenu.Items>
                            {actionTsx}
                        </ContextMenu.Items>
                        <ContextMenu.Trigger>
                            <Button variant="glass">
                                {label}
                            </Button>
                        </ContextMenu.Trigger>
                    </ContextMenu>
                    <Spacer />
                </HStack>
            </Host>
        )
    }

    // =========
    //  Actions
    // =========

    if (!actionTsx.some(Boolean)) {
        return (
            <GlassIconButton disabled systemImage='ellipsis' />
        )
    }

    return (
        <Host matchContents>
            <ContextMenu>
                <ContextMenu.Items>
                    {actionTsx}
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                    <GlassIconButton systemImage='ellipsis' />
                </ContextMenu.Trigger>
            </ContextMenu>
        </Host>
    );
};

export default PopupList;