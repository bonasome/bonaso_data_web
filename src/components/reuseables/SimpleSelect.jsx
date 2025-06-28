import React, { useEffect, useState, useMemo } from 'react';
import styles from './select.module.css';

export default function SimpleSelect({
        name,
        optionValues,
        optionLabels = null,
        label = null,
        multiple = false,
        search = false,
        searchCallback = null,
        callback = null,
        nullOption = true,
        value = null,
        defaultOption = null,
        required = false,
        }) {
    // Combine values and labels into one array for easier filtering and rendering
    const options = useMemo(() => {
        if (!optionValues || optionValues.length === 0) return [];
        let vals = [...optionValues];
        let labs = optionLabels && optionLabels.length === optionValues.length
        ? optionLabels
        : [...optionValues];

        if (optionLabels && optionLabels.length !== optionValues.length) {
            console.warn('Warning: Labels do not match values. Using values as labels.');
            labs = [...optionValues];
        }

        if (nullOption) {
            vals = ['', ...vals];
            labs = ['-----', ...labs];
        }

        return vals.map((val, i) => ({ value: val, label: labs[i] }));
    }, [optionValues, optionLabels, nullOption]);

    // Selected value state
    const [selectedVal, setSelectedVal] = useState(multiple ? [] : '');

    // Search filter
    const [searchTerm, setSearchTerm] = useState('');

    // Sync controlled value or default option
    useEffect(() => {
        if (multiple) {
        if (Array.isArray(value)) {
            setSelectedVal(value);
        } 
        else if (defaultOption && Array.isArray(defaultOption)) {
            setSelectedVal(defaultOption);
        } 
        else {
            setSelectedVal([]);
        }
        } 
        else {
            if (value !== null) {
                setSelectedVal(value);
            } 
            else if (defaultOption !== null && options.find(o => o.value === defaultOption)) {
                setSelectedVal(defaultOption);
            } 
            else if (nullOption) {
                setSelectedVal('');
            } 
            else if (options.length > 0) {
                setSelectedVal(options[0].value);
            }
        }
    }, [value, defaultOption, multiple, options, nullOption]);

    // Filter options by search term
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        const term = searchTerm.toLowerCase();
        return options.filter(
        (opt) =>
            opt.label.toLowerCase().includes(term) || opt.value.toString().toLowerCase().includes(term)
        );
    }, [searchTerm, options]);

    const handleChange = (e) => {
        if (multiple) {
            const selected = Array.from(e.target.selectedOptions, (opt) => opt.value).filter(v => v !== '');
            setSelectedVal(selected);
        if (callback) callback(selected);
        } 
        else {
            setSelectedVal(e.target.value);
            if (callback) callback(e.target.value);
        }
    };

    return (
        <div className={styles.select}>
        <label htmlFor={name} className={styles.selectLabel}>
            {label ?? name.charAt(0).toUpperCase() + name.slice(1)}
            {multiple ? ' (cntrl+click to select multiple)' : ''}
            {search && (
            <input
                id={`search_${name}`}
                className={styles.selectSearch}
                type="text"
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); searchCallback ? searchCallback(e.target.value) : null}}
                placeholder="start typing to search..."
            />
            )}
            <select
                id={name}
                name={name}
                multiple={multiple}
                onChange={handleChange}
                className={styles.select}
                required={required}
                value={selectedVal}
            >
            {filteredOptions.map(({ value, label }) => (
                <option key={value + label} value={value}>
                {label}
                </option>
            ))}
            </select>
        </label>
        </div>
    );
}