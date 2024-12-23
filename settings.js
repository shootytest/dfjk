export const settings = {
    NOTESPEED: 20,
    current_chart: {
        chart_name: "beeps",
        song_id: 0,
        song_type: 0,
    },
    offset: 160,
    line_offset: 0,
    hit_volume: 5,
    play_speed: 1,
    get notespeed() {
        return this.NOTESPEED / 20 / settings.play_speed;
    },
};
export const main_menu = {};
export const songs = [
    {
        id: 0,
        name: "beep beep",
        types: ["calibration"],
        difficulties: [1],
        charts: ["beeps"],
        preview: "beeps_preview",
        image: "beeps.png",
    },
    {
        id: 1,
        name: "piano_music_01.mp3",
        types: ["easy", "medium", "hard"],
        difficulties: [3, 6, 13],
        charts: ["saloon_1", "saloon_2", "saloon_3"],
        preview: "saloon_preview",
        image: "saloon.png",
    },
    {
        id: 2,
        name: "Deep Under",
        types: ["easy", "medium", "hard"],
        difficulties: [5, -1, 11],
        charts: ["deepunder_1", "deepunder_2", "deepunder_3"],
        preview: "deepunder_preview",
        image: "deepunder.png",
    },
    {
        id: 3,
        name: "Loneliness",
        types: ["easy", "medium", "hard"],
        difficulties: [-1, -1, -1],
        charts: ["loneliness_1", "loneliness_2", "loneliness_3"],
        preview: "loneliness_preview",
        image: "loneliness.jpg",
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
;
export const scores = {
    list: [],
    map: {},
    load: () => {
        const raw = localStorage.getItem("scores");
        if (raw) {
            scores.list = zipson.parse(raw);
            scores.load_map();
            // console.log(scores.map);
        }
        else {
            scores.save();
        }
    },
    save: () => {
        localStorage.setItem("scores", zipson.stringify(scores.list));
    },
    add: (score) => {
        const difficulty_number = songs[score.song_id].difficulties[score.song_type];
        const old = scores.map[score.chart];
        if (old == undefined) {
            scores.list.push(score);
            scores.map[score.chart] = score;
        }
        else {
            if (score.value > old.value)
                old.value = score.value;
            if (score.max_combo > old.max_combo)
                old.max_combo = score.max_combo;
            if (score.special > old.special)
                old.special = score.special;
            if (score.skill > old.skill)
                old.skill = score.skill;
        }
        scores.save();
    },
    load_map: () => {
        for (const k in scores.map) {
            delete scores.map[k];
        }
        scores.map = {};
        for (const score of scores.list) {
            scores.map[score.chart] = score;
        }
    },
    init: () => {
        scores.load();
    },
};
