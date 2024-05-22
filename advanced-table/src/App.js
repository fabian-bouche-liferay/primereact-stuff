import React, { useState, useEffect } from 'react';
import { FilterMatchMode, FilterOperator, SortOrder } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';

function App(props) {

    const username = 'test@liferay.com';
    const password = 'test1234';
    const authString = `${username}:${password}`

    const [columns, setColumns] = useState([]);
    const [elements, setElements] = useState([]);

    const [first, setFirst] = useState(1);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const [sortField, setSortField] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");

    const [filters, setFilters] = useState({
		id: { value: '', matchMode: FilterMatchMode.EQUALS },
		initialBalance: { value: '', matchMode: FilterMatchMode.EQUALS },
		dateOfRequest: { value: '', matchMode: FilterMatchMode.DATE_AFTER }
	});
    
    const [totalRecords, setTotalRecords] = useState(1);

    useEffect(() => {

        console.log("Filters: "+  JSON.stringify(filters));

        setColumns(props.fields);
        loadData();

    }, [props.fields, first, pageSize, sortField, sortOrder, filters]);

    const loadData = () => {

        console.log("FILTERS: " + filters);

        let url = props.url + "?page=" + page + "&pageSize=" + pageSize + "&fields=" + elements.map(field => field.field).join(',');
        
        if(sortField != "") {
            url = url + "&sort=" + sortField + ":" + ( sortOrder == 1 ? "asc" : "desc" );
        }

        let filterQueries = [];
        Object.entries(filters).forEach(([id, element]) => {
            if(element.value !== "") {
                if(element.matchMode === "equals") {
                    filterQueries.push(id + "%20eq%20" + element.value);
                }
            }
        });
        console.log("FilterString: " + filterQueries.join("%20and%20"));

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
            console.log(data.items);

            
            let updatedItems = data.items;
            setTotalRecords(data.totalCount);
            console.log("Total count: " + data.totalCount);

            setElements(updatedItems);
        })
        .catch(error => console.error('Error:', error));
    }

    const onCellEditChange = (options) => (event) => {
        console.log("Target value = " + event.value);
        options.editorCallback(event.value);
    };

    const cellEditor = (options, datatype) => {
        if(datatype == "date") {
            return (
                <Calendar
                    value={options.value}
                    onChange={onCellEditChange(options)}
                />
            );
        } else if(datatype == "numeric") {
            return (
                <InputNumber
                    value={options.value}
                    onChange={onCellEditChange(options)}
                />
            );
        } else {
            return (
                <InputText
                    value={options.value}
                    onChange={onCellEditChange(options)}
                />
            );
        }
    };

    const editComplete = (e) => {
        console.log(e);
        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(authString))
        headers.set('Content-Type', 'application/json')
        
        let data = {
            [e.field]: e.newValue
        }

        let id = elements[e.rowIndex - (page - 1) * pageSize - 1].id;

        const url = props.url + id;

        fetch(url, {
            method: "PATCH",
            headers: headers,
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            loadData();
        })
        .catch(error => console.error('Error:', error));

    }

    const onPage = (e) => {
        setPage(e.page + 1);
        setPageSize(e.rows);
        setFirst(1 + e.page * pageSize);
    }

    const onSort = (e) => {
        setSortField(e.sortField);
        setSortOrder(e.sortOrder);
    }

    const onFilter = (e) => {
        setFilters(e.filters);
    }

    const filterTemplate = (options) => {
        const datatype = props.fields.find(item => item.field == options.field).datatype;
        if(datatype == "date") {
            return (
                <Calendar
                    value={options.value}
                    onChange={(e) => options.filterCallback(e.value, options.index)}
                    dateFormat="dd-M-yy"
                    placeholder="dd-MMM-yy"
                    monthNavigator
                    yearNavigator
                    yearRange="2000:2050"
                />
            );
        } else if(datatype == "numeric") {
            return (
                <InputNumber
                    value={options.value}
                    onChange={(e) => options.filterCallback(e.value, options.index)}
                />
            );
        } else {
            return (
                <InputText
                    value={options.value}
                    onChange={(e) => options.filterCallback(e.value, options.index)}
                />
            );
        }
    }

    return (
        <DataTable 
            lazy
            value={elements} 
            editMode="cell"
            tableStyle={{ minWidth: '50rem' }}
            totalRecords={totalRecords}
            filters={filters}
            paginator rows={pageSize} rowsPerPageOptions={[5, 10, 25, 50]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            first={first}
            onPage={onPage}
            onSort={onSort}
            sortField={sortField}
            sortOrder={sortOrder}            
            onFilter={onFilter}
            >
            {columns.map(({ field, header, readonly, datatype }) => {

                console.log("DATATYPE: " + datatype);

                if(readonly) {
                    return <Column key={field} sortable filter 
                        filterField={field}
                        filterElement={filterTemplate}
                        field={field} header={header}
                        dataType={datatype}
                        style={{ width: '25%' }} 
                    />;
                } else {

                    
                    return <Column key={field} sortable filter
                        filterField={field}
                        filterElement={filterTemplate}
                        field={field} header={header}
                        style={{ width: '25%' }} 
                        editor={(options) => cellEditor(options, datatype)}
                        dataType={datatype}
                        onCellEditComplete={e => editComplete(e)}
                    />;
                }
            })}
        </DataTable>
    );
}

export default App;