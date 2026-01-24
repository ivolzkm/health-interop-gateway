import { describe, it, expect } from 'vitest';
import { mapData, createPatientMappingConfig, createLabResultMappingConfig } from './mapping-engine';

describe('Mapping Engine', () => {
  describe('mapData - Patient', () => {
    it('should map patient data from proprietary format to FHIR', () => {
      const config = createPatientMappingConfig();
      const sourceData = {
        id: 'patient-123',
        firstName: 'João',
        lastName: 'Silva',
        dateOfBirth: '1990-05-15',
        gender: 'M',
        email: 'joao@example.com',
        phone: '11999999999',
        cpf: '12345678901',
      };

      const { data, errors } = mapData(sourceData, config);

      expect(errors).toHaveLength(0);
      expect(data.id).toBe('patient-123');
      expect(data.name).toBeDefined();
      expect((data.name as any)[0].given[0]).toBe('João');
      expect((data.name as any)[0].family).toBe('Silva');
      expect(data.gender).toBe('male');
    });

    it('should handle missing required fields', () => {
      const config = createPatientMappingConfig();
      const sourceData = {
        firstName: 'João',
        lastName: 'Silva',
      };

      const { data, errors } = mapData(sourceData, config);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.includes('Required field missing'))).toBe(true);
    });

    it('should transform gender codes correctly', () => {
      const config = createPatientMappingConfig();
      const sourceData = {
        id: 'patient-123',
        gender: 'F',
      };

      const { data, errors } = mapData(sourceData, config);

      expect(data.gender).toBe('female');
    });

    it('should handle invalid gender codes', () => {
      const config = createPatientMappingConfig();
      const sourceData = {
        id: 'patient-123',
        gender: 'X',
      };

      const { data } = mapData(sourceData, config);

      expect(data.gender).toBe('unknown');
    });
  });

  describe('mapData - Lab Result', () => {
    it('should map lab result data from proprietary format to FHIR Observation', () => {
      const config = createLabResultMappingConfig();
      const sourceData = {
        id: 'obs-456',
        patientId: 'patient-123',
        testName: 'Hemoglobin',
        result: 14.5,
        unit: 'g/dL',
        resultDate: '2026-01-24',
        status: 'final',
      };

      const { data, errors } = mapData(sourceData, config);

      expect(errors).toHaveLength(0);
      expect(data.id).toBe('obs-456');
      expect((data.subject as any).reference).toBe('Patient/patient-123');
      expect((data.code as any).text).toBe('Hemoglobin');
      expect(data.status).toBe('final');
    });

    it('should convert numeric values correctly', () => {
      const config = createLabResultMappingConfig();
      const sourceData = {
        id: 'obs-456',
        patientId: 'patient-123',
        result: '14.5',
        status: 'final',
      };

      const { data } = mapData(sourceData, config);

      expect(typeof (data.value as any)?.Quantity?.value).toBe('number');
      expect((data.value as any)?.Quantity?.value).toBe(14.5);
    });

    it('should handle status code transformation', () => {
      const config = createLabResultMappingConfig();
      const sourceData = {
        id: 'obs-456',
        status: 'preliminary',
      };

      const { data } = mapData(sourceData, config);

      expect(data.status).toBe('preliminary');
    });
  });

  describe('Error handling', () => {
    it('should collect multiple mapping errors', () => {
      const config = createPatientMappingConfig();
      const sourceData = {
        // Missing required id field
        firstName: 'João',
      };

      const { errors } = mapData(sourceData, config);

      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle date conversion errors gracefully', () => {
      const config = createPatientMappingConfig();
      const sourceData = {
        id: 'patient-123',
        dateOfBirth: 'invalid-date',
      };

      const { data, errors } = mapData(sourceData, config);

      // Should still have data but might have errors
      expect(data.id).toBe('patient-123');
    });
  });
});
