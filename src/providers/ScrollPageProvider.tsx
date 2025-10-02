import CountdownEventToolbar from '@/components/toolbars/CountdownEventToolbar';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import RecurringEventToolbar from '@/components/toolbars/RecurringEventToolbar';
import React, { createContext, useContext, useRef } from 'react';
import { KeyboardAvoidingView, TextInput } from 'react-native';
import {
    useSharedValue
} from 'react-native-reanimated';
import { ScrollProvider } from './ScrollProvider';
import { usePathname } from 'expo-router';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';

// ✅ 

type TPageProviderProps = {
    children: React.ReactNode;
};

type TPageProviderContextValue = {
    // Focuses Placeholder Textfield (prevents keyboard flicker)
    onFocusPlaceholder: () => void;
};

export enum ELoadingStatus {
    STATIC = 'STATIC', // no overscroll visible
    LOADING = 'LOADING', // currently rebuilding list
    COMPLETE = 'COMPLETE' // list has rebuilt, still overscrolled
}

const ScrollPageContext = createContext<TPageProviderContextValue | null>(null);

export const ScrollPageProvider = ({
    children
}: TPageProviderProps) => {
    const pathname = usePathname();

    const placeholderInputRef = useRef<TextInput>(null);

    const scrollOffset = useSharedValue(0);

    const canReloadPath = reloadablePaths.some(p => pathname.includes(p));

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
                    shouldReloadPage={canReloadPath}
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


export const useScrollPageContext = () => {
    const context = useContext(ScrollPageContext);
    if (!context) {
        throw new Error("useScrollPageContext must be used within a ScrollPageProvider");
    }
    return context;
};