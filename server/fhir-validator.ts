/**
 * FHIR R4 Validator
 * Validates healthcare data against FHIR R4 standard
 */

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a Patient resource against FHIR R4
 */
export function validatePatient(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.id || typeof data.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'Patient ID is required and must be a string',
      severity: 'error',
    });
  }

  if (!data.name || !Array.isArray(data.name) || data.name.length === 0) {
    errors.push({
      field: 'name',
      message: 'At least one name is required',
      severity: 'error',
    });
  } else {
    for (let i = 0; i < data.name.length; i++) {
      const name = data.name[i] as Record<string, unknown>;
      if (!name.family && !name.given) {
        errors.push({
          field: `name[${i}]`,
          message: 'Name must have either family or given name',
          severity: 'error',
        });
      }
    }
  }

  if (data.birthDate && typeof data.birthDate !== 'string') {
    errors.push({
      field: 'birthDate',
      message: 'Birth date must be a string in YYYY-MM-DD format',
      severity: 'error',
    });
  }

  if (data.gender && !['male', 'female', 'other', 'unknown'].includes(String(data.gender))) {
    errors.push({
      field: 'gender',
      message: 'Gender must be one of: male, female, other, unknown',
      severity: 'error',
    });
  }

  if (data.telecom && Array.isArray(data.telecom)) {
    for (let i = 0; i < data.telecom.length; i++) {
      const telecom = data.telecom[i] as Record<string, unknown>;
      if (!telecom.value || typeof telecom.value !== 'string') {
        errors.push({
          field: `telecom[${i}].value`,
          message: 'Telecom value is required and must be a string',
          severity: 'error',
        });
      }
      if (telecom.system && !['phone', 'fax', 'email', 'pager', 'url', 'sms', 'other'].includes(String(telecom.system))) {
        errors.push({
          field: `telecom[${i}].system`,
          message: 'Invalid telecom system',
          severity: 'warning',
        });
      }
    }
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Validates an Observation resource against FHIR R4
 */
export function validateObservation(data: Record<string, unknown>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.id || typeof data.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'Observation ID is required and must be a string',
      severity: 'error',
    });
  }

  if (!data.status || !['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'].includes(String(data.status))) {
    errors.push({
      field: 'status',
      message: 'Status is required and must be a valid FHIR code',
      severity: 'error',
    });
  }

  if (!data.code) {
    errors.push({
      field: 'code',
      message: 'Code is required',
      severity: 'error',
    });
  }

  if (!data.subject) {
    errors.push({
      field: 'subject',
      message: 'Subject (patient reference) is required',
      severity: 'error',
    });
  }

  if (data.effectiveDateTime && typeof data.effectiveDateTime !== 'string') {
    errors.push({
      field: 'effectiveDateTime',
      message: 'Effective date time must be a string in ISO 8601 format',
      severity: 'error',
    });
  }

  if (data.value) {
    const value = data.value as Record<string, unknown>;
    if (value.Quantity) {
      const quantity = value.Quantity as Record<string, unknown>;
      if (quantity.value && typeof quantity.value !== 'number') {
        errors.push({
          field: 'value.Quantity.value',
          message: 'Quantity value must be a number',
          severity: 'error',
        });
      }
    }
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
  };
}

/**
 * Generic FHIR resource validator
 */
export function validateFhirResource(
  resourceType: string,
  data: Record<string, unknown>
): ValidationResult {
  switch (resourceType) {
    case 'Patient':
      return validatePatient(data);
    case 'Observation':
      return validateObservation(data);
    default:
      return {
        isValid: true,
        errors: [],
      };
  }
}

/**
 * Validates the structure of a FHIR resource
 */
export function validateResourceStructure(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Data must be a valid JSON object',
      severity: 'error',
    });
    return { isValid: false, errors };
  }

  const resource = data as Record<string, unknown>;

  if (!resource.resourceType || typeof resource.resourceType !== 'string') {
    errors.push({
      field: 'resourceType',
      message: 'resourceType is required and must be a string',
      severity: 'error',
    });
  }

  if (!resource.id || typeof resource.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'id is required and must be a string',
      severity: 'error',
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
