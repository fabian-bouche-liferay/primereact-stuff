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

function App(props) {

    const username = 'test@liferay.com';
    const password = 'test1234';
    const authString = `${username}:${password}`

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

    const dateMatchModes = [
        {label: 'Date is', value: 'custom_dateIs'},
        {label: 'Date is not', value: FilterMatchMode.DATE_IS_NOT},
        {label: 'Date is before', value: FilterMatchMode.DATE_BEFORE},
        {label: 'Date is after', value: FilterMatchMode.DATE_AFTER}
    ];

    const numericMatchModes = [
        {label: 'Equals', value: FilterMatchMode.EQUALS},
        {label: 'Does not equal', value: FilterMatchMode.NOT_EQUALS},
        {label: 'Greater than', value: FilterMatchMode.GREATER_THAN},
        {label: 'Greater than or equals', value: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO},
        {label: 'Less than', value: FilterMatchMode.LESS_THAN},
        {label: 'Less than or equals', value: FilterMatchMode.LESS_THAN_OR_EQUAL_TO}
    ];

    const textMatchModes = [
        {label: 'Equals', value: FilterMatchMode.EQUALS},
        {label: 'Does not equal', value: FilterMatchMode.NOT_EQUALS},
        {label: 'Starts with', value: FilterMatchMode.STARTS_WITH},
        {label: 'Contains', value: FilterMatchMode.CONTAINS},
        {label: 'Does not contain', value: FilterMatchMode.NOT_CONTAINS}
    ];

    useEffect(() => {
        setColumns(props.fields);

        let initFilters = {};

        props.fields.map(({ field, header, datatype }) => {
            let defaultFilter;
            if(field === "id") {
                defaultFilter = FilterMatchMode.EQUALS;
            } else if(datatype === "text") {
                defaultFilter = FilterMatchMode.CONTAINS;
            } else if(datatype === "date") {
                defaultFilter = 'custom_dateIs';
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
        let res = false;

        if(sortField !== null) {
            const browserSideSortAndFilter = props.fields.find(item => item.field === sortField).browserSideSortAndFilter === true;
            if(browserSideSortAndFilter) {
                res = true;
            }    
        }

        Object.entries(filters).forEach(([id, element]) => {
            const browserSideSortAndFilter = props.fields.find(item => item.field === id).browserSideSortAndFilter === true;
            if(element.value !== null && browserSideSortAndFilter) {
                res = true;
            }            
        });
        
        return res;
    }

    const loadData = (all) => {

        let url = props.apiUrl;

        if(all) {
            url = url + "?page=" + 1 + "&pageSize=200&fields=" + props.fields.map(field => field.field).join(',') + ",documentType.contentFields";
        } else {
            url = url + "?page=" + page + "&pageSize=" + pageSize + "&fields=" + props.fields.map(field => field.field).join(',') + ",documentType.contentFields";
            if(sortField !== null) {
                url = url + "&sort=" + sortField + ":" + ( sortOrder === 1 ? "asc" : "desc" );
            }
        }

        let filterQueries = [];
        Object.entries(filters).forEach(([id, element]) => {
            const datatype = props.fields.find(item => item.field === id).datatype;
            const browserSideSortAndFilter = props.fields.find(item => item.field === id).browserSideSortAndFilter === true;
            if(element.value !== null && !browserSideSortAndFilter) {
                if(element.matchMode === FilterMatchMode.EQUALS && datatype === "text") {
                    filterQueries.push(id + "%20eq%20'" + element.value + "'");
                } else if(element.matchMode === FilterMatchMode.EQUALS && datatype === "numeric") {
                    filterQueries.push(id + "%20eq%20" + element.value);
                } else if(element.matchMode === FilterMatchMode.NOT_EQUALS && datatype === "text") {
                    filterQueries.push(id + "%20ne%20'" + element.value + "'");
                } else if(element.matchMode === FilterMatchMode.NOT_EQUALS && datatype === "numeric") {
                    filterQueries.push(id + "%20ne%20" + element.value);
                } else if(element.matchMode === FilterMatchMode.LESS_THAN) {
                    filterQueries.push(id + "%20lt%20" + element.value);
                } else if(element.matchMode === FilterMatchMode.LESS_THAN_OR_EQUAL_TO) {
                    filterQueries.push(id + "%20le%20" + element.value);
                } else if(element.matchMode === FilterMatchMode.GREATER_THAN) {
                    filterQueries.push(id + "%20gt%20" + element.value);
                } else if(element.matchMode === FilterMatchMode.GREATER_THAN_OR_EQUAL_TO) {
                    filterQueries.push(id + "%20ge%20" + element.value);
                } else if(element.matchMode === FilterMatchMode.CONTAINS) {
                    filterQueries.push("contains(" + id + ",'" + element.value + "')");
                } else if(element.matchMode === FilterMatchMode.NOT_CONTAINS) {
                    filterQueries.push("not%20(contains(" + id + ",'" + element.value + "'))");
                } else if(element.matchMode === FilterMatchMode.STARTS_WITH) {
                    filterQueries.push("startswith(" + id + ",'" + element.value + "')");
                } else if(element.matchMode === 'custom_dateIs') {
                    const currentDate = element.value;
                    filterQueries.push("(" + id + "%20gt%20" + formatDate(currentDate) + "T00:00:00Z) and ("  + id + "%20lt%20" + formatDate(currentDate) + "T23:59:59Z)");
                } else if(element.matchMode === 'custom_dateIsNot') {
                    const currentDate = element.value;
                    filterQueries.push("(" + id + "%20lt%20" + formatDate(currentDate) + "T00:00:00Z) or ("  + id + "%20gt%20" + formatDate(currentDate) + "T23:59:59Z)");
                } else if(element.matchMode === 'custom_dateBefore') {
                    const currentDate = element.value;
                    filterQueries.push(id + "%20lt%20" + formatDate(currentDate) + "T00:00:00Z");
                } else if(element.matchMode === 'custom_dateAfter') {
                    const currentDate = element.value;
                    filterQueries.push(id + "%20gt%20" + formatDate(currentDate) + "T23:59:59Z");
                }
            }
        });

        const filterString = filterQueries.join("%20and%20");
        if(filterString !== "") {
            url = url + "&filter=" + filterString;
        }

        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(authString))
    
        fetch(url, {
            method: "GET",
            headers: headers
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            let updatedItems = data.items;
            setTotalRecords(data.totalCount);
            let transformedArray = transformJsonArray(updatedItems);

            setElements(transformedArray);

        })
        .catch(error => console.error('Error:', error));
    }

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
    
        return `${year}-${month}-${day}`;
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
    FilterService.register('custom_dateIs', (value, filters) => {
        return defaultDateIsFilter(new Date(value), filters);
    });
    const defaultDateIsNotFilter = FilterService.filters[FilterMatchMode.DATE_IS_NOT];
    FilterService.register('custom_dateIsNot', (value, filters) => {
        return defaultDateIsNotFilter(new Date(value), filters);
    });
    const defaultDateAfterFilter = FilterService.filters[FilterMatchMode.DATE_AFTER];
    FilterService.register('custom_dateAfter', (value, filters) => {
        return defaultDateAfterFilter(new Date(value), filters);
    });
    const defaultDateBeforeFilter = FilterService.filters[FilterMatchMode.DATE_BEFORE];
    FilterService.register('custom_dateBefore', (value, filters) => {
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
                        matchModeOptions = dateMatchModes;
                    } else if (datatype === "numeric") {
                        matchModeOptions = numericMatchModes;
                    } else {
                        matchModeOptions = textMatchModes;
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

export default App;