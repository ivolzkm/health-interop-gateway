# Health Interoperability Gateway - TODO

## Backend - Núcleo do Gateway
- [x] Definir schema do banco de dados (mapeamentos, mensagens, configurações)
- [x] Implementar motor de mapeamento de dados (de-para)
- [x] Criar API REST para receber e processar mensagens
- [x] Implementar validação de FHIR R4
- [ ] Criar sistema de fila para processamento assíncrono

## Backend - Segurança e Conformidade
- [x] Implementar criptografia AES-256 em repouso
- [x] Configurar OAuth2 com tokens de curta duração
- [x] Implementar logs de auditoria LGPD-compliant
- [x] Criar sistema de rastreamento de acesso (quem, o quê, quando)
- [x] Implementar tratamento de erros de validação

## Frontend - Dashboard Administrativo
- [x] Criar layout do dashboard
- [x] Implementar página de status de integrações
- [x] Criar visualização de volume de mensagens processadas
- [x] Implementar sistema de alertas
- [x] Criar painel de logs de erros para suporte técnico
- [ ] Implementar gerenciamento de mapeamentos por cliente

## Testes e Validação
- [x] Testes unitários do motor de mapeamento
- [x] Testes unitários do validador FHIR
- [ ] Testes de integração da API
- [ ] Testes de segurança e criptografia
- [ ] Validação de conformidade LGPD
- [ ] Testes de performance

## Entrega
- [ ] Documentação completa
- [ ] Guia de deployment
- [ ] Exemplos de uso
