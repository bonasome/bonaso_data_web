import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BatchRecord from './BatchRecord';
import { MockUserAuthProvider } from '../../mocks/utils/UserAuth';  // Your auth context mock

const mockAdmin = { username:'test', role: 'admin', organization_id: 1 };
export const renderWithContext = (user) => {
    return render(
        <MockUserAuthProvider mockUser={user}>
            <BatchRecord />
        </MockUserAuthProvider>
    );
};

describe('BatchRecord component', () => {
    it('renders and loads projects and organizations', async () => {
        renderWithContext(mockAdmin);

        // Loading shows first
        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        // Wait for projects & organizations to load
        await waitFor(() => {
        expect(screen.getByLabelText(/select an organization/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/select a project/i)).toBeInTheDocument();
        });
    });
    it('shows errors if organization or project not selected when clicking Get my file', async () => {
        renderWithContext(mockAdmin);
        await waitFor(() => screen.getByLabelText(/select an organization/i));

        userEvent.click(screen.getByRole('button', { name: /get my file/i }));

        await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent('Please select a project.');
        expect(alert).toHaveTextContent('Please select an organization.');
        });
    });

    it('fetches template file when project and organization selected and Get my file clicked', async () => {
        renderWithContext(mockAdmin);
        await waitFor(() => screen.getByLabelText(/select an organization/i));

        // Select organization and project using SimpleSelect callback - simulate by calling the callback prop
        // Since SimpleSelect isn't implemented here, simulate user selecting with fireEvent or userEvent

        // Select organization
        const orgSelect = screen.getByLabelText(/select an organization/i);
        userEvent.selectOptions(orgSelect, '2');

        // Select project
        const projectSelect = screen.getByLabelText(/select a project/i);
        userEvent.selectOptions(projectSelect, '1');

        // Mock window.URL.createObjectURL to avoid errors
        const createObjectURLMock = vi.fn(() => 'blob:url');
        global.URL.createObjectURL = createObjectURLMock;
        global.URL.revokeObjectURL = vi.fn();

        userEvent.click(screen.getByRole('button', { name: /get my file/i }));

        await waitFor(() => {
        expect(createObjectURLMock).toHaveBeenCalled();
        });
  });
  
});