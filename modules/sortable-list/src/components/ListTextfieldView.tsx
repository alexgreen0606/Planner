import { requireNativeView } from 'expo';
import { ListTextfieldProps } from '../types/ListTextfield.types';

const ListTextfieldView = requireNativeView('ListTextfield');

export default function ListTextfield(props: ListTextfieldProps) {
    return <ListTextfieldView {...props} />;
}
