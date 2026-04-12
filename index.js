require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const { google } = require("googleapis");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ====== CONFIG ======
const SHEET_ID = "1q9oSEphHdXj0SopXuE1OVzIBsKlotphZEvgkxHp4doc";
const LEADS_SHEET_NAME = "Página1";
const DASHBOARD_SHEET_NAME = "Dashboard";
const SERVICE_ACCOUNT_FILE = "./service-account.json";

// Horário diário: 08:00
const DAILY_CRON = "0 8 * * *";

// ====== ADZUNA ======
const APP_ID = process.env.ADZUNA_APP_ID;
const APP_KEY = process.env.ADZUNA_APP_KEY;

// ====== FILTRO ======
const blacklist = [
  "consultoria",
  "consulting",
  "staffing",
  "outsourcing",
  "agency",
  "recruitment",
  "headhunter",
  "talent partners",
  "bpo"
];

function isInternal(company = "") {
  const name = company.toLowerCase();
  return !blacklist.some(word => name.includes(word));
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function generateEmails(domain) {
  if (!domain) return [];

  return [
    `contato@${domain}`,
    `rh@${domain}`,
    `recrutamento@${domain}`,
    `jobs@${domain}`,
    `careers@${domain}`,
    `talent@${domain}`
  ];
}

function calculateScore(job) {
  let score = 0;

  const location = (job.location || "").toLowerCase();
  const position = (job.position || "").toLowerCase();

  if (location.includes("brasil") || location.includes("brazil")) score += 30;
  if (job.website) score += 20;
  if (job.domain) score += 10;
  if (job.possibleEmails.length > 0) score += 20;
  if (location.includes(",")) score += 10;
  if (position.includes("senior")) score += 10;
  if (position.includes("manager") || position.includes("lead")) score += 10;

  return score;
}

function buildUniqueKey(job) {
  return `${job.company}||${job.position}`.toLowerCase().trim();
}

// ====== BUSCAR JOBS ======
async function fetchJobsData() {
  const response = await axios.get("https://api.adzuna.com/v1/api/jobs/br/search/1", {
    params: {
      app_id: APP_ID,
      app_key: APP_KEY,
      results_per_page: 20
    },
    timeout: 20000
  });

  const data = response.data.results || [];
  const jobs = [];
  const seen = new Set();

  for (const item of data) {
    if (!item.company?.display_name || !item.title) continue;

    const company = item.company.display_name;
    const location = item.location?.display_name || "";

    if (
      !location.toLowerCase().includes("brasil") &&
      !location.toLowerCase().includes("brazil")
    ) {
      continue;
    }

    if (!isInternal(company)) continue;

    const website = item.redirect_url || "";
    const domain = extractDomain(website);
    if (!domain) continue;

    const job = {
      company,
      position: item.title,
      location,
      link: item.redirect_url || "",
      website,
      domain,
      possibleEmails: generateEmails(domain),
      source: "Adzuna-BR",
      score: 0
    };

    job.score = calculateScore(job);

    const key = buildUniqueKey(job);
    if (seen.has(key)) continue;
    seen.add(key);

    jobs.push(job);
  }

  jobs.sort((a, b) => b.score - a.score);

  return jobs.slice(0, 20);
}

// ====== GOOGLE SHEETS ======
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const authClient = await auth.getClient();

  return google.sheets({
    version: "v4",
    auth: authClient
  });
}

async function getSpreadsheetMeta() {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID
  });

  return {
    sheets,
    allSheets: res.data.sheets || []
  };
}

async function ensureSheetExists(sheetName) {
  const { sheets, allSheets } = await getSpreadsheetMeta();

  const existing = allSheets.find(s => s.properties.title === sheetName);
  if (existing) {
    return existing.properties.sheetId;
  }

  const addRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName
            }
          }
        }
      ]
    }
  });

  return addRes.data.replies[0].addSheet.properties.sheetId;
}

async function ensureLeadsHeader() {
  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${LEADS_SHEET_NAME}!A1:L1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        "Empresa",
        "Cargo",
        "Localização",
        "Link da vaga",
        "Website",
        "Domínio",
        "Emails sugeridos",
        "Fonte",
        "Score",
        "Status",
        "Data",
        "Observações"
      ]]
    }
  });
}

async function getExistingLeads() {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${LEADS_SHEET_NAME}!A:B`
  });

  const rows = res.data.values || [];

  return new Set(
    rows
      .slice(1)
      .filter(row => row[0] && row[1])
      .map(row => `${row[0]}||${row[1]}`.toLowerCase().trim())
  );
}

function filterNewLeads(jobs, existingSet) {
  return jobs.filter(job => !existingSet.has(buildUniqueKey(job)));
}

async function pushToLeadsSheet(jobs) {
  const sheets = await getSheetsClient();

  const values = jobs.map(job => [
    job.company,
    job.position,
    job.location,
    job.link ? `=HYPERLINK("${job.link}","Ver vaga")` : "",
    job.website,
    job.domain,
    job.possibleEmails.join(", "),
    job.source,
    job.score,
    "Novo",
    new Date().toLocaleString("pt-BR"),
    ""
  ]);

  if (values.length === 0) {
    return { skipped: true };
  }

  return sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${LEADS_SHEET_NAME}!A2:L`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values
    }
  });
}

async function getLeadsRows() {
  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${LEADS_SHEET_NAME}!A2:L`
  });

  return res.data.values || [];
}

function buildDashboardMetrics(rows) {
  const total = rows.length;

  let novo = 0;
  let contatado = 0;
  let emConversa = 0;
  let fechado = 0;
  let descartado = 0;
  let scoreSum = 0;
  let comEmail = 0;
  let comDominio = 0;

  for (const row of rows) {
    const domain = row[5] || "";
    const emails = row[6] || "";
    const score = Number(row[8] || 0);
    const status = (row[9] || "").toLowerCase();

    scoreSum += score;

    if (domain) comDominio++;
    if (emails) comEmail++;

    if (status === "novo") novo++;
    else if (status === "contatado") contatado++;
    else if (status === "em conversa") emConversa++;
    else if (status === "fechado") fechado++;
    else if (status === "descartado") descartado++;
  }

  const scoreMedio = total > 0 ? (scoreSum / total).toFixed(1) : "0.0";

  return {
    total,
    novo,
    contatado,
    emConversa,
    fechado,
    descartado,
    scoreMedio,
    comEmail,
    comDominio,
    atualizadoEm: new Date().toLocaleString("pt-BR")
  };
}

async function updateDashboard(rows) {
  const sheets = await getSheetsClient();
  await ensureSheetExists(DASHBOARD_SHEET_NAME);

  const metrics = buildDashboardMetrics(rows);

  const values = [
    ["PAINEL DE LEADS", ""],
    ["Última atualização", metrics.atualizadoEm],
    ["", ""],
    ["Métrica", "Valor"],
    ["Total de leads", metrics.total],
    ["Novos", metrics.novo],
    ["Contatados", metrics.contatado],
    ["Em conversa", metrics.emConversa],
    ["Fechados", metrics.fechado],
    ["Descartados", metrics.descartado],
    ["Score médio", metrics.scoreMedio],
    ["Com domínio", metrics.comDominio],
    ["Com emails", metrics.comEmail]
  ];

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${DASHBOARD_SHEET_NAME}!A1:B30`
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${DASHBOARD_SHEET_NAME}!A1:B30`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values }
  });
}

async function applyLeadsFormatting() {
  const { sheets, allSheets } = await getSpreadsheetMeta();
  const sheet = allSheets.find(s => s.properties.title === LEADS_SHEET_NAME);
  if (!sheet) throw new Error(`A aba "${LEADS_SHEET_NAME}" não foi encontrada.`);

  const sheetId = sheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          updateSheetProperties: {
            properties: {
              sheetId,
              gridProperties: {
                frozenRowCount: 1
              }
            },
            fields: "gridProperties.frozenRowCount"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 220 },
            fields: "pixelSize"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 1, endIndex: 2 },
            properties: { pixelSize: 280 },
            fields: "pixelSize"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 2, endIndex: 3 },
            properties: { pixelSize: 180 },
            fields: "pixelSize"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 3, endIndex: 4 },
            properties: { pixelSize: 140 },
            fields: "pixelSize"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 4, endIndex: 6 },
            properties: { pixelSize: 200 },
            fields: "pixelSize"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 6, endIndex: 7 },
            properties: { pixelSize: 340 },
            fields: "pixelSize"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 7, endIndex: 12 },
            properties: { pixelSize: 140 },
            fields: "pixelSize"
          }
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 12
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.09,
                  green: 0.24,
                  blue: 0.47
                },
                horizontalAlignment: "CENTER",
                verticalAlignment: "MIDDLE",
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  fontSize: 11,
                  bold: true
                }
              }
            },
            fields: "userEnteredFormat(backgroundColor,horizontalAlignment,verticalAlignment,textFormat)"
          }
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 12
            },
            cell: {
              userEnteredFormat: {
                wrapStrategy: "WRAP",
                verticalAlignment: "MIDDLE"
              }
            },
            fields: "userEnteredFormat(wrapStrategy,verticalAlignment)"
          }
        },
        {
          setDataValidation: {
            range: {
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 9,
              endColumnIndex: 10
            },
            rule: {
              condition: {
                type: "ONE_OF_LIST",
                values: [
                  { userEnteredValue: "Novo" },
                  { userEnteredValue: "Contatado" },
                  { userEnteredValue: "Em conversa" },
                  { userEnteredValue: "Fechado" },
                  { userEnteredValue: "Descartado" }
                ]
              },
              strict: true,
              showCustomUi: true
            }
          }
        }
      ]
    }
  });
}

async function applyDashboardFormatting() {
  const { sheets, allSheets } = await getSpreadsheetMeta();
  const sheet = allSheets.find(s => s.properties.title === DASHBOARD_SHEET_NAME);
  if (!sheet) throw new Error(`A aba "${DASHBOARD_SHEET_NAME}" não foi encontrada.`);

  const sheetId = sheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
            properties: { pixelSize: 220 },
            fields: "pixelSize"
          }
        },
        {
          updateDimensionProperties: {
            range: { sheetId, dimension: "COLUMNS", startIndex: 1, endIndex: 2 },
            properties: { pixelSize: 180 },
            fields: "pixelSize"
          }
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 2
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.13,
                  green: 0.39,
                  blue: 0.29
                },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  fontSize: 14,
                  bold: true
                },
                horizontalAlignment: "CENTER"
              }
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
          }
        },
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: 3,
              endRowIndex: 4,
              startColumnIndex: 0,
              endColumnIndex: 2
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: {
                  red: 0.09,
                  green: 0.24,
                  blue: 0.47
                },
                textFormat: {
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  bold: true
                },
                horizontalAlignment: "CENTER"
              }
            },
            fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
          }
        }
      ]
    }
  });
}

// ====== PROCESSO PRINCIPAL ======
async function runDailyPipeline() {
  await ensureSheetExists(LEADS_SHEET_NAME);
  await ensureSheetExists(DASHBOARD_SHEET_NAME);

  const jobs = await fetchJobsData();
  const existingLeads = await getExistingLeads();
  const newLeads = filterNewLeads(jobs, existingLeads);

  await ensureLeadsHeader();
  await pushToLeadsSheet(newLeads);

  const allRows = await getLeadsRows();
  await updateDashboard(allRows);

  await applyLeadsFormatting();
  await applyDashboardFormatting();

  return {
    total_coletados: jobs.length,
    novos_enviados: newLeads.length,
    mensagem: newLeads.length > 0
      ? "Planilha e dashboard atualizados com sucesso"
      : "Nenhum lead novo encontrado, dashboard atualizado"
  };
}

// ====== AGENDAMENTO DIÁRIO ======
cron.schedule(DAILY_CRON, async () => {
  console.log(`[CRON] Iniciando rotina diária em ${new Date().toLocaleString("pt-BR")}`);

  try {
    const result = await runDailyPipeline();
    console.log("[CRON] Concluído:", result);
  } catch (error) {
    console.error("[CRON] Erro:", error.message);
  }
});

// ====== ROTAS ======
app.get("/", (req, res) => {
  res.send("API rodando 🚀");
});

app.get("/jobs", async (req, res) => {
  try {
    const jobs = await fetchJobsData();
    res.json({
      total: jobs.length,
      jobs
    });
  } catch (err) {
    console.error("Erro em /jobs:", err.message);
    res.status(500).json({
      error: err.message
    });
  }
});

app.get("/push-to-sheets", async (req, res) => {
  try {
    const result = await runDailyPipeline();
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    console.error("Erro em /push-to-sheets:", err.message);
    res.status(500).json({
      error: err.message
    });
  }
});

app.get("/run-now", async (req, res) => {
  try {
    const result = await runDailyPipeline();
    res.json({
      success: true,
      executado_manual: true,
      ...result
    });
  } catch (err) {
    console.error("Erro em /run-now:", err.message);
    res.status(500).json({
      error: err.message
    });
  }
});

// ====== START ======
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} 🚀`);
  console.log(`Rotina diária agendada para ${DAILY_CRON}`);
});