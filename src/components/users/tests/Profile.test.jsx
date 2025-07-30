import { render, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MockUserAuthProvider } from '../../../mocks/utils/UserAuth';
import Profile from '../Profile';
import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

const mockAdmin = { username:'test1', role: 'admin', organization_id: 1 };
const mockMgr = { username:'test2', role: 'manager', organization_id: 1 };
export const renderWithContext = (user) => {
    return render(
        <MockUserAuthProvider mockUser={user}>
            <MemoryRouter initialEntries={[`/profiles/1`]}>
                    <Routes>
                        <Route path="/profiles/1" element={<Profile />} />
                    </Routes>
                </MemoryRouter>
        </MockUserAuthProvider>
    );
};

describe('ProfileDetail', () => {
    it('renders organization info after loading', async () => {
        renderWithContext(mockAdmin);

        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() =>
        expect(screen.getByText(/return to team overview/i)).toBeInTheDocument()
        );

        expect(screen.getByRole('heading', { name: /user wun/i })).toBeInTheDocument();
    });

    it('switches to edit mode on Edit Details click', async () => {
        renderWithContext(mockAdmin);

        await screen.findByText(/edit profile/i);

        const editButton = screen.getByText(/edit profile/i);
        expect(editButton.closest('a')).toHaveAttribute('href', '/profiles/1/edit');
    });

    it('shows set inactive for admin', async () => {
        renderWithContext(mockAdmin);

        const activateBtn = await screen.findByText(/Activate User/i);
        await userEvent.click(activateBtn);
        
        await screen.findByText(/deactivate/i);
        await waitFor(() => {
            expect(screen.queryByText('User is inactive.')).not.toBeInTheDocument();
        });
        await userEvent.click(activateBtn);
        await waitFor(() => {
            expect(screen.queryByText('User is inactive.')).toBeInTheDocument();
        });
    });
    it('not for manager', async () => {
        renderWithContext(mockMgr);

        expect(screen.queryByText('Activate User')).not.toBeInTheDocument();
    });
});
