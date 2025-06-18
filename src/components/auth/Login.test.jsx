import * as React from 'react';
console.log('useRef test:', React.useRef);
const mockedNavigate = vi.fn();


vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

vi.mock('../../contexts/UserAuth', async () => {
    return {
        useAuth: () => ({
            refreshAuth: vi.fn(),
        }),
    };
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('LoginComponent', () => {
beforeEach(() => {
    global.fetch = vi.fn();
    mockedNavigate.mockClear();
});

it('logs in and redirects on successful login', async () => {
    fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
    });

    render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'user' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'user@pass123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
            '/api/users/request-token/',
            expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            })
        );
        expect(mockedNavigate).toHaveBeenCalledWith('/');
    });
});

it('shows an error message on failed login', async () => {
    fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
    });

    render(
    <MemoryRouter>
        <Login />
    </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), {
    target: { value: 'baduser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
    target: { value: 'wrongpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
});
});