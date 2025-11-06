import { useAtom } from 'jotai';
import debounce from 'lodash.debounce';
import React, { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';

import { pendingDeleteItemsAtom } from '@/atoms/pendingDeletes';
import { textfieldIdAtom } from '@/atoms/textfieldId';
import { DELETE_ITEMS_DELAY_MS } from '@/lib/constants/listConstants';
import { EStorageId } from '@/lib/enums/EStorageId';
import { TListItem } from '@/lib/types/listItems/core/TListItem';
import { deleteChecklistItems } from '@/utils/checklistUtils';
import { deletePlannerEventsFromStorageAndCalendar } from '@/utils/plannerUtils';
import { deleteRecurringEventsFromStorageHideWeekday } from '@/utils/recurringPlannerUtils';

// ✅

type DeleteSchedulerContextType<T extends TListItem> = {
  onGetDeletingItemsByStorageIdCallback: (deleteFunctionKey: EStorageId) => T[];
  onGetIsItemDeletingCallback: (item: T | undefined) => boolean;
  onToggleScheduleItemDeleteCallback: (item: T) => void;
};

const deletionMap: Partial<Record<EStorageId, (items: any[]) => Promise<void> | void>> = {
  [EStorageId.PLANNER_EVENT]: deletePlannerEventsFromStorageAndCalendar,
  [EStorageId.RECURRING_PLANNER_EVENT]: deleteRecurringEventsFromStorageHideWeekday,
  [EStorageId.CHECKLIST_ITEM]: deleteChecklistItems
};

const DeleteSchedulerContext = createContext<DeleteSchedulerContextType<any> | undefined>(
  undefined
);

export function DeleteSchedulerProvider<T extends TListItem>({
  children
}: {
  children: ReactNode;
}) {
  const [pendingDeleteMap, setPendingDeleteMap] = useAtom(pendingDeleteItemsAtom);
  const [textfieldId, setTextfieldId] = useAtom(textfieldIdAtom);

  const debouncedProcessDeletes = useMemo(
    () =>
      debounce(
        () =>
          setPendingDeleteMap((currentMap) => {
            Object.entries(currentMap).forEach(([deleteFunctionKey, itemsMap]) => {
              if (itemsMap && Object.keys(itemsMap).length > 0) {
                const items = Object.values(itemsMap);
                const deleteFn = deletionMap[deleteFunctionKey as EStorageId];
                deleteFn?.(items);
              }
            });
            return {};
          }),
        DELETE_ITEMS_DELAY_MS
      ),
    []
  );

  // =====================
  // 2. Exposed Functions
  // =====================

  const handleGetDeletingItemsByStorageIdCallback = useCallback(
    (deleteFunctionKey: EStorageId): T[] => {
      const typeMap = pendingDeleteMap[deleteFunctionKey] ?? {};
      return Object.values(typeMap);
    },
    [pendingDeleteMap]
  );

  const handleGetIsItemDeletingCallback = useCallback(
    (item: T | undefined) => {
      return item ? Boolean(pendingDeleteMap[item.storageId]?.[item?.id]) : false;
    },
    [pendingDeleteMap]
  );

  const handleToggleScheduleItemDeleteCallback = useCallback(
    async (item: T) => {
      const storageId = item.storageId;

      if (item.id === textfieldId) {
        setTextfieldId(null);
        if (item.value.trim() === '') {
          const deleteFunction = deletionMap[item.storageId];
          if (deleteFunction) {
            await deleteFunction([item]);
          }
          return;
        }
      }

      setPendingDeleteMap((prev) => {
        const newMap = { ...prev };
        const typeMap = { ...newMap[storageId] };
        const isScheduled = typeMap[item.id];

        if (isScheduled) {
          delete typeMap[item.id];
        } else {
          typeMap[item.id] = item;
        }

        newMap[storageId] = typeMap;
        return newMap;
      });

      debouncedProcessDeletes();
    },
    [setPendingDeleteMap]
  );

  return (
    <DeleteSchedulerContext.Provider
      value={{
        onGetDeletingItemsByStorageIdCallback: handleGetDeletingItemsByStorageIdCallback,
        onGetIsItemDeletingCallback: handleGetIsItemDeletingCallback,
        onToggleScheduleItemDeleteCallback: handleToggleScheduleItemDeleteCallback
      }}
    >
      {children}
    </DeleteSchedulerContext.Provider>
  );
}

export function useDeleteSchedulerContext<T extends TListItem>(): DeleteSchedulerContextType<T> {
  const context = useContext(DeleteSchedulerContext);
  if (!context) {
    throw new Error('useDeleteScheduler must be used within a DeleteSchedulerProvider');
  }
  return context;
}
