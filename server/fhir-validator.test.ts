import { describe, it, expect } from 'vitest';
import { validatePatient, validateObservation, validateResourceStructure } from './fhir-validator';

describe('FHIR Validator', () => {
  describe('validatePatient', () => {
    it('should validate a valid patient resource', () => {
      const patient = {
        id: 'patient-123',
        name: [
          {
            family: 'Silva',
            given: ['João'],
          },
        ],
        gender: 'male',
        birthDate: '1990-05-15',
      };

      const result = validatePatient(patient);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject patient without id', () => {
      const patient = {
        name: [
          {
            family: 'Silva',
            given: ['João'],
          },
        ],
      };

      const result = validatePatient(patient);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'id')).toBe(true);
    });

    it('should reject patient without name', () => {
      const patient = {
        id: 'patient-123',
        gender: 'male',
      };

      const result = validatePatient(patient);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
    });

    it('should validate gender codes', () => {
      const patient = {
        id: 'patient-123',
        name: [{ family: 'Silva' }],
        gender: 'invalid-gender',
      };

      const result = validatePatient(patient);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'gender')).toBe(true);
    });

    it('should validate telecom entries', () => {
      const patient = {
        id: 'patient-123',
        name: [{ family: 'Silva' }],
        telecom: [
          {
            system: 'email',
            value: 'joao@example.com',
          },
          {
            system: 'phone',
            value: '11999999999',
          },
        ],
      };

      const result = validatePatient(patient);

      expect(result.isValid).toBe(true);
    });

    it('should reject telecom without value', () => {
      const patient = {
        id: 'patient-123',
        name: [{ family: 'Silva' }],
        telecom: [
          {
            system: 'email',
          },
        ],
      };

      const result = validatePatient(patient);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'telecom[0].value')).toBe(true);
    });
  });

  describe('validateObservation', () => {
    it('should validate a valid observation resource', () => {
      const observation = {
        id: 'obs-123',
        status: 'final',
        code: {
          text: 'Hemoglobin',
        },
        subject: {
          reference: 'Patient/patient-123',
        },
        effectiveDateTime: '2026-01-24T10:00:00Z',
        value: {
          Quantity: {
            value: 14.5,
            unit: 'g/dL',
          },
        },
      };

      const result = validateObservation(observation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject observation without status', () => {
      const observation = {
        id: 'obs-123',
        code: { text: 'Hemoglobin' },
        subject: { reference: 'Patient/patient-123' },
      };

      const result = validateObservation(observation);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'status')).toBe(true);
    });

    it('should reject observation without subject', () => {
      const observation = {
        id: 'obs-123',
        status: 'final',
        code: { text: 'Hemoglobin' },
      };

      const result = validateObservation(observation);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'subject')).toBe(true);
    });

    it('should validate quantity values', () => {
      const observation = {
        id: 'obs-123',
        status: 'final',
        code: { text: 'Hemoglobin' },
        subject: { reference: 'Patient/patient-123' },
        value: {
          Quantity: {
            value: 'not-a-number',
            unit: 'g/dL',
          },
        },
      };

      const result = validateObservation(observation);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'value.Quantity.value')).toBe(true);
    });
  });

  describe('validateResourceStructure', () => {
    it('should validate basic FHIR resource structure', () => {
      const resource = {
        resourceType: 'Patient',
        id: 'patient-123',
      };

      const result = validateResourceStructure(resource);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object data', () => {
      const result = validateResourceStructure('not-an-object');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'root')).toBe(true);
    });

    it('should reject resource without resourceType', () => {
      const resource = {
        id: 'patient-123',
      };

      const result = validateResourceStructure(resource);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'resourceType')).toBe(true);
    });

    it('should reject resource without id', () => {
      const resource = {
        resourceType: 'Patient',
      };

      const result = validateResourceStructure(resource);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'id')).toBe(true);
    });
  });
});
