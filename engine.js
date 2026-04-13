const TREE_JSON_URL = "https://raw.githubusercontent.com/KJumpmaster/caoc-site/main/usa_tree_pass2_with_arrows.json";
const FLAGS_JSON_URL = "https://raw.githubusercontent.com/KJumpmaster/caoc-site/main/usa_tree_v4.json";
const REGISTRY_CSV_URL = "https://raw.githubusercontent.com/KJumpmaster/caoc-site/main/SP_Registry_CANON_3_31.csv";
const EDGES_CSV_URL = "https://raw.githubusercontent.com/KJumpmaster/caoc-site/main/usa_tree_pass2_edges.csv";
const PIC_BASE = "https://kjumpmaster.github.io/Aircraft-Pics/";
const PROFILE_PIC_BASE = "https://raw.githubusercontent.com/KJumpmaster/WTAircraft_Profile_Pics/main/";

const CELL_HEIGHT_SCALE = 0.80;
const IMAGE_SCALE = 0.80;
const BANNER_PLAYED_KEY = "cats_banner_played_v1";
const RULES_STORAGE_KEY = "cats_rules_enabled_v1";
const ALL_NATIONS_SOF_KEY = "cats_sof_v1";
const DEFAULT_NATION_KEY = "usa";
const CONSENT_STORAGE_KEY = "cats_cookie_consent_v3";

const EXEMPT_UNIT_IDS = new Set([
  "ucav",
  "quadcopter",
  "o3u_1"
].map(normId));

const treeShellEl = document.getElementById("treeShell");
const rankLayerEl = document.getElementById("rankLayer");
const edgeLayerEl = document.getElementById("edgeLayer");
const nodeLayerEl = document.getElementById("nodeLayer");
const detailPanelEl = document.getElementById("detailPanel");
const statusBoxEl = document.getElementById("statusBox");
const bannerVideoEl = document.getElementById("countryBannerVideo");
const replayBannerBtn = document.getElementById("replayBannerBtn");
const printTreeBtn = document.getElementById("printTreeBtn");
const rulesToggleBtn = document.getElementById("rulesToggleBtn");
const exportDrrBtn = document.getElementById("exportDrrBtn");
const exportSofBtn = document.getElementById("exportSofBtn");
const importReadinessBtn = document.getElementById("importReadinessBtn");
const importReadinessInput = document.getElementById("importReadinessInput");
const bannerStatusText = document.getElementById("bannerStatusText");
const inventorySafetyNoteEl = document.getElementById("inventorySafetyNote");
const inventorySummaryEl = document.getElementById("inventorySummary");
const rulesModalBackdrop = document.getElementById("rulesModalBackdrop");
const rulesModalContinueBtn = document.getElementById("rulesModalContinueBtn");
const rulesModalBackBtn = document.getElementById("rulesModalBackBtn");
const consentOverlayEl = document.getElementById("consentOverlay");
const consentNecessaryEl = document.getElementById("consentNecessary");
const consentPreferencesEl = document.getElementById("consentPreferences");
const consentStatisticsEl = document.getElementById("consentStatistics");
const consentMarketingEl = document.getElementById("consentMarketing");
const consentDenyBtn = document.getElementById("consentDeny");
const consentAllowSelectionBtn = document.getElementById("consentAllowSelection");
const consentAllowAllBtn = document.getElementById("consentAllowAll");

const state = {
  registryByKey: new Map(),
  flagMap: new Map(),
  cells: [],
  edges: [],
  rectMap: new Map(),
  selectedCellId: "",
  selectedUnitId: "",
  selectedMemberIndexByCellId: new Map(),
  arrowSourceUsed: "csv",
  inventory: {},
  rulesEnabled: true,
  countryKey: DEFAULT_NATION_KEY,
  bannerReplayInProgress: false,
  rulesModalPendingAction: null,
  consent: null
};

function setStatus(message, isError = false) {
  if (!statusBoxEl) return;
  statusBoxEl.textContent = message;
  statusBoxEl.classList.toggle("error", !!isError);
}

window.addEventListener("error", (e) => {
  setStatus(`JS error: ${e.message} at ${e.filename || "inline"}:${e.lineno || 0}`, true);
});

window.addEventListener("unhandledrejection", (e) => {
  setStatus(`Promise error: ${e.reason?.message || e.reason || "Unknown promise failure"}`, true);
});

function normId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function normalizeType(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeKey(value) {
  return String(value || "").trim();
}

function firstNonBlank(values) {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s !== "") return s;
  }
  return "";
}

function toBool(v) {
  if (v === true || v === 1) return true;
  const s = String(v || "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "t"].includes(s);
}

function romanize(num) {
  const map = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];
  let out = "";
  let n = Number(num) || 0;
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out || String(num);
}

function varNum(name) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

function scaledCellH() {
  return varNum("--cell-h") * CELL_HEIGHT_SCALE;
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cssEscape(v) {
  if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(v);
  return String(v).replace(/([ #;?%&,.+*~\\':"!^$\[\]()=>|/])/g, "\\$1");
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(cur);
      cur = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push(cur);
      cur = "";
      if (row.some(v => String(v).length > 0)) rows.push(row);
      row = [];
    } else {
      cur += ch;
    }
  }

  row.push(cur);
  if (row.some(v => String(v).length > 0)) rows.push(row);

  if (!rows.length) return [];

  const headers = rows[0].map(h => String(h || "").trim());
  return rows.slice(1)
    .filter(r => r.some(v => String(v || "").trim() !== ""))
    .map(r => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] ?? "";
      });
      return obj;
    });
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return await res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return await res.text();
}

function collectObjectsDeep(root) {
  const out = [];
  const seen = new Set();

  (function walk(node) {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    const keys = Object.keys(node);
    const rowish = keys.some(k => /(^|_)(id|name|unit|plane|type|premium|event|pack|squadron|vehicle|classification|reward)$/i.test(k));
    if (rowish) out.push(node);

    for (const value of Object.values(node)) walk(value);
  })(root);

  return out;
}

function inferCountryKey() {
  const bodyText = [document.title, TREE_JSON_URL, window.location.pathname].join(" |").toLowerCase();
  const known = ["usa", "japan", "germany", "ussr", "gb", "britain", "china", "italy", "france", "israel", "sweden"];
  for (const item of known) {
    if (bodyText.includes(item)) {
      return item === "britain" ? "gb" : item;
    }
  }
  return DEFAULT_NATION_KEY;
}

function inventoryStorageKey(countryKey = state.countryKey || DEFAULT_NATION_KEY) {
  return `cats_inventory_${countryKey}_v1`;
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getTodayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


function getDirtyDetailFields() {
  const dirty = [];

  if (!detailPanelEl) return dirty;

  detailPanelEl.querySelectorAll("[data-inv-field]").forEach((input) => {
    const field = input.getAttribute("data-inv-field");
    if (!field) return;

    const selectedCell = state.cells.find(c => c.cell_id === state.selectedCellId);
    const memberIndex = selectedCell
      ? (state.selectedMemberIndexByCellId.get(selectedCell.cell_id) || 0)
      : 0;
    const member = selectedCell?.members?.[memberIndex] || selectedCell?.members?.[0] || null;
    if (!member) return;

    const inv = getInventoryRecord(member.unitId);
    const currentValue = input.type === "checkbox" ? !!input.checked : String(input.value ?? "");
    const savedValue = input.type === "checkbox" ? !!inv[field] : String(inv[field] ?? "");

    if (currentValue !== savedValue) {
      dirty.push({ field, input });
    }
  });

  return dirty;
}

function showRulesToggleModal(onContinue) {
  if (!rulesModalBackdrop) {
    if (typeof onContinue === "function") onContinue();
    return;
  }

  state.rulesModalPendingAction = typeof onContinue === "function" ? onContinue : null;
  rulesModalBackdrop.hidden = false;
  rulesModalContinueBtn?.focus();
}

function hideRulesToggleModal() {
  if (!rulesModalBackdrop) return;
  rulesModalBackdrop.hidden = true;
  state.rulesModalPendingAction = null;
}

function commitRulesToggle() {
  state.rulesEnabled = !state.rulesEnabled;
  saveRulesState();
  updateRulesToggleUi();
  refreshVisualState();
}

function defaultConsentState() {
  return {
    necessary: true,
    preferences: true,
    statistics: false,
    marketing: false,
    answered: false,
    answeredAt: ""
  };
}

function loadConsentState() {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    state.consent = {
      ...defaultConsentState(),
      ...(parsed || {})
    };
  } catch {
    state.consent = defaultConsentState();
  }
}

function saveConsentState() {
  if (!state.consent) state.consent = defaultConsentState();
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state.consent, null, 2));
}

function syncConsentUiFromState() {
  if (consentNecessaryEl) consentNecessaryEl.checked = true;
  if (consentPreferencesEl) consentPreferencesEl.checked = !!state.consent?.preferences;
  if (consentStatisticsEl) consentStatisticsEl.checked = !!state.consent?.statistics;
  if (consentMarketingEl) consentMarketingEl.checked = !!state.consent?.marketing;
}

function showConsentOverlay() {
  if (!consentOverlayEl) return;
  syncConsentUiFromState();
  consentOverlayEl.hidden = false;
  document.body.style.overflow = 'hidden';
}

function hideConsentOverlay() {
  if (!consentOverlayEl) return;
  consentOverlayEl.hidden = true;
  document.body.style.overflow = '';
}

function finalizeConsent(selection) {
  state.consent = {
    necessary: true,
    preferences: !!selection.preferences,
    statistics: !!selection.statistics,
    marketing: !!selection.marketing,
    answered: true,
    answeredAt: new Date().toISOString()
  };
  saveConsentState();
  syncConsentUiFromState();
  hideConsentOverlay();
}

function setupConsentControls() {
  if (!consentOverlayEl) return;

  loadConsentState();
  syncConsentUiFromState();

  if (!state.consent?.answered) showConsentOverlay();
  else hideConsentOverlay();

  consentAllowAllBtn?.addEventListener('click', () => {
    if (consentPreferencesEl) consentPreferencesEl.checked = true;
    if (consentStatisticsEl) consentStatisticsEl.checked = true;
    if (consentMarketingEl) consentMarketingEl.checked = true;
    finalizeConsent({ preferences: true, statistics: true, marketing: true });
  });

  consentAllowSelectionBtn?.addEventListener('click', () => {
    finalizeConsent({
      preferences: !!consentPreferencesEl?.checked,
      statistics: !!consentStatisticsEl?.checked,
      marketing: !!consentMarketingEl?.checked
    });
  });

  consentDenyBtn?.addEventListener('click', () => {
    if (consentPreferencesEl) consentPreferencesEl.checked = false;
    if (consentStatisticsEl) consentStatisticsEl.checked = false;
    if (consentMarketingEl) consentMarketingEl.checked = false;
    finalizeConsent({ preferences: false, statistics: false, marketing: false });
  });
}

function loadRulesState() {
  const raw = localStorage.getItem(RULES_STORAGE_KEY);
  state.rulesEnabled = raw == null ? true : raw === "true";
}

function saveRulesState() {
  localStorage.setItem(RULES_STORAGE_KEY, String(!!state.rulesEnabled));
}

function loadInventoryState() {
  try {
    const raw = localStorage.getItem(inventoryStorageKey());
    state.inventory = raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn("Failed to parse inventory state", err);
    state.inventory = {};
  }
}

function saveInventoryState() {
  localStorage.setItem(inventoryStorageKey(), JSON.stringify(state.inventory, null, 2));
  saveInventoryIntoSof();
}

function saveInventoryIntoSof() {
  let sof = {};
  try {
    sof = JSON.parse(localStorage.getItem(ALL_NATIONS_SOF_KEY) || "{}");
  } catch {
    sof = {};
  }

  sof[state.countryKey] = {
    countryKey: state.countryKey,
    savedAt: new Date().toISOString(),
    inventory: state.inventory
  };

  localStorage.setItem(ALL_NATIONS_SOF_KEY, JSON.stringify(sof, null, 2));
}

function getInventoryRecord(unitId) {
  const key = normId(unitId);
  if (!key) return {
    inHangar: false,
    fmc: false,
    pilotCertified: false,
    dateAcquired: "",
    notes: ""
  };

  if (!state.inventory[key]) {
    state.inventory[key] = {
      researched: false,
      inHangar: false,
      fmc: false,
      pilotCertified: false,
      dateAcquired: "",
      notes: ""
    };
  }

  return state.inventory[key];
}

function isOwned(unitId) {
  return !!getInventoryRecord(unitId).inHangar;
}

function isFmc(unitId) {
  return !!getInventoryRecord(unitId).fmc;
}

function isPilotCertified(unitId) {
  return !!getInventoryRecord(unitId).pilotCertified;
}

function buildRegistryMap(rows) {
  const map = new Map();

  for (const row of rows) {
    const keys = [
      row.master_key,
      row.wt_name,
      row.wt_display_name_new,
      row.rw_name,
      row.wt_image,
      row.rw_image_name
    ].map(v => String(v || "").trim()).filter(Boolean);

    for (const rawKey of keys) {
      const exact = String(rawKey).trim();
      const normalized = normId(rawKey);
      if (exact && !map.has(exact)) map.set(exact, row);
      if (normalized && !map.has(normalized)) map.set(normalized, row);
    }
  }

  return map;
}

function buildFlagMap(flagJson) {
  const map = new Map();
  const rows = collectObjectsDeep(flagJson);

  function addAlias(alias, payload) {
    const raw = String(alias || "").trim();
    const nid = normId(raw);
    if (!raw && !nid) return;

    const existing = map.get(raw) || map.get(nid) || {
      premium: false,
      squadron: false,
      event: false,
      pack: false
    };

    existing.premium = existing.premium || !!payload.premium;
    existing.squadron = existing.squadron || !!payload.squadron;
    existing.event = existing.event || !!payload.event;
    existing.pack = existing.pack || !!payload.pack;

    if (raw) map.set(raw, existing);
    if (nid) map.set(nid, existing);
  }

  for (const row of rows) {
    const typeText = normalizeType(firstNonBlank([
      row.vehicle_type,
      row.type,
      row.unit_type,
      row.classification,
      row.flag_type,
      row.reward_type,
      row.kind,
      row.class,
      row.category,
      row.vehicle_class
    ]));

    const allText = normalizeType(Object.values(row).map(v => String(v || "")).join(" | "));

    const payload = {
      premium: toBool(row.premium) || typeText.includes("premium") || allText.includes("premium"),
      squadron: toBool(row.squadron) || typeText.includes("squadron") || allText.includes("squadron"),
      event: toBool(row.event) || typeText.includes("event") || allText.includes("event"),
      pack: toBool(row.pack) || typeText.includes("pack") || allText.includes("pack")
    };

    [
      row.unit_id, row.aircraft_id, row.id, row.name, row.plane, row.vehicle,
      row.value, row.master_key, row.wt_name, row.display_name, row.title,
      row.cell_id, row.cell_key, row.node_id, row.key
    ].forEach(v => addAlias(v, payload));

    for (const v of Object.values(row)) {
      if (typeof v !== "string") continue;
      const s = v.trim();
      if (!s || s.length > 140) continue;
      addAlias(s, payload);
    }
  }

  return map;
}

function getRegistryRowByUnitId(unitId) {
  const raw = String(unitId || "").trim();
  const normalized = normId(unitId);
  return state.registryByKey.get(raw) || state.registryByKey.get(normalized) || null;
}

function getCellMasterKey(cell) {
  return normalizeKey(firstNonBlank([
    cell.master_key,
    cell.cell_key,
    cell.unit_id,
    cell.id,
    cell.key,
    Array.isArray(cell.units) && cell.units.length
      ? (typeof cell.units[0] === "string"
          ? cell.units[0]
          : firstNonBlank([cell.units[0].unit_id, cell.units[0].id, cell.units[0].master_key]))
      : ""
  ]));
}

function getCellUnitIds(cell) {
  const out = [];

  const pushMaybe = (v) => {
    const raw = String(v || "").trim();
    const n = normId(v);
    if (raw) out.push(raw);
    if (n) out.push(n);
  };

  pushMaybe(cell.master_key);
  pushMaybe(cell.cell_key);
  pushMaybe(cell.unit_id);
  pushMaybe(cell.id);
  pushMaybe(cell.key);
  pushMaybe(cell.name);
  pushMaybe(cell.display_name);
  pushMaybe(cell.title);

  if (Array.isArray(cell.units)) {
    for (const u of cell.units) {
      if (typeof u === "string") {
        pushMaybe(u);
      } else if (u && typeof u === "object") {
        pushMaybe(firstNonBlank([
          u.unit_id, u.aircraft_id, u.id, u.master_key, u.name, u.title, u.display_name
        ]));
      }
    }
  }

  if (Array.isArray(cell.members)) {
    for (const u of cell.members) {
      if (typeof u === "string") {
        pushMaybe(u);
      } else if (u && typeof u === "object") {
        pushMaybe(firstNonBlank([
          u.unit_id, u.aircraft_id, u.id, u.master_key, u.name, u.title, u.display_name
        ]));
      }
    }
  }

  return [...new Set(out.filter(Boolean))];
}

function getRenderableUnitIds(cell) {
  return getCellUnitIds(cell).filter(id => !EXEMPT_UNIT_IDS.has(normId(id)));
}

function classifyUnit(unitId, fallbackCell = null) {
  const candidates = new Set();

  const add = (v) => {
    const raw = String(v || "").trim();
    const nid = normId(raw);
    if (raw) candidates.add(raw);
    if (nid) candidates.add(nid);
  };

  add(unitId);

  if (fallbackCell) {
    add(fallbackCell.master_key);
    add(fallbackCell.cell_key);
    add(fallbackCell.unit_id);
    add(fallbackCell.id);
    add(fallbackCell.key);
    add(fallbackCell.name);
    add(fallbackCell.display_name);
    add(fallbackCell.title);
    add(fallbackCell.node_id);
  }

  const reg = getRegistryRowByUnitId(unitId);
  if (reg) {
    add(reg.master_key);
    add(reg.wt_name);
    add(reg.wt_display_name_new);
    add(reg.rw_name);
    add(reg.wt_image);
    add(reg.rw_image_name);
  }

  if (fallbackCell) {
    if (toBool(fallbackCell.squadron)) return "squadron";
    if (toBool(fallbackCell.event)) return "event";
    if (toBool(fallbackCell.pack)) return "pack";
    if (toBool(fallbackCell.premium)) return "premium";
  }

  for (const key of candidates) {
    const f = state.flagMap.get(key);
    if (!f) continue;
    if (f.squadron) return "squadron";
    if (f.event) return "event";
    if (f.pack) return "pack";
    if (f.premium) return "premium";
  }

  if (fallbackCell) {
    const cellTypeText = normalizeType(firstNonBlank([
      fallbackCell.type,
      fallbackCell.vehicle_type,
      fallbackCell.group_type,
      fallbackCell.kind,
      fallbackCell.class,
      fallbackCell.reward_type,
      fallbackCell.classification,
      fallbackCell.flag_type,
      fallbackCell.category,
      fallbackCell.vehicle_class
    ]));

    const nameText = normalizeType(firstNonBlank([
      fallbackCell.display_name,
      fallbackCell.wiki_name,
      fallbackCell.name,
      fallbackCell.title,
      fallbackCell.master_key,
      fallbackCell.unit_id
    ]));

    const megaText = `${cellTypeText} | ${nameText}`;

    if (megaText.includes("squadron")) return "squadron";
    if (megaText.includes("event")) return "event";
    if (megaText.includes("pack")) return "pack";
    if (megaText.includes("premium")) return "premium";
  }

  return "tech";
}

function summarizeGroupTypes(unitIds, fallbackCell = null) {
  const counts = { tech: 0, premium: 0, squadron: 0, event: 0, pack: 0 };
  for (const id of unitIds) {
    const t = classifyUnit(id, fallbackCell);
    counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

function pickMainType(unitIds, fallbackCell = null) {
  const counts = summarizeGroupTypes(unitIds, fallbackCell);
  if (counts.squadron > 0) return "squadron";
  if (counts.event > 0) return "event";
  if (counts.pack > 0) return "pack";
  if (counts.premium > 0) return "premium";
  return "tech";
}

function normalizeProfilePicKey(value) {
  return String(value || "")
    .trim()
    .replace(/[\[\]]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildAircraftImageCandidates(registryRow, unitId) {
  const out = [];
  const wtImage = normalizeKey(registryRow?.wt_image);
  const masterKey = normalizeKey(registryRow?.master_key || unitId);

  const addBaseImage = (base, value) => {
    const s = String(value || "").trim();
    if (!s) return;
    if (/^https?:\/\//i.test(s)) {
      out.push(s);
      return;
    }
    if (/\.(png|jpg|jpeg|webp)$/i.test(s)) out.push(`${base}${s}`);
    else out.push(`${base}${s}.png`);
  };

  if (wtImage) addBaseImage(PIC_BASE, wtImage);
  if (masterKey) addBaseImage(PIC_BASE, masterKey);

  return [...new Set(out)];
}

function buildProfilePicCandidates(registryRow, unitId) {
  const out = [];
  const masterKey = normalizeProfilePicKey(registryRow?.master_key || unitId);
  if (!masterKey) return out;

  const variants = [
    masterKey,
    masterKey.toLowerCase(),
    normId(masterKey),
    normId(masterKey).replace(/_/g, "-"),
    normId(masterKey).replace(/_/g, " ").replace(/\s+/g, "_")
  ].filter(Boolean);

  for (const key of [...new Set(variants)]) {
    out.push(`${PROFILE_PIC_BASE}${key}.png`);
  }

  return [...new Set(out)];
}

function resolveImageSet(registryRow, unitId) {
  const aircraft = buildAircraftImageCandidates(registryRow, unitId);
  const profile = buildProfilePicCandidates(registryRow, unitId);
  return {
    aircraft,
    profile,
    lead: aircraft[0] || null
  };
}

function getDisplayName(cell, registryRow) {
  return (
    cell.display_name ||
    cell.wiki_name ||
    cell.name ||
    cell.title ||
    registryRow?.wt_display_name_new ||
    registryRow?.wt_name ||
    registryRow?.rw_name ||
    getCellMasterKey(cell) ||
    "Unknown Aircraft"
  );
}

function normalizeCell(raw, idx) {
  const rank = Number(raw.rank);
  const column = Number(raw.column ?? raw.col);
  const row = Number(raw.row_in_rank ?? raw.row);
  const cellId = raw.cell_id || raw.cell_key || raw.id || raw.node_id || raw.key || `${getCellMasterKey(raw) || "cell"}_${idx}`;

  return {
    ...raw,
    rank,
    column,
    row,
    cell_id: cellId,
    cell_key: raw.cell_key || cellId
  };
}

function validateCellPlacement(cell) {
  return Number.isFinite(cell.rank) &&
    Number.isFinite(cell.column) &&
    Number.isFinite(cell.row) &&
    cell.rank >= 1 &&
    cell.column >= 1 &&
    cell.row >= 1;
}

function getRowCountsByRank(cells) {
  const result = new Map();
  for (const cell of cells) {
    const rank = Number(cell.rank);
    const existing = result.get(rank) || 0;
    result.set(rank, Math.max(existing, Number(cell.row) || 1));
  }
  return result;
}

function getMaxColumn(cells) {
  return Math.max(...cells.map(c => Number(c.column) || 0), 7);
}

function computeRankLayout(cells) {
  const rowCountsByRank = getRowCountsByRank(cells);
  const ranks = [...rowCountsByRank.keys()].sort((a, b) => a - b);
  const rankLayout = new Map();
  let y = varNum("--tree-pad") + 42;

  for (const rank of ranks) {
    const rows = rowCountsByRank.get(rank) || 1;
    const contentH = rows * scaledCellH() + Math.max(0, rows - 1) * varNum("--cell-gap-y");
    const bandH = varNum("--rank-header-h") + varNum("--rank-inner-top") + contentH + varNum("--rank-inner-bottom");
    rankLayout.set(rank, { y, height: bandH, rows });
    y += bandH + varNum("--rank-gap");
  }

  const maxCol = getMaxColumn(cells);
  const width = varNum("--tree-pad") * 2 + maxCol * varNum("--cell-w") + (maxCol - 1) * varNum("--cell-gap-x");
  const height = y + varNum("--tree-pad") - varNum("--rank-gap");
  return { rankLayout, width, height };
}

function getCellRect(cell, rankLayout) {
  const layout = rankLayout.get(Number(cell.rank));
  return {
    x: varNum("--tree-pad") + (Number(cell.column) - 1) * (varNum("--cell-w") + varNum("--cell-gap-x")),
    y: layout.y + varNum("--rank-header-h") + varNum("--rank-inner-top") + (Number(cell.row) - 1) * (scaledCellH() + varNum("--cell-gap-y")),
    w: varNum("--cell-w"),
    h: scaledCellH()
  };
}

function renderTreeSectionHeaders(width) {
  const maxCol = getMaxColumn(state.cells || []);
  if (!maxCol) return;

  const left = document.createElement("div");
  left.className = "tree-section-header researchable";
  left.textContent = "Researchable / Standard Aircraft";
  left.style.left = `${varNum("--tree-pad")}px`;
  left.style.top = "8px";
  left.style.width = `${Math.max(260, ((Math.min(maxCol, 5)) * varNum("--cell-w")) + (Math.max(0, Math.min(maxCol, 5) - 1) * varNum("--cell-gap-x")))}px`;

  rankLayerEl.appendChild(left);

  if (maxCol >= 6) {
    const right = document.createElement("div");
    right.className = "tree-section-header special";
    right.textContent = "Squadron / Event / Premium";
    const specialCols = maxCol - 5;
    const x = varNum("--tree-pad") + 5 * (varNum("--cell-w") + varNum("--cell-gap-x"));
    const w = Math.max(240, (specialCols * varNum("--cell-w")) + (Math.max(0, specialCols - 1) * varNum("--cell-gap-x")));
    right.style.left = `${x}px`;
    right.style.top = "8px";
    right.style.width = `${w}px`;
    rankLayerEl.appendChild(right);
  }
}

function renderRankBands(rankLayout, width) {
  rankLayerEl.innerHTML = "";
  renderTreeSectionHeaders(width);

  for (const [rank, layout] of [...rankLayout.entries()].sort((a, b) => a[0] - b[0])) {
    const band = document.createElement("div");
    band.className = "rank-band";
    band.style.left = "0px";
    band.style.top = `${layout.y}px`;
    band.style.width = `${width}px`;
    band.style.height = `${layout.height}px`;

    const label = document.createElement("div");
    label.className = "rank-label";
    label.textContent = `Rank ${romanize(rank)}`;

    band.appendChild(label);
    rankLayerEl.appendChild(band);
  }
}

function buildMember(unitId, fallbackCell, registryRow) {
  const row = registryRow || getRegistryRowByUnitId(unitId) || null;
  const imageSet = resolveImageSet(row, unitId);

  return {
    unitId: normId(unitId) || String(unitId || "").trim(),
    type: classifyUnit(unitId, fallbackCell),
    displayName: row?.wt_display_name_new || row?.wt_name || row?.rw_name || fallbackCell.display_name || fallbackCell.title || fallbackCell.name || unitId,
    registryRow: row,
    imageUrl: imageSet.lead,
    imageCandidates: imageSet.aircraft,
    profilePicUrl: imageSet.profile[0] || null,
    profilePicCandidates: imageSet.profile
  };
}


function prepareCells(rawCells) {
  const validCells = rawCells.map(normalizeCell).filter(validateCellPlacement);
  const prepared = [];
  const seenPremiumKeys = new Set();

  function buildPremiumDedupeKey(raw, primaryUnitId, registryRow, members) {
    const candidates = [
      registryRow?.master_key,
      raw.master_key,
      raw.cell_key,
      raw.unit_id,
      primaryUnitId,
      ...(members || []).map(member => member?.unitId)
    ];

    for (const candidate of candidates) {
      const key = normId(candidate);
      if (key) return key;
    }

    return "";
  }

  for (const raw of validCells) {
    const renderableUnitIds = getRenderableUnitIds(raw);
    const dedupedUnitIds = [];
    const seenUnitIds = new Set();

    for (const unitId of renderableUnitIds) {
      const key = normId(unitId);
      if (!key || seenUnitIds.has(key)) continue;
      seenUnitIds.add(key);
      dedupedUnitIds.push(unitId);
    }

    if (!dedupedUnitIds.length) continue;

    const primaryUnitId = dedupedUnitIds[0];
    const registryRow = getRegistryRowByUnitId(primaryUnitId) || getRegistryRowByUnitId(getCellMasterKey(raw)) || null;
    const members = dedupedUnitIds.map(uid => buildMember(uid, raw, registryRow));
    const mainType = pickMainType(dedupedUnitIds, raw);
    const groupCounts = summarizeGroupTypes(dedupedUnitIds, raw);

    if (mainType === "premium") {
      const premiumKey = buildPremiumDedupeKey(raw, primaryUnitId, registryRow, members);
      if (premiumKey) {
        if (seenPremiumKeys.has(premiumKey)) continue;
        seenPremiumKeys.add(premiumKey);
      }
    }

    prepared.push({
      ...raw,
      unitIds: dedupedUnitIds,
      primaryUnitId,
      members,
      isGroup: dedupedUnitIds.length > 1 || (Array.isArray(raw.units) && raw.units.length > 1) || (Array.isArray(raw.members) && raw.members.length > 1),
      mainType,
      groupCounts,
      displayTitle: getDisplayName(raw, registryRow)
    });
  }

  return prepared;
}

function isRuleExemptType(cellOrType) {
  const type = (typeof cellOrType === "string"
    ? cellOrType
    : String(
        cellOrType?.mainType ||
        cellOrType?.type ||
        cellOrType?.vehicle_type ||
        cellOrType?.classification ||
        ""
      )
  ).trim().toLowerCase();

  return (
    type.includes("premium") ||
    type.includes("event") ||
    type.includes("pack") ||
    type.includes("squadron")
  );
}

function getCellInventory(cell) {
  if (!cell) return null;

  const candidateUnitIds = [];
  if (Array.isArray(cell.members)) {
    for (const member of cell.members) {
      if (member?.unitId) candidateUnitIds.push(normId(member.unitId));
    }
  }
  for (const raw of [cell.primaryUnitId, cell.master_key, cell.cell_id, cell.cell_key]) {
    const key = normId(raw);
    if (key) candidateUnitIds.push(key);
  }

  for (const key of candidateUnitIds) {
    if (state.inventory && state.inventory[key]) return state.inventory[key];
  }

  return null;
}

function getProgressUnitIdForCell(cell) {
  if (!cell) return "";
  if (Array.isArray(cell.members) && cell.members.length) {
    return cell.members[0]?.unitId || cell.primaryUnitId || "";
  }
  return cell.primaryUnitId || "";
}

function getRankRequirement(rank) {
  const rankRequirements = {
    2: 6,
    3: 6,
    4: 6,
    5: 6,
    6: 5,
    7: 5,
    8: 5,
    9: 5
  };
  return rankRequirements[Number(rank) || 0] || 0;
}

function countResearchedInRank(rank) {
  return (state.cells || []).filter(c => {
    if ((Number(c.rank) || 0) !== rank) return false;
    return Array.isArray(c.members) && c.members.some(m => isResearched(m.unitId) || isOwned(m.unitId));
  }).length;
}

function getIncomingEdgesForCell(cell) {
  return (state.edges || []).filter(e => e.toRef === cell.cell_id);
}

function getCellLockReasons(cell) {
  const reasons = [];

  if (!cell) return reasons;
  if (!state.rulesEnabled) return reasons;
  if (isRuleExemptType(cell)) return reasons;

  const currentRank = Number(cell.rank) || 0;
  const neededFromPriorRank = getRankRequirement(currentRank);

  if (neededFromPriorRank > 0) {
    const priorRank = currentRank - 1;
    const researchedPrior = countResearchedInRank(priorRank);

    if (researchedPrior < neededFromPriorRank) {
      reasons.push(`Requires ${neededFromPriorRank} researched from Rank ${romanize(priorRank)}`);
    }
  }

  const incomingEdges = getIncomingEdgesForCell(cell);
  if (incomingEdges.length) {
    const hasUnlockedParent = incomingEdges.some(e => {
      const parentCell = (state.cells || []).find(c => c.cell_id === e.fromRef);
      if (!parentCell) return false;
      const progressUnitId = getProgressUnitIdForCell(parentCell);
      return !!progressUnitId && isResearched(progressUnitId);
    });

    if (!hasUnlockedParent) {
      reasons.push("Requires parent aircraft researched in lineage above");
    }
  }

  return reasons;
}

function getMemberLockReasons(cell, memberIndex = 0) {
  const reasons = [];
  if (!cell) return reasons;
  if (!state.rulesEnabled) return reasons;

  const member = Array.isArray(cell.members) ? cell.members[memberIndex] : null;
  if (!member) return getCellLockReasons(cell);
  if (isRuleExemptType(member.type || cell.mainType || cell)) return reasons;

  if (memberIndex === 0) {
    return getCellLockReasons(cell);
  }

  const firstMember = cell.members[0];
  if (firstMember && !isResearched(firstMember.unitId)) {
    reasons.push(`Requires lead folder aircraft researched: ${firstMember.displayName || firstMember.unitId}`);
  }

  return reasons;
}

function memberIsUnlocked(cell, memberIndex = 0) {
  return getMemberLockReasons(cell, memberIndex).length === 0;
}


function isResearched(unitId) {
  return !!getInventoryRecord(unitId).researched;
}

function getCellVisualState(cell) {
  if (!cell) return "locked";
  const anyOwned = Array.isArray(cell.members) && cell.members.some(m => isOwned(m.unitId));
  const anyResearched = Array.isArray(cell.members) && cell.members.some(m => isResearched(m.unitId));
  if (anyOwned) return "obtained";
  if (getCellLockReasons(cell).length > 0) return "locked";
  if (anyResearched) return "researched";
  return "available";
}

function getCellStatusPills(cell) {
  if (!cell) return [{ label: "Locked", tone: "locked" }];

  const isSpecial = cell.mainType !== "tech";
  const anyOwned = Array.isArray(cell.members) && cell.members.some(m => isOwned(m.unitId));
  const anyFmc = Array.isArray(cell.members) && cell.members.some(m => isFmc(m.unitId));
  const anyPilot = Array.isArray(cell.members) && cell.members.some(m => isPilotCertified(m.unitId));
  const visualState = getCellVisualState(cell);
  const pills = [];

  if (visualState === "locked") {
    pills.push({ label: "Locked", tone: "locked" });
  } else {
    if (visualState === "available") pills.push({ label: "Available", tone: "available" });
    if (visualState === "researched" && !isSpecial) pills.push({ label: "Researched", tone: "researched" });
    if (anyOwned) pills.push({ label: "In Hangar", tone: "obtained" });
    if (anyFmc) pills.push({ label: "FMC", tone: "fmc" });
    if (anyPilot) pills.push({ label: "Pilot", tone: "pilot" });
  }

  const seen = new Set();
  return pills.filter(p => {
    const key = `${p.label}|${p.tone}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getCellStatusLabel(cell) {
  return getCellStatusPills(cell)[0]?.label || "Locked";
}

function getCellStatusTone(cell) {
  return getCellStatusPills(cell)[0]?.tone || "locked";
}

function applyInventoryClasses(el, cell) {
  if (!el || !cell) return;

  const anyOwned = cell.members.some(m => isOwned(m.unitId));
  const anyFmc = cell.members.some(m => isFmc(m.unitId));
  const anyPilot = cell.members.some(m => isPilotCertified(m.unitId));
  const locked = getCellLockReasons(cell).length > 0;
  const visualState = getCellVisualState(cell);

  el.classList.toggle("has-owned", anyOwned);
  el.classList.toggle("has-fmc", anyFmc);
  el.classList.toggle("has-pilot-certified", anyPilot);
  el.classList.toggle("locked-by-rules", locked);
  el.classList.toggle("state-obtained", visualState === "obtained");
  el.classList.toggle("state-available", visualState === "available");
  el.classList.toggle("state-researched", visualState === "researched");
  el.classList.toggle("state-locked", visualState === "locked");
}

function createMemberStatusPills(member, memberIndex, cell) {
  const owned = isOwned(member.unitId);
  const fmc = isFmc(member.unitId);
  const pilot = isPilotCertified(member.unitId);
  const lockReasons = getMemberLockReasons(cell, memberIndex);
  const pills = [];

  if (owned) pills.push('<span class="tag status-obtained">In Hangar</span>');
  if (fmc) pills.push('<span class="tag status-fmc">FMC</span>');
  if (pilot) pills.push('<span class="tag status-pilot">Pilot</span>');
  if (lockReasons.length) pills.push('<span class="tag event">Locked</span>');

  return pills.join(" ");
}


function createCellElement(cell) {
  const el = document.createElement("div");
  el.className = `tree-cell ${cell.mainType}`;
  el.dataset.cellId = cell.cell_id;
  el.dataset.unitId = cell.primaryUnitId;
  el.style.width = `${varNum("--cell-w")}px`;
  el.style.height = `${scaledCellH()}px`;

  const selectedMemberIndex = state.selectedMemberIndexByCellId.get(cell.cell_id) || 0;
  const lead = cell.members[selectedMemberIndex] || cell.members[0] || null;
  const metaRight = cell.isGroup ? `${cell.members.length} aircraft` : `R${cell.rank} C${cell.column} Y${cell.row}`;
  const visualState = getCellVisualState(cell);
  const statusPills = getCellStatusPills(cell);
  const badges = statusPills.map(({ label, tone }) => `<span class="tag cell-state-pill ${tone}">${label}</span>`);
  if (cell.mainType !== "tech") badges.push(`<span class="tag ${cell.mainType}">${cell.mainType}</span>`);
  if (cell.isGroup) badges.push('<span class="tag group">Group</span>');

  el.innerHTML = `
    <div class="cell-accent"></div>
    ${cell.isGroup ? `<div class="group-corner">${cell.members.length}</div>` : ""}
    <div class="cell-top"><div class="cell-image-wrap"></div></div>
    <div class="cell-body">
      <div class="cell-title"></div>
      <div class="cell-inline-tags"><div class="badge-row">${badges.join("")}</div></div>
      <div class="cell-meta">
        <span>${cell.primaryUnitId ? escapeHTML(cell.primaryUnitId) : ""}</span>
        <span>${escapeHTML(metaRight)}</span>
      </div>
      <div class="cell-footer-zone ${cell.mainType}"></div>
    </div>
  `;

  el.querySelector(".cell-title").textContent = lead?.displayName || cell.displayTitle;

  const topEl = el.querySelector(".cell-top");
  const imgWrap = el.querySelector(".cell-image-wrap");
  const bodyEl = el.querySelector(".cell-body");
  const titleEl = el.querySelector(".cell-title");

  if (topEl) {
    topEl.style.flex = "0 0 auto";
    topEl.style.height = `${Math.max(44, Math.round(64 * IMAGE_SCALE))}px`;
  }

  if (imgWrap) {
    imgWrap.style.height = `${Math.max(40, Math.round(60 * IMAGE_SCALE))}px`;
    imgWrap.style.display = "flex";
    imgWrap.style.alignItems = "center";
    imgWrap.style.justifyContent = "center";
  }

  if (bodyEl) {
    bodyEl.style.minHeight = "0";
  }

  if (titleEl) {
    titleEl.style.lineHeight = "1.05";
  }

  if (lead && lead.imageUrl) {
    const img = document.createElement("img");
    img.className = "cell-image";
    img.alt = lead.displayName || cell.displayTitle;
    img.src = lead.imageUrl;
    img.style.maxWidth = `${Math.round(118 * IMAGE_SCALE)}px`;
    img.style.maxHeight = `${Math.round(54 * IMAGE_SCALE)}px`;

    const candidates = Array.isArray(lead.imageCandidates) ? lead.imageCandidates.slice() : [lead.imageUrl];
    let candidateIndex = 0;
    img.addEventListener("error", () => {
      candidateIndex += 1;
      if (candidateIndex < candidates.length) {
        img.src = candidates[candidateIndex];
      } else {
        img.replaceWith(Object.assign(document.createElement("div"), {
          className: "cell-fallback",
          textContent: "No Image"
        }));
      }
    });

    imgWrap.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "cell-fallback";
    fallback.textContent = "No Image";
    imgWrap.appendChild(fallback);
  }

  applyInventoryClasses(el, cell);
  el.addEventListener("click", () => selectCell(cell));
  return el;
}


function renderCells(cells, rankLayout) {
  nodeLayerEl.innerHTML = "";
  const rectMap = new Map();

  for (const cell of cells) {
    const rect = getCellRect(cell, rankLayout);
    rectMap.set(cell.cell_id, rect);

    const wrap = document.createElement("div");
    wrap.className = "cell-wrap" + (cell.isGroup ? " grouped" : "");
    wrap.style.left = `${rect.x}px`;
    wrap.style.top = `${rect.y}px`;
    wrap.style.width = `${rect.w}px`;
    wrap.style.height = `${rect.h}px`;

    if (cell.isGroup) {
      const s2 = document.createElement("div");
      s2.className = "cell-shadow-2";
      s2.style.width = `${rect.w}px`;
      s2.style.height = `${rect.h}px`;

      const s1 = document.createElement("div");
      s1.className = "cell-shadow-1";
      s1.style.width = `${rect.w}px`;
      s1.style.height = `${rect.h}px`;

      wrap.appendChild(s2);
      wrap.appendChild(s1);
    }

    wrap.appendChild(createCellElement(cell));
    nodeLayerEl.appendChild(wrap);
  }

  return rectMap;
}

function getRectAnchor(rect, side) {
  if (side === "bottom") {
    return { x: rect.x + rect.w / 2, y: rect.y + rect.h };
  }
  return { x: rect.x + rect.w / 2, y: rect.y };
}

function makeVerticalPath(a, b) {
  const midY = a.y + Math.max(26, (b.y - a.y) * 0.5);
  return `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
}

function ensureArrowMarkers(svg) {
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

  const blue = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  blue.setAttribute("id", "arrowhead-blue");
  blue.setAttribute("markerWidth", "14");
  blue.setAttribute("markerHeight", "14");
  blue.setAttribute("refX", "7");
  blue.setAttribute("refY", "11.5");
  blue.setAttribute("orient", "auto");
  blue.setAttribute("markerUnits", "userSpaceOnUse");

  const bluePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  bluePath.setAttribute("d", "M 0 0 L 14 0 L 7 14 Z");
  bluePath.setAttribute("fill", "rgba(125, 190, 255, 0.92)");
  blue.appendChild(bluePath);

  const gold = document.createElementNS("http://www.w3.org/2000/svg", "marker");
  gold.setAttribute("id", "arrowhead-gold");
  gold.setAttribute("markerWidth", "14");
  gold.setAttribute("markerHeight", "14");
  gold.setAttribute("refX", "7");
  gold.setAttribute("refY", "11.5");
  gold.setAttribute("orient", "auto");
  gold.setAttribute("markerUnits", "userSpaceOnUse");

  const goldPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  goldPath.setAttribute("d", "M 0 0 L 14 0 L 7 14 Z");
  goldPath.setAttribute("fill", "rgba(255, 221, 110, 0.98)");
  gold.appendChild(goldPath);

  defs.appendChild(blue);
  defs.appendChild(gold);
  svg.appendChild(defs);
}

function buildVisibleEdges(rows, visibleUnitSet, cellsById) {
  const edges = [];
  const seen = new Set();

  function addEdge(fromCell, toCell, row, sourceTag) {
    if (!fromCell || !toCell) return;
    if (fromCell.cell_id === toCell.cell_id) return;

    const key = `${fromCell.cell_id}__${toCell.cell_id}`;
    if (seen.has(key)) return;
    seen.add(key);

    edges.push({
      fromId: fromCell.primaryUnitId,
      toId: toCell.primaryUnitId,
      fromRef: fromCell.cell_id,
      toRef: toCell.cell_id,
      raw: row,
      sourceTag
    });
  }

  function resolveCell(ref) {
    const raw = String(ref || "").trim();
    const nid = normId(raw);
    if (!raw && !nid) return null;

    return (
      cellsById.get(raw) ||
      cellsById.get(nid) ||
      state.cells.find(c =>
        c.cell_id === raw ||
        c.cell_key === raw ||
        normId(c.cell_id) === nid ||
        normId(c.cell_key) === nid ||
        c.unitIds.includes(raw) ||
        c.unitIds.includes(nid) ||
        c.primaryUnitId === raw ||
        c.primaryUnitId === nid ||
        normId(c.displayTitle) === nid ||
        normId(c.master_key) === nid ||
        normId(c.name) === nid ||
        normId(c.title) === nid ||
        normId(c.node_id) === nid ||
        normId(c.id) === nid
      ) ||
      null
    );
  }

  for (const row of rows) {
    const fromRef = firstNonBlank([
      row.from_id, row.from, row.source, row.parent, row.parent_id,
      row.source_cell_key, row.src, row.From, row.Source, row.Parent,
      row.source_id, row.start, row.a, row.u, row.unit_from, row.cell_from,
      row.from_cell, row.source_node, row.parent_cell, row.parent_unit
    ]);

    const toRef = firstNonBlank([
      row.to_id, row.to, row.target, row.child, row.child_id,
      row.target_cell_key, row.dst, row.To, row.Target, row.Child,
      row.target_id, row.end, row.b, row.v, row.unit_to, row.cell_to,
      row.to_cell, row.target_node, row.child_cell, row.child_unit
    ]);

    if (fromRef && toRef) {
      addEdge(resolveCell(fromRef), resolveCell(toRef), row, "explicit-fields");
      continue;
    }

    if (Array.isArray(row.path) && row.path.length >= 2) {
      addEdge(resolveCell(row.path[0]), resolveCell(row.path[row.path.length - 1]), row, "path-array");
      continue;
    }

    if (typeof row.path === "string" && row.path.trim()) {
      const parts = row.path.split(/>|,|;/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        addEdge(resolveCell(parts[0]), resolveCell(parts[parts.length - 1]), row, "path-string");
        continue;
      }
    }

    const compactRefs = Object.values(row)
      .map(v => String(v || "").trim())
      .filter(Boolean)
      .filter(v => v.length < 120);

    if (compactRefs.length >= 2) {
      const maybeFrom = resolveCell(compactRefs[0]);
      const maybeTo = resolveCell(compactRefs[1]);
      if (maybeFrom && maybeTo) {
        addEdge(maybeFrom, maybeTo, row, "fallback-first-two");
      }
    }
  }

  return edges;
}

function renderEdges() {
  edgeLayerEl.innerHTML = "";

  const width = parseFloat(treeShellEl.style.width) || treeShellEl.clientWidth || 0;
  const height = parseFloat(treeShellEl.style.height) || treeShellEl.clientHeight || 0;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.position = "absolute";
  svg.style.left = "0";
  svg.style.top = "0";
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.style.overflow = "visible";
  svg.style.pointerEvents = "none";
  ensureArrowMarkers(svg);

  for (const edge of state.edges) {
    const fromCell = state.cells.find(c => c.cell_id === edge.fromRef) || null;
    const toCell = state.cells.find(c => c.cell_id === edge.toRef) || null;
    if (!fromCell || !toCell) continue;

    const fromRect = state.rectMap.get(fromCell.cell_id);
    const toRect = state.rectMap.get(toCell.cell_id);
    if (!fromRect || !toRect) continue;

    const a = getRectAnchor(fromRect, "bottom");
    const b = getRectAnchor(toRect, "top");
    const active = state.selectedUnitId && (state.selectedUnitId === edge.fromId || state.selectedUnitId === edge.toId);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", makeVerticalPath(a, b));
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");

    if (active) {
      path.setAttribute("stroke", "rgba(255, 221, 110, 0.96)");
      path.setAttribute("stroke-width", "3.4");
      path.setAttribute("opacity", "1");
      path.setAttribute("filter", "drop-shadow(0 0 4px rgba(255,221,110,0.65))");
      path.setAttribute("marker-end", "url(#arrowhead-gold)");
    } else {
      path.setAttribute("stroke", "rgba(125, 190, 255, 0.68)");
      path.setAttribute("stroke-width", "2.2");
      path.setAttribute("opacity", "0.95");
      path.setAttribute("stroke-dasharray", "7 8");
      path.setAttribute("marker-end", "url(#arrowhead-blue)");
    }

    svg.appendChild(path);
  }

  edgeLayerEl.appendChild(svg);
}

function updateInventorySummary() {
  if (!inventorySummaryEl) return;
  const uniqueUnitIds = new Set();
  for (const cell of state.cells) {
    for (const member of cell.members) {
      uniqueUnitIds.add(member.unitId);
    }
  }

  const total = uniqueUnitIds.size;
  let inHangar = 0;
  let fmc = 0;
  let pilot = 0;

  for (const unitId of uniqueUnitIds) {
    if (isOwned(unitId)) inHangar += 1;
    if (isFmc(unitId)) fmc += 1;
    if (isPilotCertified(unitId)) pilot += 1;
  }

  const pct = total ? Math.round((inHangar / total) * 100) : 0;
  inventorySummaryEl.textContent = `In Hangar ${inHangar}/${total} · FMC ${fmc} · Pilot Certified ${pilot} · ${pct}%`;
}

function updateRulesToggleUi() {
  if (!rulesToggleBtn) return;
  if (state.rulesEnabled) {
    rulesToggleBtn.textContent = "Override Game Rules";
    rulesToggleBtn.classList.remove("safe");
    rulesToggleBtn.classList.add("danger");
  } else {
    rulesToggleBtn.textContent = "Game Rules";
    rulesToggleBtn.classList.remove("danger");
    rulesToggleBtn.classList.add("safe");
  }
}

function updateBannerStatus(text) {
  if (bannerStatusText) bannerStatusText.textContent = text;
}

function setupBannerControls() {
  if (bannerVideoEl) {
    bannerVideoEl.addEventListener("ended", () => {
      state.bannerReplayInProgress = false;
      updateBannerStatus("");
      localStorage.setItem(BANNER_PLAYED_KEY, "true");
    });

    bannerVideoEl.addEventListener("play", () => {
      updateBannerStatus("");
    });

    bannerVideoEl.addEventListener("pause", () => {
      if (!state.bannerReplayInProgress) updateBannerStatus("Banner standby");
    });
  }

  if (replayBannerBtn && bannerVideoEl) {
    replayBannerBtn.addEventListener("click", async () => {
      try {
        state.bannerReplayInProgress = true;
        updateBannerStatus("");
        bannerVideoEl.currentTime = 0;
        bannerVideoEl.muted = false;
        await bannerVideoEl.play();
      } catch (err) {
        updateBannerStatus("");
        console.warn(err);
      }
    });
  }

  if (printTreeBtn) {
    printTreeBtn.addEventListener("click", () => window.print());
  }

  if (bannerVideoEl) {
    const playedAlready = localStorage.getItem(BANNER_PLAYED_KEY) === "true";
    if (!playedAlready) {
      bannerVideoEl.muted = true;
      bannerVideoEl.play().then(() => {
        updateBannerStatus("");
      }).catch(() => {
        updateBannerStatus("");
      });
    } else {
      updateBannerStatus("");
    }
  }
}

function exportDrr() {
  downloadJson(`DRR_${state.countryKey}_${getTodayIso()}.json`, {
    reportType: "DRR",
    countryKey: state.countryKey,
    savedAt: new Date().toISOString(),
    inventory: state.inventory
  });
  if (inventorySafetyNoteEl) {
    inventorySafetyNoteEl.textContent = `DRR exported for ${state.countryKey.toUpperCase()} at ${new Date().toLocaleTimeString()}.`;
  }
}

function exportSof() {
  let sof = {};
  try {
    sof = JSON.parse(localStorage.getItem(ALL_NATIONS_SOF_KEY) || "{}");
  } catch {
    sof = {};
  }
  downloadJson(`SoF_${getTodayIso()}.json`, {
    reportType: "SoF",
    savedAt: new Date().toISOString(),
    nations: sof
  });
  if (inventorySafetyNoteEl) {
    inventorySafetyNoteEl.textContent = `SoF exported at ${new Date().toLocaleTimeString()}.`;
  }
}

async function importReadinessFile(file) {
  const text = await file.text();
  const payload = JSON.parse(text);

  if (payload.reportType === "DRR" && payload.inventory) {
    state.inventory = payload.inventory;
    saveInventoryState();
  } else if (payload.reportType === "SoF" && payload.nations) {
    localStorage.setItem(ALL_NATIONS_SOF_KEY, JSON.stringify(payload.nations, null, 2));
    const nationPayload = payload.nations[state.countryKey];
    if (nationPayload?.inventory) {
      state.inventory = nationPayload.inventory;
      saveInventoryState();
    }
  } else {
    throw new Error("Unrecognized readiness payload");
  }

  refreshVisualState();
  if (inventorySafetyNoteEl) {
    inventorySafetyNoteEl.textContent = `Readiness import complete at ${new Date().toLocaleTimeString()}.`;
  }
}

function setupReadinessControls() {
  if (rulesToggleBtn) {
    rulesToggleBtn.addEventListener("click", () => {
      const dirtyFields = getDirtyDetailFields();
      const switchingIntoOverride = state.rulesEnabled === true;

      if (switchingIntoOverride || dirtyFields.length) {
        const titleEl = document.getElementById("rulesModalTitle");
        const textEl = document.getElementById("rulesModalText");
        if (titleEl) titleEl.textContent = switchingIntoOverride ? "Override game rules?" : "Unsaved kneeboard changes detected";
        if (textEl) {
          textEl.textContent = switchingIntoOverride
            ? "Continuing without exporting your progress, notes, and collection may cause some or all of that information to be lost later. Use Export DRR / SoF on the top command row before switching into override mode."
            : "You have unsaved field changes in the active kneeboard. Continuing will switch the rules mode and discard those pending edits.";
        }
        showRulesToggleModal(() => {
          hideRulesToggleModal();
          commitRulesToggle();
        });
        return;
      }

      commitRulesToggle();
    });
  }

  if (rulesModalContinueBtn) {
    rulesModalContinueBtn.addEventListener("click", () => {
      const pending = state.rulesModalPendingAction;
      if (typeof pending === "function") pending();
      else hideRulesToggleModal();
    });
  }

  if (rulesModalBackBtn) {
    rulesModalBackBtn.addEventListener("click", () => {
      const dirtyFields = getDirtyDetailFields();
      hideRulesToggleModal();
      dirtyFields[0]?.input?.focus();
    });
  }

  if (rulesModalBackdrop) {
    rulesModalBackdrop.addEventListener("click", (event) => {
      if (event.target === rulesModalBackdrop) {
        const dirtyFields = getDirtyDetailFields();
        hideRulesToggleModal();
        dirtyFields[0]?.input?.focus();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && rulesModalBackdrop && !rulesModalBackdrop.hidden) {
      const dirtyFields = getDirtyDetailFields();
      hideRulesToggleModal();
      dirtyFields[0]?.input?.focus();
    }
  });

  if (exportDrrBtn) exportDrrBtn.addEventListener("click", exportDrr);
  if (exportSofBtn) exportSofBtn.addEventListener("click", exportSof);

  if (importReadinessBtn && importReadinessInput) {
    importReadinessBtn.addEventListener("click", () => importReadinessInput.click());
    importReadinessInput.addEventListener("change", async () => {
      const file = importReadinessInput.files?.[0];
      if (!file) return;
      try {
        await importReadinessFile(file);
      } catch (err) {
        setStatus(`Import failed: ${err.message || err}`, true);
      } finally {
        importReadinessInput.value = "";
      }
    });
  }

  updateRulesToggleUi();
}

function renderLockNotice(lockReasons) {
  if (!lockReasons.length) return "";
  return `
    <div class="section" style="margin-bottom:14px;border-color:rgba(255,138,101,0.28);">
      <div class="section-title"><span>Rule Lock Notice</span></div>
      <div style="color:var(--muted);font-size:13px;line-height:1.55;">
        ${lockReasons.map(r => `<div>• ${escapeHTML(r)}</div>`).join("")}
      </div>
    </div>
  `;
}


function renderInventoryEditor(member, lockReasons, cell, memberIndex) {
  const inv = getInventoryRecord(member.unitId);
  const canEditStatus = !lockReasons.length || !state.rulesEnabled;
  const canEditPostResearch = canEditStatus && !!inv.researched;

  return `
    <div class="section">
      <div class="section-title"><span>Kneeboard Status</span></div>
      <div style="display:grid;gap:12px;">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
          <input type="checkbox" data-inv-field="researched" ${inv.researched ? "checked" : ""} ${canEditStatus ? "" : "disabled"} />
          <span>Researched</span>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
          <input type="checkbox" data-inv-field="inHangar" ${inv.inHangar ? "checked" : ""} ${canEditPostResearch ? "" : "disabled"} />
          <span>In Hangar</span>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
          <input type="checkbox" data-inv-field="fmc" ${inv.fmc ? "checked" : ""} ${canEditPostResearch ? "" : "disabled"} />
          <span>FMC (Fully Mission Capable)</span>
        </label>
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
          <input type="checkbox" data-inv-field="pilotCertified" ${inv.pilotCertified ? "checked" : ""} ${canEditPostResearch ? "" : "disabled"} />
          <span>Pilot Certified</span>
        </label>
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;">Date Acquired</span>
          <div class="date-input-row">
            <input class="kb-date-input" type="date" data-inv-field="dateAcquired" value="${escapeHTML(inv.dateAcquired || "")}" ${canEditPostResearch ? "" : "disabled"}
              style="padding:10px;border-radius:10px;border:1px solid rgba(124,255,178,0.14);background:rgba(255,255,255,0.03);color:var(--text);" />
            <button type="button" class="date-picker-btn" data-open-picker ${canEditPostResearch ? "" : "disabled"} aria-label="Open calendar">📅</button>
          </div>
        </label>
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;">Notes</span>
          <textarea class="kb-notes" data-inv-field="notes" rows="4"
            style="padding:10px;border-radius:10px;border:1px solid rgba(124,255,178,0.18);background:rgba(124,255,178,0.06);color:var(--text);resize:vertical;">${escapeHTML(inv.notes || "")}</textarea>
        </label>
        <div style="font-size:12px;color:var(--muted);">
          ${canEditStatus
            ? (inv.researched
                ? "Changes save automatically to local browser storage unless you clear your browser cookies, history, or site data."
                : "Research this aircraft first. After that, In Hangar, FMC, Pilot, and Date Acquired unlock for this kneeboard. Saved browser data can still be cleared by deleting cookies, history, or site data.")
            : "Status controls are locked by the current ruleset. Notes remain editable on all kneeboards and saved browser data can still be cleared by deleting cookies, history, or site data."}
        </div>
      </div>
    </div>
  `;
}

function wireInventoryEditor(member, cell, memberIndex) {
  detailPanelEl.querySelectorAll("[data-inv-field]").forEach(input => {
    const field = input.getAttribute("data-inv-field");
    const handler = () => {
      const lockReasons = getMemberLockReasons(cell, memberIndex);
      const isNotesField = field === "notes";

      if (!isNotesField && state.rulesEnabled && lockReasons.length) {
        refreshDetailPanel(cell, memberIndex);
        return;
      }

      const inv = getInventoryRecord(member.unitId);
      if (input.type === "checkbox") inv[field] = !!input.checked;
      else inv[field] = input.value;

      if (field === "researched" && !input.checked) {
        inv.inHangar = false;
        inv.fmc = false;
        inv.pilotCertified = false;
        inv.dateAcquired = "";
      }
      if (!inv.researched && (field === "inHangar" || field === "fmc" || field === "pilotCertified" || field === "dateAcquired")) {
        refreshDetailPanel(cell, memberIndex);
        return;
      }
      if (field === "inHangar" && !input.checked) {
        inv.dateAcquired = "";
      }
      if (field === "inHangar" && input.checked && !inv.dateAcquired) {
        inv.dateAcquired = getTodayIso();
      }

      saveInventoryState();

      if (field === "notes") {
        refreshDetailPanel(cell, memberIndex);
        return;
      }

      refreshVisualState();
      refreshDetailPanel(cell, memberIndex);
    };

    input.addEventListener("change", handler);
  });

  detailPanelEl.querySelectorAll("[data-open-picker]").forEach(btn => {
    btn.addEventListener("click", () => {
      const dateInput = detailPanelEl.querySelector('[data-inv-field="dateAcquired"]');
      if (!dateInput || btn.disabled) return;
      if (typeof dateInput.showPicker === "function") {
        dateInput.showPicker();
      } else {
        dateInput.focus();
        dateInput.click();
      }
    });
  });
}

function renderSingleUnitPanel(member, cell = null, memberIndex = 0) {
  const row = member.registryRow || null;
  const effectiveCell = cell || state.cells.find(c => c.members.some(m => m.unitId === member.unitId)) || null;
  const lockReasons = effectiveCell ? getMemberLockReasons(effectiveCell, memberIndex) : [];
  const isGroupedMember = !!(effectiveCell && effectiveCell.isGroup);
  const typeTag = member.type !== "tech" ? `<span class="tag ${member.type}">${member.type}</span>` : "";
  const navHtml = isGroupedMember ? `
    <div class="member-nav-strip under-hero">
      <button type="button" class="banner-button secondary nav-arrow" data-member-prev ${memberIndex <= 0 ? "disabled" : ""} aria-label="Previous group aircraft">◀</button>
      <button type="button" class="banner-button secondary nav-group" data-back-to-group>Group</button>
      <button type="button" class="banner-button secondary nav-arrow" data-member-next ${memberIndex >= (effectiveCell.members.length - 1) ? "disabled" : ""} aria-label="Next group aircraft">▶</button>
    </div>
  ` : "";

  detailPanelEl.innerHTML = `
    ${renderLockNotice(lockReasons)}
    <div class="hero-card">
      <div class="hero-image ${(member.profilePicUrl || member.imageUrl) ? "" : "placeholder"}">
        ${(member.profilePicUrl || member.imageUrl) ? `<img src="${escapeHTML(member.profilePicUrl || member.imageUrl)}" alt="${escapeHTML(member.displayName)}" />` : "No Image"}
      </div>
      <div class="hero-content">
        <div class="hero-kicker">${typeTag} ${createMemberStatusPills(member, memberIndex, effectiveCell || { members:[member] })}</div>
        <h3 class="hero-name">${escapeHTML(member.displayName)}</h3>
        <div class="meta-grid">
          <div class="meta-box"><div class="meta-label">Unit ID</div><div class="meta-value">${escapeHTML(member.unitId || "—")}</div></div>
          <div class="meta-box"><div class="meta-label">Nation</div><div class="meta-value">${escapeHTML(row?.nation || state.countryKey.toUpperCase())}</div></div>
          <div class="meta-box"><div class="meta-label">WT Name</div><div class="meta-value">${escapeHTML(row?.wt_name || "—")}</div></div>
          <div class="meta-box"><div class="meta-label">Master Key</div><div class="meta-value">${escapeHTML(row?.master_key || member.unitId || "—")}</div></div>
          <div class="meta-box"><div class="meta-label">RW Name</div><div class="meta-value">${escapeHTML(row?.rw_name || "—")}</div></div>
          <div class="meta-box"><div class="meta-label">Profile Pic Source</div><div class="meta-value">${escapeHTML(member.profilePicUrl || "PROFILE_PIC_BASE only")}</div></div>
        </div>
      </div>
      ${navHtml}
    </div>
    ${effectiveCell ? renderInventoryEditor(member, lockReasons, effectiveCell, memberIndex) : ""}
  `;

  const heroImg = detailPanelEl.querySelector(".hero-image img");
  if (heroImg) {
    const candidates = [...new Set([...(member.profilePicCandidates || []), ...(member.imageCandidates || [])].filter(Boolean))];
    let candidateIndex = 0;
    heroImg.addEventListener("error", () => {
      candidateIndex += 1;
      if (candidateIndex < candidates.length) {
        heroImg.src = candidates[candidateIndex];
      } else {
        const heroBox = detailPanelEl.querySelector(".hero-image");
        if (heroBox) {
          heroBox.classList.add("placeholder");
          heroBox.textContent = "No Image";
        }
      }
    });
  }

  if (effectiveCell) wireInventoryEditor(member, effectiveCell, memberIndex);

  if (isGroupedMember && effectiveCell) {
    detailPanelEl.querySelector("[data-back-to-group]")?.addEventListener("click", () => {
      state.selectedUnitId = effectiveCell.primaryUnitId || "";
      renderEdges();
      renderGroupPanel(effectiveCell);
    });

    detailPanelEl.querySelector("[data-member-prev]")?.addEventListener("click", () => {
      if (memberIndex <= 0) return;
      const nextIndex = memberIndex - 1;
      state.selectedMemberIndexByCellId.set(effectiveCell.cell_id, nextIndex);
      const nextMember = effectiveCell.members[nextIndex];
      state.selectedUnitId = nextMember?.unitId || effectiveCell.primaryUnitId || "";
      updateSelectedCellDisplay(effectiveCell);
      renderEdges();
      if (nextMember) renderSingleUnitPanel(nextMember, effectiveCell, nextIndex);
    });

    detailPanelEl.querySelector("[data-member-next]")?.addEventListener("click", () => {
      if (memberIndex >= effectiveCell.members.length - 1) return;
      const nextIndex = memberIndex + 1;
      state.selectedMemberIndexByCellId.set(effectiveCell.cell_id, nextIndex);
      const nextMember = effectiveCell.members[nextIndex];
      state.selectedUnitId = nextMember?.unitId || effectiveCell.primaryUnitId || "";
      updateSelectedCellDisplay(effectiveCell);
      renderEdges();
      if (nextMember) renderSingleUnitPanel(nextMember, effectiveCell, nextIndex);
    });
  }
}

function renderGroupPanel(cell) {
  const summaryTags = [];
  for (const t of ["squadron", "event", "pack", "premium"]) {
    const n = cell.groupCounts[t] || 0;
    if (n > 0) summaryTags.push(`<span class="tag ${t}">${t} ${n}</span>`);
  }

  const listHtml = cell.members.map((member, idx) => {
    const lockReasons = getMemberLockReasons(cell, idx);
    return `
      <div class="member-item" data-member-unit-id="${escapeHTML(member.unitId)}" data-member-index="${idx}">
        <div class="member-thumb ${member.imageUrl ? "" : "placeholder"}">
          ${member.imageUrl ? `<img src="${escapeHTML(member.imageUrl)}" alt="${escapeHTML(member.displayName)}" />` : "No Image"}
        </div>
        <div>
          <div class="member-name">${escapeHTML(member.displayName)}</div>
          <div class="badge-row" style="margin-top:0;">${member.type !== "tech" ? `<span class="tag ${member.type}">${member.type}</span>` : ""} ${createMemberStatusPills(member, idx, cell)}</div>
          <div style="margin-top:6px;font-size:11px;color:var(--muted);">${escapeHTML(member.unitId)}</div>
          ${lockReasons.length ? `<div style="margin-top:6px;font-size:11px;color:#ffd0c6;">${escapeHTML(lockReasons[0])}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");

  detailPanelEl.innerHTML = `
    ${renderLockNotice(getCellLockReasons(cell))}
    <div class="hero-card">
      <div class="hero-content">
        <div class="hero-kicker">${summaryTags.join(" ")}</div>
        <h3 class="hero-name">${escapeHTML(cell.displayTitle)}</h3>
        <div style="color:var(--muted);font-size:13px;line-height:1.5;">
          Grouped aircraft folder. Select a member below to inspect the exact kneeboard, status, and rule lock state.
        </div>
        <div class="meta-grid" style="margin-top:16px;">
          <div class="meta-box"><div class="meta-label">Group Members</div><div class="meta-value">${cell.members.length}</div></div>
          <div class="meta-box"><div class="meta-label">Primary Unit</div><div class="meta-value">${escapeHTML(cell.primaryUnitId || "—")}</div></div>
        </div>
      </div>
    </div>
    <div class="section">
      <div class="section-title"><span>Folder Members</span></div>
      <div class="member-list">${listHtml}</div>
    </div>
  `;

  detailPanelEl.querySelectorAll("[data-member-unit-id]").forEach(el => {
    el.addEventListener("click", () => {
      const unitId = el.getAttribute("data-member-unit-id");
      const memberIndex = Number(el.getAttribute("data-member-index")) || 0;
      const member = cell.members.find(m => m.unitId === unitId) || cell.members[memberIndex];
      state.selectedMemberIndexByCellId.set(cell.cell_id, memberIndex);
      state.selectedUnitId = member?.unitId || cell.primaryUnitId || "";
      updateSelectedCellDisplay(cell);
      renderEdges();
      if (member) renderSingleUnitPanel(member, cell, memberIndex);
    });
  });
}

function refreshDetailPanel(cell, memberIndex = null) {
  if (!cell) return;
  if (cell.isGroup) {
    if (memberIndex == null) {
      renderGroupPanel(cell);
      return;
    }
    const member = cell.members[memberIndex];
    if (member) renderSingleUnitPanel(member, cell, memberIndex);
    else renderGroupPanel(cell);
  } else {
    renderSingleUnitPanel(cell.members[0], cell, 0);
  }
}

function selectCell(cell) {
  state.selectedCellId = cell.cell_id;
  state.selectedUnitId = cell.primaryUnitId || "";

  document.querySelectorAll(".tree-cell.active").forEach(el => el.classList.remove("active"));
  const activeEl = document.querySelector(`.tree-cell[data-cell-id="${cssEscape(cell.cell_id)}"]`);
  if (activeEl) activeEl.classList.add("active");

  if (cell.isGroup) {
    const currentIdx = state.selectedMemberIndexByCellId.get(cell.cell_id);
    if (currentIdx != null) {
      refreshDetailPanel(cell, currentIdx);
    } else {
      renderGroupPanel(cell);
    }
  } else {
    renderSingleUnitPanel(cell.members[0], cell, 0);
  }

  renderEdges();
}

function updateSelectedCellDisplay(cell) {
  if (!cell) return;

  const selectedMemberIndex = state.selectedMemberIndexByCellId.get(cell.cell_id) || 0;
  const lead = cell.members[selectedMemberIndex] || cell.members[0] || null;
  const cellEl = document.querySelector(`.tree-cell[data-cell-id="${cssEscape(cell.cell_id)}"]`);
  if (!cellEl || !lead) return;

  const titleEl = cellEl.querySelector(".cell-title");
  if (titleEl) titleEl.textContent = lead.displayName || cell.displayTitle;

  const imgWrap = cellEl.querySelector(".cell-image-wrap");
  if (!imgWrap) return;

  const currentImg = imgWrap.querySelector("img");
  const desiredSrc = lead.imageUrl || "";
  if (currentImg && currentImg.getAttribute("src") === desiredSrc) return;

  imgWrap.innerHTML = "";
  if (lead.imageUrl) {
    const img = document.createElement("img");
    img.className = "cell-image";
    img.alt = lead.displayName || cell.displayTitle;
    img.src = lead.imageUrl;
    img.style.maxWidth = `${Math.round(118 * IMAGE_SCALE)}px`;
    img.style.maxHeight = `${Math.round(54 * IMAGE_SCALE)}px`;

    const candidates = Array.isArray(lead.imageCandidates) ? lead.imageCandidates.slice() : [lead.imageUrl];
    let candidateIndex = 0;
    img.addEventListener("error", () => {
      candidateIndex += 1;
      if (candidateIndex < candidates.length) {
        img.src = candidates[candidateIndex];
      } else {
        imgWrap.replaceChildren(Object.assign(document.createElement("div"), {
          className: "cell-fallback",
          textContent: "No Image"
        }));
      }
    });

    imgWrap.appendChild(img);
  } else {
    const fallback = document.createElement("div");
    fallback.className = "cell-fallback";
    fallback.textContent = "No Image";
    imgWrap.appendChild(fallback);
  }
}

function refreshVisualState() {
  const { rankLayout, width, height } = computeRankLayout(state.cells);
  treeShellEl.style.width = `${width}px`;
  treeShellEl.style.height = `${height}px`;
  renderRankBands(rankLayout, width);
  state.rectMap = renderCells(state.cells, rankLayout);
  renderEdges();
  updateInventorySummary();

  const selected = state.cells.find(c => c.cell_id === state.selectedCellId);
  if (selected) {
    const currentIdx = state.selectedMemberIndexByCellId.get(selected.cell_id);
    refreshDetailPanel(selected, currentIdx != null ? currentIdx : null);
    const activeEl = document.querySelector(`.tree-cell[data-cell-id="${cssEscape(selected.cell_id)}"]`);
    if (activeEl) activeEl.classList.add("active");
  }
}

async function initiateSystem() {
  state.countryKey = inferCountryKey();
  loadRulesState();
  loadInventoryState();
  saveInventoryIntoSof();
  setupBannerControls();
  setupReadinessControls();
  setupConsentControls();

  setStatus("Loading tree, flags, registry, and edge truth...");

  const [treePayload, flagsPayload, regText, edgeText] = await Promise.all([
    fetchJSON(TREE_JSON_URL),
    fetchJSON(FLAGS_JSON_URL),
    fetchText(REGISTRY_CSV_URL),
    fetchText(EDGES_CSV_URL)
  ]);

  const registryRows = parseCSV(regText);
  state.registryByKey = buildRegistryMap(registryRows);
  state.flagMap = buildFlagMap(flagsPayload);

  const rawCells = Array.isArray(treePayload.cells) ? treePayload.cells : [];
  const bad = rawCells.map(normalizeCell).filter(c => !validateCellPlacement(c));
  if (bad.length) {
    setStatus(`Some cells invalid.\nFirst bad cell:\n${JSON.stringify(bad[0], null, 2)}`, true);
  }

  state.cells = prepareCells(rawCells);
  if (!state.cells.length) {
    throw new Error(`No valid cells found. First raw cell: ${JSON.stringify(rawCells[0], null, 2)}`);
  }

  const cellsById = new Map();

  for (const cell of state.cells) {
    cellsById.set(cell.cell_id, cell);
    cellsById.set(normId(cell.cell_id), cell);
    cellsById.set(cell.cell_key, cell);
    cellsById.set(normId(cell.cell_key), cell);

    if (cell.primaryUnitId) {
      cellsById.set(cell.primaryUnitId, cell);
      cellsById.set(normId(cell.primaryUnitId), cell);
    }

    if (cell.displayTitle) {
      cellsById.set(cell.displayTitle, cell);
      cellsById.set(normId(cell.displayTitle), cell);
    }

    if (cell.master_key) {
      cellsById.set(cell.master_key, cell);
      cellsById.set(normId(cell.master_key), cell);
    }

    for (const id of cell.unitIds) {
      cellsById.set(id, cell);
      cellsById.set(normId(id), cell);
    }
  }

  const edgeRows = parseCSV(edgeText);
  const jsonEdges = Array.isArray(treePayload.edges)
    ? treePayload.edges
    : (Array.isArray(treePayload.arrows) ? treePayload.arrows : []);

  state.edges = buildVisibleEdges(edgeRows, null, cellsById);
  state.arrowSourceUsed = "csv";

  if (!state.edges.length && jsonEdges.length) {
    state.edges = buildVisibleEdges(jsonEdges, null, cellsById);
    state.arrowSourceUsed = "json-fallback";
  }

  const { rankLayout, width, height } = computeRankLayout(state.cells);
  treeShellEl.style.width = `${width}px`;
  treeShellEl.style.height = `${height}px`;

  renderRankBands(rankLayout, width);
  state.rectMap = renderCells(state.cells, rankLayout);
  renderEdges();
  updateInventorySummary();

  const first = state.cells.find(c => !c.isGroup) || state.cells[0];
  if (first) selectCell(first);

  const counts = { tech: 0, premium: 0, squadron: 0, event: 0, pack: 0 };
  for (const cell of state.cells) {
    counts[cell.mainType] = (counts[cell.mainType] || 0) + 1;
  }

  setStatus(
`Loaded OK
Tree: ${TREE_JSON_URL}
Flags: ${FLAGS_JSON_URL}
Registry: ${REGISTRY_CSV_URL}
Edges: ${EDGES_CSV_URL}
Visible cells: ${state.cells.length}
Drawn arrows: ${state.edges.length}
Premium: ${counts.premium} | Squadron: ${counts.squadron} | Event: ${counts.event} | Pack: ${counts.pack}
Flag rows indexed: ${state.flagMap.size}
Arrow source used: ${state.arrowSourceUsed || "csv"}
Rules enabled: ${state.rulesEnabled}
Country key: ${state.countryKey}
Cell height scale: ${CELL_HEIGHT_SCALE}
Image scale: ${IMAGE_SCALE}`
  );
}

if (treeShellEl && rankLayerEl && edgeLayerEl && nodeLayerEl) {
  initiateSystem().catch(err => {
    console.error(err);
    setStatus(`Init failed: ${err.message || err}`, true);
  });
} else {
  console.error("Critical DOM nodes missing for engine bootstrap.");
}
