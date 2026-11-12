# FEM · Descargas de navio e Contentores

Projecto Next.js 16 (App Router + Tailwind) que funciona sozinho: os dados ficam em `data/db.json`
(criado no primeiro arranque, já com dados de exemplo).

## Correr
    npm install
    npm run dev
Abrir http://localhost:3000

## Apagar os dados de exemplo / recomeçar
    npm run reset   (e voltar a arrancar)

## O que tem
- **Descargas de navio** (`/operations`): criar/editar/eliminar/arquivar operações com plano de produtos;
  lançar/editar/eliminar camiões (descargas); pesagem cheio/vazio com leitura da balança (Web Serial, Chrome/Edge);
  alerta de tempo porto → balança (amarelo 80 min, vermelho 120 min); filtros; ticket para imprimir.
- **Contentores** (`/contentores`): CRUD, KPIs, gráficos, pesquisa e filtro por estado.

## Notas
- Armazenamento em ficheiro JSON: serve para começar e para 1 utilizador/servidor. Para produção, trocar
  `src/lib/db.ts` por Prisma + SQLite/PostgreSQL (as rotas só usam `readDb` e `mutate`).
- Ainda não há login/permissões.
- Atrelado "normal" = até 24 t estimadas, "link" = mais de 24 t (constante em `src/lib/constants.ts`).
