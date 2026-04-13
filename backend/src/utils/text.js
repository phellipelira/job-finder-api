export function normalizeText(input) {
  if (input == null) return "";
  return String(input)
    .replace(/\s+/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

const REMOTE_PATTERNS = [
  /\bremoto\b/i,
  /\bremote\b/i,
  /\bhome\s*office\b/i,
  /\bh[ií]brido\b/i,
  /\bhybrid\b/i,
  /\btrabalho\s*h[ií]brido\b/i,
  /\b100%\s*remoto\b/i,
];

export function detectRemote(title, description) {
  const blob = `${title || ""} ${description || ""}`;
  return REMOTE_PATTERNS.some((re) => re.test(blob));
}

const BRAZIL_PATTERNS = [
  /\bbrasil\b/i,
  /\bbrazil\b/i,
  /\bbr\b/i,
  /,\s*br$/i,
  /\bsão paulo\b/i,
  /\brio de janeiro\b/i,
  /\bminas gerais\b/i,
];

export function detectBrazilLocation(location) {
  const loc = normalizeText(location).toLowerCase();
  if (!loc) return true;
  if (BRAZIL_PATTERNS.some((re) => re.test(loc))) return true;
  if (loc.includes("brazil") || loc.includes("brasil")) return true;
  return false;
}

const STAFFING = [
  "consultoria",
  "consulting",
  "staffing",
  "outsourcing",
  "recruitment",
  "headhunter",
  "talent partners",
  "bpo",
  "rh terceiriz",
];

export function isRelevantCompany(companyName) {
  const n = normalizeText(companyName).toLowerCase();
  if (n.length < 2) return false;
  return !STAFFING.some((w) => n.includes(w));
}

const STRATEGIC_WORDS = [
  "engenheiro",
  "engineer",
  "desenvolvedor",
  "developer",
  "devops",
  "sre",
  "analista",
  "analyst",
  "gerente",
  "manager",
  "tech lead",
  "líder",
  "lider",
  "arquiteto",
  "architect",
  "cientista",
  "scientist",
  "product owner",
  "scrum master",
  "cto",
  "vp ",
  "diretor",
  "director",
  "coordenador",
  "supervisor",
];

export function isStrategicRole(title) {
  const t = normalizeText(title).toLowerCase();
  return STRATEGIC_WORDS.some((k) => t.includes(k));
}
