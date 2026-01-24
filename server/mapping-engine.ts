/**
 * Data Mapping Engine
 * Transforms proprietary healthcare data formats to HL7 FHIR R4 standard
 */

interface MappingRule {
  source: string;
  target: string;
  type?: string;
  transform?: (value: unknown) => unknown;
  required?: boolean;
}

interface MappingConfig {
  sourceFormat: string;
  targetFormat: string;
  rules: MappingRule[];
  customTransforms?: Record<string, (value: unknown) => unknown>;
}

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let value: unknown = obj;

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * Sets a nested value in an object using dot notation
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop();

  if (!lastKey) return;

  let current: Record<string, unknown> = obj;

  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[lastKey] = value;
}

/**
 * Converts value based on specified type
 */
function convertValue(value: unknown, targetType?: string): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  switch (targetType) {
    case 'string':
      return String(value);
    case 'number':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'date':
      if (value instanceof Date) {
        return value.toISOString();
      }
      return new Date(String(value)).toISOString();
    case 'code':
      return String(value);
    default:
      return value;
  }
}

/**
 * Validates that required fields are present in source data
 */
function validateRequiredFields(sourceData: Record<string, unknown>, rules: MappingRule[]): string[] {
  const errors: string[] = [];

  for (const rule of rules) {
    if (rule.required) {
      const value = getNestedValue(sourceData, rule.source);
      if (value === null || value === undefined || value === '') {
        errors.push(`Required field missing: ${rule.source}`);
      }
    }
  }

  return errors;
}

/**
 * Maps data from source format to target FHIR format
 */
export function mapData(
  sourceData: Record<string, unknown>,
  mappingConfig: MappingConfig
): { data: Record<string, unknown>; errors: string[] } {
  const errors: string[] = [];
  const targetData: Record<string, unknown> = {};

  const validationErrors = validateRequiredFields(sourceData, mappingConfig.rules);
  errors.push(...validationErrors);

  for (const rule of mappingConfig.rules) {
    try {
      let value = getNestedValue(sourceData, rule.source);

      if (value !== undefined && value !== null) {
        if (rule.transform) {
          value = rule.transform(value);
        } else if (mappingConfig.customTransforms?.[rule.source]) {
          value = mappingConfig.customTransforms[rule.source](value);
        }

        value = convertValue(value, rule.type);
        setNestedValue(targetData, rule.target, value);
      }
    } catch (error) {
      errors.push(`Error mapping field ${rule.source}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { data: targetData, errors };
}

/**
 * Creates a mapping configuration for Patient data
 */
export function createPatientMappingConfig(): MappingConfig {
  return {
    sourceFormat: 'proprietary_patient',
    targetFormat: 'fhir_r4_patient',
    rules: [
      {
        source: 'id',
        target: 'id',
        type: 'string',
        required: true,
      },
      {
        source: 'firstName',
        target: 'name.0.given.0',
        type: 'string',
      },
      {
        source: 'lastName',
        target: 'name.0.family',
        type: 'string',
      },
      {
        source: 'dateOfBirth',
        target: 'birthDate',
        type: 'date',
      },
      {
        source: 'gender',
        target: 'gender',
        type: 'code',
        transform: (value: unknown) => {
          const genderMap: Record<string, string> = {
            'M': 'male',
            'F': 'female',
            'O': 'other',
            'U': 'unknown',
          };
          return genderMap[String(value).toUpperCase()] || 'unknown';
        },
      },
      {
        source: 'email',
        target: 'telecom.0.value',
        type: 'string',
      },
      {
        source: 'phone',
        target: 'telecom.1.value',
        type: 'string',
      },
      {
        source: 'cpf',
        target: 'identifier.0.value',
        type: 'string',
      },
    ],
  };
}

/**
 * Creates a mapping configuration for Lab Result data
 */
export function createLabResultMappingConfig(): MappingConfig {
  return {
    sourceFormat: 'proprietary_lab_result',
    targetFormat: 'fhir_r4_observation',
    rules: [
      {
        source: 'id',
        target: 'id',
        type: 'string',
        required: true,
      },
      {
        source: 'patientId',
        target: 'subject.reference',
        type: 'string',
        transform: (value: unknown) => `Patient/${value}`,
      },
      {
        source: 'testName',
        target: 'code.text',
        type: 'string',
      },
      {
        source: 'result',
        target: 'value.Quantity.value',
        type: 'number',
      },
      {
        source: 'unit',
        target: 'value.Quantity.unit',
        type: 'string',
      },
      {
        source: 'resultDate',
        target: 'effectiveDateTime',
        type: 'date',
      },
      {
        source: 'status',
        target: 'status',
        type: 'code',
        transform: (value: unknown) => {
          const statusMap: Record<string, string> = {
            'final': 'final',
            'preliminary': 'preliminary',
            'amended': 'amended',
            'cancelled': 'cancelled',
          };
          return statusMap[String(value).toLowerCase()] || 'unknown';
        },
      },
    ],
  };
}
