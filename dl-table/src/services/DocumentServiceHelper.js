import { FilterMatchMode } from 'primereact/api';
import CustomFilterMatchMode from '../constants/CustomFilterMatchMode';

class DocumentServiceHelper {

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
    
        return `${year}-${month}-${day}`;
    }

    static getFilterString(fields, filters) {

        let filterQueries = [];
        Object.entries(filters).forEach(([id, element]) => {
            const datatype = fields.find(item => item.field === id).datatype;
            const browserSideSortAndFilter = fields.find(item => item.field === id).browserSideSortAndFilter === true;
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
                } else if(element.matchMode === CustomFilterMatchMode.DATE_IS) {
                    const currentDate = element.value;
                    filterQueries.push("(" + id + "%20gt%20" + this.formatDate(currentDate) + "T00:00:00Z) and ("  + id + "%20lt%20" + this.formatDate(currentDate) + "T23:59:59Z)");
                } else if(element.matchMode === CustomFilterMatchMode.DATE_IS_NOT) {
                    const currentDate = element.value;
                    filterQueries.push("(" + id + "%20lt%20" + this.formatDate(currentDate) + "T00:00:00Z) or ("  + id + "%20gt%20" + this.formatDate(currentDate) + "T23:59:59Z)");
                } else if(element.matchMode === CustomFilterMatchMode.DATE_BEFORE) {
                    const currentDate = element.value;
                    filterQueries.push(id + "%20lt%20" + this.formatDate(currentDate) + "T00:00:00Z");
                } else if(element.matchMode === CustomFilterMatchMode.DATE_AFTER) {
                    const currentDate = element.value;
                    filterQueries.push(id + "%20gt%20" + this.formatDate(currentDate) + "T23:59:59Z");
                }
            }
        });

        return filterQueries.join("%20and%20");

    }

}

export default DocumentServiceHelper;