import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { FilterService } from 'primereact/api';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';

import CustomFilterMatchMode from './constants/CustomFilterMatchMode';
import MatchModesConfiguration from './constants/MatchModesConfiguration';
import DocumentFolderColumns from './constants/DocumentFolderColumns'

function CustomDataTable(props) {

    const [documentsHeader, setDocumentsHeader] = useState(<h2>Documents</h2>);
    const [foldersHeader, setFoldersHeader] = useState(<h2>Subfolders</h2>);

    const [columns, setColumns] = useState([]);
    const [elements, setElements] = useState([]);
    const [folderElements, setFolderElements] = useState([]);

    const [lazy, setLazy] = useState(true);

    const [first, setFirst] = useState(0);
    const [folderFirst, setFolderFirst] = useState(0);
    const [page, setPage] = useState(1);
    const [folderPage, setFolderPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [folderPageSize, setFolderPageSize] = useState(5);

    const [sortField, setSortField] = useState(null);
    const [sortOrder, setSortOrder] = useState("asc");

    const [filters, setFilters] = useState({});

    const [currentFolderId, setCurrentFolderId] = useState(props.folderId);
    const [parentFolderIds, setParentFolderIds] = useState([]);

    const [totalRecords, setTotalRecords] = useState(0);
    const [folderTotalRecords, setFolderTotalRecords] = useState(0);

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

        let folderTotalRecords = 0;
        let folderElements = [];

        let documentTotalRecords = 0;
        let documentElements = [];

        let folderPromise = props.documentFolderService.loadData(props.apiUrl, props.fields, filters, sortField, sortOrder, folderPage, folderPageSize, currentFolderId, all, false);
        let documentPromise = props.documentService.loadData(props.apiUrl, props.fields, filters, sortField, sortOrder, page, pageSize, currentFolderId, all, false);

        folderPromise.then(data => {
            folderTotalRecords = data.totalCount;
            folderElements = data.items;

            setFolderTotalRecords(folderTotalRecords);
            setFolderElements(folderElements);

        })
        .catch(error => console.error('Error:', error));

        documentPromise.then(data => {
            documentTotalRecords = data.totalCount;
            documentElements = data.items;

            setTotalRecords(documentTotalRecords);
            setElements(documentElements);
        })
        .catch(error => console.error('Error:', error));

    }

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

        props.documentFolderService.getCurrentFolder(props.apiUrl, currentFolderId, true).then(data => {
            if(parentFolderIds.length > 0) {
                setFoldersHeader(
                    <div>
                        <h2>Subfolders of {data.name}</h2>
                        <Button label="Go to parent folder" link onClick={() => goToParentFolder()}></Button>
                    </div>
                );
                setDocumentsHeader(
                    <div>
                        <h2>Documents of {data.name}</h2>
                        <Button label="Go to parent folder" link onClick={() => goToParentFolder()}></Button>
                    </div>
                );
            } else {
                setFoldersHeader(
                    <div>
                        <h2>Subfolders of {data.name}</h2>
                    </div>
                );
                setDocumentsHeader(
                    <div>
                        <h2>Documents of {data.name}</h2>
                    </div>
                );                
            }
            
        })
        .catch(error => console.error('Error:', error));

        setFilters(initFilters);

    }, [props.fields, currentFolderId]);

    useEffect(() => {

        console.log("### Filters: "+  JSON.stringify(filters));

        if(isLocal()) {
            setLazy(false);
            loadData(true);
        } else {
            setLazy(true);
            loadData(false);
        }

    }, [currentFolderId, columns, folderFirst, first, folderPageSize, pageSize, sortField, sortOrder, filters]);

    const onPage = (e) => {
        setPage(e.page + 1);
        setPageSize(e.rows);
        setFirst(e.page * pageSize);
    }

    const onFolderPage = (e) => {
        setFolderPage(e.page + 1);
        setFolderPageSize(e.rows);
        setFolderFirst(e.page * folderPageSize);
    }

    const onSort = (e) => {
        setSortField(e.sortField);
        setSortOrder(e.sortOrder);
    }

    const onFilter = (e) => {
        setFilters(e.filters);
    }

    const onChangeFolder = (e) => {
        
        const newParentFolderIds = [...parentFolderIds];
        newParentFolderIds.push(currentFolderId);

        setParentFolderIds(newParentFolderIds);
        setCurrentFolderId(e.data.id);
    }

    const goToParentFolder = () => {

        if(parentFolderIds.length > 0) {
            const newParentFolderIds = [...parentFolderIds];
            const lastItem = newParentFolderIds.pop();
    
            setParentFolderIds(newParentFolderIds);
            setCurrentFolderId(lastItem);
        }

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
        <div>
            <DataTable 
                {...(lazy && { lazy: true })}
                header={foldersHeader}
                dataKey="id"
                value={folderElements} 
                tableStyle={{ minWidth: '50rem' }}
                totalRecords={folderTotalRecords}
                filters={filters}
                paginator rows={folderPageSize} rowsPerPageOptions={[5, 10, 25, 50]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                first={folderFirst}
                onPage={onFolderPage}
                onSort={onSort}
                removableSort 
                sortField={sortField}
                sortOrder={sortOrder}            
                onFilter={onFilter}
                filterDisplay="menu"
                selectionMode="single"
                onRowSelect={onChangeFolder}
            >
                {columns.filter(({ field, header, datatype, browserSideSortAndFilter}) => DocumentFolderColumns.ALLOWED.includes(field))
                    .map(({ field, header, datatype, browserSideSortAndFilter}) => {

                    if(datatype === "image") {

                        return <Column key={field}
                            header={header}
                            body={imageBodyTemplate(field)}
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
                        />;

                    }

                })}
            </DataTable>
            
            <DataTable 
                {...(lazy && { lazy: true })}
                header={documentsHeader}
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
                        />;

                    }

                })}
            </DataTable>
        </div>
    );


}

export default CustomDataTable;