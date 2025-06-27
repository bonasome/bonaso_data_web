import { render, fireEvent } from '@testing-library/react';
import { MockUserAuthProvider } from '../../mocks/utils/UserAuth';
import Tasks from './Tasks'
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

const mockAdmin = { username:'test', role: 'admin', organization_id: 1 };
const mockMgr = { username:'test', role: 'manager', organization_id: 1 };
export const renderWithContext = (user) => {
    return render(
        <MockUserAuthProvider mockUser={user}>
            <Tasks target={true} canDelete={true}/>
        </MockUserAuthProvider>
    );
};

describe('Tasks', () => {
    it('fetches and displays tasks', async () => {
        renderWithContext(mockAdmin);
        expect(await screen.findByText(/HIV-TEST/)).toBeInTheDocument();
    });
    it('toggles expanded view when clicked', async () => {
        renderWithContext(mockAdmin);
        await waitFor(() => {
            expect(screen.getByText(/HIV-TEST/i)).toBeInTheDocument();
        });
        expect(screen.queryByText(/Health Org Botswana/)).not.toBeInTheDocument();

        fireEvent.click(screen.getByText(/HIV-TEST/));

        await waitFor(() => {
            expect(screen.getByText(/Health Org Botswana/i)).toBeInTheDocument();
        });
    });
    it('shows subcategories', async () => {
        renderWithContext(mockAdmin);
        
        await waitFor(() => {
            expect(screen.getByText(/HIV-MSG/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/HIV-MSG/));

        expect(screen.getByText('Subcategories:')).toBeInTheDocument();
        expect(screen.getByText('CCC')).toBeInTheDocument();
        expect(screen.getByText('Testing')).toBeInTheDocument();
        expect(screen.getByText('ART')).toBeInTheDocument();
    });
    it('shows if task requires number', async () => {
        renderWithContext(mockAdmin);
        
        await waitFor(() => {
            expect(screen.getByText(/HIV-CON/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/HIV-CON/));

        expect(screen.getByText('Requires Number')).toBeInTheDocument();
    });
    it('shows admin-only buttons when expanded', async () => {
        renderWithContext(mockAdmin);
        await waitFor(() => {
            expect(screen.getByText(/HIV-CON/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/HIV-CON/));

        expect(screen.getByText('Add Target')).toBeInTheDocument();
        expect(screen.getByText('Remove Task')).toBeInTheDocument();
    });

    it('does not show admin-only buttons when expanded', async () => {
        renderWithContext(mockMgr);
        await waitFor(() => {
            expect(screen.getByText(/HIV-CON/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/HIV-CON/));

        expect(screen.queryByText('Add Target')).not.toBeInTheDocument();
        expect(screen.queryByText('Remove Task')).not.toBeInTheDocument();
    });
    it('deletes task after confirming in confirm dialog', async () => {
        renderWithContext(mockAdmin);
        await waitFor(() => {
            expect(screen.getByText(/HIV-CON/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/HIV-CON/));

        fireEvent.click(screen.getByText('Remove Task'));

        const confirmInput = await screen.findByLabelText(/please type "confirm"/i);
        await userEvent.clear(confirmInput);
        await userEvent.type(confirmInput, 'confirm');

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(screen.getByText(/Task removed/)).toBeInTheDocument();
        });
    });
    it('deletes task after confirming in confirm dialog', async () => {
        renderWithContext(mockAdmin);
        await waitFor(() => {
            expect(screen.getByText(/HIV-CON/i)).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText(/HIV-CON/));

        fireEvent.click(screen.getByText('Remove Task'));

        const confirmInput = await screen.findByLabelText(/please type "confirm"/i);
        await userEvent.clear(confirmInput);
        await userEvent.type(confirmInput, 'confirm');

        fireEvent.click(screen.getByText('Confirm'));

        await waitFor(() => {
            expect(screen.getByText(/Task removed/)).toBeInTheDocument();
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
})