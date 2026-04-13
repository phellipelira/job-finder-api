# Job Leads SaaS

Sistema de prospecção de vagas no Brasil com coleta automática, enriquecimento de dados e dashboard profissional.

## Stack

### Backend
- Node.js + Express
- Prisma ORM + PostgreSQL
- Axios (coleta com retry/timeout)
- node-cron

### Frontend
- React + Vite
- Tailwind CSS
- Recharts

## Estrutura

```txt
backend/
  src/
    config/
    controllers/
    routes/
    services/
    collectors/
    utils/
    middleware/
    app.js
    server.js
    cron.js
  prisma/
    schema.prisma

frontend/
  src/
    components/
    pages/
    services/
    hooks/
    App.jsx
```

## Funcionalidades

- Busca automática de vagas no Brasil (Adzuna)
- Paginação por múltiplas páginas com limite de segurança
- Deduplicação por `[source + redirectUrl]`
- Normalização e limpeza dos dados
- Detecção de remoto
- Sugestão de domínio e e-mail corporativo
- Cálculo de score de lead (0 a 100)
- API REST + dashboard com métricas e filtros
- Atualização manual e automática (cron a cada 6 horas)

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/api/dashboard` | Métricas e gráfico de score |
| GET | `/api/jobs` | Lista paginada (`page`, `limit`, `q`, `minScore`) |
| POST | `/api/jobs/update` | Força sincronização de vagas |

## Configuração

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Backend padrão: `http://localhost:4000`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend padrão: `http://localhost:5173`

## Variáveis de ambiente (backend)

Use o arquivo `backend/.env.example` como base.

Obrigatórias para sincronizar vagas:
- `DATABASE_URL`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`

Importantes para produção:
- `CORS_ORIGIN` (origens separadas por vírgula)
- `CRON_ENABLED`
- `CRON_SCHEDULE` (padrão: `0 */6 * * *`)
- `MAX_PAGES_PER_RUN`
- `RESULTS_PER_PAGE`

## Build de produção

```bash
cd frontend && npm run build
cd ../backend && npm start
```

## Observações de produção

- O servidor encerra com shutdown gracioso (`SIGINT`/`SIGTERM`) e desconecta o Prisma.
- O cron só inicia quando `CRON_ENABLED=true` e credenciais Adzuna estão configuradas.
- A coleta usa timeout e retries para maior resiliência.

## Licença

ISC
