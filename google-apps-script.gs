/**
 * PSC Simulator / League Site V1.0
 * Google Apps Script starter API
 *
 * Add this script to the Google Sheet that currently powers the Bogus Boys league.
 * Replace the ranges below after we inspect your actual sheet layouts.
 */

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || "";

  const routes = {
    attendance: getAttendance,
    pairings: getPairings,
    standings: getStandings,
    handicaps: getHandicaps,
    stats: getStats,
    latestResults: getLatestResults,
    nextEvent: getNextEvent
  };

  if (!routes[action]) {
    return jsonResponse({ error: "Unknown action", action: action });
  }

  try {
    return jsonResponse(routes[action]());
  } catch (error) {
    return jsonResponse({
      error: error.message,
      action: action
    });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAttendance() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Home Page");

  // Replace this sample range with the actual attendance table range.
  const values = sheet.getRange("A2:E26").getDisplayValues();

  return values
    .filter(row => row[0])
    .map(row => ({
      player: row[0],
      status: row[1],
      flight: row[2],
      handicap: row[3],
      quota: row[4]
    }));
}

function getPairings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Home Page");

  // Placeholder structure. We will connect this to your populated pairings area.
  const values = sheet.getRange("G2:J25").getDisplayValues();
  const groups = [];

  for (let col = 0; col < values[0].length; col++) {
    const players = values
      .map(row => row[col])
      .filter(Boolean)
      .map(name => ({ name: name, hdcp: "" }));

    if (players.length) {
      groups.push({
        group: "Group " + (col + 1),
        players: players
      });
    }
  }

  return groups;
}

function getStandings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const combined = readStandingsSheet(ss.getSheetByName("BBPts Combined"));
  const flightA = readStandingsSheet(ss.getSheetByName("BBPts A"));
  const flightB = readStandingsSheet(ss.getSheetByName("BBPts B"));

  return {
    combined: combined,
    a: flightA,
    b: flightB
  };
}

function readStandingsSheet(sheet) {
  const values = sheet.getDataRange().getDisplayValues();

  // Temporary assumption: Player in column A, points in final populated column.
  return values
    .slice(1)
    .filter(row => row[0])
    .map((row, index) => ({
      rank: index + 1,
      player: row[0],
      flight: sheet.getName().includes(" A") ? "A" : sheet.getName().includes(" B") ? "B" : "",
      points: row[row.length - 1]
    }));
}

function getHandicaps() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rowsA = readHandicapSheet(ss.getSheetByName("Hdcp A"), "A");
  const rowsB = readHandicapSheet(ss.getSheetByName("Hdcp B"), "B");
  return rowsA.concat(rowsB);
}

function readHandicapSheet(sheet, flight) {
  const values = sheet.getDataRange().getDisplayValues();

  // Temporary assumptions:
  // A = Player, B = Index, C = Course Handicap, D = Quota
  return values
    .slice(1)
    .filter(row => row[0])
    .map(row => ({
      player: row[0],
      flight: flight,
      index: row[1],
      course: row[2],
      quota: row[3]
    }));
}

function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Stats Combined");

  // Starter summary cards. We will map these to your real stat columns.
  return [
    { label: "Rounds Played", value: sheet.getRange("B2").getDisplayValue(), note: "Combined season total" },
    { label: "Low Net", value: sheet.getRange("C2").getDisplayValue(), note: "Best combined result" },
    { label: "Quota High", value: sheet.getRange("D2").getDisplayValue(), note: "Best quota finish" },
    { label: "Points Leader", value: sheet.getRange("E2").getDisplayValue(), note: "Current YTD leader" }
  ];
}

function getLatestResults() {
  return {
    netA: { winner: "TBD", score: "Connect Weekly Net A" },
    netB: { winner: "TBD", score: "Connect Weekly Net B" },
    quotaA: { winner: "TBD", score: "Connect Weekly Quota A" },
    quotaB: { winner: "TBD", score: "Connect Weekly Quota B" }
  };
}

function getNextEvent() {
  return {
    title: "Bogus Boys League Night",
    date: "TBD",
    time: "TBD",
    deadline: "TBD"
  };
}
