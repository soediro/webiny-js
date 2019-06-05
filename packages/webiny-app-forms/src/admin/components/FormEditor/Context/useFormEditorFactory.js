import React from "react";
import shortid from "shortid";
import { set } from "dot-prop-immutable";
import { get, cloneDeep, pick } from "lodash";
import { getForm, updateRevision } from "./graphql";
import type { FieldsLayoutType, FieldType } from "webiny-app-forms/types";

export default FormEditorContext => {
    return () => {
        const context = React.useContext(FormEditorContext);
        if (!context) {
            throw new Error("useFormEditor must be used within a FormEditorProvider");
        }

        const { state, dispatch } = context;
        window.useFormEditorState = state;

        const self = {
            apollo: state.apollo,
            async getForm(id) {
                let response = await self.apollo.query({ query: getForm, variables: { id } });
                response = get(response, "data.forms.getForm");
                dispatch({ type: "data", data: response.data });

                return response;
            },
            saveForm: async () => {
                const data = state.data;
                let response = await self.apollo.mutate({
                    mutation: updateRevision,
                    variables: { id: data.id, data: pick(data, ["layout", "fields", "name"]) }
                });

                return get(response, "data.forms.updateRevision");
            },
            setData(data) {
                dispatch({ type: "data", data });
            },
            setName(name) {
                dispatch({ type: "name", value: name });
            },
            getFields(layout = false): [FieldType] | FieldsLayoutType {
                if (!layout) {
                    return state.data.fields;
                }

                // Replace every field ID with actual field object.
                const fields = cloneDeep(state.data.layout);
                fields.forEach((row, rowIndex) => {
                    row.forEach((fieldId, fieldIndex) => {
                        fields[rowIndex][fieldIndex] = self.getFieldById(fieldId);
                    });
                });
                return fields;
            },
            getFieldById(id): ?FieldType {
                return self.getFields().find(item => item.id === id);
            },
            insertField(fieldData, position) {
                const data = cloneDeep(state.data);

                const field = cloneDeep(fieldData);
                field.id = shortid.generate();

                if (!Array.isArray(data.fields)) {
                    data.fields = [];
                }
                data.fields.push(field);

                const { row, index } = position;
                if (!Array.isArray(data.layout)) {
                    data.layout = [];
                }

                // Setting a form field into a new non-existing row.
                if (!data.layout[row]) {
                    data.layout[row] = [field.id];
                    self.setData(data);
                    return;
                }

                // If row exists, we drop the field at the specified index.

                if (index === null) {
                    // Create a new row with the new field at the given row index
                    console.log("cemu ovo sluzi?! ");
                    self.setFields(
                        set(state, "data.fields", [
                            ...fields.slice(0, row),
                            [field],
                            ...fields.slice(row)
                        ])
                    );
                    return;
                }

                // We are dropping a new field at the specified index.
                data.layout[row].splice(index, 0, field.id);
                self.setData(data);
            },
            deleteField(fieldData) {
                const field = cloneDeep(fieldData);
                const data = cloneDeep(state.data);

                // Remove the field from fields list...
                const fieldIndex = data.fields.findIndex(item => item.id === field.id);
                data.fields.splice(fieldIndex, 1);
                for (let i = 0; i < data.fields.length; i++) {
                    if (data.fields[i].id === field.id) {
                        data.fields[i] = field;
                        break;
                    }
                }

                // ...and rebuild the layout object.
                const layout = [];
                let currentRowIndex = 0;
                data.layout.forEach(row => {
                    row.forEach(fieldId => {
                        const field = data.fields.find(item => item.id === fieldId);
                        if (!field) {
                            return true;
                        }
                        if (!Array.isArray(layout[currentRowIndex])) {
                            layout[currentRowIndex] = [];
                        }

                        layout[currentRowIndex].push(fieldId);
                    });
                    layout[currentRowIndex] && layout[currentRowIndex].length && currentRowIndex++;
                });

                data.layout = layout;

                self.setData(data);
            },
            updateField(fieldData) {
                const field = cloneDeep(fieldData);
                const data = cloneDeep(state.data);
                for (let i = 0; i < data.fields.length; i++) {
                    if (data.fields[i].id === field.id) {
                        data.fields[i] = field;
                        break;
                    }
                }
                self.setData(data);
            },
            editField(data) {
                dispatch({ type: "editField", data });
            },
            fieldExists(fieldId): boolean {
                return state.data.fields.findIndex(f => f.fieldId === fieldId) >= 0;
            },
            findFieldPosition(id) {
                for (let i = 0; i < state.data.fields.length; i++) {
                    const row = state.data.fields[i];
                    for (let j = 0; j < row.length; j++) {
                        if (row[j]._id === id) {
                            return { row: i, index: j };
                        }
                    }
                }

                return { row: null, index: null };
            },
            state,
            dispatch
        };

        window.useFormEditor = self;
        return self;
    };
};
