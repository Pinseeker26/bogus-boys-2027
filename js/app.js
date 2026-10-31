const demoData = {
  nextEvent: {
    title: "Bogus Boys League Night",
    date: "Coming Soon",
    time: "TBD",
    deadline: "TBD"
  },
  attendance: [],
 pairings: [],
  standings: {
    combined: [
      { rank:1, player:"Jimmy C.", flight:"A", points:128 },
      { rank:2, player:"Adam R.", flight:"A", points:121 },
      { rank:3, player:"Lou C.", flight:"B", points:116 },
      { rank:4, player:"Donnie W.", flight:"A", points:109 },
      { rank:5, player:"Pedro B.", flight:"B", points:103 }
    ],
    a: [
      { rank:1, player:"Jimmy C.", flight:"A", points:128 },
      { rank:2, player:"Adam R.", flight:"A", points:121 },
      { rank:3, player:"Donnie W.", flight:"A", points:109 }
    ],
    b: [
      { rank:1, player:"Lou C.", flight:"B", points:116 },
      { rank:2, player:"Pedro B.", flight:"B", points:103 },
      { rank:3, player:"Jeff H.", flight:"B", points:98 }
    ]
  },
  handicaps: [
    { player:"Jimmy C.", flight:"A", index:5.8, course:6, quota:30 },
    { player:"Adam R.", flight:"A", index:7.6, course:8, quota:28 },
    { player:"Lou C.", flight:"B", index:11.7, course:12, quota:24 },
    { player:"Pedro B.", flight:"B", index:13.5, course:14, quota:22 },
    { player:"Jeff H.", flight:"B", index:15.1, course:16, quota:20 }
  ],
  stats: [
    { label:"Most Rounds", value:"18", note:"Season leader" },
    { label:"Low Net", value:"63", note:"Best round this season" },
    { label:"Quota High", value:"+9", note:"Best quota finish" },
    { label:"Points Leader", value:"128", note:"Bogus Boys points" }
  ],
  latestResults: {
    netA: { winner:"Jimmy C.", score:"Net 68" },
    netB: { winner:"Lou C.", score:"Net 66" },
    quotaA: { winner:"Adam R.", score:"+6" },
    quotaB: { winner:"Pedro B.", score:"+5" }
  }
};

async function fetchEndpoint(action) {
    const cfg = window.LEAGUE_CONFIG;

    if (!cfg.useLiveData || !cfg.appsScriptUrl) {
        return null;
    }

    const cacheKey = `leagueData_${action}`;
    const cachedText = localStorage.getItem(cacheKey);

    if (
    cachedText &&
    action !== "attendance" &&
    action !== "pairings"
) {
        const cachedData = JSON.parse(cachedText);

        fetch(
            `${cfg.appsScriptUrl}?action=${encodeURIComponent(action)}&t=${Date.now()}`,
            { cache: "no-store" }
        )
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status}`);
                }

                return response.json();
            })
            .then(freshData => {
                localStorage.setItem(
                    cacheKey,
                    JSON.stringify(freshData)
                );
            })
            .catch(error => {
                console.error(`Background refresh failed for ${action}:`, error);
            });

        return cachedData;
    }

    const response = await fetch(
        `${cfg.appsScriptUrl}?action=${encodeURIComponent(action)}&t=${Date.now()}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();

    localStorage.setItem(
        cacheKey,
        JSON.stringify(data)
    );

    return data;
}

function badgeClass(status) {
  if (status.toLowerCase().startsWith("yes")) return "yes";
  if (status.toLowerCase().startsWith("no response")) return "waiting";
  return "no";
}

function renderAttendance(rows) {
  const tbody = document.getElementById("attendanceTable");
  if (!tbody) return;
  tbody.innerHTML = rows.map(row => `
    <tr>
      <td><strong>${row.player}</strong></td>
      <td><span class="badge ${badgeClass(row.status)}">${row.status}</span></td>
      <td>${row.flight}</td>
      <td>${row.handicap}</td>
      <td>${row.quota}</td>
    </tr>
  `).join("");
}

function renderPairings(groups) {
  const grid = document.getElementById("pairingsGrid");
  if (!grid) return;
  grid.innerHTML = groups.map(group => `
    <article class="pairing-card">
      <h3>${group.group}</h3>
      <ul class="player-list">
        ${group.players.map(player => `
    <li>
        <strong>${player.name}</strong>
        <span>HCP ${player.hdcp} | Q ${18 - player.hdcp}</span>
    </li>
`).join("")}
      </ul>
    </article>
  `).join("");
}

function renderStandings(rows) {
    const standingsTable = document.getElementById("standingsTable");

    if (!standingsTable) return;

    let activeFlight = "A";
    const tabs = document.querySelectorAll(".standings-page .tab");

    function getOrdinal(number) {
        const lastTwo = number % 100;

        if (lastTwo >= 11 && lastTwo <= 13) {
            return `${number}th`;
        }

        const lastDigit = number % 10;

        if (lastDigit === 1) return `${number}st`;
        if (lastDigit === 2) return `${number}nd`;
        if (lastDigit === 3) return `${number}rd`;

        return `${number}th`;
    }

    function drawTable() {
        let filteredRows;

        if (activeFlight === "Combined") {
            filteredRows = [...rows];
        } else {
            filteredRows = rows.filter(row => row.flight === activeFlight);
        }

        filteredRows.sort((a, b) => {
            return Number(b.ytdPoints) - Number(a.ytdPoints);
        });

        const rankedRows = [];

filteredRows.forEach((row, index) => {
    const points = Number(row.ytdPoints);

    let calculatedRank = index + 1;

    if (
        index > 0 &&
        points === Number(filteredRows[index - 1].ytdPoints)
    ) {
        calculatedRank = rankedRows[index - 1].calculatedRank;
    }

    rankedRows.push({
        ...row,
        calculatedRank
    });
});

        const standingsPanel = document.querySelector(".standings-panel");

if (standingsPanel) {
    standingsPanel.classList.toggle(
        "show-flight-column",
        activeFlight === "Combined"
    );
}
const leaderName = document.getElementById("standingsLeaderName");
const leaderPoints = document.getElementById("standingsLeaderPoints");
const bubbleName = document.getElementById("standingsBubbleName");
const bubblePoints = document.getElementById("standingsBubblePoints");
const playerCount = document.getElementById("standingsPlayerCount");

const leader = rankedRows[0];
const bubble = rankedRows[15];

if (leaderName) {
    leaderName.textContent = leader ? leader.player : "—";
}

if (leaderPoints) {
    leaderPoints.textContent = leader
        ? `${Number(leader.ytdPoints).toLocaleString("en-US")} BBPts`
        : "— BBPts";
}

if (bubbleName) {
    bubbleName.textContent = bubble ? bubble.player : "Not Set";
}

if (bubblePoints) {
    bubblePoints.textContent = bubble
        ? `${Number(bubble.ytdPoints).toLocaleString("en-US")} BBPts • 16th Place`
        : "Top 16 Playoff Cut";
}

if (playerCount) {
    playerCount.textContent = rankedRows.length;
}
standingsTable.innerHTML = rankedRows.map((row, index) => {
    const tied =
        rankedRows.some((otherRow, otherIndex) =>
            otherIndex !== index &&
            Number(otherRow.ytdPoints) === Number(row.ytdPoints)
        );

    const placement = `${getOrdinal(row.calculatedRank)}${tied ? " (T)" : ""}`;

    let rowClass = "";
let rankClass = "";

if (row.calculatedRank === 1) {
    rowClass = "standings-first";
    rankClass = "rank-gold";
} else if (row.calculatedRank === 2) {
    rowClass = "standings-second";
    rankClass = "rank-silver";
} else if (row.calculatedRank === 3) {
    rowClass = "standings-third";
    rankClass = "rank-bronze";
}

const formattedPoints = Number(row.ytdPoints).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});;

    return `
        <tr class="${rowClass}">
            <td class="standings-rank">
    <span class="rank-badge ${rankClass}">
        ${placement}
    </span>
</td>

            <td class="standings-player">
                ${row.player}
            </td>

            <td class="standings-flight-column">
                <span class="flight-pill">${row.flight}</span>
            </td>

            <td class="text-right standings-points">
                <strong>${formattedPoints}</strong>
                <span>BBPts</span>
            </td>
        </tr>
    `;
}).join("");
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(button => button.classList.remove("active"));
            tab.classList.add("active");

            const value = tab.dataset.tab;

            if (value === "a") activeFlight = "A";
            if (value === "b") activeFlight = "B";
            if (value === "combined") activeFlight = "Combined";

            drawTable();
        });
    });

    drawTable();
}

function renderHandicaps(rows) {
  const handicapTableA = document.getElementById("handicapTableA");
  const handicapTableB = document.getElementById("handicapTableB");
  const courseButtons = document.querySelectorAll(".courseToggleButton");

  if (!handicapTableA || !handicapTableB) return;

  let selectedCourse = "west";

  function drawTables() {
    const handicapField = `${selectedCourse}Handicap`;
    const quotaField = `${selectedCourse}Quota`;

    const aFlightRows = rows.filter(row => row.flight === "A");
    const bFlightRows = rows.filter(row => row.flight === "B");

    const buildRows = flightRows => flightRows.map(row => `
      <tr>
        <td><strong>${row.player}</strong></td>
        <td>${row.currentIndex}</td>
        <td>${row[handicapField] ?? "-"}</td>
        <td>${row[quotaField] ?? "-"}</td>
      </tr>
    `).join("");

    handicapTableA.innerHTML = buildRows(aFlightRows);
    handicapTableB.innerHTML = buildRows(bFlightRows);
  }

  courseButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedCourse = button.dataset.course;

      courseButtons.forEach(courseButton => {
        courseButton.classList.remove("active");
      });

      button.classList.add("active");
      drawTables();
    });
  });

  drawTables();
}

function renderStats(stats) {
  const statsGrid = document.getElementById("statsGrid");

if (!statsGrid) return;

statsGrid.innerHTML = stats.map(stat => `
    <article class="stat-card">
      <span>${stat.label}</span>
      <strong>${stat.value}</strong>
      <p>${stat.note}</p>
    </article>
  `).join("");
}

function renderNextEvent(event) {
  const nextEventTitle = document.getElementById("nextEventTitle");

if (!nextEventTitle) return;
  document.getElementById("nextEventTitle").textContent = event.title;
  document.getElementById("nextEventDate").textContent = event.date;
  document.getElementById("nextEventTime").textContent = event.time;
  document.getElementById("attendanceDeadline").textContent = event.deadline;
}

function renderResults(results) {
    const netAWinner = document.getElementById("netAWinner");

    if (!netAWinner || !results) return;

    document.getElementById("netAWinner").textContent =
        results.netA?.winner || "Results Pending";

    document.getElementById("netAScore").textContent =
        results.netA?.score || "";

    document.getElementById("netBWinner").textContent =
        results.netB?.winner || "Results Pending";

    document.getElementById("netBScore").textContent =
        results.netB?.score || "";

    document.getElementById("quotaAWinner").textContent =
        results.quotaA?.winner || "Results Pending";

    document.getElementById("quotaAScore").textContent =
        results.quotaA?.score || "";

    document.getElementById("quotaBWinner").textContent =
        results.quotaB?.winner || "Results Pending";

    document.getElementById("quotaBScore").textContent =
        results.quotaB?.score || "";
}

async function init() {
  let data = { ...demoData };

  if (window.LEAGUE_CONFIG.useLiveData) {
    try {
      let attendance = null;
let pairings = null;
let handicaps = null;

try {
    attendance = await fetchEndpoint(
        window.LEAGUE_CONFIG.endpoints.attendance
    );
} catch (error) {
    console.error("Attendance failed", error);
}

try {
    pairings = await fetchEndpoint(
        window.LEAGUE_CONFIG.endpoints.pairings
    );
} catch (error) {
    console.error("Pairings failed", error);
}

try {
    handicaps = await fetchEndpoint(
        window.LEAGUE_CONFIG.endpoints.handicaps
    );
} catch (error) {
    console.error("Handicaps failed", error);
}
      data = {
  ...demoData,
  attendance: attendance || demoData.attendance,
  pairings: pairings || demoData.pairings,
  handicaps: handicaps || demoData.handicaps
};

      const attendanceStatus =
        document.getElementById("attendanceStatus");

      if (attendanceStatus) {
        attendanceStatus.textContent = "Live Data";
      }
    } catch (error) {
      console.error(error);

      const attendanceStatus =
        document.getElementById("attendanceStatus");

      if (attendanceStatus) {
        attendanceStatus.textContent = "Demo Data";
      }
    }
  }

  renderNextEvent(data.nextEvent);
  renderAttendance(data.attendance);
  renderPairings(data.pairings);
  renderHandicaps(data.handicaps);
  renderStats(data.stats);
  renderResults(data.latestResults);
}

const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

if (navToggle && mainNav) {
    navToggle.addEventListener("click", () => {
        mainNav.classList.toggle("open");
        navToggle.setAttribute(
            "aria-expanded",
            mainNav.classList.contains("open")
        );
    });
}

document.querySelectorAll(".main-nav a").forEach(link => {
    link.addEventListener("click", () => {
        if (mainNav) {
            mainNav.classList.remove("open");
        }
    });
});



init();
async function loadLeagueStatsPage() {

    const statsTable = document.getElementById("leagueStatsTable");
    const description = document.getElementById("statsTableDescription");
    const tabs = document.querySelectorAll('.tabs .tab[data-tab]');
let liveLeagueStats = {};

try {
    liveLeagueStats = await fetchEndpoint("leagueStats");
} catch (error) {
    console.error("Unable to load live league stats:", error);
}
    if (!statsTable || !liveLeagueStats) return;

    function renderLeagueStats(course = "west") {

        const courseStats =
    liveLeagueStats[course] ||
    liveLeagueStats.combined ||
    [];

        statsTable.innerHTML = courseStats.map(player => `
            <tr>
                <td>${player.player}</td>
                <td class="text-center">${player.roundsPlayed}</td>
<td class="text-center">${player.bestGrossScore}</td>
<td class="text-center">${player.eagles}</td>
<td class="text-center">${player.birdies}</td>
<td class="text-center">${player.pars}</td>
<td class="text-center">${player.bogeys}</td>
<td class="text-center">${player.doubleBogeysPlus}</td>
                <td class="text-right">${player.netScoreMoneyWon}</td>
                <td class="text-right">${player.moneyHoleMoneyWon}</td>
                <td class="text-right">${player.totalMoneyWon}</td>
            </tr>
        `).join("");

        const courseNames = {
            west: "West Course season statistics.",
            north: "North Course season statistics.",
            south: "South Course season statistics.",
            combined: "Combined statistics from all three Rolling Acres courses."
        };

        if (description) {
    description.textContent = courseNames[course];
}
    }
console.log(liveLeagueStats);
    renderLeagueStats("west");

    document.addEventListener("click", event => {
    const button = event.target.closest(".tab[data-tab]");

    if (!button || !document.getElementById("leagueStatsTable")) return;

    tabs.forEach(tab => tab.classList.remove("active"));
    button.classList.add("active");

    renderLeagueStats(button.dataset.tab);
});
}

document.addEventListener("DOMContentLoaded", loadLeagueStatsPage);
async function loadPlayersPage() {

    const playerGrid = document.getElementById("playerGrid");
    let standings = [];

    try {
        standings = await fetchEndpoint("standings");
    } catch (error) {
        console.error("Unable to load live standings:", error);
    }

    let handicaps = [];

    try {
        handicaps = await fetchEndpoint("handicaps");
    } catch (error) {
        console.error("Unable to load live handicaps:", error);
    }

    if (!playerGrid || !leagueData.players) return;

    playerGrid.innerHTML = "";

    leagueData.players.forEach(player => {

        const standing = standings.find(
            s =>
                s.player?.trim().toLowerCase() ===
                player.name?.trim().toLowerCase()
        );

        const handicap = handicaps.find(
            h =>
                h.player?.trim().toLowerCase() ===
                player.name?.trim().toLowerCase()
        );


        playerGrid.innerHTML += `
            <article class="player-card" onclick="window.location.href='players-profile.html?player=${encodeURIComponent(player.name)}'">

                <div class="player-card-header">
                    <h3>${player.name}</h3>
                </div>

                <div class="player-card-stats">

                    <div class="player-stat">
                        <span class="stat-label">Handicap Index</span>
                        <span class="stat-value">${handicap ? handicap.currentIndex : "—"}</span>
                    </div>

                    <div class="player-stat">
                        <span class="stat-label">Flight</span>
                        <span class="stat-value">${standing ? standing.flight : "—"}</span>
                    </div>

                    <div class="player-stat">
                        <span class="stat-label">League Points</span>
                        <span class="stat-value">${standing ? standing.ytdPoints : "—"}</span>
                    </div>

                </div>

            </article>
        `;

    });

}
function loadPlayerOfTheYearPage() {

    const table = document.getElementById("potyTableBody");
    const leaderCard = document.getElementById("currentLeaderCard");

    if (!table || !leaderCard || !leagueData.standings) return;

    const leader = leagueData.standings[0];

    leaderCard.innerHTML = `
        <h3>🏆 Current Player of the Year Leader</h3>
        <h2>${leader.player}</h2>
        <p>${leader.points} Points</p>
    `;

    table.innerHTML = leagueData.standings.map(player => `
        <tr>
            <td>${player.rank}</td>
            <td>${player.player}</td>
            <td>${player.points}</td>
        </tr>
    `).join("");

}

async function loadStandingsPage() {
    const standingsTable = document.getElementById("standingsTable");

    if (!standingsTable) return;

    try {
        const rows = await fetchEndpoint("standings");

        if (!rows || !Array.isArray(rows)) {
            throw new Error("No standings data returned.");
        }

        renderStandings(rows);

    } catch (error) {
        console.error("Standings failed to load:", error);

        standingsTable.innerHTML = `
            <tr>
                <td colspan="4">Standings are currently unavailable.</td>
            </tr>
        `;
    }
}

document.addEventListener("DOMContentLoaded", loadStandingsPage);
function renderWeeklyResults(data) {
    const leaderboardBody = document.getElementById("completeLeaderboard");

    if (!leaderboardBody) return;

    const rows = [...data.leaderboard]
    .sort((a, b) => {
    if (a.flight !== b.flight) {
        return a.flight.localeCompare(b.flight);
    }

    return a.player.localeCompare(b.player);
});

    const flightA = rows.filter(player => player.flight === "A");
const flightB = rows.filter(player => player.flight === "B");

const formatMoney = value => {
    const amount = Number(
        String(value ?? 0).replace(/[$,]/g, "")
    );

    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });
};

const buildFlightSection = (flight, players) => {
    if (!players.length) return "";

    return `
        <tr class="results-flight-divider">
            <td colspan="10">${flight} FLIGHT</td>
        </tr>

        ${players.map(player => `
            <tr class="official-results-row">
                <td class="results-golfer">${player.player}</td>
                <td class="text-center">${player.gross}</td>
<td class="text-center">${player.handicap}</td>
<td class="text-center">${player.net}</td>
<td class="text-center">${player.quotaNeeded}</td>
<td class="text-center ${Number(player.plusMinus) > 0
    ? "positive-result"
    : Number(player.plusMinus) < 0
        ? "negative-result"
        : ""}">
                    ${Number(player.plusMinus) > 0 ? "+" : ""}${player.plusMinus}
                </td>
                <td class="text-center">${player.bbPointsWon}</td>
                <td class="text-center ${Number(player.formatWinnings.replace(/[$,]/g, "")) > 0 ? "money-winner" : "money-zero"}">
    ${formatMoney(player.formatWinnings)}
</td>

<td class="text-center ${Number(player.moneyHoleWinnings.replace(/[$,]/g, "")) > 0 ? "money-winner" : "money-zero"}">
    ${formatMoney(player.moneyHoleWinnings)}
</td>

<td class="text-center ${Number(player.totalWinnings.replace(/[$,]/g, "")) > 0 ? "money-winner" : "money-zero"}">
    ${formatMoney(player.totalWinnings)}
</td>
            </tr>
        `).join("")}
    `;
};

leaderboardBody.innerHTML =
    buildFlightSection("A", flightA) +
    buildFlightSection("B", flightB);

    const moneyHoles = data.moneyHoles || [];

    const moneyHoleOneA = moneyHoles.find(
    result => result.flight === "A"
);

const moneyHoleTwoA = moneyHoles.filter(
    result => result.flight === "A"
)[1];

const moneyHoleOneB = moneyHoles.find(
    result => result.flight === "B"
);

const moneyHoleTwoB = moneyHoles.filter(
    result => result.flight === "B"
)[1];

    const setText = (id, value, fallback = "TBD") => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value || fallback;
        }
    };
const setMoneyHoleHeader = (numberId, titleId, label) => {
    const holeMatch = String(label || "").match(/#\s*(\d+)/);
    const holeNumber = holeMatch ? holeMatch[1] : "";

    const title = String(label || "").toUpperCase().includes("CTP")
        ? "Closest to the Pin"
        : String(label || "").toUpperCase().includes("LFP")
            ? "Longest First Putt"
            : "Money Hole";

    setText(numberId, holeNumber ? `Hole ${holeNumber}` : "Hole");
    setText(titleId, title, "Money Hole");
};

setMoneyHoleHeader(
    "moneyHoleOneNumber",
    "moneyHoleOneTitle",
    moneyHoleOneA?.label
);

setMoneyHoleHeader(
    "moneyHoleTwoNumber",
    "moneyHoleTwoTitle",
    moneyHoleTwoA?.label
);
    setText("moneyHoleOneAWinner", moneyHoleOneA?.winner, "");
setText("moneyHoleTwoAWinner", moneyHoleTwoA?.winner, "");
setText("moneyHoleOneBWinner", moneyHoleOneB?.winner, "");
setText("moneyHoleTwoBWinner", moneyHoleTwoB?.winner, "");

setText("moneyHoleOneAPrize", moneyHoleOneA?.winnings, "$0.00");
setText("moneyHoleTwoAPrize", moneyHoleTwoA?.winnings, "$0.00");
setText("moneyHoleOneBPrize", moneyHoleOneB?.winnings, "$0.00");
setText("moneyHoleTwoBPrize", moneyHoleTwoB?.winnings, "$0.00");

    const summary = data.summary || {};
const winners = data.flightWinners || {};
setText("resultsDate", summary.date);
setText("resultsCourse", summary.course);
document.getElementById("resultsWeek").style.display = "none";
setText("resultsFormat", summary.format);
setText("summaryPrizePool", summary.prizePool);
setText("resultsPlayers", summary.players);
// A Flight
setText("flightAFirst", winners.A?.first?.player);
setText("flightAFirstNote", winners.A?.first?.score, "");
setText("flightAFirstPrize", winners.A?.first?.winnings || "$0");

setText("flightASecond", winners.A?.second?.player);
setText("flightASecondNote", winners.A?.second?.score, "");
setText("flightASecondPrize", winners.A?.second?.winnings || "$0");

// B Flight
setText("flightBFirst", winners.B?.first?.player);
setText("flightBFirstNote", winners.B?.first?.score, "");
setText("flightBFirstPrize", winners.B?.first?.winnings || "$0");

setText("flightBSecond", winners.B?.second?.player);
setText("flightBSecondNote", winners.B?.second?.score, "");
setText("flightBSecondPrize", winners.B?.second?.winnings || "$0");

}
async function loadWeeklyResultsPage() {
console.log("loadWeeklyResultsPage started");
    const leaderboard = document.getElementById("completeLeaderboard");

    if (!leaderboard) return;

    try {

        const data = await fetchEndpoint("weeklyResults");

        if (!data || !Array.isArray(data.leaderboard)) {
            throw new Error("No weekly results returned.");
        }

        renderWeeklyResults(data);

    } catch (error) {

        console.error("Weekly Results failed to load:", error);

        leaderboard.innerHTML = `
            <tr>
                <td colspan="6">Weekly results are currently unavailable.</td>
            </tr>
        `;
    }

}
function loadHandicapsPage() {

    const handicapTableA = document.getElementById("handicapTableA");
    const handicapTableB = document.getElementById("handicapTableB");

    if (!handicapTableA || !handicapTableB || !leagueData.handicaps) return;

    const flightA = leagueData.handicaps.filter(player => player.flight === "A");
    const flightB = leagueData.handicaps.filter(player => player.flight === "B");

    handicapTableA.innerHTML = flightA.map(player => `
        <tr>
            <td>${player.player}</td>
            <td>${player.index.toFixed(3)}</td>
            <td>${player.courseHandicap}</td>
            <td>${player.quota}</td>
        </tr>
    `).join("");

    handicapTableB.innerHTML = flightB.map(player => `
        <tr>
            <td>${player.player}</td>
            <td>${player.index.toFixed(3)}</td>
            <td>${player.courseHandicap}</td>
            <td>${player.quota}</td>
        </tr>
    `).join("");

}

document.addEventListener("DOMContentLoaded", loadHandicapsPage);
function loadHallOfChampionsPage() {

    const champions = leagueData.hallOfChampions;

    if (!champions) return;

    const leagueChampion = document.getElementById("leagueChampion");
    if (!leagueChampion) return;

    document.querySelectorAll(".champion-year").forEach(year => {
        year.textContent = champions.year;
    });

    document.getElementById("leagueChampion").textContent =
        champions.leagueChampion.player;

    document.getElementById("leagueChampionResult").textContent =
        champions.leagueChampion.result;

    document.getElementById("mostWeeklyWins").textContent =
        champions.mostWeeklyWins.player;

    document.getElementById("mostWeeklyWinsResult").textContent =
        champions.mostWeeklyWins.result;

    document.getElementById("bestAverageGross").textContent =
        champions.bestAverageGross.player;

    document.getElementById("bestAverageGrossResult").textContent =
        champions.bestAverageGross.result;

    document.getElementById("grandTotalMoney").textContent =
        champions.grandTotalMoney.player;

    document.getElementById("grandTotalMoneyResult").textContent =
        champions.grandTotalMoney.result;

    document.getElementById("averageMoneyPerRound").textContent =
        champions.averageMoneyPerRound.player;

    document.getElementById("averageMoneyPerRoundResult").textContent =
        champions.averageMoneyPerRound.result;
}


document.addEventListener("DOMContentLoaded", loadWeeklyResultsPage);
function loadFeed() {

    const feedList = document.getElementById("feedList");

    if (!feedList || !leagueData.feed) return;

    feedList.innerHTML = leagueData.feed.map(item => `
        <article class="feed-item">
            <span class="feed-date">${item.date}</span>
            <h3>${item.title}</h3>
            <p>${item.message}</p>
        </article>
    `).join("");

}

document.addEventListener("DOMContentLoaded", loadFeed);
async function renderThisWeek() {
    const aFirstPurse = document.getElementById("aFirstPurse");
const aSecondPurse = document.getElementById("aSecondPurse");
const aMoneyHolePurse = document.getElementById("aMoneyHolePurse");

const bFirstPurse = document.getElementById("bFirstPurse");
const bSecondPurse = document.getElementById("bSecondPurse");
const bMoneyHolePurse = document.getElementById("bMoneyHolePurse");

const yearEndPot = document.getElementById("yearEndPot");
    const currentWeek = await fetchEndpoint("thisWeek");
    if (!currentWeek) return;
    const courseMoneyHoles =
        leagueMoneyHoles.courses[currentWeek.course] || [];

    const weekCourse = document.getElementById("weekCourse");
    const weekCourseNine = document.getElementById("weekCourseNine");
    const weekMoneyHoleOne = document.getElementById("weekMoneyHoleOne");
    const weekMoneyHoleTwo = document.getElementById("weekMoneyHoleTwo");
    const weekFormat = document.getElementById("weekFormat");
    const weekWager = document.getElementById("weekWager");
    const weekAttendance = document.getElementById("weekAttendance");
    const weekAttendancePending =
        document.getElementById("weekAttendancePending");
    const weekTeeTime = document.getElementById("weekTeeTime");
const weekCountdown = document.getElementById("weekCountdown");
const overviewTitle = document.getElementById("overviewTitle");
    if (!weekCourse) return;

    weekCourseNine.textContent = `${currentWeek.course} Course`;
    if (weekCourseNine) {
   if (weekFormat) {
    weekFormat.textContent = currentWeek.format;
} 
if (overviewTitle) {
    overviewTitle.textContent =
        `${currentWeek.date} Overview`;
}
}
    if (weekMoneyHoleOne) {
    weekMoneyHoleOne.textContent = currentWeek.moneyHoleOne;
}

    if (weekMoneyHoleTwo) {
    weekMoneyHoleTwo.textContent = currentWeek.moneyHoleTwo;
}
if (aFirstPurse) {
    aFirstPurse.textContent = currentWeek.aFlightFirst;
}

if (aSecondPurse) {
    aSecondPurse.textContent = currentWeek.aFlightSecond;
}

if (aMoneyHolePurse) {
    aMoneyHolePurse.textContent = currentWeek.aFlightMoneyHoles;
}

if (bFirstPurse) {
    bFirstPurse.textContent = currentWeek.bFlightFirst;
}

if (bSecondPurse) {
    bSecondPurse.textContent = currentWeek.bFlightSecond;
}

if (bMoneyHolePurse) {
    bMoneyHolePurse.textContent = currentWeek.bFlightMoneyHoles;
}

if (yearEndPot) {
    yearEndPot.textContent = currentWeek.potYtd;
}
   if (weekWager) {
    weekWager.textContent = `$${currentWeek.wager.toFixed(2)}`;
}
    if (weekAttendance) {
    weekAttendance.textContent =
        `${currentWeek.attendanceConfirmed} Confirmed`;
}

if (weekAttendancePending) {
    weekAttendancePending.textContent =
        `${currentWeek.attendancePending} Pending`;
}

if (weekTeeTime) {
    weekTeeTime.textContent = currentWeek.teeTime;
}
    const [month, day, year] = currentWeek.date.split("-").map(Number);
const leagueDate = new Date(year, month - 1, day);
const today = new Date();

today.setHours(0, 0, 0, 0);
leagueDate.setHours(0, 0, 0, 0);

const daysRemaining = Math.ceil(
    (leagueDate - today) / (1000 * 60 * 60 * 24)
);

if (weekCountdown) {
    if (daysRemaining === 0) {
        weekCountdown.textContent = "Today";
    } else if (daysRemaining === 1) {
        weekCountdown.textContent = "Tomorrow";
    } else if (daysRemaining > 1) {
        weekCountdown.textContent = `${daysRemaining} Days`;
    } else {
        weekCountdown.textContent = "Completed";
    }
}
}
async function loadPlayoffsPage() {

    const playoffSeedingTable =
        document.getElementById("playoffSeedingTable");

    const top16Table =
        document.getElementById("top16Table");

    const championshipTable =
        document.getElementById("championshipTable");

    const championName =
    document.getElementById("playoffChampionName");

const secondName =
    document.getElementById("playoffSecondName");

const thirdName =
    document.getElementById("playoffThirdName");

const fourthName =
    document.getElementById("playoffFourthName");

    if (!playoffSeedingTable) return;

    let playoffs = {};

    try {
        playoffs = await fetchEndpoint("playoffs");
    } catch (error) {
        console.error("Unable to load playoff data:", error);
        return;
    }

    playoffSeedingTable.innerHTML = playoffs.seeding
    .filter(row => row[5])
    .map(row => `
        <tr>
            <td>${row[3]}</td>
            <td>${row[4]}</td>
            <td>${row[5]}</td>
            <td class="text-center">${row[6]}</td>
            <td class="text-center">${row[7]}</td>
            <td class="text-center">${row[8]}</td>
        </tr>
    `)
    .join("");

    if (top16Table) {
    top16Table.innerHTML = playoffs.sweet16
        .filter(row => row[0])
        .map(row => `
           <tr>
    <td>${row[0]}</td>
    <td>${row[2]}</td>
    <td>${row[1]}</td>
    <td>${row[3]}</td>
    <td>${row[4]}</td>
    <td>${row[5]}</td>
</tr>
        `)
        .join("");
}
if (championshipTable) {
    championshipTable.innerHTML = playoffs.championship
        .filter(row => row[0])
        .map(row => `
           <tr>
    <td>${row[0]}</td>
    <td>${row[2]}</td>
    <td>${row[1]}</td>
    <td class="text-center">${row[3]}</td>
    <td class="text-center">${row[4]}</td>
    <td class="text-center">${row[5]}</td>
    <td class="text-center">${row[6]}</td>
</tr>
        `)
        .join("");
}
const placements = playoffs.placements || [];

if (championName) {
    championName.textContent =
        placements[0]?.[1] || "To Be Determined";
}

if (secondName) {
    secondName.textContent =
        placements[1]?.[1] || "To Be Determined";
}

if (thirdName) {
    thirdName.textContent =
        placements[2]?.[1] || "To Be Determined";
}

if (fourthName) {
    fourthName.textContent =
        placements[3]?.[1] || "To Be Determined";
}
const reseedTable = document.getElementById("reseedPointsTable");
const round1Table = document.getElementById("round1PointsTable");
const round2Table = document.getElementById("round2PointsTable");

if (reseedTable) {
    reseedTable.innerHTML = (playoffs.reseedPoints || [])
        .filter(row => row[0])
        .map(row => `
            <div class="playoff-points-list-row">
                <span>${row[0]}</span>
                <span>${row[1]}</span>
            </div>
        `)
        .join("");
}

if (round1Table) {
    round1Table.innerHTML = (playoffs.round1Points || [])
        .filter(row => row[0])
        .map(row => `
            <div class="playoff-points-list-row">
                <span>${row[0]}</span>
                <span>${row[1]}</span>
            </div>
        `)
        .join("");
}

if (round2Table) {
    round2Table.innerHTML = (playoffs.round2Points || [])
        .filter(row => row[0])
        .map(row => `
            <div class="playoff-points-list-row">
                <span>${row[0]}</span>
                <span>${row[1]}</span>
            </div>
        `)
        .join("");
}

if (round2Table) {
    round2Table.innerHTML = (playoffs.round2Points || [])
        .filter(row => row[0])
        .map(row => `
            <div class="playoff-points-list-row">
                <span>${row[0]}</span>
                <span>${row[1]}</span>
            </div>
        `)
        .join("");
}
}
function loadHallOfChampionsPage() {
    const champions = leagueData.hallOfChampions;

    if (!champions) {
        return;
    }

    const leagueChampion = document.getElementById("leagueChampion");
    const leagueChampionResult = document.getElementById("leagueChampionResult");

    const mostWeeklyWins = document.getElementById("mostWeeklyWins");
    const mostWeeklyWinsResult = document.getElementById("mostWeeklyWinsResult");

    const grandTotalMoney = document.getElementById("grandTotalMoney");
    const grandTotalMoneyResult = document.getElementById("grandTotalMoneyResult");

    const bestAverageGross = document.getElementById("bestAverageGross");
    const bestAverageGrossResult = document.getElementById("bestAverageGrossResult");

    const averageMoneyPerRound = document.getElementById("averageMoneyPerRound");
    const averageMoneyPerRoundResult = document.getElementById("averageMoneyPerRoundResult");

    if (leagueChampion) {
        leagueChampion.textContent = champions.leagueChampion.winner;
    }

    if (leagueChampionResult) {
        leagueChampionResult.textContent = champions.leagueChampion.result;
    }

    if (mostWeeklyWins) {
        mostWeeklyWins.textContent = champions.mostWeeklyWins.winner;
    }

    if (mostWeeklyWinsResult) {
        mostWeeklyWinsResult.textContent = champions.mostWeeklyWins.result;
    }

    if (grandTotalMoney) {
        grandTotalMoney.textContent = champions.grandTotalMoney.winner;
    }

    if (grandTotalMoneyResult) {
        grandTotalMoneyResult.textContent = champions.grandTotalMoney.result;
    }

    if (bestAverageGross) {
        bestAverageGross.textContent = champions.bestAverageGross.winner;
    }

    if (bestAverageGrossResult) {
        bestAverageGrossResult.textContent = champions.bestAverageGross.result;
    }

    if (averageMoneyPerRound) {
        averageMoneyPerRound.textContent = champions.averageMoneyPerRound.winner;
    }

    if (averageMoneyPerRoundResult) {
        averageMoneyPerRoundResult.textContent = champions.averageMoneyPerRound.result;
    }
}
renderThisWeek();
document.addEventListener("DOMContentLoaded", loadHallOfChampionsPage);
async function loadPlayerProfilePage() {

    const profileName = document.getElementById("profilePlayerName");
    const profileSummary = document.getElementById("profileSummary");

    if (!profileName) return;

    const params = new URLSearchParams(window.location.search);
    const playerName = params.get("player");

    if (!playerName) return;

    profileName.textContent = playerName;

    let standings = [];
    let handicaps = [];

    try {
        standings = await fetchEndpoint("standings");
    } catch (error) {
        console.error("Unable to load live standings:", error);
    }

    try {
        handicaps = await fetchEndpoint("handicaps");
    } catch (error) {
        console.error("Unable to load live handicaps:", error);
    }

    const standing = standings.find(
        s =>
            s.player?.trim().toLowerCase() ===
            playerName.trim().toLowerCase()
    );

    const handicap = handicaps.find(
        h =>
            h.player?.trim().toLowerCase() ===
            playerName.trim().toLowerCase()
    );

        const profileContent = document.getElementById("profileContent");

profileContent.innerHTML = `
    <div class="statsGrid">

        <div class="statCard">
            <span class="statTitle">Flight</span>
            <span class="statValue">${standing?.flight || "—"}</span>
        </div>

        <div class="statCard">
            <span class="statTitle">Handicap Index</span>
            <span class="statValue">${handicap?.currentIndex || "—"}</span>
        </div>

 <div class="statCard">
    <span class="statTitle">League Points</span>
    <span class="statValue">${standing?.ytdPoints || "—"}</span>
    
</div>

    </div>
`;
}
document.addEventListener("DOMContentLoaded", loadPlayersPage);
document.addEventListener("DOMContentLoaded", loadPlayerProfilePage);
document.addEventListener("DOMContentLoaded", loadPlayoffsPage);
