import { FilterMatchMode } from 'primereact/api';
import CustomFilterMatchMode from '../constants/CustomFilterMatchMode';

class MatchModesConfiguration {

    static DATE = [
        {label: 'Date is', value: CustomFilterMatchMode.DATE_IS},
        {label: 'Date is not', value: CustomFilterMatchMode.DATE_IS_NOT},
        {label: 'Date is before', value: CustomFilterMatchMode.DATE_BEFORE},
        {label: 'Date is after', value: CustomFilterMatchMode.DATE_AFTER}
    ];
    
    static NUMERIC = [
        {label: 'Equals', value: FilterMatchMode.EQUALS},
        {label: 'Does not equal', value: FilterMatchMode.NOT_EQUALS},
        {label: 'Greater than', value: FilterMatchMode.GREATER_THAN},
        {label: 'Greater than or equals', value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO},
        {label: 'Less than', value: FilterMatchMode.LESS_THAN},
        {label: 'Less than or equals', value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
    ];
    
    static TEXT = [
        {label: 'Equals', value: FilterMatchMode.EQUALS},
        {label: 'Does not equal', value: FilterMatchMode.NOT_EQUALS},
        {label: 'Starts with', value: FilterMatchMode.STARTS_WITH},
        {label: 'Contains', value: FilterMatchMode.CONTAINS},
        {label: 'Does not contain', value: FilterMatchMode.NOT_CONTAINS}
    ];

}

export default MatchModesConfiguration;