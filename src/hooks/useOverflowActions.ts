import useAppTheme from "@/hooks/useAppTheme";
import { MenuAction } from "@react-native-menu/menu";

// ✅ 

const useOverflowActions = (actions: MenuAction[]) => {
  const { overflowActionText } = useAppTheme();

  const processActions = (actions: MenuAction[]): MenuAction[] => {
    return actions.map((action) => {
      let updated: MenuAction = { ...action };
      const attrs = updated.attributes ?? {};

      if (updated.subactions?.length) {
        const processedChildren = processActions(updated.subactions);
        const allChildrenHidden = processedChildren.every(
          (child) => child.attributes?.hidden
        );

        if (allChildrenHidden) {
          updated.attributes = { ...attrs, hidden: true };
        }

        updated.subactions = processedChildren;
      }

      if (updated.imageColor) return updated;

      if (attrs.disabled) {
        updated.imageColor = "rgb(135,135,135)";
      } else if (attrs.destructive) {
        updated.imageColor = "rgb(208,77,64)";
      } else {
        updated.imageColor = updated.imageColor ?? overflowActionText;
      }

      return updated;
    });
  };

  return processActions(actions);
};

export default useOverflowActions;
