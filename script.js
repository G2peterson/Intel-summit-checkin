const el = {
  nameInput: document.getElementById("attendee-name"),
  teamSelect: document.getElementById("team-select"),
  checkInBtn: document.getElementById("check-in-btn"),

  greeting: document.getElementById("greeting"),
  attendanceText: document.getElementById("attendance-text"),
  progressFill: document.getElementById("progress-fill"),

  waterCount: document.getElementById("water-count"),
  netZeroCount: document.getElementById("netzero-count"),
  renewablesCount: document.getElementById("renewables-count"),

  attendeeList: document.getElementById("attendee-list"),
  celebration: document.getElementById("celebration-message"),
  error: document.getElementById("error-message"),
};

const GOAL = 50;
const STORAGE_KEY = "intel_summit_checkin_state_v1";

let state = {
  total: 0,
  teamCounts: { water: 0, netZero: 0, renewables: 0 },
  attendees: [], // { name, teamKey, teamLabel, ts }
  lastGreeting: "",
};

function setText(node, text) {
  if (node) node.textContent = text;
}

function setError(msg) {
  setText(el.error, msg || "");
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.total !== "number") return;

    state.total = parsed.total || 0;
    state.teamCounts = {
      water: Number(parsed.teamCounts?.water || 0),
      netZero: Number(parsed.teamCounts?.netZero || 0),
      renewables: Number(parsed.teamCounts?.renewables || 0),
    };
    state.attendees = Array.isArray(parsed.attendees) ? parsed.attendees : [];
    state.lastGreeting = String(parsed.lastGreeting || "");
  } catch (e) {}
}

function teamFromSelect() {
  const v = String(el.teamSelect?.value || "");
  if (v === "water") return { key: "water", label: "Team Water Wise" };
  if (v === "netZero") return { key: "netZero", label: "Team Net Zero" };
  if (v === "renewables") return { key: "renewables", label: "Team Renewables" };
  return null;
}

function getWinners() {
  const entries = Object.entries(state.teamCounts);
  const max = Math.max(...entries.map(([, c]) => c));
  const winners = entries
    .filter(([, c]) => c === max)
    .map(([k]) => (k === "water" ? "Team Water Wise" : k === "netZero" ? "Team Net Zero" : "Team Renewables"));
  return winners;
}

function render() {
  // attendance text
  setText(el.attendanceText, `${state.total} / ${GOAL}`);

  // progress bar
  const pct = Math.min(100, Math.max(0, (state.total / GOAL) * 100));
  if (el.progressFill) {
    el.progressFill.style.width = `${pct}%`;
    el.progressFill.setAttribute("aria-valuenow", String(Math.round(pct)));
  }

  // team counts
  setText(el.waterCount, String(state.teamCounts.water));
  setText(el.netZeroCount, String(state.teamCounts.netZero));
  setText(el.renewablesCount, String(state.teamCounts.renewables));

  // greeting
  setText(el.greeting, state.lastGreeting);

  // attendee list (LevelUp)
  if (el.attendeeList) {
    el.attendeeList.innerHTML = "";
    const items = [...state.attendees].reverse();
    for (const a of items) {
      const li = document.createElement("li");
      li.textContent = `${a.name} (${a.teamLabel})`;
      el.attendeeList.appendChild(li);
    }
  }

  // celebration (LevelUp)
  if (el.celebration) {
    if (state.total >= GOAL) {
      const winners = getWinners();
      const winnerText = winners.length === 1 ? winners[0] : `Tie: ${winners.join(" + ")}`;
      setText(el.celebration, `Goal reached! Winning team: ${winnerText}`);
    } else {
      setText(el.celebration, "");
    }
  }
}

function handleCheckIn() {
  setError("");

  const name = String(el.nameInput?.value || "").trim();
  const team = teamFromSelect();

  if (!name) {
    setError("Please enter a name.");
    el.nameInput?.focus();
    return;
  }
  if (!team) {
    setError("Please select a team.");
    el.teamSelect?.focus();
    return;
  }

  state.total += 1;
  state.teamCounts[team.key] += 1;

  state.lastGreeting = `Welcome, ${name} from ${team.label}!`;
  state.attendees.push({ name, teamKey: team.key, teamLabel: team.label, ts: Date.now() });

  // clear inputs
  el.nameInput.value = "";
  el.teamSelect.selectedIndex = 0;

  saveState();
  render();
}

function init() {
  loadState();
  render();

  el.checkInBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    handleCheckIn();
  });

  el.nameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleCheckIn();
  });
}

init();
