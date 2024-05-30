import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { FilterService } from 'primereact/api';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';

import CustomFilterMatchMode from './constants/CustomFilterMatchMode';
import MatchModesConfiguration from './constants/MatchModesConfiguration';

function CustomDataTable(props) {

    const [columns, setColumns] = useState([]);
    const [elements, setElements] = useState([]);

    const [lazy, setLazy] = useState(true);

    const [first, setFirst] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");

    const [filters, setFilters] = useState({});
    
    const [totalRecords, setTotalRecords] = useState(1);

    useEffect(() => {
        setColumns(props.fields);

        let initFilters = {};

        props.fields.map(({ field, datatype }) => {
            let defaultFilter;
            if(field === "id") {
                defaultFilter = FilterMatchMode.EQUALS;
            } else if(datatype === "text") {
                defaultFilter = FilterMatchMode.CONTAINS;
            } else if(datatype === "date") {
                defaultFilter = CustomFilterMatchMode.DATE_IS;
            } else {
                defaultFilter = FilterMatchMode.EQUALS;
            }
            initFilters = ({
                ...initFilters,
                [field]: {value: null, matchMode: defaultFilter }
            });    
        });

        setFilters(initFilters);

    }, [props.fields]);

    useEffect(() => {

        console.log("Filters: "+  JSON.stringify(filters));

        if(isLocal()) {
            setLazy(false);
            loadData(true);
        } else {
            setLazy(true);
            loadData(false);
        }

    }, [columns, first, pageSize, sortField, sortOrder, filters]);

    const isLocal = () => {

        if(sortField !== null) {
            const browserSideSortAndFilter = props.fields.find(item => item.field === sortField).browserSideSortAndFilter === true;
            if(browserSideSortAndFilter) {
                return true;
            }    
        }

        Object.entries(filters).forEach(([id, element]) => {
            const browserSideSortAndFilter = props.fields.find(item => item.field === id).browserSideSortAndFilter === true;
            if(element.value !== null && browserSideSortAndFilter) {
                return true;
            }            
        });
        
        return false;
    }

    const loadData = (all) => {
        props.documentService.loadData(props.apiUrl, props.fields, filters, sortField, sortOrder, page, pageSize, all, false).then(data => {
            let updatedItems = data.items;
            setTotalRecords(data.totalCount);
            let transformedArray = transformJsonArray(updatedItems);
            setElements(transformedArray);
        })
        .catch(error => console.error('Error:', error));;
    }

    const onPage = (e) => {
        setPage(e.page + 1);
        setPageSize(e.rows);
        setFirst(e.page * pageSize);
    }

    const onSort = (e) => {
        setSortField(e.sortField);
        setSortOrder(e.sortOrder);
    }

    const onFilter = (e) => {
        setFilters(e.filters);
    }

    const filterTemplate = (options) => {
        const datatype = props.fields.find(item => item.field === options.field).datatype;
        if(datatype === "date") {
            return (
                <Calendar
                    value={options.value || ''}
                    onChange={
                        (e) => {
                            options.filterCallback(e.value);
                        }
                    }
                    dateFormat="yy-mm-dd"
                    placeholder="yyyy-mm-dd"
                    monthNavigator
                    yearNavigator
                    yearRange="2000:2050"
                />
            );
        } else if(datatype === "numeric") {
            return (
                <InputNumber
                    value={options.value || ''}
                    onChange={(e) => options.filterCallback(e.value)}
                />
            );
        } else {
            return (
                <InputText
                value={options.value || ''}
                onChange={(e) => options.filterCallback(e.target.value)}
                />
            );
        }
    }

    const imageBodyTemplate = (fieldName) => (rowData) => {
        return <img src={props.baseUrl + rowData[fieldName]} alt="Preview" style={{ width: '50px', height: '50px' }} />;
    };

    function transformJsonItem(item) {
        const { documentType } = item;
        const { contentFields } = documentType;
      
        contentFields.forEach(field => {
          documentType[field.name] = field.contentFieldValue.data;
        });

        return item;
    }
      
    function transformJsonArray(jsonArray) {
        let transformed = jsonArray.map(transformJsonItem)
        return transformed;
    }

    const defaultDateIsFilter = FilterService.filters[FilterMatchMode.DATE_IS];
    FilterService.register(CustomFilterMatchMode.DATE_IS, (value, filters) => {
        return defaultDateIsFilter(new Date(value), filters);
    });
    const defaultDateIsNotFilter = FilterService.filters[FilterMatchMode.DATE_IS_NOT];
    FilterService.register(CustomFilterMatchMode.DATE_IS_NOT, (value, filters) => {
        return defaultDateIsNotFilter(new Date(value), filters);
    });
    const defaultDateAfterFilter = FilterService.filters[FilterMatchMode.DATE_AFTER];
    FilterService.register(CustomFilterMatchMode.DATE_AFTER, (value, filters) => {
        return defaultDateAfterFilter(new Date(value), filters);
    });
    const defaultDateBeforeFilter = FilterService.filters[FilterMatchMode.DATE_BEFORE];
    FilterService.register(CustomFilterMatchMode.DATE_BEFORE, (value, filters) => {
        return defaultDateBeforeFilter(new Date(value), filters);
    });

    return (
        <DataTable 
            {...(lazy && { lazy: true })}
            dataKey="id"
            value={elements} 
            tableStyle={{ minWidth: '50rem' }}
            totalRecords={totalRecords}
            filters={filters}
            paginator rows={pageSize} rowsPerPageOptions={[5, 10, 25, 50]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            first={first}
            onPage={onPage}
            onSort={onSort}
            removableSort 
            sortField={sortField}
            sortOrder={sortOrder}            
            onFilter={onFilter}
            filterDisplay="menu"
        >
            {columns.map(({ field, header, datatype, browserSideSortAndFilter}) => {

                if(datatype === "image") {

                    return <Column key={field}
                        header={header}
                        body={imageBodyTemplate(field)}
                        style={{ width: '25%' }} 
                    />;


                } else {

                    let matchModeOptions;

                    if(datatype === "date") {
                        matchModeOptions = MatchModesConfiguration.DATE;
                    } else if (datatype === "numeric") {
                        matchModeOptions = MatchModesConfiguration.NUMERIC;
                    } else {
                        matchModeOptions = MatchModesConfiguration.TEXT;
                    }

                    return <Column key={field}
                        sortable 
                        filter 
                        filterElement={filterTemplate}
                        showFilterMatchModes={true}
                        showFilterMenu={true}
                        filterMatchModeOptions={matchModeOptions}
                        field={field}
                        header={header}
                        dataType={datatype}
                        style={{ width: '25%' }} 
                    />;

                }

            })}
        </DataTable>
    );


}

export default CustomDataTable;