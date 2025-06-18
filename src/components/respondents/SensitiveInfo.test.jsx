import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SensitiveInfo from './SensitiveInfo'
import { RespondentsProvider } from '../../contexts/RespondentsContext'
import { formatISO, addDays } from 'date-fns'
import 'whatwg-fetch'

function renderWithProviders(ui) {
    return render(<RespondentsProvider>{ui}</RespondentsProvider>)
}

describe('SensitiveInfo', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders sensitive info in view mode', async () => {
        renderWithProviders(<SensitiveInfo id={1} />)

        // Wait for the key populations text to appear
        expect(await screen.findByText(/Key Populations/)).toBeInTheDocument()
        expect(screen.getByText('Female Sex Worker')).toBeInTheDocument()
        expect(screen.getByText('Disability Status:')).toBeInTheDocument()
        expect(screen.getByText('Hearing Impairment')).toBeInTheDocument()
        expect(screen.getByText('HIV Status: Positive')).toBeInTheDocument()
        expect(screen.getByText('Pregnant Since: 2024-01-01')).toBeInTheDocument()
    })

    it('switches to edit mode and renders form fields', async () => {
        renderWithProviders(<SensitiveInfo id={1} />)

        // Wait for the Edit button to appear
        await screen.findByText('Edit')

        fireEvent.click(screen.getByText(/Edit/))

        // Wait for form fields and labels to appear and be populated
        await waitFor(() => {
            expect(screen.getByText(/Key Population Status/)).toBeInTheDocument()
            expect(screen.getByLabelText(/Is this HIV Positive/)).toBeChecked()
            expect(screen.getByLabelText(/When did this person become HIV Positve/)).toHaveValue('2023-06-01')
            expect(screen.getByLabelText(/Is this person pregnant/)).toBeChecked()
            expect(screen.getByLabelText(/Pregnancy began/)).toHaveValue('2024-01-01')
            expect(screen.getByLabelText(/Pregnancy Ended/)).toHaveValue('2024-05-01')
        })
    })

    it('shows validation errors for future or invalid dates', async () => {
        renderWithProviders(<SensitiveInfo id={1} />)

        // Wait for initial load
        await screen.findByText('Edit')

        fireEvent.click(screen.getByText('Edit'))

        // Modify dates to trigger validation errors
        const futureDate = formatISO(addDays(new Date(), 10), { representation: 'date' })

        fireEvent.change(await screen.findByLabelText(/When did this person become HIV Positve/i), {
            target: { value: futureDate },
        })

        fireEvent.change(screen.getByLabelText('Pregnancy began'), {
            target: { value: '2024-06-01' },
        })
        fireEvent.change(screen.getByLabelText(/Pregnancy Ended/i), {
            target: { value: '2024-05-01' },
        })

        // Submit form
        fireEvent.click(screen.getByText('Save'))

        // Expect errors to appear
        expect(await screen.findByText('Date positive must be a valid date not in the future.')).toBeInTheDocument()
        expect(screen.getByText('Pregnancy end may not be before the start.')).toBeInTheDocument()
    })
})