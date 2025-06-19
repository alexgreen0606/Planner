// import { useAtom } from 'jotai';
// import { useCallback, useEffect, useMemo, useRef } from 'react';
// import { DELETE_ITEMS_DELAY_MS } from '@/lib/constants/listConstants';
// import { deleteFunctionsMapAtom, pendingDeleteItemsAtom } from '@/atoms/pendingDeletes';
// import { IListItem } from '@/lib/types/listItems/core/TListItem';

// export function useDeleteScheduler<T extends IListItem>() {
//     const [pendingDeleteMap, setPendingDeleteMap] = useAtom(pendingDeleteItemsAtom);
//     const [deleteFunctionsMap, setDeleteFunctionsMap] = useAtom(deleteFunctionsMapAtom);
//     const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

//     // TODO: need to use the same delete functions for different listIds. Let's use a deleteId instead of a listId.

//     const deletingItems = useMemo(
//         () => Object.values(pendingDeleteMap),
//         [pendingDeleteMap]
//     );

//     const getIsItemDeleting = useCallback((item: T) => {
//         return Boolean(pendingDeleteMap[item.id]);
//     }, [pendingDeleteMap]);

//     function registerDeleteFunction(
//         listId: string,
//         deleteFunction: (items: T[]) => void
//     ) {
//         setDeleteFunctionsMap(prev => ({
//             ...prev,
//             [listId]: deleteFunction
//         }));
//     }

//     function scheduleItemDeletion(item: T) {
//         setPendingDeleteMap(prev => ({
//             ...prev,
//             [item.id]: item
//         }));
//     }

//     function cancelItemDeletion(item: T) {
//         setPendingDeleteMap(prev => {
//             const newMap = { ...prev };
//             delete newMap[item.id];

//             return newMap;
//         });
//     }

//     useEffect(() => {
//         if (deleteTimeoutRef.current) {
//             clearTimeout(deleteTimeoutRef.current);
//             deleteTimeoutRef.current = null;
//         }

//         if (deletingItems.length > 0) {

//             // Group items by listId
//             const listDeletions: Record<string, T[]> = {};
//             deletingItems.forEach((item) => {
//                 const listId = item.listId;
//                 if (!listDeletions[listId]) {
//                     listDeletions[listId] = [];
//                 }
//                 listDeletions[listId].push(item);
//             });

//             console.log('here scheduling')

//             deleteTimeoutRef.current = setTimeout(() => {
//                 Object.entries(listDeletions).forEach(([listId, items]) => {
//                     const deleteFn = deleteFunctionsMap[listId];
//                     if (deleteFn) {
//                         deleteFn(items);
//                     }
//                 });
//                 deleteTimeoutRef.current = null;
//             }, DELETE_ITEMS_DELAY_MS);
//         }
//     }, [pendingDeleteMap]);

//     return {
//         deletingItems,
//         getIsItemDeleting,
//         scheduleItemDeletion,
//         cancelItemDeletion,
//         registerDeleteFunction
//     };
// }
