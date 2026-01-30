# Health Interop Gateway

Este projeto atua como um gateway de interoperabilidade na saúde, recebendo dados em formato JSON, transformando-os para o padrão FHIR e encaminhando-os para os sistemas de destino, como a RNDS.

## Fluxo Lógico

1.  **Input**: O gateway recebe um JSON simples de um sistema de hospital (ex: nome, CPF, temperatura).
2.  **Mapping**: O código utiliza a biblioteca `fhir.resources` para construir o objeto FHIR em conformidade com o padrão brasileiro.
3.  **Validation**: O código verifica a validade de identificadores como CPF/CNS e garante a presença de extensões obrigatórias, como a de Raça/Cor.
4.  **Output**: O sistema envia o resultado para a RNDS ou, como alternativa, retorna o Bundle FHIR pronto para consumo.
