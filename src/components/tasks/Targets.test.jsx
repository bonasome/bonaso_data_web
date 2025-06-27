import { render, fireEvent } from '@testing-library/react';
import { MockUserAuthProvider } from '../../mocks/utils/UserAuth';
import Tasks from './Tasks'
import { TargetEdit } from './Targets';
import { screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { getTaskNumeric, getTaskTypical, getTaskPrereq } from '../../mocks/handlerHelpers/projectHandler';

const mockAdmin = { username:'test', role: 'admin', organization_id: 1 };
export const renderWithContext = (user) => {
    return render(
        <MockUserAuthProvider mockUser={user}>
            <Tasks target={true} canDelete={true} />
        </MockUserAuthProvider>
    );
};

describe('Tasks', () => {
    it('allows for adding targets', async () => {
        const onUpdate = vi.fn();
        render(
            <MockUserAuthProvider mockUser={mockAdmin}>
                <TargetEdit
                    task={getTaskNumeric}
                    tasks={[getTaskNumeric]}
                    onUpdate={onUpdate}
                    existing={null}
                />
            </MockUserAuthProvider>
        );

        expect(await screen.findByLabelText('Start')).toBeInTheDocument();
        expect(screen.getByLabelText('End')).toBeInTheDocument();

        const startInput = await screen.findByLabelText(/start/i); 
        fireEvent.change(startInput, { target: { value: '2025-12-01' } });

        const endInput = await screen.findByLabelText(/end/i); 
        fireEvent.change(endInput, { target: { value: '2025-12-31' } });


        const amountInput = await screen.findByLabelText(/amount/i); 
        fireEvent.change(amountInput, { target: { value: '100' } });

        fireEvent.click(screen.getByText('Save'));
        
        await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
            amount: '100',
            start: '2025-12-01',
            end: '2025-12-31',
            related_to_id: null,
            percentage_of_related: null,
            task_id: 4,
        })
        );
        });
    });
    it('allows for adding targets this way too', async () => {
        const onUpdate = vi.fn();
        render(
            <MockUserAuthProvider mockUser={mockAdmin}>
                <TargetEdit
                    task={getTaskPrereq}
                    tasks={[getTaskPrereq, getTaskTypical]}
                    onUpdate={onUpdate}
                    existing={null}
                />
            </MockUserAuthProvider>
        );

        expect(await screen.findByLabelText('Start')).toBeInTheDocument();
        expect(screen.getByLabelText('End')).toBeInTheDocument();

        const startInput = await screen.findByLabelText(/start/i); 
        fireEvent.change(startInput, { target: { value: '2025-12-01' } });

        const endInput = await screen.findByLabelText(/end/i); 
        fireEvent.change(endInput, { target: { value: '2025-12-31' } });

        const switchAmount = screen.getByLabelText(/measure as a percentage/i);
        userEvent.click(switchAmount);

       const rtInput = await screen.findByLabelText(/related task/i);
        await userEvent.selectOptions(rtInput, '1');

        const pInput = await screen.findByLabelText(/percentage of/i);
        await userEvent.type(pInput, '75');

        fireEvent.click(screen.getByText('Save'));
        
        await waitFor(() => {
        expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
            amount: null,
            start: '2025-12-01',
            end: '2025-12-31',
            related_to_id: '1',
            percentage_of_related: '75',
            task_id: 2,
        })
        );
        });
    });

    it('target switches to edit mode', async () => {
        renderWithContext(mockAdmin);
        await waitFor(() => {
            expect(screen.getByText(/HIV-CON/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/HIV-CON/));
        expect(screen.getByText('Edit Target')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Edit Target'));

        expect(await screen.findByLabelText('Start')).toBeInTheDocument();
        expect(screen.getByLabelText('End')).toBeInTheDocument();

    });
    it('deletes a target', async () => {
        renderWithContext(mockAdmin);
        await waitFor(() => {
            expect(screen.getByText(/HIV-CON/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/HIV-CON/));
        expect(screen.getByText('Delete Target')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Delete Target'));


        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(screen.queryByText(/100/)).not.toBeInTheDocument();
        });

    });
})