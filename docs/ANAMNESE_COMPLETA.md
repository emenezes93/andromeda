# Anamnese Completa – Questionário

O questionário **Anamnese Completa** foi gerado a partir do documento `docs/anamnese_completa.docx` (Nutrição & Personal Training) e registrado como template no seed do projeto.

## Onde está definido

- **Fonte original:** `docs/anamnese_completa.docx`
- **Schema do questionário:** `prisma/seed-data/anamnese-completa.ts`
- **Registro no banco:** o seed (`npm run prisma:seed`) cria o template "Anamnese Completa" para o tenant demo quando não existir.

## Estrutura do questionário (blocos)

1. **Identificação pessoal** – nome, nascimento, idade, CPF/RG, telefone, e-mail, endereço, cidade, profissão, estado civil, com quem mora, nº de filhos  
2. **Dados antropométricos** – peso, altura, IMC, circunferências (abdominal, quadril, pescoço, coxa, braço), % gordura, massa muscular  
3. **Objetivos e motivação** – objetivo principal, descrição, motivação, tentativas anteriores  
4. **Histórico de saúde** – doenças diagnosticadas (múltipla escolha), outras doenças, cirurgias, histórico familiar  
5. **Medicamentos e suplementos** – uso contínuo, suplementos, exames recentes  
6. **Hábitos alimentares** – refeições/dia, horários, preferências, aversões, alergias, restrições, líquidos, álcool, comportamento (ritmo, TV, compulsão, ansiedade, beliscos, dia típico)  
7. **Atividade física** – nível, modalidades, horário, local, dor/limitação, lesões  
8. **Sono e recuperação** – horas, horário dormir/acordar, insônia, acorda à noite, descansado, medicamentos para dormir, plantão noturno  
9. **Saúde mental e estresse** – nível 0–10, estresse intenso, ansiedade/depressão, acompanhamento, impacto na alimentação  
10. **Saúde digestiva** – refluxo/gastrite, SII, constipação, diarreia, gases, exames, frequência evacuação, Bristol  
11. **Saúde hormonal** – ciclo menstrual, anticoncepcional, gestante, menopausa, reposição; (homens) testosterona, TRT, esteroides  
12. **Rotina e estilo de vida** – horários, turno, presencial/remoto, rotina típica, esforço físico, tempo sentado, lazer, dificuldades  
13. **Outras informações** – fumante, drogas recreativas, tatuagens, renda para alimentação, outras informações  

## Uso

- Na aplicação, ao criar uma **nova sessão**, escolha o template **"Anamnese Completa"** para aplicar este questionário.
- As respostas são salvas na sessão e podem ser usadas para **insights** (IA/regras) e para preenchimento de **cadastro/evolução** do paciente quando houver integração com o módulo de pacientes.
