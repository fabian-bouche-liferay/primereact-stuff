import DocumentServiceHelper from './DocumentServiceHelper';
import ServiceConstants from '../constants/ServiceConstants';

class DocumentService {

    constructor(authString) {
        this.authString = authString;
        this.cache = {};
        this.cacheDuration = 10 * 60 * 1000;
    }

    getValuesForField(baseURL, fields, staticFilters, folderId, fieldName, forceRefresh) {

        let url = baseURL + folderId + "/documents";
        url = url + "?page=" + 1 + "&pageSize=" + ServiceConstants.MAX_PAGESIZE + "&fields=" + fieldName;

        const filterString = DocumentServiceHelper.getFilterString(fields, staticFilters, false);

        console.log("Filter string: " + filterString);

        if(filterString !== "") {
            url = url + "&filter=" + filterString;
        }

        this.makeCall(url, forceRefresh);

    }

    loadData(baseURL, fields, filters, sortField, sortOrder, page, pageSize, folderId, all, forceRefresh) {

        let url = baseURL + folderId + "/documents";

        if(all) {
            url = url + "?page=" + 1 + "&pageSize=" + ServiceConstants.MAX_PAGESIZE + "&fields=" + fields.map(field => field.field).join(',') + ",documentType.contentFields";
        } else {
            url = url + "?page=" + page + "&pageSize=" + pageSize + "&fields=" + fields.map(field => field.field).join(',') + ",documentType.contentFields";
            if(sortField !== null) {
                url = url + "&sort=" + sortField + ":" + ( sortOrder === 1 ? "asc" : "desc" );
            }
        }

        const filterString = DocumentServiceHelper.getFilterString(fields, filters, false);

        console.log("Filter string: " + filterString);

        if(filterString !== "") {
            url = url + "&filter=" + filterString;
        }
        
        return this.makeCall(url, forceRefresh);

    }

    makeCall(url, forceRefresh) {

        console.log("URL: " + url);

        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(this.authString))

        console.log("URL: " + url);

        if(!forceRefresh) {
            console.log("Looking for cache entry");
            const cachedEntry = this.cache[url];
            if (cachedEntry) {
                console.log("Found");
                const now = Date.now();
                if (now - cachedEntry.timestamp < this.cacheDuration) {
                    return Promise.resolve(cachedEntry.data);
                } else {
                    delete this.cache[url];
                }
            }
        }

        return fetch(url, {
            method: "GET",
            headers: headers
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        }).then(data => {
            console.log("Caching entry");
            this.cache[url] = {
                data: data,
                timestamp: Date.now()
            };

            const {items} = data;
            data.items = DocumentServiceHelper.flattenDocumentType(items);

            return data;
        });

    }

}

export default DocumentService;