import React from 'react';
import { SFSymbol } from 'react-native-sfsymbols';

export type AppleIconProps = {
    config: {
        name: string;
        size: number;
    };
};

const AppleIcon: React.FC<AppleIconProps> = ({ config }) => {
    const {
        name,
        size,
    } = config;

    return <SFSymbol
        name={name}
        size={size}
        multicolor
        resizeMode='right'
    />
};

export default AppleIcon;
