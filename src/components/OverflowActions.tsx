import { Button, ContextMenu, Host } from "@expo/ui/swift-ui";
import { ReactNode } from "react";
import GenericIcon from "./icon";

// ✅ 

type TOverflowActionsProps = {
    label: string;
    children: ReactNode;
};

const OverflowActions = ({ label, children }: TOverflowActionsProps) => (
    <Host style={{ width: 100, height: 20 }}>
        <ContextMenu>
            <ContextMenu.Items>
                {children}
            </ContextMenu.Items>
            <ContextMenu.Trigger>
                {label ? (
                    <Button variant="borderless">
                        {label}
                    </Button>
                ) : (
                    <GenericIcon size='l' type='more' platformColor='systemBlue' />
                )}
            </ContextMenu.Trigger>
        </ContextMenu>
    </Host>
);

export default OverflowActions;