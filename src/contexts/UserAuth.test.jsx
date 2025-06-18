import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserAuth, useAuth } from './UserAuth';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock fetchWithAuth module
vi.mock('../../services/fetchWithAuth', () => ({
    default: vi.fn(),
}));

import fetchWithAuth from '../../services/fetchWithAuth';

// Test component that consumes the context
function TestComponent() {
    const { loggedIn, loading, user, refreshAuth } = useAuth();

    return (
        <div>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>Logged In: {loggedIn ? 'true' : 'false'}</p>
            <p>User: {user ? user.username : 'null'}</p>
            <button onClick={refreshAuth}>Refresh Auth</button>
        </div>
    );
}

describe('UserAuth context', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initially loads user data successfully', async () => {
            // Mock successful API response
            fetchWithAuth.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ username: 'testuser' }),
            });

            render(
            <UserAuth>
                <TestComponent />
            </UserAuth>
            );

            // Initially loading should be true
            expect(screen.getByText(/Loading: true/i)).toBeInTheDocument();

            // Wait for loading to finish and user data to appear
            await waitFor(() => {
                expect(screen.getByText(/Loading: false/i)).toBeInTheDocument();
                expect(screen.getByText(/Logged In: true/i)).toBeInTheDocument();
                expect(screen.getByText(/User: testuser/i)).toBeInTheDocument();
            });
        });

        it('handles failed user fetch and sets loggedIn false', async () => {
            // Mock failed API response (e.g. unauthorized)
            fetchWithAuth.mockResolvedValueOnce({
                ok: false,
            });

        render(
            <UserAuth>
                <TestComponent />
            </UserAuth>
        );

        await waitFor(() => {
            expect(screen.getByText(/Loading: false/i)).toBeInTheDocument();
            expect(screen.getByText(/Logged In: false/i)).toBeInTheDocument();
            expect(screen.getByText(/User: null/i)).toBeInTheDocument();
        });
    });

    it('refreshAuth updates the context values', async () => {
        // First call in useEffect returns no user
        fetchWithAuth.mockResolvedValueOnce({
        ok: false,
        });

        // Second call from refreshAuth returns user data
        fetchWithAuth.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ username: 'refreshedUser' }),
        });

        render(
            <UserAuth>
                <TestComponent />
            </UserAuth>
        );

        // Wait for initial checkAuth call
        await waitFor(() => {
            expect(screen.getByText(/Logged In: false/i)).toBeInTheDocument();
        });

        // Click the refreshAuth button
        screen.getByRole('button', { name: /refresh auth/i }).click();

        // Wait for refreshAuth to update user
        await waitFor(() => {
            expect(screen.getByText(/Logged In: true/i)).toBeInTheDocument();
            expect(screen.getByText(/User: refreshedUser/i)).toBeInTheDocument();
        });
    });
});