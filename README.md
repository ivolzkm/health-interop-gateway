# Health Interop Gateway 🏥

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![FHIR](https://img.shields.io/badge/FHIR-R4-green.svg)](https://www.hl7.org/fhir/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Gateway de interoperabilidade em saúde que atua como ponte entre sistemas hospitalares e a Rede Nacional de Dados em Saúde (RNDS), transformando dados simples em recursos FHIR padronizados.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Características](#-características)
- [Arquitetura](#-arquitetura)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Exemplos](#-exemplos)
- [Validações](#-validações)
- [Testes](#-testes)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)
- [Roadmap](#-roadmap)
- [Licença](#-licença)

## 🎯 Visão Geral

O **Health Interop Gateway** é uma solução de interoperabilidade que facilita a integração entre sistemas de informação em saúde e a RNDS. O gateway recebe dados em formato JSON simples e os transforma automaticamente para o padrão FHIR (Fast Healthcare Interoperability Resources), garantindo conformidade com as especificações brasileiras.

### Problema que Resolve

Muitos sistemas hospitalares utilizam formatos proprietários ou simplificados para armazenamento de dados. A integração com a RNDS requer que esses dados sejam convertidos para o padrão FHIR, o que pode ser complexo e demorado. Este gateway automatiza todo esse processo.

## ✨ Características

- ✅ **Conversão Automática**: Transforma JSON simples em recursos FHIR completos
- ✅ **Validação de Identificadores**: Valida CPF, CNS e outros identificadores nacionais
- ✅ **Extensões Brasileiras**: Suporte completo para extensões obrigatórias (Raça/Cor, Etnia, etc.)
- ✅ **Conformidade RNDS**: Garante compatibilidade total com os requisitos da RNDS
- ✅ **Mapeamento Inteligente**: Mapeia automaticamente campos do sistema de origem para FHIR
- ✅ **Validação em Tempo Real**: Verifica a integridade dos dados antes do envio
- ✅ **Logs Detalhados**: Rastreabilidade completa de todas as transformações
- ✅ **Extensível**: Fácil adição de novos tipos de recursos e validações

## 🏗️ Arquitetura

```
┌─────────────────┐
│  Sistema        │
│  Hospitalar     │
└────────┬────────┘
         │ JSON Simples
         ▼
┌─────────────────┐
│  Health Interop │
│    Gateway      │
│                 │
│  1. Recebimento │
│  2. Mapeamento  │
│  3. Validação   │
│  4. Transformação│
└────────┬────────┘
         │ FHIR Bundle
         ▼
┌─────────────────┐
│      RNDS       │
│  (Rede Nacional)│
└─────────────────┘
```

### Fluxo de Dados

1. **Input**: Recebe JSON simplificado do sistema hospitalar
2. **Mapping**: Mapeia campos para estruturas FHIR usando `fhir.resources`
3. **Validation**: Valida identificadores (CPF/CNS) e campos obrigatórios
4. **Enrichment**: Adiciona extensões obrigatórias brasileiras
5. **Output**: Gera Bundle FHIR pronto para envio à RNDS

## 📦 Pré-requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)
- Conexão com internet (para envio à RNDS)
- Credenciais de acesso à RNDS (para produção)

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/ivolzkm/health-interop-gateway.git
cd health-interop-gateway
```

### 2. Crie um Ambiente Virtual (Recomendado)

```bash
# No Linux/Mac
python3 -m venv venv
source venv/bin/activate

# No Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Instale as Dependências

```bash
pip install -r requirements.txt
```

### 4. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Ambiente (development/production)
ENVIRONMENT=development

# Credenciais RNDS (obter no portal da RNDS)
RNDS_CLIENT_ID=seu_client_id
RNDS_CLIENT_SECRET=seu_client_secret
RNDS_ENDPOINT=https://ehr-services.saude.gov.br/api/fhir/r4

# Logs
LOG_LEVEL=INFO
LOG_FILE=logs/gateway.log
```

## 💻 Uso

### Uso Básico

```python
from src.gateway import HealthInteropGateway

# Inicializar o gateway
gateway = HealthInteropGateway()

# Dados de entrada do sistema hospitalar
patient_data = {
    "nome": "João da Silva",
    "cpf": "123.456.789-00",
    "data_nascimento": "1980-05-15",
    "sexo": "M",
    "temperatura": 37.5,
    "pressao_arterial": "120/80"
}

# Processar e enviar para RNDS
result = gateway.process(patient_data)

if result.success:
    print(f"Dados enviados com sucesso! ID: {result.bundle_id}")
else:
    print(f"Erro: {result.error_message}")
```

### Via API REST (se implementado)

```bash
curl -X POST http://localhost:8000/api/v1/process \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Maria Santos",
    "cpf": "987.654.321-00",
    "temperatura": 36.8
  }'
```

### Via Linha de Comando

```bash
python -m src.cli --input examples/patient_simple.json --output output/fhir_bundle.json
```

## 📁 Estrutura do Projeto

```
health-interop-gateway/
│
├── src/                          # Código fonte principal
│   ├── __init__.py
│   ├── gateway.py               # Classe principal do gateway
│   ├── mappers/                 # Mapeadores JSON → FHIR
│   │   ├── patient_mapper.py
│   │   ├── observation_mapper.py
│   │   └── ...
│   ├── validators/              # Validadores de dados
│   │   ├── cpf_validator.py
│   │   ├── cns_validator.py
│   │   └── ...
│   ├── extensions/              # Extensões brasileiras FHIR
│   │   ├── race_color.py
│   │   ├── ethnicity.py
│   │   └── ...
│   ├── rnds/                    # Integração com RNDS
│   │   ├── client.py
│   │   ├── auth.py
│   │   └── ...
│   └── utils/                   # Utilitários
│       ├── logger.py
│       └── config.py
│
├── tests/                       # Testes automatizados
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── examples/                    # Exemplos de uso
│   ├── patient_simple.json
│   ├── observation_simple.json
│   └── complete_workflow.py
│
├── docs/                        # Documentação
│   ├── api.md
│   ├── mappers.md
│   ├── extensions.md
│   └── deployment.md
│
├── .env.example                 # Exemplo de configuração
├── .gitignore
├── requirements.txt             # Dependências Python
├── setup.py                     # Configuração de instalação
└── README.md
```

## 📚 Exemplos

### Exemplo 1: Paciente Simples

**Entrada (JSON do hospital):**
```json
{
  "nome": "Ana Oliveira",
  "cpf": "111.222.333-44",
  "data_nascimento": "1995-03-20",
  "sexo": "F",
  "raca_cor": "parda",
  "telefone": "(11) 98765-4321",
  "email": "ana@email.com"
}
```

**Saída (FHIR Bundle):**
```json
{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "identifier": [
          {
            "system": "http://www.saude.gov.br/fhir/r4/NamingSystem/cpf",
            "value": "11122233344"
          }
        ],
        "name": [
          {
            "use": "official",
            "text": "Ana Oliveira"
          }
        ],
        "gender": "female",
        "birthDate": "1995-03-20",
        "extension": [
          {
            "url": "http://www.saude.gov.br/fhir/r4/StructureDefinition/BRRacaCor",
            "valueCodeableConcept": {
              "coding": [
                {
                  "system": "http://www.saude.gov.br/fhir/r4/CodeSystem/BRRacaCor",
                  "code": "03",
                  "display": "Parda"
                }
              ]
            }
          }
        ],
        "telecom": [
          {
            "system": "phone",
            "value": "11987654321"
          },
          {
            "system": "email",
            "value": "ana@email.com"
          }
        ]
      }
    }
  ]
}
```

### Exemplo 2: Observação de Sinais Vitais

Veja mais exemplos na pasta [`examples/`](examples/)

## ✅ Validações

O gateway realiza as seguintes validações:

### Identificadores
- ✓ CPF: Validação de dígitos verificadores e formatação
- ✓ CNS: Validação segundo algoritmo do Cartão Nacional de Saúde
- ✓ CNH, RG, Passaporte: Validação de formato

### Campos Obrigatórios
- ✓ Nome completo do paciente
- ✓ Data de nascimento
- ✓ Sexo/Gênero
- ✓ Ao menos um identificador válido

### Extensões Brasileiras
- ✓ Raça/Cor (obrigatória)
- ✓ Etnia Indígena (quando aplicável)
- ✓ Naturalidade
- ✓ Nacionalidade

### Dados Clínicos
- ✓ Unidades de medida (UCUM)
- ✓ Códigos LOINC para observações
- ✓ Códigos CID-10 para diagnósticos

## 🧪 Testes

### Executar Todos os Testes

```bash
pytest tests/
```

### Testes Unitários

```bash
pytest tests/unit/
```

### Testes de Integração

```bash
pytest tests/integration/
```

### Cobertura de Testes

```bash
pytest --cov=src tests/
```

### Executar Testes Específicos

```bash
pytest tests/unit/test_validators.py::test_cpf_validation
```

## 📖 Documentação

Documentação adicional disponível em:

- [Guia de Mapeamento](docs/mappers.md) - Como mapear novos recursos
- [Extensões FHIR](docs/extensions.md) - Detalhes sobre extensões brasileiras
- [API Reference](docs/api.md) - Documentação completa da API
- [Deploy](docs/deployment.md) - Guia de implantação

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Diretrizes

- Escreva testes para novas funcionalidades
- Mantenha a cobertura de testes acima de 80%
- Siga o PEP 8 para código Python
- Documente todas as funções públicas
- Atualize o README quando necessário

## 🗺️ Roadmap

### v1.0 (Atual)
- [x] Mapeamento básico de Patient
- [x] Validação de CPF/CNS
- [x] Extensões brasileiras obrigatórias
- [x] Geração de Bundle FHIR

### v1.1 (Próxima)
- [ ] Suporte para Observations (sinais vitais)
- [ ] Integração completa com RNDS (autenticação)
- [ ] API REST para recebimento de dados
- [ ] Dashboard de monitoramento

### v2.0 (Futuro)
- [ ] Suporte para outros recursos FHIR
  - [ ] Procedure
  - [ ] MedicationRequest
  - [ ] Condition (diagnósticos)
  - [ ] Encounter (atendimentos)
- [ ] Fila de processamento assíncrono
- [ ] Interface web para configuração
- [ ] Suporte a HL7 v2 como entrada
- [ ] Webhooks para notificações

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Ivo Ricardo Lozekam Junior** - *Desenvolvimento Inicial* - [@ivolzkm](https://github.com/ivolzkm)

## 🙏 Agradecimentos

- Ministério da Saúde pela documentação da RNDS
- Comunidade FHIR Brasil
- HL7 Brasil
- Contribuidores do projeto `fhir.resources`

## 📞 Suporte

- 📧 Email: [seu-email@exemplo.com]
- 🐛 Issues: [GitHub Issues](https://github.com/ivolzkm/health-interop-gateway/issues)
- 💬 Discussões: [GitHub Discussions](https://github.com/ivolzkm/health-interop-gateway/discussions)

## 🔗 Links Úteis

- [RNDS - Rede Nacional de Dados em Saúde](https://rnds.saude.gov.br/)
- [FHIR R4 Specification](https://www.hl7.org/fhir/)
- [FHIR Brasil (Perfis Nacionais)](http://www.saude.gov.br/fhir/)
- [HL7 Brasil](https://hl7.org.br/)

---

**⚕️ Desenvolvido com ❤️ para melhorar a interoperabilidade em saúde no Brasil**
