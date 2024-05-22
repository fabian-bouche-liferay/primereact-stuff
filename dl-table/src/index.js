import React from 'react';
import App from './App';
import ReactDOM from 'react-dom';

class WebComponent extends HTMLElement {

    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {

        const folderId = this.getAttribute('folderid');
        const baseUrl = "http://localhost:8080";
        const apiUrl = baseUrl + "/o/headless-delivery/v1.0/document-folders/" + folderId + "/documents";

        const fields = [];
        this.querySelectorAll('dl-table-field').forEach(field => {
            fields.push({
                field: field.getAttribute('id'),
                datatype: field.getAttribute('datatype'),
                browserSideSortAndFilter: field.getAttribute('bssaf') === "true",
                header: field.textContent.trim()
            });
        });

        ReactDOM.render(
            <App baseUrl={baseUrl} apiUrl={apiUrl} fields={fields} />,
            this
        );
    }

    disconnectedCallback() {
        ReactDOM.unmountComponentAtNode(this);
    }
}

const ELEMENT_ID = 'dl-table';

if (!customElements.get(ELEMENT_ID)) {
	customElements.define(ELEMENT_ID, WebComponent);
}