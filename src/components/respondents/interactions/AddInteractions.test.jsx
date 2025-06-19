import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddInteractions from './AddInteractions';
import { InteractionsProvider } from '../../../contexts/InteractionsContext'
import fetchWithAuth from '../../../../services/fetchWithAuth';
import { vi, test, expect } from 'vitest';

vi.mock('../../services/fetchWithAuth', () => ({
  default: vi.fn(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  }))
}));

function setupComponent(props = {}) {
    const defaultTask = {
        id: 1,
        indicator: {
        id: 11,
        name: 'Test Indicator',
        code: 'TI',
        require_numeric: true,
        subcategories: [{ name: 'SubA' }, { name: 'SubB' }],
        },
    };

    const interactions = [];
    const onUpdate = vi.fn();
    const onFinish = vi.fn();

    render(
        <InteractionsProvider>
        <AddInteractions
            id={99}
            tasks={[defaultTask]}
            interactions={interactions}
            onUpdate={onUpdate}
            onFinish={onFinish}
            {...props}
        />
        </InteractionsProvider>
    );

    return { defaultTask, onUpdate, onFinish };
    }

    test('adds task via drag/drop and submits complete interaction', async () => {
    const { defaultTask, onFinish } = setupComponent();

    const dropBox = screen.getByText(/drag an indicator/i).closest('div');

    const dataTransfer = {
        data: {},
        getData: vi.fn(() => JSON.stringify(defaultTask)),
        setData: vi.fn((type, val) => {
        dataTransfer.data[type] = val;
        })
    };

    fireEvent.dragOver(dropBox, { dataTransfer });
    fireEvent.drop(dropBox, { dataTransfer });

    // Should open number modal
    const input = await screen.findByLabelText(/requires a numeric component/i);
    userEvent.type(input, '42');

    const confirmButton = screen.getByText(/confirm choices/i);
    userEvent.click(confirmButton);

    // Should open subcategory modal
    const subCheck = await screen.findByLabelText('SubA');
    userEvent.click(subCheck);

    const subConfirm = screen.getByText(/confirm choices/i);
    userEvent.click(subConfirm);

    // Enter date
    const dateInput = screen.getByLabelText(/interaction date/i) || screen.getByRole('textbox', { type: 'date' });
    fireEvent.change(dateInput, { target: { value: '2025-06-15' } });

    // Click Save
    const saveButton = screen.getByText(/save/i);
    userEvent.click(saveButton);

    await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/record/interactions/batch/',
        expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            body: expect.stringContaining('Test Indicator')
        })
        );
        expect(onFinish).toHaveBeenCalled();
    });
});