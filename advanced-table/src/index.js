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

        const objectName = this.getAttribute('objectname');
        const url = "http://localhost:8080/o/c/" + objectName + "/";

        const fields = [];
        this.querySelectorAll('advanced-table-field').forEach(field => {
            fields.push({
                field: field.getAttribute('id'),
                readonly: field.getAttribute('readonly') === 'true',
                datatype: field.getAttribute('datatype'),
                header: field.textContent.trim()
            });
        });

        ReactDOM.render(
            <App url={url} fields={fields} />,
            this
        );
    }

    disconnectedCallback() {
        ReactDOM.unmountComponentAtNode(this);
    }
}

const ELEMENT_ID = 'advanced-table';

if (!customElements.get(ELEMENT_ID)) {
	customElements.define(ELEMENT_ID, WebComponent);
}