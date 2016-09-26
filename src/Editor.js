import React from 'react';
import cx from 'classnames';
import update from 'react-addons-update';

import { PropTypes } from './constants';

import Scrim from './Scrim';

import * as Schema from './Schema';

import _ from 'lodash';

const empty = () => null;

// Base propTypes for all editor variants
const BASE_EDITOR_PROPTYPES = {
    // Schema for the elements in the array
    type: PropTypes.Schema.isRequired,

    // Optional: classes to apply to the editor wrapper
    className: React.PropTypes.string,

    // Optional.
    // A function that returns a react node to use for the icon
    icon: React.PropTypes.func,
};

// A tabular editor for editing a single JSON object
class ObjectEditor extends React.Component {
    static displayName = 'ObjectEditor';

    static propTypes = {
        ...BASE_EDITOR_PROPTYPES,

        // The thing to edit. Can be either
        // * an object with shape specified in type
        // * undefined
        object: React.PropTypes.object,

        // Handler called when the object is updated
        // function onUpdateElement (updatedObject) -> void
        // updatedObject is the current object with updates applied
        onUpdateElement: React.PropTypes.func.isRequired,
    };

    static defaultProps = {
        className: '',
    };

    render () {
        return (
            <table className={cx('editor', 'editor--object', this.props.className)}>
                <thead>
                <tr>
                    <th>
                        {/* Blank -- just for spacing */}
                        {/* This is the icon column */}
                    </th>

                    {
                        // A column for each element key
                        Object.keys(this.props.type).map(
                            field => (
                                <th>{ field }</th>
                            )
                        )
                    }

                    <th>
                        {/* Blank -- just for spacing */}
                        {/* This is the delete object column */}
                    </th>
                </tr>
                </thead>

                <tbody>

                    { /* Object is just an individual object, so there's only one row */ }
                    <ElementRow
                        icon={this.props.icon || undefined}
                        trash={empty /* no trash button for single objects */}
                        type={this.props.type}
                        object={this.props.object}
                        onChange={this.props.onUpdateElement}
                        onRemove={empty} />

                </tbody>
            </table>
        );
    }
};

const ScrimObjectEditor = Scrim(ObjectEditor);

// A tabular editor for editing an array of JSON objects in real time
class ArrayEditor extends React.Component {
    static displayName = 'Editor';

    static propTypes = {
        ...BASE_EDITOR_PROPTYPES,

        // The thing to edit. Must be either
        // * an array of the objects with shape specified in type
        // * undefined
        object: React.PropTypes.array,

        // Handler called when one of the elements in object is modified
        //
        // function onUpdateElement (updatedElement: Object, index: Number) -> void
        // where updatedElement is the element that has been updated, and
        // index is the index of updatedElement in the the object prop
        onUpdateElement: React.PropTypes.func.isRequired,

        // Handler called when one of the elements is removed
        //
        // function onUpdateElement (removedElement: Object, index: Number) -> void
        // where removedElement is the element that has been removed, and
        // index is the index of removedElement in the the object prop
        onRemoveElement: React.PropTypes.func.isRequired,

        // Handler called when a new element is added
        // function onAddElement (newElement: Object) -> void
        // where newElement is the element to add
        onAddElement: React.PropTypes.func.isRequired,
    };

    static defaultProps = {
        className: '',
    };

    render () {
        return (
            <table className={cx('editor', 'editor--array', this.props.className)}>
                <thead>
                <tr>
                    <th>
                        {/* Blank -- just for spacing */}
                        {/* This is the icon column */}
                    </th>

                    {
                        // A column for each element key
                        Object.keys(this.props.type).map(
                            field => (
                                <th>{ field }</th>
                            )
                        )
                    }

                    <th>
                        {/* Blank -- just for spacing */}
                        {/* This is the delete object column */}
                    </th>
                </tr>
                </thead>

                <tbody>

                {
                    _.map(
                        this.props.object,
                        (el, idx) => <ElementRow
                            icon={this.props.icon || undefined}
                            type={this.props.type}
                            object={el}
                            onChange={updated => this.props.onUpdateElement(updated, idx)}
                            onRemove={() => this.props.onRemoveElement(el, idx)} />
                    )
                }

                <AddObjectRow
                    type={this.props.type}
                    onAddElement={this.props.onAddElement}
                    onError={empty} />

                </tbody>
            </table>
        );
    }
};

// A table row for adding a new element to an array
// TODO: error handling
class AddObjectRow extends React.Component {
    static displayName = 'AddObjectRow';

    static propTypes = {
        // The schema to to use for creating new element
        type: PropTypes.Schema.isRequired,

        // Handler called when a new element is added
        // If this function returns anything truthy, the object row is cleared (so a new object can be added).
        // If this function returns anything falsey, the object row will not be cleared.
        //
        // function onAddElement (newElement: Object) -> boolean
        onAddElement: React.PropTypes.func.isRequired,
    };

    constructor (props) {
        super(props);

        this.state = {
            // Initialize with empty object
            object: {}
        };
    }

    // Handler called when the "add" button is clicked
    add = () => {
        const result = this.props.onAddElement(this.state.object);

        // If consumer returned true, reset fields.
        if (result) {
            return this.setState({
                object: {}
            });
        }
    };

    // Renders the "add element" button
    addButton = () => {
        return <button onClick={this.add}>Add</button>;
    };

    // Handler for updates to the object in state.
    // Simply sets object equal to the update.
    updateObject = updated => {
        this.setState({
            object: updated
        });
    };

    render () {
        const rowClasses = cx('editor__add-object');
        return (
            <ElementRow
                className={rowClasses}
                type={this.props.type}
                icon={empty}
                trash={this.addButton}
                object={this.state.object}
                onChange={this.updateObject}
                onRemove={empty /* unused by this component */} />
        );
    }
}

// Scrim version of the array editor.
const ScrimArrayEditor = Scrim(ArrayEditor);

// The primitive types that we'll use <input /> elements for.
// Other types will get nested object editors.
const STRING_INPUT_TYPES = [
    'string', 'boolean', 'number', 'date'
];

// A td cell for editing a property whose type is anything but 'object'
class StringCell extends React.Component {
    static displayName = 'StringCell';

    static propTypes = {
        // The type of this cell
        type: PropTypes.Schema.isRequired,

        // Current value of this cell
        value: React.PropTypes.any,

        // Handler called when the value is modified
        onChange: React.PropTypes.func.isRequired,
    };

    render () {
        return (
            <td>
                <input
                    className='form-control'
                    type='text'
                    value={this.props.value || ''}
                    required={this.props.type.required}
                    onChange={evt => this.props.onChange(evt.target.value)}/>
            </td>
        );
    }
}

// A td cell for editing a property of type `object`
// This cell will spawn nested editors using the scrimmed Editors
class ObjectCell extends React.Component {
    static displayName = 'ObjectCell';

    static propTypes = {
        // The type of this cell
        type: PropTypes.Schema.isRequired,

        // Current value of this cell
        value: React.PropTypes.any,

        // Handler called when the value is modified
        onChange: React.PropTypes.func.isRequired,
    };

    state = {
        open: false
    };

    // Toggle open the editor when the edit button is clicked.
    clickEdit = evt => {
        this.setState({
            open: !this.state.open
        });
    };

    // Close the editor
    close = evt => {
        this.setState({
            open: false,
        });
    };

    // Conditionally renders the value editor (depending on whether
    // the cell is toggled open)
    renderEditor = () => {
        // Cell is closed -- render nothing
        if (!this.state.open) {
            return <div></div>
        }

        // Choose between Array and Object Editors based on whether the value
        // is itself an array.
        const Editor = Array.isArray(this.props.value)
            ? ScrimArrayEditor
            : ScrimObjectEditor;

        // Cell is open -- render the value editor
        return (
            <Editor
                onClickScrim={this.close}

                className='editor--inside'
                type={this.props.type}
                object={this.props.value}
                onUpdateElement={this.props.onChange}
                onRemoveElement={
                    (el, droppedIndex) => this.props.onChange(
                        _.reject(
                            this.props.value,
                            (__, idx) => idx === droppedIndex
                        )
                    )
                }
                onAddElement={
                    (el) => this.props.onChange(
                        [ ...this.props.value, el ]
                    )
                } />
        );
    };

    render () {
        return (
            <td className='object-cell'>
                <button onClick={this.clickEdit}>Edit</button>

                { this.renderEditor() }
            </td>
        );
    }
}

// Render an object as a row in a table.
// The "icon" prop gets render as the furthest-left td, and the
// "trash" prop gets render as the furthest-right td.
const ElementRow = props => {
    // For some key, returns a handler that calls props.onChange with the
    // value of props.object[key].
    // Support null/undefined objects.
    const getChangeHandler = key => newValue => {
        // Element doesn't have a value at this key yet
        // So create an object with this key
        if (!props.object) {
            return props.onChange({
                [key]: newValue
            });
        }

        return props.onChange(update(
            props.object,
            {
                [key]: {
                    $set: newValue
                }
            }
        ));
    };

    // The trash button (if the consumer didn't specify one)
    const trashButton = (
        <button onClick={props.onRemove}>Trash</button>
    );

    return (
        <tr>
            <td>
                {
                    // Icon for the element
                    props.icon
                        ? props.icon()
                        : <i>C</i>
                }
            </td>

            {
                _.map(
                    Object.keys(props.type),
                    key => {
                        const isStringType = _.includes(STRING_INPUT_TYPES, props.type[key].type)

                        const CellType = isStringType
                            ? StringCell
                            : ObjectCell;

                        const value = props.object
                            ? props.object[key]
                            : null;

                        return <CellType
                            type={props.type[key]}
                            value={value}
                            onChange={getChangeHandler(key)} />
                    }
                )
            }

            <td>
                {
                    props.trash
                        ? props.trash()
                        : trashButton
                }
                {/*<Icon*/}
                    {/*which="trash"*/}
                    {/*onClick={empty}/>*/}
            </td>
        </tr>
    );
};
ElementRow.displayName = 'ElementRow';
ElementRow.propTypes = {
    // The type of this field -- a SchemaType
    // type: PropTypes.SchemaType.isRequired,
    type: PropTypes.Schema.isRequired,

    // Icon to use for the field
    icon: React.PropTypes.func,

    // Content for the trash button cell
    trash: React.PropTypes.func,

    // The element itself (should have the type `type`)
    object: React.PropTypes.any,

    // Handler called when the element is updated
    //
    // function onChange (updatedElement: Object) -> void
    onChange: React.PropTypes.func.isRequired,

    // Handler called when the user clicks the remove button
    // Called with no arguments
    //
    // function onRemove () -> void
    onRemove: React.PropTypes.func.isRequired,
};

export { ObjectEditor, ArrayEditor };