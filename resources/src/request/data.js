import { FormSerializer } from "../util/form-serializer";

export class Data
{
    constructor(userData, targetEl, formEl) {
        this.userData = userData || {};
        this.targetEl = targetEl;
        this.formEl = formEl;
    }

    // Public
    getRequestData() {
        let requestData;

        // Serialize form
        if (this.formEl) {
            requestData = new FormData(this.formEl);
        }
        else {
            requestData = new FormData;
        }

        // Add single input data
        this.appendSingleInputElement(requestData);

        return requestData;
    }

    getAsFormData() {
        return this.appendJsonToFormData(
            this.getRequestData(),
            this.userData
        );
    }

    getAsQueryString() {
        return this.convertFormDataToQuery(
            this.getAsFormData()
        );
    }

    getAsJsonObject() {
        return this.convertFormDataToJson(
            this.getAsFormData()
        );
    }

    getAsJsonData() {
        const formData = this.getAsFormData();
        const jsonData = this.convertFormDataToJson(formData);

        // Carry key order for integer-keyed objects, which JSON does not preserve.
        const orders = this.buildOrderManifest(formData);
        if (orders.length) {
            jsonData.__ajax = { orders };
        }

        return JSON.stringify(jsonData);
    }

    // Private
    appendSingleInputElement(requestData) {
        // Has a form, no target element, or not a singular input
        if (this.formEl || !this.targetEl || !isElementInput(this.targetEl)) {
            return;
        }

        // No name or supplied by user data already
        const inputName = this.targetEl.name;
        if (!inputName || this.userData[inputName] !== undefined) {
            return;
        }

        // Include files, if they are any
        if (this.targetEl.type === 'file') {
            this.targetEl.files.forEach(function(value) {
                requestData.append(inputName, value);
            });
        }
        else {
            requestData.append(inputName, this.targetEl.value);
        }
    }

    appendJsonToFormData(formData, useJson, parentKey) {
        var self = this;
        for (var key in useJson) {
            var fieldKey = key;
            if (parentKey) {
                fieldKey = parentKey + '[' + key + ']';
            }

            var value = useJson[key];

            // Object
            if (value && value.constructor === {}.constructor) {
                this.appendJsonToFormData(formData, value, fieldKey);
            }
            // Array
            else if (value && value.constructor === [].constructor) {
                value.forEach(function(v, i) {
                    if (
                        v.constructor === {}.constructor ||
                        v.constructor === [].constructor
                    ) {
                        self.appendJsonToFormData(formData, v, fieldKey + '[' + i + ']');
                    }
                    else {
                        formData.append(fieldKey + '[]', self.castJsonToFormData(v));
                    }
                });
            }
            // Mixed
            else {
                formData.append(fieldKey, this.castJsonToFormData(value));
            }
        }

        return formData;
    }

    convertFormDataToQuery(formData) {
        // Process to a flat object with array values
        let flatData = this.formDataToArray(formData);

        // Process HTML names to a query string
        return Object.keys(flatData)
            .map(function(key) {
                if (key.endsWith('[]')) {
                    return flatData[key].map(function(val) {
                        return encodeURIComponent(key) + '=' + encodeURIComponent(val);
                    }).join('&');
                }
                else {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(flatData[key]);
                }
            })
            .join('&');
    }

    buildOrderManifest(formData) {
        // Capture DOM order of integer-keyed objects before the nested build re-sorts them.
        const ordersByPath = {};

        Array.from(formData.keys()).forEach((name) => {
            const segments = name.match(/[^\]\[]+/g) || [];

            // Each integer-like segment marks a parent container whose order matters.
            for (let i = 1; i < segments.length; i++) {
                const key = segments[i];
                if (!isIntegerKey(key)) {
                    continue;
                }

                const parentPath = segments.slice(0, i);
                const pathKey = parentPath.join('\0');

                if (!ordersByPath[pathKey]) {
                    ordersByPath[pathKey] = { path: parentPath, keys: [] };
                }

                // First-seen wins.
                if (!ordersByPath[pathKey].keys.includes(key)) {
                    ordersByPath[pathKey].keys.push(key);
                }
            }
        });

        // Only emit containers with something to reorder.
        return Object.values(ordersByPath).filter(entry => entry.keys.length > 1);
    }

    convertFormDataToJson(formData) {
        // Process to a flat object with array values
        let flatData = this.formDataToArray(formData);

        // Process HTML names to a nested object
        let jsonData = {};
        for (var key in flatData) {
            FormSerializer.assignToObj(jsonData, key, flatData[key]);
        }

        return jsonData;
    }

    formDataToArray(formData) {
        return Object.fromEntries(
            Array.from(formData.keys()).map(key => [
                key,
                key.endsWith('[]')
                    ? formData.getAll(key)
                    : formData.getAll(key).pop()
            ])
        );
    }

    castJsonToFormData(val) {
        if (val === null || val === undefined) {
            return '';
        }

        if (val === true) {
            return '1';
        }

        if (val === false) {
            return '0';
        }

        return val;
    }
}

function isElementInput(el) {
    return ['input', 'select', 'textarea'].includes((el.tagName || '').toLowerCase());
}

function isIntegerKey(key) {
    // Canonical array-index strings, which JS reorders ascending.
    return /^(0|[1-9][0-9]*)$/.test(key);
}
