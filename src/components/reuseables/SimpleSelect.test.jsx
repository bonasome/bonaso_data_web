import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import SimpleSelect from './SimpleSelect';

describe('SimpleSelect', () => {
    const optionValues = ['apple', 'banana', 'cherry'];
    const optionLabels = ['Apple', 'Banana', 'Cherry'];

    it('renders without crashing and shows label and options', () => {
        render(<SimpleSelect name="fruit" optionValues={optionValues} optionLabels={optionLabels} label="Fruits" />);

        expect(screen.getByLabelText(/Fruits/i)).toBeInTheDocument();
        optionLabels.forEach(label => {
        expect(screen.getByText(label)).toBeInTheDocument();
        });
    });

    it('renders null option by default', () => {
        render(<SimpleSelect name="fruit" optionValues={optionValues} optionLabels={optionLabels} label="Fruits" />);

        expect(screen.getByText('-----')).toBeInTheDocument();
    });

    it('calls callback with selected value on change (single select)', () => {
        const callback = vi.fn();
        render(<SimpleSelect name="fruit" optionValues={optionValues} optionLabels={optionLabels} callback={callback} />);

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'banana' } });
        expect(callback).toHaveBeenCalledWith('banana');
    });

    it('supports multiple selection and calls callback with array', () => {
        const callback = vi.fn();

        render(
            <SimpleSelect
            name="fruits"
            optionValues={['apple', 'banana', 'cherry']}
            optionLabels={['Apple', 'Banana', 'Cherry']}
            multiple
            callback={(val) => {callback(val)}}
            nullOption={false} // <-- important to avoid blank default
            />
        );

        const select = screen.getByRole('listbox');
        const options = screen.getAllByRole('option');

        // Simulate selecting apple and cherry
        options[0].selected = true; // apple
        options[2].selected = true; // cherry

        fireEvent.change(select);

        expect(callback).toHaveBeenCalledWith(['apple', 'cherry']);
        });

    it('filters options when search is enabled', () => {
        render(
        <SimpleSelect
            name="fruit"
            optionValues={optionValues}
            optionLabels={optionLabels}
            search
        />
        );

        const searchInput = screen.getByPlaceholderText(/start typing to search/i);
        fireEvent.change(searchInput, { target: { value: 'ban' } });

        // banana should be visible, others not
        expect(screen.queryByText('Banana')).toBeInTheDocument();
        expect(screen.queryByText('Apple')).not.toBeInTheDocument();
        expect(screen.queryByText('Cherry')).not.toBeInTheDocument();
    });

    it('shows message if no options', () => {
        render(<SimpleSelect name="empty" optionValues={[]} />);

        expect(screen.getByText(/Field Empty has no values/i)).toBeInTheDocument();
    });
});