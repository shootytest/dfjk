export const settings = {
    NOTESPEED: 20,
    current_chart: {
        chart_name: "beeps",
        song_id: 0,
        song_type: 0,
    },
    offset: 0,
    line_offset: 0,
    hit_volume: 5,
    play_speed: 1,
    display_number: "score",
    play_mode: "play",
    controls: "dfjk",
    get notespeed() {
        return this.NOTESPEED / 20 / settings.play_speed;
    },
    get normal_mode() {
        return this.play_mode === "play";
    },
    get view_mode() {
        return this.play_mode === "view";
    },
    get practice_mode() {
        return this.play_mode === "practice";
    }
};
export const config = {
    lanes: 4,
    cdn_i: "https://res.cloudinary.com/dzzjrhgkb/image/upload/v1740076652/dfjk/",
    cdn_v: "https://res.cloudinary.com/dzzjrhgkb/video/upload/v1740075693/dfjk/",
};
export const main_menu = {};
export const songs = [
    {
        id: 0,
        name: "beep beep",
        bpm: 120,
        types: ["calibration"],
        difficulties: [1],
        charts: ["beeps"],
        notes: [600],
        preview: "beeps_preview",
        image: "beeps.png",
    },
    {
        id: 1,
        name: "piano_music_01.mp3",
        bpm: 121.5,
        types: ["easy", "medium", "hard", "extreme"],
        difficulties: [3, 6, 15, 48],
        charts: ["saloon_1", "saloon_2", "saloon_3", "saloon_4"],
        notes: [100, 148, 228, 390],
        preview: "saloon_preview",
        image: "saloon.png",
    },
    {
        id: 2,
        name: "Deep Under",
        bpm: 63,
        types: ["easy", "medium", "hard"],
        difficulties: [5, -1, 12],
        charts: ["deepunder_1", "deepunder_2", "deepunder_3"],
        notes: [401, 0, 606],
        preview: "deepunder_preview",
        image: "deepunder.png",
    },
    {
        id: 3,
        name: "Loneliness",
        bpm: 120.2,
        types: ["easy", "medium", "hard"],
        difficulties: [6, 14, 32],
        charts: ["loneliness_1", "loneliness_2", "loneliness_3"],
        notes: [472, 689, 1061],
        preview: "loneliness_preview",
        image: "loneliness.jpg",
    },
    {
        id: 4,
        name: "dusk approach",
        bpm: 90,
        types: ["easy", "medium", "hard"],
        difficulties: [2, 9, -1],
        charts: ["dusk_1", "dusk_2", "dusk_3"],
        notes: [170, 400, 0],
        preview: "dusk_approach_preview",
        image: "dusk_approach.jpg",
    },
    {
        id: 5,
        name: "⠞⠧⠶⠳⡇⠼⠗",
        bpm: 74.63,
        types: ["easy", "medium", "hard"],
        difficulties: [5, 8, -1],
        charts: ["tetris_1", "tetris_2", "tetris_3"],
        notes: [189, 303, 0],
        preview: "tetris_preview",
        image: "tetris.png",
    },
    {
        id: 6,
        name: "Happiness",
        bpm: 126,
        types: ["easy", "medium", "hard"],
        difficulties: [-1, -1, -1],
        charts: ["happiness_1", "happiness_2", "happiness_3"],
        notes: [0, 0, 0],
        preview: "happiness_preview",
        image: "happiness.png",
    },
];
;
;
export const chart_map = {};
for (const song of songs) {
    const id = song.id;
    for (let i = 0; i < song.types.length; i++) {
        const name = song.charts[i];
        chart_map[name] = {
            chart_name: name,
            song_id: id,
            song_type: song.types[i],
            song_difficulty: song.difficulties[i],
        };
    }
}
export const skill_rate_data = (function () {
    const raw = `
    1010000	✪	1	1.8	0
    1009500	✸	500	1.795	0.005
    1009000	★★	500	1.78	0.015
    1008000	★	1000	1.75	0.03
    1004000	✦✦	4000	1.65	0.1
    1000000	✦	4000	1.5	0.15
    995000	SS+	5000	1.36	0.14
    990000	SS	5000	1.23	0.13
    985000	S+	5000	1.11	0.12
    980000	S	5000	1	0.11
    965000	AA+	15000	0.9	0.1
    950000	AA	15000	0.83	0.07
    925000	A+	25000	0.74	0.09
    900000	A	25000	0.65	0.09
    875000	B+	25000	0.56	0.09
    850000	B	25000	0.47	0.09
    800000	C+	50000	0.33	0.14
    750000	C	50000	0.25	0.08
    650000	D+	100000	0.2	0.05
    500000	D	150000	0.1	0.1
    250000	E	250000	0.025	0.075
    1	F	249999	0	0.025
    0	Z	1	0	0
  `;
    const result = [];
    for (const line of raw.trim().split("\n")) {
        const [s, r, ds, m, dm] = line.trim().split("\t");
        const s_ = parseInt(s);
        const ds_ = parseInt(ds);
        const m_ = parseFloat(m);
        const dm_ = parseFloat(dm);
        result.push({
            score: s_,
            rank: r,
            d_score: ds_,
            mult: m_,
            d_mult: dm_,
        });
    }
    return result;
})();
export const special_skill_rate_data = [0, 0.1, 0.15, 0.2, 0.2];
export const skill_rate = function (score) {
    let result = chart_map[score.chart]?.song_difficulty ?? 0;
    const value = score.value;
    const special = score.special;
    for (const a of skill_rate_data) {
        if (a.score <= value) {
            const mult = a.mult + ((value - a.score) / a.d_score * a.d_mult) + special_skill_rate_data[special];
            return result * mult;
        }
    }
    return result;
};
;
export const scores = {
    list: [],
    map: {},
    peak_skill: 0,
    total_skill: 0,
    load: () => {
        const raw = localStorage.getItem("scores");
        if (raw) {
            const o = zipson.parse(raw);
            if (Array.isArray(o)) {
                scores.list = o;
                scores.load_map_from_list();
            }
            else {
                scores.map = zipson.parse(raw);
            }
        }
        else {
            scores.save();
        }
        scores.recalculate_skills();
    },
    save: () => {
        localStorage.setItem("scores", zipson.stringify(scores.map));
    },
    clear: () => {
        scores.list = [];
        scores.map = {};
        scores.total_skill = 0;
        scores.save();
    },
    add: (score) => {
        const difficulty_number = chart_map[score.chart].song_difficulty;
        const old = scores.map[score.chart];
        if (old == undefined) {
            scores.list.push(score);
            scores.map[score.chart] = [score];
        }
        else {
            old.push(score);
            old.sort(scores.compare_fn);
            if (old.length > 10) {
                old.length = 10;
            }
        }
    },
    load_map_from_list: () => {
        for (const k in scores.map) {
            delete scores.map[k];
        }
        scores.map = {};
        for (const score of scores.list) {
            if (!scores.map[score.chart])
                scores.map[score.chart] = [];
            scores.map[score.chart].push(score);
        }
        for (const scorelist of Object.values(scores.map)) {
            scorelist.sort(scores.compare_fn);
        }
    },
    compare_fn: (a, b) => {
        return b.skill - a.skill;
    },
    check_same: (a, b) => {
        return a.chart === b.chart && a.max_combo === b.max_combo && a.special === b.special && a.value === b.value && a.time === b.time;
    },
    check_contains: (sl, b) => {
        for (const a of sl) {
            if (scores.check_same(a, b))
                return true;
        }
        return false;
    },
    get_list: () => {
        const result = [];
        for (const scorelist of Object.values(scores.map)) {
            result.push(scorelist[0]);
        }
        result.sort(scores.compare_fn);
        return result;
    },
    recalculate_skills: () => {
        scores.peak_skill = 0;
        scores.total_skill = 0;
        for (const k in scores.map) {
            const scorelist = scores.map[k];
            for (const score of scorelist) {
                score.skill = skill_rate(score);
            }
            scorelist.sort(scores.compare_fn);
            if (scorelist[0]) {
                const s = scorelist[0].skill;
                scores.total_skill += s;
                if (s > scores.peak_skill)
                    scores.peak_skill = s;
            }
        }
        scores.save();
    },
    init: () => {
        scores.load();
    },
};
;
export const requirements = {
    ["6"]: {
        name: "score AA on loneliness",
        at_least: 1,
        requirements: ["happiness_1", "happiness_2", "happiness_3"],
    },
    happiness_1: {
        name: "score AA on loneliness easy",
        at_least: 1,
        charts: ["loneliness_1"],
        scores: [950000],
        combos: [0],
    },
    happiness_2: {
        name: "score AA on loneliness medium",
        at_least: 1,
        charts: ["loneliness_2"],
        scores: [950000],
        combos: [0],
    },
    happiness_3: {
        name: "score AA on loneliness hard",
        at_least: 1,
        charts: ["loneliness_3"],
        scores: [950000],
        combos: [0],
    },
};
export const requirement = {
    check: function (r) {
        if (r == undefined)
            return true;
        let fulfilled = 0;
        if ("requirements" in r) {
            r = r;
            for (const s of r.requirements) {
                if (requirement.check(typeof s === "string" ? requirements[s] : s))
                    fulfilled += 1;
                if (fulfilled >= r.at_least)
                    return true;
            }
        }
        else {
            r = r;
            for (let i = 0; i < r.charts.length; i++) {
                const k = r.charts[i];
                const scorelist = scores.map[k];
                if (scorelist == undefined || scorelist.length <= 0)
                    continue;
                for (const s of scorelist) {
                    if (s.value >= r.scores[i] && s.max_combo >= r.combos[i]) {
                        fulfilled += 1;
                        break;
                    }
                }
                if (fulfilled >= r.at_least)
                    return true;
            }
        }
        return false;
    },
};
