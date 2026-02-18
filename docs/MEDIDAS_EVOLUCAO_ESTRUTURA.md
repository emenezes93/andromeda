# Medidas & Evolução – Estrutura para cadastro e anamnese

Documento que define os dados de **Medidas e Evolução** do paciente, para cadastro completo, anamnese e insights. Baseado em práticas clínicas (nutrição, medicina, saúde).

---

## 1. Cadastro do paciente (identificação e dados iniciais)

| Campo | Tipo | Uso na anamnese / insights |
|-------|------|----------------------------|
| **Nome completo** | texto | Identificação em sessões e relatórios |
| **Data de nascimento** | data | Idade; faixas etárias nos insights |
| **Sexo / Gênero** | enum (M/F/Outro/Prefiro não informar) | Análise por perfil; IMC por sexo |
| **CPF** | texto (opcional) | Identificação única |
| **E-mail** | texto | Contato; lemretes |
| **Telefone** | texto | Contato; WhatsApp |
| **Profissão / Ocupação** | texto | Contexto de estilo de vida |
| **Objetivo principal** | texto ou opções | Meta (perda de peso, ganho de massa, saúde) → insights |
| **Queixa principal** | texto | Foco do acompanhamento → anamnese |
| **Observações** | texto longo | Anotações livres |

---

## 2. Medidas antropométricas e sinais vitais

Cada **registro de evolução** (uma data) pode conter:

### Antropometria
| Campo | Unidade | Uso |
|-------|---------|-----|
| Peso | kg | IMC; tendência; risco |
| Altura | cm | IMC (fixo ou por registro) |
| IMC | calculado (peso/altura²) | Classificação (baixo peso, normal, sobrepeso, obesidade) |
| Circunferência de cintura | cm | Risco cardiovascular |
| Circunferência de quadril | cm | RCQ |
| RCQ (cintura/quadril) | calculado | Risco metabólico |
| Percentual de gordura | % | Opcional (bioimpedância) |
| Massa magra | kg | Opcional |

### Sinais vitais
| Campo | Unidade | Uso |
|-------|---------|-----|
| Pressão arterial (sistólica/diastólica) | mmHg | Hipertensão; risco |
| Frequência cardíaca | bpm | Condicionamento; repouso |

### Evolução
| Campo | Uso |
|-------|-----|
| Data do registro | Ordenação; gráficos de evolução |
| Observações da consulta | Anotações daquele dia |

---

## 3. Uso na anamnese (questionários)

Perguntas que podem ser incluídas nos templates, alinhadas a Medidas & Evolução:

- **Objetivo principal com o programa:** Perda de peso, Ganho de massa, Melhorar saúde, Performance, Outro.
- **Queixa principal:** texto livre.
- **Peso atual (kg):** número.
- **Altura (cm):** número.
- **Circunferência da cintura (cm):** número (opcional).
- **Prática de atividade física:** frequência e tipo.
- **Medicamentos em uso:** sim/não + quais.
- **Condições de saúde:** texto (diabetes, HAS, etc.).
- **Como você avalia sua disposição (1–10):** número (para insights de readiness).

Essas respostas podem ser usadas para **preencher automaticamente** o cadastro ou a primeira ficha de evolução quando o paciente já estiver cadastrado.

---

## 4. Uso nos insights (IA / regras)

- **Riscos:** IMC, RCQ, PA fora da faixa → alertas e recomendações.
- **Evolução:** tendência de peso (subiu/desceu/manteve) → sugestões de conduta.
- **Readiness / adesão:** sono, estresse, alimentação emocional (já no modelo atual) + dados de evolução (comparecimento, metas).
- **Resumo narrativo:** incluir “objetivo”, “queixa” e “últimas medidas” no texto do insight.

---

## 5. Modelo de dados no sistema (Prisma)

- **Patient:** cadastro (nome, nascimento, sexo, contato, objetivo, queixa, observações).
- **PatientEvolution:** registros ao longo do tempo (data, peso, altura, IMC, cintura, quadril, PA, FC, observações).
- **AnamnesisSession:** pode vincular a `patientId` (além de `subjectId` opcional) para associar sessões ao cadastro.
- **AiInsight:** já existe; pode ser enriquecido com dados do paciente/evolução quando disponíveis.

---

## 6. Fluxo sugerido

1. **Cadastro do paciente** (novo formulário) → cria `Patient`.
2. **Primeira avaliação** → cria primeiro `PatientEvolution` com medidas iniciais.
3. **Nova sessão de anamnese** → seleciona paciente (ou “anonimo”) e template; preenche questionário.
4. **Consultas de retorno** → novo registro em `PatientEvolution` (medidas + observações).
5. **Insights** → gerados por sessão; podem considerar histórico do paciente quando houver `patientId`.

---

## 7. Template de anamnese “Medidas & Evolução”

O seed do projeto inclui um template **Medidas & Evolução** com as seguintes perguntas (para uso na anamnese e posterior cadastro/evolução):

- Objetivo principal (perda de peso, ganho de massa, melhorar saúde, performance, outro)
- Queixa principal (texto livre)
- Peso atual (kg) e altura (cm)
- Circunferência da cintura e do quadril (cm)
- Pressão arterial (sistólica e diastólica) e frequência cardíaca (bpm)
- Frequência de atividade física
- Medicamentos e condições de saúde
- Disposição (1–10)

As respostas podem ser usadas para preencher o cadastro do paciente e o primeiro registro de evolução quando a API de pacientes estiver implementada.

---

Se você tiver o conteúdo do PDF “Medidas & Evolução” (texto ou tabelas), podemos ajustar esta estrutura para refletir exatamente os campos do formulário que você usa.
