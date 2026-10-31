window.LEAGUE_CONFIG = {
  useLiveData: true,
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbzjECrRaYShE2vgA6g4VfWpQ9-rM_YtwWm9gVcpB8JSnvvZbxHQTWnIfxoBIwmKxDnosQ/exec",
  endpoints: {
    attendance: "attendance",
    pairings: "pairings",
    standings: "standings",
    handicaps: "handicaps",
    stats: "stats",
    latestResults: "latestResults",
    weeklyResults: "weeklyResults",
    nextEvent: "nextEvent"
  }
};

const leagueMoneyHoles = {
    currentCourse: "North",

    flights: {
        A: 6,
        B: 8
    },

    courses: {
        West: [
            { hole: 4, contest: "Closest to the Pin" },
            { hole: 8, contest: "Closest to the Pin" }
        ],

        North: [
            { hole: 3, contest: "Closest to the Pin" },
            { hole: 6, contest: "Closest to the Pin" }
        ],

        South: [
            { hole: 4, contest: "Closest to the Pin" },
            { hole: 9, contest: "Longest First Putt" }
        ]
    }
};

const leagueData = {
   players: [
    { name: "Al H." },
    { name: "Bill F." },
    { name: "Biz M." },
    { name: "Brooks M." },
    { name: "Butch W." },
    { name: "Don S." },
    { name: "Don Wi." },
    { name: "Don Wo." },
    { name: "Ed G." },
    { name: "Jeff F." },
    { name: "Jeff H." },
    { name: "Jim B." },
    { name: "Jimmy C." },
    { name: "Kenny T." },
    { name: "Lennie M." },
    { name: "Mike B." },
    { name: "Ollie B." },
    { name: "Pat K." },
    { name: "Pedro B." },
    { name: "Randy M." },
    { name: "Rocco V." },
    { name: "Roger B." },
    { name: "Spence F." },
    { name: "Steve P." },
    { name: "Tom R." }
],
    leagueStats: {
west: [
    {
        player: "Al H.",
        roundsPlayed: 0,
        bestGrossScore: 0,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubleBogeysPlus: 0,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Bill F.",
        roundsPlayed: 3,
        bestGrossScore: 40,
        eagles: 0,
        birdies: 1,
        pars: 8,
        bogeys: 15,
        doubleBogeysPlus: 3,
        netScoreMoneyWon: 20,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 20
    },
    {
        player: "Biz M.",
        roundsPlayed: 4,
        bestGrossScore: 48,
        eagles: 0,
        birdies: 0,
        pars: 6,
        bogeys: 20,
        doubleBogeysPlus: 10,
        netScoreMoneyWon: 5,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 5
    },
    {
        player: "Brooks M.",
        roundsPlayed: 0,
        bestGrossScore: 0,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubleBogeysPlus: 0,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Butch W.",
        roundsPlayed: 1,
        bestGrossScore: 50,
        eagles: 0,
        birdies: 0,
        pars: 1,
        bogeys: 2,
        doubleBogeysPlus: 6,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Don S.",
        roundsPlayed: 4,
        bestGrossScore: 46,
        eagles: 0,
        birdies: 0,
        pars: 7,
        bogeys: 12,
        doubleBogeysPlus: 17,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 9,
        totalMoneyWon: 9
    },
    {
        player: "Don Wi.",
        roundsPlayed: 3,
        bestGrossScore: 39,
        eagles: 0,
        birdies: 1,
        pars: 15,
        bogeys: 9,
        doubleBogeysPlus: 2,
        netScoreMoneyWon: 18,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 18
    },
    {
        player: "Don Wo.",
        roundsPlayed: 4,
        bestGrossScore: 36,
        eagles: 0,
        birdies: 5,
        pars: 19,
        bogeys: 11,
        doubleBogeysPlus: 1,
        netScoreMoneyWon: 21,
        moneyHoleMoneyWon: 16,
        totalMoneyWon: 37
    },
    {
        player: "Ed G.",
        roundsPlayed: 4,
        bestGrossScore: 36,
        eagles: 0,
        birdies: 1,
        pars: 11,
        bogeys: 12,
        doubleBogeysPlus: 12,
        netScoreMoneyWon: 24,
        moneyHoleMoneyWon: 16,
        totalMoneyWon: 40
    },
    {
        player: "Jeff F.",
        roundsPlayed: 0,
        bestGrossScore: 0,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubleBogeysPlus: 0,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Jeff H.",
        roundsPlayed: 4,
        bestGrossScore: 40,
        eagles: 0,
        birdies: 1,
        pars: 10,
        bogeys: 17,
        doubleBogeysPlus: 8,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 16,
        totalMoneyWon: 16
    },
    {
        player: "Jim B.",
        roundsPlayed: 0,
        bestGrossScore: 0,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubleBogeysPlus: 0,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Jimmy C.",
        roundsPlayed: 4,
        bestGrossScore: 41,
        eagles: 0,
        birdies: 0,
        pars: 9,
        bogeys: 19,
        doubleBogeysPlus: 8,
        netScoreMoneyWon: 18,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 18
    },
    {
        player: "Kenny T.",
        roundsPlayed: 3,
        bestGrossScore: 39,
        eagles: 0,
        birdies: 1,
        pars: 4,
        bogeys: 13,
        doubleBogeysPlus: 9,
        netScoreMoneyWon: 6,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 6
    },
    {
        player: "Lennie M.",
        roundsPlayed: 2,
        bestGrossScore: 50,
        eagles: 0,
        birdies: 0,
        pars: 4,
        bogeys: 7,
        doubleBogeysPlus: 7,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Mike B.",
        roundsPlayed: 4,
        bestGrossScore: 39,
        eagles: 0,
        birdies: 3,
        pars: 15,
        bogeys: 13,
        doubleBogeysPlus: 5,
        netScoreMoneyWon: 31,
        moneyHoleMoneyWon: 23,
        totalMoneyWon: 54
    },
    {
        player: "Ollie B.",
        roundsPlayed: 3,
        bestGrossScore: 46,
        eagles: 0,
        birdies: 1,
        pars: 4,
        bogeys: 7,
        doubleBogeysPlus: 15,
        netScoreMoneyWon: 20,
        moneyHoleMoneyWon: 8,
        totalMoneyWon: 28
    },
    {
        player: "Pat K.",
        roundsPlayed: 3,
        bestGrossScore: 52,
        eagles: 0,
        birdies: 0,
        pars: 2,
        bogeys: 5,
        doubleBogeysPlus: 20,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Pedro B.",
        roundsPlayed: 3,
        bestGrossScore: 41,
        eagles: 0,
        birdies: 1,
        pars: 9,
        bogeys: 15,
        doubleBogeysPlus: 2,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 9,
        totalMoneyWon: 9
    },
    {
        player: "Randy M.",
        roundsPlayed: 4,
        bestGrossScore: 50,
        eagles: 0,
        birdies: 0,
        pars: 2,
        bogeys: 13,
        doubleBogeysPlus: 21,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 7,
        totalMoneyWon: 7
    },
    {
        player: "Rocco V.",
        roundsPlayed: 3,
        bestGrossScore: 46,
        eagles: 0,
        birdies: 0,
        pars: 3,
        bogeys: 9,
        doubleBogeysPlus: 15,
        netScoreMoneyWon: 20,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 20
    },
    {
        player: "Roger B.",
        roundsPlayed: 2,
        bestGrossScore: 50,
        eagles: 0,
        birdies: 0,
        pars: 1,
        bogeys: 10,
        doubleBogeysPlus: 7,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Spence F.",
        roundsPlayed: 4,
        bestGrossScore: 40,
        eagles: 0,
        birdies: 2,
        pars: 6,
        bogeys: 14,
        doubleBogeysPlus: 14,
        netScoreMoneyWon: 6,
        moneyHoleMoneyWon: 13,
        totalMoneyWon: 19
    },
    {
        player: "Steve P.",
        roundsPlayed: 3,
        bestGrossScore: 43,
        eagles: 0,
        birdies: 1,
        pars: 6,
        bogeys: 9,
        doubleBogeysPlus: 11,
        netScoreMoneyWon: 4,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 4
    },
    {
        player: "Tom R.",
        roundsPlayed: 3,
        bestGrossScore: 43,
        eagles: 0,
        birdies: 0,
        pars: 6,
        bogeys: 10,
        doubleBogeysPlus: 11,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 14,
        totalMoneyWon: 14
    },
    {
        player: "TOTALS",
        roundsPlayed: 68,
        bestGrossScore: 30.6,
        eagles: 0,
        birdies: 18,
        pars: 148,
        bogeys: 242,
        doubleBogeysPlus: 204,
        netScoreMoneyWon: 193,
        moneyHoleMoneyWon: 131,
        totalMoneyWon: 324
    }
],
north: [
    {
        player: "Al H.",
        roundsPlayed: 3,
        bestGrossScore: 46,
        eagles: 0,
        birdies: 0,
        pars: 4,
        bogeys: 17,
        doubleBogeysPlus: 6,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 8,
        totalMoneyWon: 8
    },
    {
        player: "Bill F.",
        roundsPlayed: 3,
        bestGrossScore: 40,
        eagles: 0,
        birdies: 0,
        pars: 7,
        bogeys: 16,
        doubleBogeysPlus: 5,
        netScoreMoneyWon: 18,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 18
    },
    {
        player: "Biz M.",
        roundsPlayed: 4,
        bestGrossScore: 46,
        eagles: 0,
        birdies: 0,
        pars: 5,
        bogeys: 15,
        doubleBogeysPlus: 16,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Brooks M.",
        roundsPlayed: 0,
        bestGrossScore: 0,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubleBogeysPlus: 0,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Butch W.",
        roundsPlayed: 1,
        bestGrossScore: 52,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 3,
        doubleBogeysPlus: 6,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Don S.",
        roundsPlayed: 4,
        bestGrossScore: 42,
        eagles: 0,
        birdies: 1,
        pars: 5,
        bogeys: 14,
        doubleBogeysPlus: 16,
        netScoreMoneyWon: 9,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 9
    },
    {
        player: "Don Wi.",
        roundsPlayed: 4,
        bestGrossScore: 38,
        eagles: 0,
        birdies: 1,
        pars: 14,
        bogeys: 11,
        doubleBogeysPlus: 10,
        netScoreMoneyWon: 6,
        moneyHoleMoneyWon: 25,
        totalMoneyWon: 31
    },
    {
        player: "Don Wo.",
        roundsPlayed: 3,
        bestGrossScore: 41,
        eagles: 0,
        birdies: 1,
        pars: 11,
        bogeys: 15,
        doubleBogeysPlus: 0,
        netScoreMoneyWon: 18,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 18
    },
    {
        player: "Ed G.",
        roundsPlayed: 4,
        bestGrossScore: 42,
        eagles: 0,
        birdies: 0,
        pars: 14,
        bogeys: 16,
        doubleBogeysPlus: 6,
        netScoreMoneyWon: 15,
        moneyHoleMoneyWon: 15,
        totalMoneyWon: 30
    },
    {
        player: "Jeff F.",
        roundsPlayed: 0,
        bestGrossScore: 0,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 0,
        doubleBogeysPlus: 0,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Jeff H.",
        roundsPlayed: 4,
        bestGrossScore: 43,
        eagles: 0,
        birdies: 0,
        pars: 14,
        bogeys: 6,
        doubleBogeysPlus: 17,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Jim B.",
        roundsPlayed: 4,
        bestGrossScore: 45,
        eagles: 0,
        birdies: 0,
        pars: 4,
        bogeys: 18,
        doubleBogeysPlus: 14,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Jimmy C.",
        roundsPlayed: 4,
        bestGrossScore: 41,
        eagles: 0,
        birdies: 0,
        pars: 14,
        bogeys: 18,
        doubleBogeysPlus: 4,
        netScoreMoneyWon: 12,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 12
    },
    {
        player: "Kenny T.",
        roundsPlayed: 3,
        bestGrossScore: 43,
        eagles: 0,
        birdies: 0,
        pars: 7,
        bogeys: 10,
        doubleBogeysPlus: 10,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Lennie M.",
        roundsPlayed: 2,
        bestGrossScore: 47,
        eagles: 0,
        birdies: 0,
        pars: 0,
        bogeys: 12,
        doubleBogeysPlus: 6,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Mike B.",
        roundsPlayed: 3,
        bestGrossScore: 38,
        eagles: 0,
        birdies: 1,
        pars: 12,
        bogeys: 13,
        doubleBogeysPlus: 1,
        netScoreMoneyWon: 18,
        moneyHoleMoneyWon: 32,
        totalMoneyWon: 50
    },
    {
        player: "Ollie B.",
        roundsPlayed: 2,
        bestGrossScore: 50,
        eagles: 0,
        birdies: 0,
        pars: 1,
        bogeys: 5,
        doubleBogeysPlus: 12,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Pat K.",
        roundsPlayed: 2,
        bestGrossScore: 49,
        eagles: 0,
        birdies: 0,
        pars: 2,
        bogeys: 2,
        doubleBogeysPlus: 14,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 0
    },
    {
        player: "Pedro B.",
        roundsPlayed: 2,
        bestGrossScore: 41,
        eagles: 0,
        birdies: 1,
        pars: 6,
        bogeys: 9,
        doubleBogeysPlus: 2,
        netScoreMoneyWon: 6,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 6
    },
    {
        player: "Randy M.",
        roundsPlayed: 3,
        bestGrossScore: 43,
        eagles: 0,
        birdies: 1,
        pars: 4,
        bogeys: 13,
        doubleBogeysPlus: 9,
        netScoreMoneyWon: 32,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 32
    },
    {
        player: "Rocco V.",
        roundsPlayed: 2,
        bestGrossScore: 46,
        eagles: 0,
        birdies: 0,
        pars: 3,
        bogeys: 6,
        doubleBogeysPlus: 9,
        netScoreMoneyWon: 6,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 6
    },
    {
        player: "Roger B.",
        roundsPlayed: 2,
        bestGrossScore: 44,
        eagles: 0,
        birdies: 0,
        pars: 6,
        bogeys: 9,
        doubleBogeysPlus: 2,
        netScoreMoneyWon: 18,
        moneyHoleMoneyWon: 0,
        totalMoneyWon: 18
    },
    {
        player: "Spence F.",
        roundsPlayed: 3,
        bestGrossScore: 43,
        eagles: 0,
        birdies: 1,
        pars: 4,
        bogeys: 18,
        doubleBogeysPlus: 4,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 8,
        totalMoneyWon: 8
    },
    {
        player: "Steve P.",
        roundsPlayed: 2,
        bestGrossScore: 46,
        eagles: 0,
        birdies: 1,
        pars: 3,
        bogeys: 6,
        doubleBogeysPlus: 8,
        netScoreMoneyWon: 0,
        moneyHoleMoneyWon: 8,
        totalMoneyWon: 8
    },
    {
        player: "Tom R.",
        roundsPlayed: 3,
        bestGrossScore: 42,
        eagles: 0,
        birdies: 1,
        pars: 7,
        bogeys: 10,
        doubleBogeysPlus: 9,
        netScoreMoneyWon: 20,
        moneyHoleMoneyWon: 9,
        totalMoneyWon: 29
    },
    {
        player: "TOTALS",
        roundsPlayed: 67,
        bestGrossScore: 40.32,
        eagles: 0,
        birdies: 9,
        pars: 147,
        bogeys: 262,
        doubleBogeysPlus: 186,
        netScoreMoneyWon: 178,
        moneyHoleMoneyWon: 105,
        totalMoneyWon: 283
    }
],
south: [
    { player: "Al H.", roundsPlayed: 0, bestGrossScore: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, doubleBogeysPlus: 0, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Bill F.", roundsPlayed: 3, bestGrossScore: 44, eagles: 0, birdies: 0, pars: 5, bogeys: 18, doubleBogeysPlus: 4, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Biz M.", roundsPlayed: 4, bestGrossScore: 48, eagles: 0, birdies: 0, pars: 1, bogeys: 19, doubleBogeysPlus: 16, netScoreMoneyWon: 2, moneyHoleMoneyWon: 0, totalMoneyWon: 2 },
    { player: "Brooks M.", roundsPlayed: 0, bestGrossScore: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, doubleBogeysPlus: 0, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Butch W.", roundsPlayed: 0, bestGrossScore: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, doubleBogeysPlus: 0, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Don S.", roundsPlayed: 3, bestGrossScore: 46, eagles: 0, birdies: 0, pars: 4, bogeys: 14, doubleBogeysPlus: 9, netScoreMoneyWon: 25, moneyHoleMoneyWon: 18, totalMoneyWon: 43 },
    { player: "Don Wi.", roundsPlayed: 2, bestGrossScore: 41, eagles: 0, birdies: 1, pars: 7, bogeys: 9, doubleBogeysPlus: 1, netScoreMoneyWon: 5, moneyHoleMoneyWon: 7, totalMoneyWon: 12 },
    { player: "Don Wo.", roundsPlayed: 4, bestGrossScore: 38, eagles: 0, birdies: 3, pars: 19, bogeys: 13, doubleBogeysPlus: 0, netScoreMoneyWon: 24, moneyHoleMoneyWon: 13, totalMoneyWon: 37 },
    { player: "Ed G.", roundsPlayed: 4, bestGrossScore: 41, eagles: 0, birdies: 2, pars: 9, bogeys: 16, doubleBogeysPlus: 9, netScoreMoneyWon: 24, moneyHoleMoneyWon: 8, totalMoneyWon: 32 },
    { player: "Jeff F.", roundsPlayed: 0, bestGrossScore: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, doubleBogeysPlus: 0, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Jeff H.", roundsPlayed: 2, bestGrossScore: 43, eagles: 0, birdies: 1, pars: 5, bogeys: 8, doubleBogeysPlus: 4, netScoreMoneyWon: 3, moneyHoleMoneyWon: 11, totalMoneyWon: 14 },
    { player: "Jim B.", roundsPlayed: 1, bestGrossScore: 52, eagles: 0, birdies: 0, pars: 0, bogeys: 5, doubleBogeysPlus: 4, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Jimmy C.", roundsPlayed: 4, bestGrossScore: 41, eagles: 0, birdies: 0, pars: 15, bogeys: 20, doubleBogeysPlus: 1, netScoreMoneyWon: 4, moneyHoleMoneyWon: 4, totalMoneyWon: 8 },
    { player: "Kenny T.", roundsPlayed: 2, bestGrossScore: 43, eagles: 0, birdies: 1, pars: 4, bogeys: 10, doubleBogeysPlus: 3, netScoreMoneyWon: 5, moneyHoleMoneyWon: 0, totalMoneyWon: 5 },
    { player: "Lennie M.", roundsPlayed: 1, bestGrossScore: 53, eagles: 0, birdies: 0, pars: 0, bogeys: 5, doubleBogeysPlus: 4, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Mike B.", roundsPlayed: 2, bestGrossScore: 39, eagles: 0, birdies: 1, pars: 7, bogeys: 10, doubleBogeysPlus: 0, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Ollie B.", roundsPlayed: 3, bestGrossScore: 47, eagles: 0, birdies: 1, pars: 0, bogeys: 11, doubleBogeysPlus: 15, netScoreMoneyWon: 15, moneyHoleMoneyWon: 0, totalMoneyWon: 15 },
    { player: "Pat K.", roundsPlayed: 2, bestGrossScore: 54, eagles: 0, birdies: 0, pars: 0, bogeys: 6, doubleBogeysPlus: 12, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Pedro B.", roundsPlayed: 4, bestGrossScore: 43, eagles: 0, birdies: 1, pars: 13, bogeys: 18, doubleBogeysPlus: 4, netScoreMoneyWon: 0, moneyHoleMoneyWon: 6, totalMoneyWon: 6 },
    { player: "Randy M.", roundsPlayed: 2, bestGrossScore: 46, eagles: 0, birdies: 0, pars: 4, bogeys: 8, doubleBogeysPlus: 6, netScoreMoneyWon: 6, moneyHoleMoneyWon: 0, totalMoneyWon: 6 },
    { player: "Rocco V.", roundsPlayed: 3, bestGrossScore: 50, eagles: 0, birdies: 0, pars: 0, bogeys: 12, doubleBogeysPlus: 15, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Roger B.", roundsPlayed: 0, bestGrossScore: 0, eagles: 0, birdies: 0, pars: 0, bogeys: 0, doubleBogeysPlus: 0, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Spence F.", roundsPlayed: 2, bestGrossScore: 43, eagles: 0, birdies: 0, pars: 5, bogeys: 9, doubleBogeysPlus: 4, netScoreMoneyWon: 13, moneyHoleMoneyWon: 7, totalMoneyWon: 20 },
    { player: "Steve P.", roundsPlayed: 1, bestGrossScore: 50, eagles: 0, birdies: 0, pars: 1, bogeys: 4, doubleBogeysPlus: 4, netScoreMoneyWon: 0, moneyHoleMoneyWon: 0, totalMoneyWon: 0 },
    { player: "Tom R.", roundsPlayed: 2, bestGrossScore: 42, eagles: 0, birdies: 0, pars: 8, bogeys: 7, doubleBogeysPlus: 3, netScoreMoneyWon: 15, moneyHoleMoneyWon: 0, totalMoneyWon: 15 }
],

},
};
leagueData.currentWeek = {
    week: 7,
    date: "07-29-2026",
    course: "West",
    format: "Net",
    teeTime: "3:15pm - 4:00pm",
    wager: 5,
    players: 28,
    attendanceConfirmed: 0,
    attendancePending: 0
};
leagueData.standings = [
    {
        rank: 1,
        player: "Ed G.",
        flight: "B",
        points: 5422.5
    },
    {
        rank: 2,
        player: "Don Wo.",
        flight: "A",
        points: 4871.66
    },
    {
        rank: 3,
        player: "Jimmy C.",
        flight: "A",
        points: 4535.83
    },
    {
        rank: 4,
        player: "Mike B.",
        flight: "B",
        points: 4260
    },
    {
        rank: 5,
        player: "Don S.",
        flight: "B",
        points: 3962.5
    },
    {
        rank: 6,
        player: "Jeff H.",
        flight: "A",
        points: 3730
    },
    {
        rank: 7,
        player: "Don Wi.",
        flight: "A",
        points: 3647.5
    },
    {
        rank: 8,
        player: "Biz M.",
        flight: "B",
        points: 3587.5
    },
    {
        rank: 9,
        player: "Randy M.",
        flight: "B",
        points: 3455
    },
    {
        rank: 10,
        player: "Bill F.",
        flight: "A",
        points: 3416.66
    },
    {
        rank: 11,
        player: "Tom R.",
        flight: "A",
        points: 3380.83
    },
    {
        rank: 12,
        player: "Kenny T.",
        flight: "B",
        points: 3317.5
    },
    {
        rank: 13,
        player: "Ollie B.",
        flight: "B",
        points: 3295
    },
    {
        rank: 14,
        player: "Spence F.",
        flight: "A",
        points: 3002.5
    },
    {
        rank: 15,
        player: "Pedro B.",
        flight: "A",
        points: 2563.33
    },
    {
        rank: 16,
        player: "Rocco V.",
        flight: "B",
        points: 2407.5
    },
    {
        rank: 17,
        player: "Steve P.",
        flight: "A",
        points: 2203.33
    },
    {
        rank: 18,
        player: "Pat K.",
        flight: "B",
        points: 1792.5
    },
    {
        rank: 19,
        player: "Jim B.",
        flight: "B",
        points: 1330
    },
    {
        rank: 20,
        player: "Lennie M.",
        flight: "B",
        points: 1300
    },
    {
        rank: 21,
        player: "Roger B.",
        flight: "A",
        points: 1290
    },
    {
        rank: 22,
        player: "Al H.",
        flight: "A",
        points: 803.33
    },
    {
        rank: 23,
        player: "Butch W.",
        flight: "B",
        points: 380
    },
    {
        rank: 24,
        player: "Brooks M.",
        flight: "A",
        points: 0
    },
    {
        rank: 25,
        player: "Jeff F.",
        flight: "A",
        points: 0
    },

    ];
leagueData.handicaps = [
    { player: "Don Wo.", flight: "A", index: 0.810, courseHandicap: 1, quota: 17 },
    { player: "Pedro B.", flight: "A", index: 3.630, courseHandicap: 4, quota: 14 },
    { player: "Don Wi.", flight: "A", index: 4.540, courseHandicap: 5, quota: 13 },
    { player: "Jimmy C.", flight: "A", index: 4.690, courseHandicap: 5, quota: 13 },
    { player: "Brooks M.", flight: "A", index: 4.920, courseHandicap: 5, quota: 13 },
    { player: "Spence F.", flight: "A", index: 6.080, courseHandicap: 6, quota: 12 },
    { player: "Al H.", flight: "A", index: 6.300, courseHandicap: 7, quota: 11 },
    { player: "Jeff H.", flight: "A", index: 6.590, courseHandicap: 7, quota: 11 },
    { player: "Bill F.", flight: "A", index: 6.900, courseHandicap: 7, quota: 11 },
    { player: "Tom R.", flight: "A", index: 7.030, courseHandicap: 7, quota: 11 },
    { player: "Steve P.", flight: "A", index: 8.880, courseHandicap: 9, quota: 9 },
    { player: "Roger B.", flight: "A", index: 8.980, courseHandicap: 9, quota: 9 },
    { player: "Jeff F.", flight: "A", index: 0.000, courseHandicap: 0, quota: 18 },

    { player: "Mike B.", flight: "B", index: 1.840, courseHandicap: 2, quota: 16 },
    { player: "Ed G.", flight: "B", index: 5.950, courseHandicap: 7, quota: 11 },
    { player: "Kenny T.", flight: "B", index: 6.990, courseHandicap: 7, quota: 11 },
    { player: "Jim B.", flight: "B", index: 8.140, courseHandicap: 9, quota: 9 },
    { player: "Biz M.", flight: "B", index: 8.860, courseHandicap: 10, quota: 8 },
    { player: "Don S.", flight: "B", index: 8.890, courseHandicap: 10, quota: 8 },
    { player: "Randy M.", flight: "B", index: 8.940, courseHandicap: 9, quota: 9 },
    { player: "Rocco V.", flight: "B", index: 9.350, courseHandicap: 10, quota: 8 },
    { player: "Butch W.", flight: "B", index: 9.970, courseHandicap: 10, quota: 8 },
    { player: "Lennie M.", flight: "B", index: 10.460, courseHandicap: 11, quota: 7 },
    { player: "Ollie B.", flight: "B", index: 12.300, courseHandicap: 13, quota: 5 },
    { player: "Pat K.", flight: "B", index: 13.420, courseHandicap: 14, quota: 4 }
];
leagueData.weeklyResults = {
   flightA: {
    first: {
        player: "Pedro B.",
        prize: "$18",
        note: ""
    },
    second: {
        player: "Jimmy C.",
        prize: "$6",
        note: ""
    }
},

flightB: {
    first: {
        player: "Don S.",
        prize: "$24",
        note: ""
    },
    second: {
        player: "Mike B.",
        prize: "$8",
        note: ""
    }
},

moneyHoles: [
    {
        hole: 4,
        contest: "Closest to the Pin",
        flightA: {
            winner: "Pedro B.",
            prize: "$6",
            note: ""
        },
        flightB: {
            winner: "Don S.",
            prize: "$8",
            note: ""
        }
    },
    {
        hole: 8,
        contest: "Closest to the Pin",
        flightA: {
            winner: "Jimmy C.",
            prize: "$6",
            note: ""
        },
        flightB: {
            winner: "Mike B.",
            prize: "$8",
            note: ""
        }
    }
],

    leaderboard: [
        {
            place: 1,
            player: "Spence F.",
            flight: "A",
            gross: 42,
            formatScore: 35,
            points: 6
        },
        {
            place: 2,
            player: "Jimmy C.",
            flight: "A",
            gross: 43,
            formatScore: 37,
            points: 5
        },
        {
    place: 3,
    player: "Bill F.",
    flight: "A",
    gross: 43,
    formatScore: 35,
    points: 4
},
{
    place: 4,
    player: "Tom R.",
    flight: "A",
    gross: 46,
    formatScore: 38,
    points: 3
},
{
    place: 5,
    player: "Don Wo.",
    flight: "A",
    gross: 38,
    formatScore: 37,
    points: 2
},
{
    place: 6,
    player: "Pedro B.",
    flight: "A",
    gross: 43,
    formatScore: 39,
    points: 1
},
{
    place: 7,
    player: "Don Wi.",
    flight: "A",
    gross: "-",
    formatScore: "-",
    points: "-"
},
{
    place: 8,
    player: "Brooks M.",
    flight: "A",
    gross: "-",
    formatScore: "-",
    points: "-"
},
{
    place: 9,
    player: "Al H.",
    flight: "A",
    gross: "-",
    formatScore: "-",
    points: "-"
},
{
    place: 10,
    player: "Jeff H.",
    flight: "A",
    gross: "-",
    formatScore: "-",
    points: "-"
},
{
    place: 11,
    player: "Steve P.",
    flight: "A",
    gross: "-",
    formatScore: "-",
    points: "-"
},
{
    place: 12,
    player: "Roger B.",
    flight: "A",
    gross: "-",
    formatScore: "-",
    points: "-"
},
{
    place: 13,
    player: "Jeff F.",
    flight: "A",
    gross: "-",
    formatScore: "-",
    points: "-"
},
        {
            place: 1,
            player: "Don S.",
            flight: "B",
            gross: 46,
            formatScore: 36,
            points: 11
        },
        {
            place: 2,
            player: "Mike B.",
            flight: "B",
            gross: 39,
            formatScore: 37,
            points: 10
        },
        {
            place: 3,
            player: "Ollie B.",
            flight: "B",
            gross: 53,
            formatScore: 40,
            points: 9
        },
        {
            place: 4,
            player: "Biz M.",
            flight: "B",
            gross: 47,
            formatScore: 37,
            points: 8
        },
        {
            place: 5,
            player: "Pat K.",
            flight: "B",
            gross: 57,
            formatScore: 43,
            points: 7
        },
        {
            place: 6,
            player: "Rocco V.",
            flight: "B",
            gross: 50,
            formatScore: 42,
            points: 6
        },
        {
            place: 7,
            player: "Randy M.",
            flight: "B",
            gross: 46,
            formatScore: 37,
            points: 5
        },
        {
            place: 8,
            player: "Lennie M.",
            flight: "B",
            gross: 53,
            formatScore: 42,
            points: 4
        },
        {
            place: 9,
            player: "Ed G.",
            flight: "B",
            gross: 46,
            formatScore: 39,
            points: 3
        },
        {
            place: 10,
            player: "Kenny T.",
            flight: "B",
            gross: "-",
            formatScore: "-",
            points: "-"
        },
        {
            place: 11,
            player: "Jim B.",
            flight: "B",
            gross: "-",
            formatScore: "-",
            points: "-"
        },
        {
            place: 12,
            player: "Butch W.",
            flight: "B",
            gross: "-",
            formatScore: "-",
            points: "-"
        }
    ]
};
leagueData.feed = [
    {
        date: "July 23",
        title: "Week 5 Results Posted",
        message: "Weekly Net, Quota, and updated standings are now available."
    },
    {
        date: "July 21",
        title: "Money Holes Announced",
        message: "This week's Money Holes have been posted for North Course."
    },
    {
        date: "July 19",
        title: "Reminder",
        message: "Please arrive 30 minutes before your tee time."
    }
];
leagueData.hallOfChampions = {
    year: "2026",

    leagueChampion: {
        winner: "To Be Determined",
        result: ""
    },

    mostWeeklyWins: {
        winner: "To Be Determined",
        result: ""
    },

    bestAverageGross: {
        winner: "To Be Determined",
        result: ""
    },

    grandTotalMoney: {
        winner: "To Be Determined",
        result: ""
    },

    averageMoneyPerRound: {
        winner: "To Be Determined",
        result: ""
    }
};