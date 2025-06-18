import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RespondentsIndex from '../../components/respondents/RespondentsIndex';
import RespondentsCard from './RespondentsIndex'
import { RespondentsProvider } from '../../contexts/RespondentsContext';
import fetchWithAuth from '../../../services/fetchWithAuth';

vi.mock('../../../services/fetchWithAuth');

const mockRespondents = {
    count: 1,
    results: [
        {
            id: 1,
            is_anonymous: false,
            first_name: "John",
            last_name: "Doe",
            sex: "M",
            village: "Sampleville",
            district: "North",
        }
    ]
};

describe('RespondentsIndex', () => {
    it('renders loading state initially', async () => {
        fetchWithAuth.mockResolvedValueOnce({
        json: async () => mockRespondents
        });

        render(
        <RespondentsProvider>
            <MemoryRouter>
            <RespondentsIndex />
            </MemoryRouter>
        </RespondentsProvider>
        );

        expect(screen.getByText('Loading...')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
    });

    it('renders respondent card after fetch', async () => {
        fetchWithAuth.mockResolvedValueOnce({
            json: async () => mockRespondents
        });

        render(
        <RespondentsProvider>
            <MemoryRouter>
            <RespondentsIndex />
            </MemoryRouter>
        </RespondentsProvider>
        );

        await waitFor(() => {
            expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
            expect(screen.getByText(/Sampleville, North/)).toBeInTheDocument();
        });
    });

    it('displays "no respondents" if list is empty', async () => {
        fetchWithAuth.mockResolvedValueOnce({
            json: async () => ({ count: 0, results: [] })
        });

        render(
        <RespondentsProvider>
            <MemoryRouter>
            <RespondentsIndex />
            </MemoryRouter>
        </RespondentsProvider>
        );

        await waitFor(() => {
        expect(screen.getByText(/No respondents match your criteria/i)).toBeInTheDocument();
        });
    });

});