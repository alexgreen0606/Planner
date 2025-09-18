import {
    Button,
    ContextMenu,
    Host,
    Submenu,
    Switch,
    VStack
} from "@expo/ui/swift-ui";
import React, { ReactNode, useMemo } from "react";
import GenericIcon from "./icon";
import { frame } from "@expo/ui/swift-ui/modifiers";

type TOverflowActionsProps = {
    label?: string;
    actions: TOverflowAction[];
};

export enum EOverflowActionType {
    BUTTON = "BUTTON",
    SWITCH = "SWITCH",
    SUBMENU = "SUBMENU",
}

type BaseOverflowAction = {
    title: string;
    systemImage?: string;
    hidden?: boolean;
};

type ButtonAction = BaseOverflowAction & {
    type: EOverflowActionType.BUTTON;
    onPress: () => void;
    destructive?: boolean;
    value?: boolean;
};

type SwitchAction = BaseOverflowAction & {
    type: EOverflowActionType.SWITCH;
    value: boolean;
    onPress: () => void;
};

type SubmenuAction = BaseOverflowAction & {
    type: EOverflowActionType.SUBMENU;
    items: TOverflowAction[];
};

export type TOverflowAction = ButtonAction | SwitchAction | SubmenuAction;


const OverflowActions = ({ label, actions }: TOverflowActionsProps) => {

    const renderMenuAction = (
        option: TOverflowAction,
        index: number
    ): ReactNode | null => {
        if (option.hidden) return null;

        switch (option.type) {
            case EOverflowActionType.BUTTON:
                return (
                    <Button
                        key={index}
                        systemImage={option.systemImage ?? option.value ? 'checkmark' : undefined}
                        role={option.destructive ? "destructive" : undefined}
                        onPress={option.onPress}
                    >
                        {option.title}
                    </Button>
                );

            case EOverflowActionType.SWITCH:
                return (
                    <Switch
                        key={index}
                        value={option.value}
                        label={option.title}
                        variant="checkbox"
                        onValueChange={option.onPress}
                    />
                );

            case EOverflowActionType.SUBMENU:
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

export default OverflowActions;