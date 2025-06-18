import { describe, it, expect } from 'vitest';
import validate from './validate';

describe('validate', () => {
    it('returns an error if a required field is empty', () => {
        const target = {
        name: 'username',
        value: '',
        required: true,
        type: 'text',
        };
        const errors = validate(target);
        expect(errors).toContain('Username is required.');
    });

    it('returns an error if value exceeds max length', () => {
        const target = {
        name: 'bio',
        value: 'This is a very long bio exceeding the limit.',
        required: false,
        type: 'text',
        max: 10,
        };
        const errors = validate(target);
        expect(errors).toContain('Bio has a maximum length of 10 characters');
    });

    it('validates email pattern correctly', () => {
        const validEmail = {
        name: 'email',
        value: 'user@example.com',
        required: true,
        type: 'email',
        };
        const invalidEmail = {
        ...validEmail,
        value: 'invalidemail@',
        };

        expect(validate(validEmail)).toEqual([]);
        expect(validate(invalidEmail)).toContain('Please enter a valid email address for field Email.');
    });

    it('validates numeric values correctly', () => {
        const valid = {
        name: 'age',
        value: '25',
        required: false,
        type: 'number',
        };
        const invalid = {
        ...valid,
        value: 'twenty-five',
        };

        expect(validate(valid)).toEqual([]);
        expect(validate(invalid)).toContain('Please enter a valid number for question Age.');
    });

    it('validates phone numbers when phone=true', () => {
        const validPhone = {
        name: 'contact',
        value: '+267 71234567',
        required: false,
        type: 'text',
        };
        const invalidPhone = {
        ...validPhone,
        value: '71234567',
        };

        expect(validate(validPhone, true)).toEqual([]);
        expect(validate(invalidPhone, true)).toContain(
        'Please enter a valid phone number, including the country code for field Contact.'
        );
    });

    it('returns no errors for valid optional input', () => {
        const optional = {
        name: 'optionalField',
        value: '',
        required: false,
        type: 'text',
        };
        expect(validate(optional)).toEqual([]);
    });
});