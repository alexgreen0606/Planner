import CountdownEventToolbar from '@/components/toolbars/CountdownEventToolbar';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import RecurringEventToolbar from '@/components/toolbars/RecurringEventToolbar';
import useAppTheme from '@/hooks/useAppTheme';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { usePathname } from 'expo-router';
import React, { createContext, ReactNode, useContext, useRef } from 'react';
import { KeyboardAvoidingView, RefreshControl, TextInput } from 'react-native';
import {
    useSharedValue
} from 'react-native-reanimated';
import { useExternalDataContext } from './ExternalDataProvider';
import { ScrollProvider } from './ScrollProvider';

// ✅ 

type TPageProviderProps = {
    children: ReactNode;
    hasStickyHeader?: boolean;
};

type TPageProviderContextValue = {
    // Focuses Placeholder Textfield (prevents keyboard flicker)
    onFocusPlaceholder: () => void;
}

const ScrollPageContext = createContext<TPageProviderContextValue | null>(null);

export const PageProvider = ({
    children,
    hasStickyHeader
}: TPageProviderProps) => {
    const pathname = usePathname();

    const placeholderInputRef = useRef<TextInput>(null);

    const scrollOffset = useSharedValue(0);

    const { background } = useAppTheme();
    const { onReloadPage, loading } = useExternalDataContext();

    const canReloadPath = reloadablePaths.some(p => pathname.includes(p));

    const manualPadHeaderScrollProps = hasStickyHeader ? {
        stickyHeaderIndices: [0]
    } : {};

    function handleFocusPlaceholder() {
        placeholderInputRef.current?.focus();
    }

    return (
        <ScrollPageContext.Provider value={{
            onFocusPlaceholder: handleFocusPlaceholder
        }}>
            <KeyboardAvoidingView className='flex-1' behavior='padding'>
                <ScrollProvider
                    scrollOffset={scrollOffset}
                    contentContainerStyle={{
                        flexGrow: 1
                    }}
                    refreshControl={canReloadPath ? (
                        <RefreshControl onRefresh={onReloadPage} refreshing={loading} />
                    ) : undefined}
                    contentInsetAdjustmentBehavior="automatic"
                    {...manualPadHeaderScrollProps}
                >
                    {children}
                </ScrollProvider>
            </KeyboardAvoidingView>

            {/* List Toolbars */}
            <PlannerEventToolbar />
            <FolderItemToolbar />
            <CountdownEventToolbar />
            <RecurringEventToolbar />

            {/* Placeholder Field */}
            <TextInput
                ref={placeholderInputRef}
                returnKeyType='done'
                className='absolute w-1 h-1 left-[9999]'
                autoCorrect={false}
            />

        </ScrollPageContext.Provider>
    )
};


export const usePageContext = () => {
    const context = useContext(ScrollPageContext);
    if (!context) {
        throw new Error("usePageContext must be used within a PageProvider");
    }
    return context;
};