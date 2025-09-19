import { EPopupActionType } from "@/lib/enums/EPopupActionType";
import { TPopupAction } from "@/lib/types/TPopupAction";
import {
    Button,
    ContextMenu,
    Host,
    Submenu,
    Switch,
    VStack
} from "@expo/ui/swift-ui";
import { frame } from "@expo/ui/swift-ui/modifiers";
import React, { ReactNode, useMemo } from "react";
import GenericIcon from "./icon";

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

    if (!actionTsx.some(Boolean)) return null; // TODO: disable this instead

    // ==========
    //  Dropdown
    // ==========

    if (label) {
        return (
            <Host matchContents>
                <VStack modifiers={[frame({ width: 300, alignment: 'leading' })]}>
                    <ContextMenu>
                        <ContextMenu.Items>
                            {actions.map((option, index) =>
                                renderMenuAction(option, index)
                            )}
                        </ContextMenu.Items>
                        <ContextMenu.Trigger>
                            <Button variant="glass" modifiers={[frame({ alignment: 'leading' })]}>
                                {label}
                            </Button>
                        </ContextMenu.Trigger>
                    </ContextMenu>
                </VStack>
            </Host>
        )
    }

    // =========
    //  Actions
    // =========

    return (
        <Host matchContents>
            <ContextMenu>
                <ContextMenu.Items>
                    {actions.map((option, index) =>
                        renderMenuAction(option, index)
                    )}
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                    <GenericIcon size='l' type='more' platformColor='systemBlue' />
                </ContextMenu.Trigger>
            </ContextMenu>
        </Host>
    );
};

export default PopupList;