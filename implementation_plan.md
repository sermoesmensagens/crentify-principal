# Goal Description

Aprimorar o módulo `Academy` para organizar as aulas em "Semanas" e "Dias". Isso permite que o usuário tenha um roteiro claro de estudos de segunda a domingo (ou quantos dias a semana tiver). Além disso, a visualização interna das aulas será reformulada para exibir as "Tarefas" (Recursos) com botões de "Ver" individuais, e um sistema de conclusão (checkboxes) por tarefa. O novo layout de exibição utilizará o formato Acordeão (blocos de semana verticais que se expandem), pois é a melhor abordagem para responsividade no mobile (mantendo a elegância e simplicidade).

## User Review Required

> [!IMPORTANT]
> A estrutura de navegação mudará. Ao clicar em um curso, os alunos verão as **Semanas** listadas. Ao clicar em uma Semana, ela se expande listando os **Dias**, e dentro de cada dia teremos as **Tarefas** (Leitura, Vídeo, etc.).
> As anotações agora serão fixadas por **Tarefa** (na modal de "Ver"). 

## Proposed Changes

---
### 1. Types & Data Models (`types.ts`)

#### [MODIFY] `types.ts`
- Alterar `AcademyContent` para incluir `week` (Semana) e `day` (Dia). 
- Alterar `AcademyResource` para adicionar os campos `duration` (Ex: "15 min", "1 capítulo") e suporte para anotações per-resource, se necessário.
- Atualizar a tipagem de progresso para rastrear a conclusão pelo `.id` do *Recurso* e não apenas da aula inteira.

---
### 2. Painel de Administração (`AdminPanel.tsx`)

#### [MODIFY] `components/AdminPanel.tsx`
- Na aba "Aulas", ao criar uma nova "Aula" (que agora passa a ser o Bloco de um Dia), o administrador poderá digitar ou selecionar a **Semana** (Ex: 1, 2, 3) e o **Dia da Semana** (Segunda, Terça, etc.).
- Na adição de *Recursos*, será possível adicionar a estimativa de tempo/tamanho (ex: `15 min`) para gerar a "badge" solicitada no print de exemplo.

---
### 3. Visualização do Curso (`Academy.tsx`)

#### [MODIFY] `components/Academy.tsx`
- **Agrupamento por Semana**: Vamos pegar todas as aulas de um Curso e agrupá-las por `week`.
- **Layout em Acordeão (Opção 2 escolhida)**: Serão renderizados blocos para "Semana 1", "Semana 2", etc. Ao clicar no bloco, ele desliza para baixo relevando os Dias (`day`).
- **Lista de Tarefas por Dia**: Dentro do Dia, em vez de um único botão de "Concluir Aula", renderizaremos uma lista horizontal de *Recursos* com um "Checkbox" à esquerda e um botão "Ver" à direita, similar aos prints enviados.
- **Modal de Tarefa ("Ver")**: Ao clicar em "Ver", abrirá uma modal focada no recurso contendo:
  1. Conteúdo da Tarefa (Texto, Vídeo ou Instruções de Leitura).
  2. Área de anotações ("Suas Anotações").
  3. Botão grande inferir "CONCLUIR EXERCÍCIO / TAREFA", que fechará a modal e marcará a bolinha de concluído.

## Open Questions

> [!WARNING]
> 1. Os nomes das semanas no admin podem ser textos livres (ex: "Semana 1 - Fundamentos") ou apenas número (ex: "1")? Deixarei como texto livre para maior flexibilidade.
> 2. O botão de cronômetro ("00:00 INICIAR") mostrado no segundo print é fundamental para o seu uso ou posso suprimir e focar em entregar o vídeo/leitura e as anotações num formato mais clássico e bonito? (No plano, manterei tudo limpo sem cronômetro, a menos que solicite).

## Verification Plan

### Manual Verification
- Acessar o `Admin` > Criar um Curso > Adicionar uma Aula na "Semana 1" -> "Segunda-feira". Adicionar 2 recursos (1 Vídeo, 1 Leitura).
- Acessar o `Academy` logado como usuário comum > Entrar no novo curso > Clicar na "Semana 1", expandir, visualizar as tarefas listadas com badges de tempo, clicar em "Ver", assistir/ler, escrever anotações, e marcar como concluído. Verificar se a barra de progresso avança adequadamente.
