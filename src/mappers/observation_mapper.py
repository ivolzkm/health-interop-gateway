from fhir.resources.observation import Observation
from fhir.resources.codeableconcept import CodeableConcept

def map_temperature_to_fhir(patient_id: str, temp_value: float):
    """
    Converte um valor de temperatura comum para um recurso Observation FHIR
    no padrão exigido pela RNDS.
    """
    observation = Observation.construct()
    observation.status = "final"
    observation.category = [CodeableConcept.construct(coding=[{
        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
        "code": "vital-signs",
        "display": "Vital Signs"
    }])]
    
    # Código LOINC para temperatura corporal
    observation.code = CodeableConcept.construct(coding=[{
        "system": "http://loinc.org",
        "code": "8310-5",
        "display": "Body temperature"
    }])
    
    observation.subject = {"reference": f"Patient/{patient_id}"}
    observation.valueQuantity = {
        "value": temp_value,
        "unit": "C",
        "system": "http://unitsofmeasure.org",
        "code": "Cel"
    }
    
    return observation.json(indent=2)