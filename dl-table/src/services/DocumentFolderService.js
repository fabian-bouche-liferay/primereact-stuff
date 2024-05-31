import DocumentServiceHelper from './DocumentServiceHelper';
import DocumentFolderColumns from '../constants/DocumentFolderColumns'

class DocumentFolderService {

    constructor(authString) {
        this.authString = authString;
        this.cache = {};
        this.cacheDuration = 10 * 60 * 1000;
    }

    loadData(baseURL, fields, filters, sortField, sortOrder, page, pageSize, folderId, all, forceRefresh) {

        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(this.authString))

        let url = baseURL + folderId + "/document-folders";

        console.log("FOLDER - fields: " + fields);

        let filteredFields = fields.filter(item => DocumentFolderColumns.ALLOWED.includes(item.field));

        const filteredFilters = {};

        Object.entries(filters).forEach(([id, element]) => {
            if(DocumentFolderColumns.ALLOWED.includes(id)) {
                filteredFilters[id] = element;
            }
        });

        if(all) {
            url = url + "?page=" + 1 + "&pageSize=200&fields=" + filteredFields.map(field => field.field === "title" ? "name" : field.field).join(',');
        } else {
            url = url + "?page=" + page + "&pageSize=" + pageSize + "&fields=" + filteredFields.map(field => field.field === "title" ? "name" : field.field).join(',');
            if(sortField !== null) {
                url = url + "&sort=" + (sortField === "title" ? "name" : sortField) + ":" + ( sortOrder === 1 ? "asc" : "desc" );
            }
        }

        const filterString = DocumentServiceHelper.getFilterString(fields, filteredFilters, true);
        if(filterString !== "") {
            url = url + "&filter=" + filterString;
        }
        
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
            data.items = DocumentServiceHelper.replaceNameWithTitle(items);

            return data;
        });

    }

}

export default DocumentFolderService;