import DocumentServiceHelper from './DocumentServiceHelper';

class DocumentService {

    constructor(authString) {
        this.authString = authString;
        this.cache = {};
        this.cacheDuration = 10 * 60 * 1000;
    }

    loadData(baseURL, fields, filters, sortField, sortOrder, page, pageSize, all, forceRefresh) {

        let headers = new Headers();
        headers.set('Authorization', 'Basic ' + btoa(this.authString))

        let url = baseURL;

        if(all) {
            url = url + "?page=" + 1 + "&pageSize=200&fields=" + fields.map(field => field.field).join(',') + ",documentType.contentFields";
        } else {
            url = url + "?page=" + page + "&pageSize=" + pageSize + "&fields=" + fields.map(field => field.field).join(',') + ",documentType.contentFields";
            if(sortField !== null) {
                url = url + "&sort=" + sortField + ":" + ( sortOrder === 1 ? "asc" : "desc" );
            }
        }

        const filterString = DocumentServiceHelper.getFilterString(fields, filters);
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
            return data;
        });

    }

}

export default DocumentService;