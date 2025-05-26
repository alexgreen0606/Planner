import { reloadMapAtom } from '@/atoms/reloadMap';
import { usePathname } from 'expo-router';
import { useAtom } from 'jotai';
import { useMemo } from 'react';

export function useReloadScheduler() {
    const [reloadMap, setReloadMap] = useAtom(reloadMapAtom);
    const currentPath = usePathname();

    const canReloadPath = useMemo(
        () => !!reloadMap[currentPath],
        [currentPath, reloadMap]
    );

    const registerReloadFunction = (
        functionId: string,
        reloadFunc: () => Promise<void>,
        path: string
    ) => {
        setReloadMap(prev => ({
            ...prev,
            [path]: {
                ...prev[path],
                [functionId]: reloadFunc
            },
        }));
    };

    const reloadPage = async (pathname?: string) => {
        const path = pathname ?? currentPath;
        const reloadFunctionsMap = reloadMap[path];
        if (!reloadFunctionsMap) return;

        try {
            await Promise.all(Object.values(reloadFunctionsMap).map(func => func()));
        } catch (error) {
            console.error('Error during reload:', error);
        }
    };

    return {
        registerReloadFunction,
        reloadPage,
        canReloadPath
    };
}