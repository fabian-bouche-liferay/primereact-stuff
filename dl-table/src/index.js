import React from 'react';
import ReactDOM from 'react-dom';
import CustomDataTable from './CustomDataTable';
import DocumentService from './services/DocumentService';
import DocumentFolderService from './services/DocumentFolderService';

class WebComponent extends HTMLElement {

    /* For Local Testing */
    username = 'test@liferay.com';
    password = 'test1234';
    authString = `${this.username}:${this.password}`;

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {

        const folderId = this.getAttribute('folderid');

        const baseUrl = "http://localhost:8080";
        const apiUrl = baseUrl + "/o/headless-delivery/v1.0/document-folders/";

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
            <CustomDataTable
                baseUrl={baseUrl}
                apiUrl={apiUrl}
                fields={fields}
                folderId={folderId}
                documentFolderService={new DocumentFolderService(this.authString)}
                documentService={new DocumentService(this.authString)} />,
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