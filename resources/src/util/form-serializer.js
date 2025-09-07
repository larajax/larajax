// FormSerializer serializes input elements to JSON
export class FormSerializer
{
    // Public
    static assignToObj(obj, name, value) {
        (new FormSerializer).assignObjectInternal(obj, name, value);
    }

    static serializeJSON(element) {
        return (new FormSerializer).parseContainer(element);
    }

    // Private
    parseContainer(element) {
        let jsonData = {};
        element.querySelectorAll('input, textarea, select').forEach((field) => {
            if (!field.name || field.disabled || ['file', 'reset', 'submit', 'button'].indexOf(field.type) > -1) {
                return;
            }

            if (['checkbox', 'radio'].indexOf(field.type) > -1 && !field.checked) {
                return;
            }

            if (field.type === 'select-multiple') {
                var arr = [];
                Array.from(field.options).forEach(function(option) {
                    if (option.selected) {
                        arr.push({
                            name: field.name,
                            value: option.value
                        });
                    }
                });
                this.assignObjectInternal(jsonData, field.name, arr);
                return;
            }

            this.assignObjectInternal(jsonData, field.name, field.value);
        });

        return jsonData;
    }

    assignObjectInternal(obj, fieldName, fieldValue) {
        this.assignObjectNested(
            obj,
            this.nameToArray(fieldName),
            fieldValue,
            fieldName.endsWith('[]')
        );
    }

    assignObjectNested(obj, fieldArr, fieldValue, isArray) {
        var currentTarget = obj,
            lastIndex = fieldArr.length - 1;

        fieldArr.forEach(function(prop, index) {
            if (isArray && index === lastIndex) {
                if (!Array.isArray(currentTarget[prop])) {
                    currentTarget[prop] = [];
                }

                currentTarget[prop].push(fieldValue);
            }
            else {
                if (currentTarget[prop] === undefined || currentTarget[prop].constructor !== {}.constructor) {
                    currentTarget[prop] = {};
                }

                if (index === lastIndex) {
                    currentTarget[prop] = fieldValue;
                }

                currentTarget = currentTarget[prop];
            }
        });
    }

    nameToArray(fieldName) {
        var expression = /([^\]\[]+)/g,
            elements = [],
            searchResult;

        while ((searchResult = expression.exec(fieldName))) {
            elements.push(searchResult[0]);
        }

        return elements;
    }
}
