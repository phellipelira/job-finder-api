# Job Leads SaaS

Sistema de prospecção de vagas no Brasil: coleta via **Adzuna**, processamento, deduplicação, score de lead, domínio e e-mail sugeridos, API REST e dashboard em React.

## Estrutura

- `backend/` — Node.js, Express, Prisma, PostgreSQL, Axios, node-cron
- `frontend/` — React, Vite, Tailwind CSS, Recharts

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Conta [Adzuna API](https://developer.adzuna.com/) (app id e app key)

## Configuração do backend

1. Copie o ambiente: `cd backend` e copie `.env.example` para `.env`.
2. Edite `backend/.env`: `DATABASE_URL`, `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, `CRON_SCHEDULE` (padrão: a cada 6 horas), `MAX_PAGES_PER_RUN`.
3. **`CORS_ORIGIN`**: em produção, liste as origens do frontend separadas por vírgula (ex.: `https://app.seudominio.com`). Sem isso, o navegador não recebe cabeçalhos CORS em origens cruzadas. Em desenvolvimento, com valor vazio, são aceitos apenas `http(s)://localhost` e `127.0.0.1` (qualquer porta).
4. `npm install` e `npx prisma migrate dev` (ou `db push`).
5. `npm run dev` — API em `http://localhost:4000`.

### Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Saúde do serviço |
| GET | `/api/dashboard` | Métricas e distribuição de score |
| GET | `/api/jobs` | Lista (`page`, `limit`, `q`, `minScore`) |
| POST | `/api/jobs/update` | Sincroniza com a Adzuna (Brasil) |

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Interface em `http://localhost:5173` (proxy para a API em `localhost:4000`). Em produção, defina `VITE_API_URL` e faça `npm run build`.

## Licença

ISC
