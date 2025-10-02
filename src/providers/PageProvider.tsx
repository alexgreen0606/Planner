import CountdownEventToolbar from '@/components/toolbars/CountdownEventToolbar';
import FolderItemToolbar from '@/components/toolbars/FolderItemToolbar';
import PlannerEventToolbar from '@/components/toolbars/PlannerEventToolbar';
import RecurringEventToolbar from '@/components/toolbars/RecurringEventToolbar';
import { reloadablePaths } from '@/lib/constants/reloadablePaths';
import { usePathname } from 'expo-router';
import React, { createContext, useContext, useRef } from 'react';
import { KeyboardAvoidingView, TextInput } from 'react-native';
import {
    useSharedValue
} from 'react-native-reanimated';
import { ScrollProvider } from './ScrollProvider';

// ✅ 

type TPageProviderProps = {
    children: React.ReactNode;
    additionalHeaderHeight?: number;
};

type TPageProviderContextValue = {
    // Focuses Placeholder Textfield (prevents keyboard flicker)
    onFocusPlaceholder: () => void;
}

const ScrollPageContext = createContext<TPageProviderContextValue | null>(null);

export const PageProvider = ({
    children,
    additionalHeaderHeight
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
                    shouldReloadPage={canReloadPath}
                    additionalHeaderHeight={additionalHeaderHeight}
                    contentContainerStyle={{
                        flexGrow: 1
                    }}
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
        throw new Error("usePageContext must be used within a ScrollPageProvider");
    }
    return context;
};