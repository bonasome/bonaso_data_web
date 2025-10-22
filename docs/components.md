# BONASO Data Portal Website Components

---

For consistency and maintnance, some components are shared across numerous pages. Below is a brief description of the use case for each of these.

---

# Contents

- [Forms](#forms)
- [Inputs](#inputs)
- [Loading](#loading)
- [IndexViewWrapper](#indexviewwrapper)
- [Filter](#filter)
- [ConfirmDelete](#confirm)
- [ReturnLink](#returnlink)
- [Messages](#messages)
- [Tooltip](#tooltip)
- [UpdateRecord](#updaterecord)

---

## Forms
This site mostly uses React Hook Forms for collecting information from users. To help ease this process, there are two custom form components:

### [Field](/src/components/reuseables/forms/Field.jsx)
Takes a variety of inputs (such as label, options, IndexComponent, rules, name, etc.) depending on the type of input (see below) and returns an object the user can interact with. The only component that should reference field is FormSection, which should be used to build sets of fields. 

**Note**: A field will accept certain props that depend on the type of input:
- name (string, required for all), HTML name/id.
- label (string, required for all), what will be displayed to the user.
- rules (object, optional), validation rules (required, email, etc.), passes errors to error prop of input component.
- options (array, MultiCheckbox, RadioButtons, Select, ImageSelect), the option label and value.
- IndexComponent (component, required for ModelSelect/ModelMultiSelect), produces the correct index view for selection.
- Include/Exclude Params (array, optional for ModelSelect/ModelMultiSelect), objects that are passed to the url to explicitly only include or exclude certain items.
- Blacklist (array, optional for ModelSelect/ModelMultiSelect), object ids that should not be displayed when a user is selecting itmes.
- valueField (string, optional for RadioButtons, MultiSelect, ModelSelect, ModelMultiSelect): What key in options should be used for the returned values.
- labelField (string, optional for RadioButtons, MultiSelect, ModelSelect, ModelMultiSelect): What key in options should be used to display values.

More detailed examples of field construction can be found at [here](/src/components/indicators/IndicatorForm.jsx)

### [FormSection](/src/components/reuseables/forms/FormSection.jsx): 
Combines a variety of forms into one section that can be displayed or hidden based on watches. Can also optionally be given a header. Meant to be used alongside field.

---

## Inputs
Inputs should always be wrapped in our reusable components rather than raw HTML `<input>/<select>` unless explicitly noted.

- [ButtonHover](/src/components/reuseables/inputs/ButtonHover.jsx]): A button (of type button) that displays additional information when hovered (mostly used to show an icon and then additional text when hovered).
```jsx
<ButtonHover callback={() => doSomething()} noHover={<Icon />} hover={'Click Here'} />
```

- [Checkbox](/src/components/reuseables/inputs/Checkbox.jsx): A single toggle checkbox with a custom icon that returns a boolean.
```jsx
<Checkbox name="isActive" label="Active?" value={state} onChange={(v) => setState(v)} /> //onChange: boolean (true when checked, false when unchecked)
```

- [MultiCheckbox](/src/components/reuseables/inputs/MultiCheckbox.jsx): A list of checkboxes that return information as an array.
```jsx
<MultiCheckbox name="kp_status" label="KP Status" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> //onChange: returns array of values
```

- [MultiInt](/src/components/reuseables/inputs/MultiInt.jsx): Gives a list of numeric entries that correspond to a specific option. Used for the "Multiple Number" indicator type, where a user can segment numbers within one indicator by category. 
```jsx
<MultiCheckboxNum name="condoms" label="Condoms Received" options={[{id: 1, name: 'Option1'}, {id: 2, name: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> 
//onChange: returns an array of objects [{value: null, option: id: 1}]
```

- [RadioButtons](/src/components/reuseables/inputs/RadioButtons.jsx): A custom radio button component with custom icons that allows a user to select a single option.
```jsx
<RadioButtons name="sex" label="Sex" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> //onChange: returns selected value
```

- [Select](/src/components/reuseables/inputs/Select.jsx): A select component that returns a single value (does not support mutliselect, as MultiCheckbox is preferred for that). RadioButtons are preferred, except with long lists or where space is a concern. 
```jsx
<Select name="age_range" label="Age Range" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} search={true} /> //onChange: returns selected value
```
    - *Note*: For selects with many options, enabling 'search=true' in params will display an input that the user can type into the filter the list (can also be used for selects that pull from paginated APIs if a searchCallback is provided)   

- [Input](/src/components/reuseables/inputs/Input.jsx): A basic text input component. Can be passed a type prop that can specify for textarea, numbers, email, or date inputs. 
```jsx
<Input name='first_name' label='First name' onChange={(e) => setState(e.target.value)} value={state} type={'text'} /> //returns string of typed value
```

- [ImageSelect](/src/components/reuseables/inputs/ImageSelect.jsx): This component displays a list of icons that, when hovered over, also show text. Can be used to select one or multiple items, and will return a single value or array as specified. Used to add a bit of visual flare.
```jsx
<ImageSelect images={[Icon1, Icon2]} options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} search={true} />
```
- [ModelSelect](/src/components/reuseables/inputs/ModelMultiSelect.jsx): Allows a user to select another model for foreign key fields.
```jsx
<ModelSelect IndexComponent={IndexComponent} onChange={(v) => setState(v)} callbackText='Choose Item' />
//returns selected object
```
- [ModelMultiSelect](/src/components/reuseables/inputs/ModelMultiSelect.jsx): Allows a user to select multiple other model instances for m2m or m2one fields. 
```jsx
<ModelMultiSelect IndexComponent={IndexComponent} onChange={(v) => handleUpdate(v)} callbackText='Add Item' />
//returns an array of the selected objects
```

---

## Loading
- [Loading](/src/components/reuseables/loading/Loading.jsx): A full page loading screen. Use for intial page loads or full refreshes. 
- [ComponentLoading](/src/components/reuseables/loading/ComponentLoading.jsx): A smaller loading component that displays moving bars. Use this when a singular component is loading/updating to prevent full page rerenders.
- [ButtonLoading](/src/components/reuseables/loading/ButtonLoading.jsx): A button looking component that shows a spinning wheel. Can be used after a button is clicked to signify that the system is wokring on the request. Used in most forms. 

---

## Flags
The flag system is used for respondents, interactions, social media posts, and event counts (but could be expanded) as a way to note suspiscious entries. The following components help to standardize the process of creating/viewing/resolving flags across different components. You can see examples of these components at [`InteractionCard.jsx`](/src/components/respondents/interactions/InteractionCard.jsx)

- [FlagCard](/src/components/flags/flagCard.jsx): Condenses information about a flag into a single expandable card. This is also where flags are resolved.
- [FlagDetailModal](/src/components/flags/FlagDetailModal.jsx): If a page/component does not have space to index a list of flag cards, this modal can be used to display them. 
- [FlagModal](/src/components/flags/FlagModal.jsx): A modal that allows a user to create a new flag. 

## [IndexViewWrapper](/src/components/reuseables/IndexView.jsx)
A helper wrapper used for index views that automatically includes a search bar and page buttons. It can also optionally accept a filter component. Passes these back to the main Index Component which manages it using entires, search, page, and optionally filters states.

See an example at [`IndicatorsIndex.jsx`](/src/components/indicators/IndicatorsIndex.jsx).

## [Filter](/src/components/reuseables/Filter.jsx)
A helper filter that returns an object which values that an index component can use as url params when making API calls. 

See an example at [`FunWithFlags.jsx`](/src//components/flags/FunWithFlags.jsx).

**Note**: Filter requires a filterConfig.js file (usually located in the same folder as the IndexComponent of the app), which has both an array with objects to help build the inputs and an initial value object that sets the initial values for each field. See an example [here](/src/components/flags/filterConfig.js)

## [ConfirmDelete](/src/components/reuseables/ConfirmDelete.jsx)
Displays a modal that will appear when a user tries to delete something to ask for confirmation. By default, it will require the user to type "confirm" to enable the delete function. 

```jsx
<ConfirmDelete name={'this object'} onConfirm={()=> handleDelete()} onCancel={() => handleClose()} />
```

## [ReturnLink](/src/components/reuseables/ReturnLink.jsx)
The return link displays a small bar at the top of a page with an arrow and a link that is intended to return to the previous page (most commonly used for returning to an index view from a detail view.)

```jsx
<ReturnLink url={'/random-location'} label={'Return to Index'} />
```

## [Messages](/src/components/reuseables/Messages.jsx)
This component is designed to display all errors, warnings, and success messages. Can optionally accept a ref for automatic scrolling. Any pages that have any API interactions should include this component.
```jsx
<Messages errors={errors} warnings={warnings} success={success} ref={alertRef} /> //with errors, warnings, and success each being an array
```

## [Tooltip](/src/components/reuseables/Tooltip.jsx)
This component displays a small info icon that shows helpful text when hovered over (mostly used with RHF forms to explain inputs).
```jsx
<Tooltip msg={'This is confusing!'} />
```

## [UpdateRecord](/src/components/reuseables/meta/UpdateRecord.jsx)
The backend will pass created_by/updated_by features for most items, and this component takes created/updated_by/at information and formats it in a consistent way. Should be used for detail views/components so that users can see a record's history. 
```jsx
<UpdateRecord created_by={obj.created_by} created_at={obj.created_at} updated_by={obj.updated_by} updated_at={obj.updated_at} /> 
//there is some safety if one of these fields does not exist on the object
```
