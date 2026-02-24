import { canvas, ctx } from "./util/canvas.js";
import { vector } from "./util/vector.js";
import { Chart, lane_to_col, lane_to_key, lane_to_row, note_type } from "./chart.js";
import { Sound, sounds } from "./sound.js";
import dat from "./dat.js";
import { firebase } from "./firebase.js";
import { math } from "./util/math.js";
import { key, mouse } from "./util/key.js";
import { scores, settings, songs, chart_map, config, requirement, requirements, variance_rate } from "./settings.js";
let x, y, w, h;
let r, c, size;
export const color = {
    white: "#eeeeee",
    black: "#111111",
    red: "#db6353",
    yellow: "#cfc04c",
    green: "#54f088",
    blue: "#7a8eff",
    purple: "#9c7aff",
    keyboard_row_0: "#a83275",
    keyboard_row_1: "#a87f32",
    keyboard_row_2: "#32a873",
    keyboard_row_3: "#5e39bd",
    keyboard_row_4: "#5ede02",
    ["difficulty_easy"]: "#73f586",
    ["difficulty_medium"]: "#e8e864",
    ["difficulty_hard"]: "#f59c73",
    ["difficulty_expert"]: "#e864aa",
    ["difficulty_extreme"]: "#c564e8",
    ["difficulty_special"]: "#b17cf7",
    ["difficulty_calibration"]: "#cccccc",
    ["grade_✪"]: "#eeeeee",
    ["grade_✸"]: "#e6ff82",
    ["grade_★★"]: "#e3f06c",
    ["grade_★"]: "#d7de52",
    ["grade_✦✦"]: "#f5d973",
    ["grade_✦"]: "#e3b656",
    ["grade_SS+"]: "#ff829f",
    ["grade_SS"]: "#e85d92",
    ["grade_S+"]: "#fa6eff",
    ["grade_S"]: "#c54bde",
    ["grade_AA+"]: "#be6eff",
    ["grade_AA"]: "#9253e6",
    ["grade_A+"]: "#6e70f5",
    ["grade_A"]: "#566adb",
    ["grade_B+"]: "#64bae8",
    ["grade_B"]: "#54b6d6",
    ["grade_C+"]: "#7ffacf",
    ["grade_C"]: "#5ddea0",
    ["grade_D+"]: "#7ef57a",
    ["grade_D"]: "#6bd656",
    ["grade_E"]: "#49a130",
    ["grade_F"]: "#a13030",
    ["grade_Z"]: "#574646",
    ["special_"]: "#eeeeee",
    ["special_FC"]: "#edb147",
    ["special_FC+"]: "#aee848",
    ["special_AP"]: "#7a8eff",
    ["special_AP+"]: "#9c7aff",
    tetris_0: "#a1a1a1",
    tetris_7: "#65e9b8",
    tetris_2: "#e99665",
    tetris_3: "#5f4db0",
    tetris_5: "#da585f",
    tetris_4: "#b0df60",
    tetris_1: "#c15cb7",
    tetris_6: "#d8be58",
    kahoot_1: "#e21b3c",
    kahoot_2: "#1367ce",
    kahoot_3: "#d79e00",
    kahoot_4: "#26880b",
};
export const ui = {
    time: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    gui: new dat.GUI({ hideable: false, }),
    menu: "main",
    main: {
        index: 0,
        index_target: 0,
        svg: ["play", "toplist", "leaderboard", "about", "account"],
        text: ["play!", "stats", "leaderboard", "info", "account"],
        color: ["green", "blue", "yellow", "white", "purple"],
    },
    list: {
        index: 0,
        index_circle: 0,
        index_target: 0,
        index_target_d: 0,
        index_target_scroll_mult: 0.6,
        type: 0,
        type_target: 0,
        mode: "four",
        playing: sounds.beeps_preview,
        leaderboard: false,
        get song() {
            return songs[ui.list.index_target];
        },
        get type_real() {
            return Math.min(ui.list.type_target, ui.list.song.charts.length - 1);
        },
        get chart() {
            return ui.list.song.charts[ui.list.type_real];
        },
    },
    game: {
        lanes: 4,
        lanes_prev: 4,
        lanes_target: 4,
        lanes_smoothness: 0.05,
        lanes_type: "four",
        tilt: 0,
        tilt_: 0,
        offset: vector.create(0, 0),
        offset_: vector.create(0, 0),
        scale: vector.create(1, 1),
        scale_target: vector.create(1, 1),
        scale_smoothness: vector.create(0.05, 0.05),
        separation: 1,
        separation_target: 1,
        separation_smoothness: 0.05,
        skin: "normal",
        skins: ["normal", "tetris", "kahoot"],
        hit_force: 0,
        notespeed_mult: 1,
        notespeed_set: undefined,
        note_acceleration: 0,
        backing: 0,
        restarting: 0,
        calibration: {
            offset_queue: [],
            get mean() { return math.mean(this.offset_queue); },
            get variance() { return math.variance(this.offset_queue); },
        },
    },
    images: {},
    init: function () {
        window.addEventListener("resize", ui.resize);
        canvas.style.zIndex = "0";
        settings.play_speed = 1;
        const gui = this.gui;
        gui.useLocalStorage = true;
        gui.remember(settings);
        gui.remember(ui.list);
        dat.GUI.TEXT_OPEN = "open settings";
        dat.GUI.TEXT_CLOSED = "close settings";
        const c1 = gui.add(settings, "NOTESPEED", 10, 30, 1);
        c1.name("speed");
        const c3 = gui.add(settings, "offset", -200, 400, 10);
        c3.name("time offset");
        const c4 = gui.add(settings, "line_offset", -100, 100, 10);
        c4.name("line offset");
        const c5 = gui.add(settings, "hit_volume", 0, 10, 1);
        c5.name("<em>hit</em> volume");
        const c6 = gui.add(settings, "play_speed", 0.5, 2, 0.25);
        c6.name("play speed");
        c6.updateDisplay();
        c6.onChange(() => {
            for (const sound of Object.values(sounds)) {
                sound.element.playbackRate = settings.play_speed;
            }
        });
        const c8 = gui.add(settings, "play_mode", { normal: "play", practice: "practice", view: "view" });
        c8.name("play mode");
        const c9 = gui.add(settings, "display_number", { score: "score", accuracy: "accuracy", "accuracy+": "accuracy+", "highest score": "highest", "predicted": "predict" });
        c9.name("number display");
        const c7 = gui.add(settings, "controls");
        c7.name("controls");
        settings.play_speed = 1;
        c7.onChange(() => {
            if (settings.controls.length < 4) {
                settings.controls = "dfjk";
            }
            else {
                settings.controls = settings.controls.substring(0, 4);
            }
            c7.updateDisplay();
        });
        const hidden = gui.addFolder("hidden");
        hidden.add(ui.list, "index_target", 0, songs.length - 1);
        hidden.add(ui.list, "type_target", 0, 100);
        gui.__folders.hidden.hide();
        gui.close();
        for (const song of songs) {
            const image = document.createElement("img");
            image.setAttribute("src", config.cdn_i + song.image);
            ui.images[song.image] = image;
        }
        ui.make_toplist();
        ui.make_leaderboard();
        ui.make_credits();
        ui.make_account();
        ui.close_boxes();
    },
    tick: function () {
        ui.time++;
    },
    check_hover: function (hover_f) {
        if (ctx.point_in_path_v(mouse)) {
            hover_f();
        }
    },
    check_drag: function (drag_f) {
        if (mouse.buttons[0] && ctx.point_in_path_v(mouse.down_position[0])) {
            drag_f(vector.sub(mouse, mouse.down_position[0]));
        }
    },
    check_click: function (click_f, hover_f = () => { }) {
        if (ctx.point_in_path_v(mouse)) {
            if (hover_f)
                hover_f();
            if (mouse.up_buttons[0] && ctx.point_in_path_v(mouse.down_position[0])) {
                click_f();
            }
        }
    },
    draw: function () {
        ctx.clear(color.black);
        if (ui.is_box_open()) {
            canvas.style.filter = "blur(3px)";
            ctx.beginPath();
            ctx.rect(0, 0, ui.width, ui.height);
            ui.check_click(() => {
                ui.cancel_click();
                if (ui.is_box_open())
                    ui.close_boxes();
            });
        }
        else {
            canvas.style.filter = "";
        }
        const v = { x: this.width / 2, y: this.height / 2, };
        if (ui.menu === "main") {
            this.draw_main(v);
        }
        else if (ui.menu === "list") {
            this.draw_list(v);
        }
        else if (ui.menu === "game") {
            h = Math.min(this.width * 0.7 / 0.5, this.height * 0.8);
            const x_constrained = (h >= this.width * 1.2);
            const size = { x: h * 0.5, y: h };
            const offset = vector.add(v, vector.add(ui.game.offset, ui.game.offset_));
            this.draw_board(offset, size, x_constrained);
            if (settings.practice_mode) {
                this.draw_practice();
            }
            if (Chart.current?.sound.finished && settings.normal_mode) {
                this.draw_results(v, size, x_constrained);
            }
        }
    },
    draw_main: function (v) {
        const size = { x: ui.width, y: ui.height };
        const x_constrained = (size.y >= size.x);
        const m = ui.main.index;
        const mi = ui.main.index_target;
        const ml = ui.main.svg.length;
        ui.main.index = math.lerp_circle(m, mi, ml, 0.05);
        r = Math.min(size.x, size.y) * 0.25;
        ctx.strokeStyle = color.white;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.circle(v.x, v.y, r);
        ctx.stroke();
        ui.check_click(ui.enter);
        ctx.fillStyle = color.white;
        ctx.set_font_mono(r * 0.2);
        ctx.text(ui.main.text[mi], v.x, v.y);
        ctx.strokeStyle = color[ui.main.color[mi]];
        ctx.lineWidth = r * 0.005;
        ctx.strokeText(ui.main.text[mi], v.x, v.y);
        ctx.save("main_menu");
        ctx.strokeStyle = color.white;
        ctx.translate(v.x, v.y);
        const angle = Math.PI * 2 / ml;
        ctx.rotate(-m * angle);
        ctx.lineWidth = 2;
        for (let i = 0; i < ml; i++) {
            ctx.beginPath();
            ctx.circle(0, -r * 1.4, r * 0.3);
            ctx.stroke();
            if (i === mi) {
                ctx.fillStyle = color.white + "22";
                ctx.fill();
            }
            ctx.fillStyle = color[ui.main.color[i]];
            ctx.svg(ui.main.svg[i], 0, -r * 1.4, r * 0.3);
            ui.check_click(() => (ui.main.index_target = i));
            ctx.rotate(angle);
        }
        ctx.restore("main_menu");
        ctx.strokeStyle = color.yellow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.circle(v.x, v.y - r * 1.4, r * 0.3 + 2);
        ctx.stroke();
        ui.check_click(ui.enter);
    },
    main_enter: function () {
        const i = ui.main.index_target;
        if (i === 0) {
            ui.menu = "list";
            ui.list_change_index(0);
        }
        else if (i === 1) {
            ui.make_toplist();
            ui.show_box("toplist");
        }
        else if (i === 2) {
            ui.make_leaderboard();
            ui.show_box("leaderboard");
        }
        else if (i === 3) {
            ui.show_box("credits");
        }
        else if (i === 4) {
            ui.show_box("account");
        }
    },
    draw_list: function (v) {
        const size = { x: ui.width, y: ui.height };
        const x_constrained = size.y >= size.x * 1.6;
        r = x_constrained ? (size.y * 0.8) : (size.x * 0.92);
        ui.list.index_circle = math.lerp_circle(ui.list.index_circle, ui.list.index_target + ui.list.index_target_d, songs.length, 0.1);
        ui.list.index = math.lerp(ui.list.index, ui.list.index_target + ui.list.index_target_d, 0.1);
        const index = ui.list.index;
        const index_circle = ui.list.index_circle;
        const indices = [];
        for (let i = 0; i < 3; i++) {
            indices.push(Math.round(index_circle - 1 + i + songs.length) % songs.length);
        }
        ui.list.type = math.lerp(ui.list.type, ui.list.type_target, 0.1);
        const type = ui.list.type;
        let index_target_change = 0;
        let song_enter = false;
        ctx.strokeStyle = color.white;
        ctx.fillStyle = color.white;
        ctx.lineWidth = 5;
        ctx.save("draw_list_left");
        ctx.beginPath();
        if (x_constrained)
            ctx.rect(0, 0, size.x, v.y);
        else {
            x = v.x - 0.15 * r;
            ctx.rect(0, 0, x, size.y);
        }
        ctx.clip();
        if (ui.mobile) {
            ui.check_drag((delta) => {
                ui.list.index_target_d = -delta.x / r * ui.list.index_target_scroll_mult * 4;
            });
            if (!mouse.buttons[0] && ui.list.index_target_d !== 0) {
                index_target_change = Math.round(ui.list.index_target_d);
                ui.list.index_target_d = 0;
            }
        }
        const rr = 0.14 * r;
        for (let i = 0; i < 3; i++) {
            const ii = indices[i];
            const song = songs[ii];
            const type_target = Math.min(ui.list.type_target, (ui.list.type_target < 5 ? (song.fourmode ?? 3) : song.types.length) - 1);
            const score = scores.map[song.charts[type_target]]?.[0];
            const req = requirements[song.charts[type_target]];
            const current_type = song.types[type_target];
            const is_full = current_type && current_type.length > 0 && current_type.substring(current_type.length - 1) === " ";
            if (i === 1)
                ui.list.mode = (is_full) ? "full" : "four";
            let locked = false;
            const angle = 0.32 * -((Math.round(index_circle) - index_circle) - 1 + i);
            if (x_constrained)
                ctx.translate(v.x, v.y / 2 - r * 1.05);
            else
                ctx.translate(v.x - 0.35 * r, v.y - r * 1.05);
            ctx.rotate(angle);
            const diff = song.difficulties[type_target];
            if (score) {
                ctx.fillStyle = color["grade_" + Chart.grade(score.value)];
                ctx.set_font_mono(r * 0.04);
                ctx.text("" + score.value, 0, r * 1.04 + rr);
                ctx.fillStyle = color.white;
                ctx.set_font_mono(r * 0.025);
                ctx.text(`bpm: ${song.bpm}`, 0, r * 1.0815 + rr);
                ctx.text(`combo: ${score.max_combo}/${song.notes[type_target]}`, 0, r * 1.115 + rr);
                ctx.strokeStyle = color["grade_" + Chart.grade(score.value)];
            }
            else if (!requirement.check(req)) {
                locked = true;
                ctx.fillStyle = color.purple;
                ctx.set_font_mono(r * 0.025);
                ctx.text("locked", 0, r * 1.04 + rr);
                ctx.set_font_mono(r * 0.02);
                ctx.text(req.name, 0, r * 1.08 + rr);
                ctx.strokeStyle = color.purple;
            }
            else if (req) {
                ctx.fillStyle = color.green;
                ctx.set_font_mono(r * 0.025);
                ctx.text("unlocked!", 0, r * 1.04 + rr);
                ctx.set_font_mono(r * 0.02);
                ctx.text(req.name, 0, r * 1.08 + rr);
                ctx.strokeStyle = color.grade_Z;
            }
            else {
                ctx.fillStyle = diff < 0 ? color.red : color.yellow;
                ctx.set_font_mono(r * 0.025);
                if (diff >= 0) {
                    ctx.text("not played yet", 0, r * 1.04 + rr);
                    ctx.text(`bpm: ${song.bpm}`, 0, r * 1.0765 + rr);
                    ctx.text(`notes: ${song.notes[type_target]}`, 0, r * 1.11 + rr);
                }
                else {
                    ctx.text("unavailable", 0, r * 1.06 + rr);
                }
                ctx.strokeStyle = color.grade_Z;
            }
            ctx.beginPath();
            if (!is_full)
                ctx.circle(0, r, rr);
            else
                ctx.polygon(6, rr * 1.1, 0, r, 0.3);
            ctx.stroke();
            let rotato = false;
            if (i === 1)
                ui.check_click(ui.list_enter, () => { rotato = true; });
            else
                ui.check_click(() => {
                    if (true && (x_constrained && mouse.down_position[0].y < v.y) || (!x_constrained && mouse.down_position[0].x < v.x - 0.15 * r)) {
                        index_target_change = ii - ui.list.index_target;
                    }
                });
            ctx.clip();
            ctx.translate(0, r);
            if (locked) {
                ctx.globalAlpha = 0.3;
                ctx.draw_image(ui.images[songs[ii].image], -0.15 * r, -0.15 * r, 0.3 * r, 0.3 * r);
                ctx.globalAlpha = 1;
                ctx.fillStyle = color.purple;
                ctx.svg("lock", 0, 0, r * 0.16);
            }
            else {
                if (rotato)
                    ctx.rotate(ui.time * 0.5);
                ctx.draw_image(ui.images[songs[ii].image], -0.15 * r, -0.15 * r, 0.3 * r, 0.3 * r);
                if (req && !score) {
                    ctx.fillStyle = color.green;
                    ctx.svg("unlock", 0, 0, r * 0.15);
                }
            }
            ctx.resetTransform();
            ctx.restore("draw_list_left");
            ctx.save("draw_list_left");
            ctx.beginPath();
            if (x_constrained)
                ctx.rect(0, 0, size.x, v.y);
            else
                ctx.rect(0, 0, x, size.y);
            ctx.clip();
        }
        ctx.restore("draw_list_left");
        ctx.strokeStyle = color.white;
        ctx.lineWidth = 2;
        if (x_constrained) {
            ctx.line(0, v.y, size.x, v.y);
        }
        else {
            x = v.x - 0.15 * r;
            ctx.line(x, 0, x, size.y);
        }
        ctx.stroke();
        if (x_constrained) {
            x = v.x;
            y = v.y * 1.5;
        }
        else {
            x = v.x + 0.2 * r;
            y = v.y;
        }
        w = 0.6 * r;
        h = 0.09 * r;
        ctx.strokeStyle = color.white;
        ctx.lineWidth = 2;
        ctx.save("draw_list_right");
        if (x_constrained) {
            ctx.beginPath();
            ctx.rect(0, v.y, size.x, v.y);
            ctx.clip();
        }
        else {
            ctx.beginPath();
            ctx.rectangle(x, y, w, size.y);
        }
        if (ui.mobile) {
            ui.check_drag((delta) => {
                ui.list.index_target_d = -delta.y / h * ui.list.index_target_scroll_mult;
            });
            if (!mouse.buttons[0] && ui.list.index_target_d !== 0) {
                index_target_change = Math.round(ui.list.index_target_d);
                ui.list.index_target_d = 0;
            }
        }
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            const type_target = Math.min(ui.list.type_target, (ui.list.type_target < 5 ? (song.fourmode ?? 3) : song.types.length) - 1);
            const score = scores.map[song.charts[type_target]]?.[0];
            const current_type = song.types[type_target];
            const is_full = current_type && current_type.length > 0 && current_type.substring(current_type.length - 1) === " ";
            const angle = 0.2 * (i - index);
            ctx.translate(x, y + Math.sin(angle) * r / 2);
            ctx.scale(1, Math.cos(angle));
            if (i === ui.list.index_target) {
                const grade = Chart.grade(score?.value ?? 0);
                ctx.fillStyle = color["grade_" + grade];
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.rectangle(0, 0, w * 7 / 6 - 3, h * 1.12);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.fillStyle = color.black;
                ctx.beginPath();
                ctx.round_rectangle(0, 0, w, h, is_full ? h * 0.1 : h * 2);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.rectangle(0, 0, w, h);
            ui.check_click(() => {
                const change = i - ui.list.index_target;
                if (change !== 0)
                    ui.list_change_index(change);
                else
                    song_enter = true;
            }, () => {
                ctx.fillStyle = color.white + "11";
                ctx.beginPath();
                ctx.round_rectangle(0, 0, w, h, is_full ? h * 0.1 : h * 2);
                ctx.fill();
            });
            ctx.set_font_mono(h * 0.3);
            ctx.fillStyle = color.white;
            ctx.text(song.name, 0, 0);
            ctx.fillStyle = color["difficulty_" + song.types[type_target].trim()];
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            if (is_full)
                ctx.round_rectangle(h / 2 - w / 2, 0, h, h, h * 0.1);
            else
                ctx.circle(h / 2 - w / 2, 0, h / 2);
            ui.check_click(() => {
                ui.list_change_type(1);
                song_enter = false;
            }, () => ctx.globalAlpha = 0.2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.set_font_mono(h * 0.4);
            let difftext = "" + Math.floor(song.difficulties[type_target]);
            if (difftext === "-1")
                difftext = "✖";
            ctx.text(difftext, h / 2 - w / 2, 0);
            const grade = Chart.grade(score?.value ?? 0);
            ctx.fillStyle = color["grade_" + grade];
            ctx.globalAlpha = 0.15;
            ctx.beginPath();
            if (is_full)
                ctx.round_rectangle(w / 2 - h / 2, 0, h, h, h * 0.1);
            else
                ctx.circle(w / 2 - h / 2, 0, h / 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.set_font_mono(h * 0.4);
            ctx.text(grade, w / 2 - h / 2, 0);
            ctx.beginPath();
            ctx.round_rectangle(0, 0, w, h, is_full ? h * 0.1 : h * 2);
            ctx.stroke();
            const special = Chart.special_grades[score?.special ?? 0];
            ctx.fillStyle = color["special_" + special];
            ctx.translate(w * 0.475, -h / 2);
            ctx.rotate(Math.PI * 0.1);
            ctx.strokeText(special, 0, 0);
            ctx.text(special, 0, 0);
            ctx.resetTransform();
        }
        if (song_enter)
            ui.enter();
        ctx.restore("draw_list_right");
        if (ui.mobile) {
            w = Math.min(ui.width, ui.height) * 0.2;
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = ui.game.backing > 0 ? color.red : color.yellow;
            ctx.beginPath();
            ctx.round_rect(w * 0.5, w * 0.5, w, w, w * 0.2);
            ctx.fill();
            ctx.globalAlpha = 0.5;
            ctx.svg("back", w, w, w * 0.8);
            ui.check_click(() => {
                index_target_change = 0;
                ui.back();
            });
            if (ui.game.backing && ui.time - ui.game.backing > 120) {
                ui.game.backing = 0;
            }
            ctx.fillStyle = ui.game.restarting > 0 ? color.red : color.yellow;
            ctx.beginPath();
            ctx.round_rect(size.x - w * 1.5, w * 0.5, w, w, w * 0.2);
            ctx.fill();
            ctx.globalAlpha = 0.5;
            ctx.svg("chart", size.x - w, w, w * 0.8);
            ui.check_click(() => {
                index_target_change = 0;
                ui.shift();
            });
            if (ui.game.restarting && ui.time - ui.game.restarting > 120) {
                ui.game.restarting = 0;
            }
            ctx.globalAlpha = 1;
        }
        else {
        }
        if (index_target_change)
            ui.list_change_index(index_target_change);
    },
    list_change_index: function (delta) {
        if (ui.menu !== "list")
            return;
        ui.list.playing = sounds[songs[ui.list.index_target].preview];
        ui.list.playing.pause();
        ui.list.playing.reset();
        ui.list.index_target += delta + songs.length;
        ui.list.index_target %= songs.length;
        ui.list.playing = sounds[songs[ui.list.index_target].preview];
        ui.list.playing.reset();
        ui.list.playing.play();
    },
    list_change_type: function (delta) {
        if (ui.menu !== "list")
            return;
        const song = songs[ui.list.index_target];
        ui.list.type_target += delta + Math.max(song.types.length, 3);
        ui.list.type_target %= Math.max(song.types.length, 3);
        if (song.types[ui.list.type_target] == undefined || song.types[ui.list.type_target].length <= 0) {
            ui.list_change_type(delta);
            return;
        }
        ui.list.playing.play();
    },
    list_enter: function () {
        if (ui.menu !== "list")
            return;
        const song = songs[ui.list.index_target];
        settings.current_chart.song_id = song.id;
        settings.current_chart.song_type = Math.min(ui.list.type_target, (ui.list.type_target < 5 ? (song.fourmode ?? 3) : song.types.length) - 1);
        const chart_name = song.charts[settings.current_chart.song_type];
        settings.current_chart.chart_name = chart_name;
        if (song.difficulties[settings.current_chart.song_type] === -1)
            return;
        if (!requirement.check(requirements[chart_name]) && window.location.hostname !== "127.0.0.1")
            return;
        ui.list.playing.pause();
        ui.list.playing.reset();
        ui.menu = "game";
        ui.game.backing = 0;
        ui.game.restarting = 0;
        ui.reset_effects();
    },
    enter: function () {
        if (ui.close_boxes())
            return;
        if (ui.menu === "main") {
            ui.main_enter();
        }
        else if (ui.menu === "list") {
            ui.list_enter();
        }
        else if (ui.menu === "game" && (!Sound.current || Sound.current?.play_timestamp === -1)) {
            ui.list.playing.pause();
            ui.list.playing.reset();
            Chart.make(settings.current_chart);
            Chart.make(settings.current_chart);
            Sound.current?.play_after(1000);
            if (Sound.current)
                Sound.current.element.playbackRate = settings.play_speed;
            const sound = sfxr.generate("pickupCoin");
            sfxr.play(sound);
        }
        else if (ui.menu === "game" && !settings.normal_mode) {
            Sound.current?.toggle();
        }
        else if (ui.menu === "game" && Sound.current?.finished) {
            ui.back();
        }
    },
    shift: function () {
        if (ui.menu === "list") {
            if (ui.check_box("toplist_chart")) {
                if (ui.list.leaderboard) {
                    ui.make_toplist_chart(ui.list.chart, false);
                }
                else {
                    ui.hide_box("toplist_chart");
                }
            }
            else {
                ui.make_toplist_chart(ui.list.chart, true);
            }
        }
    },
    restart: function () {
        if (ui.menu === "game" && Sound.current && Sound.current?.play_timestamp > -1) {
            ui.game.restarting = 0;
            Chart.make(settings.current_chart);
            Sound.current?.play_after(1000);
            const sound = sfxr.generate("pickupCoin");
            sfxr.play(sound);
        }
    },
    back: function () {
        if (ui.close_boxes())
            return;
        if (ui.menu === "list") {
            ui.menu = "main";
            ui.main.index_target = 0;
            ui.list.playing.pause();
            ui.list.playing.reset();
            ui.make_toplist();
            ui.make_leaderboard();
        }
        else if (ui.menu === "game") {
            ui.menu = "list";
            ui.list_change_index(0);
            if (Chart.current?.metadata.chart_name === "beeps" && ui.game.calibration.offset_queue.length >= 4) {
                ui.make_calibration_popup();
                ui.show_box("calibration_popup");
            }
            Sound.current?.pause();
            Sound.current?.reset();
            Chart.current?.reset();
            Sound.current?.hide();
            Sound.current = undefined;
        }
        else {
        }
    },
    up: function () {
        if (ui.is_box_open())
            return;
        if (ui.menu === "main") {
            ui.main.index_target += ui.main.svg.length - 1;
            ui.main.index_target %= ui.main.svg.length;
        }
        else if (ui.menu === "list") {
            ui.list_change_index(-1);
        }
    },
    down: function () {
        if (ui.is_box_open())
            return;
        if (ui.menu === "main") {
            ui.main.index_target += 1;
            ui.main.index_target %= ui.main.svg.length;
        }
        else if (ui.menu === "list") {
            ui.list_change_index(1);
        }
    },
    left: function () {
        if (ui.is_box_open())
            return;
        if (ui.menu === "main") {
            ui.main.index_target += ui.main.svg.length - 1;
            ui.main.index_target %= ui.main.svg.length;
        }
        else if (ui.menu === "list") {
            ui.list_change_type(-1);
        }
        else if (ui.menu === "game") {
            if (!settings.normal_mode && Sound.current) {
                Sound.current.element.currentTime -= 5;
            }
        }
    },
    right: function () {
        if (ui.is_box_open())
            return;
        if (ui.menu === "main") {
            ui.main.index_target += 1;
            ui.main.index_target %= ui.main.svg.length;
        }
        else if (ui.menu === "list") {
            ui.list_change_type(1);
        }
        else if (ui.menu === "game") {
            if (!settings.normal_mode && Sound.current) {
                Sound.current.element.currentTime += 5;
            }
        }
    },
    draw_board: function (v, size, x_constrained = false) {
        const chart = Chart.current;
        const sound = Sound.current;
        const is_full = chart?.type === "full";
        r = Math.min(size.y / 2, size.x);
        if (!chart || !sound) {
            const difftype = chart_map[settings.current_chart.chart_name].song_type;
            const diffnumber = chart_map[settings.current_chart.chart_name].song_difficulty;
            const h = Math.min(150, Math.min(ui.width * 0.2, r * 0.3));
            ctx.set_font_mono(h * 0.6);
            ctx.fillStyle = color.white;
            ctx.text("start", v.x, v.y - h * 0.2);
            ctx.set_font_mono(h * 0.3);
            ctx.fillStyle = color["difficulty_" + difftype];
            ctx.text(difftype + " " + diffnumber, v.x, v.y + h * 0.35);
            ctx.strokeStyle = color.white;
            ctx.beginPath();
            ctx.round_rectangle(v.x, v.y, h * 3.5, h * 1.5, h * 0.2);
            ctx.stroke();
            ui.check_click(ui.enter, () => {
                ctx.fillStyle = color.white + "11";
                ctx.fill();
            });
            if (ui.mobile) {
                w = Math.min(ui.width, ui.height) * 0.2;
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = ui.game.backing > 0 ? color.red : color.yellow;
                ctx.beginPath();
                ctx.round_rect(w * 0.5, w * 0.5, w, w, w * 0.2);
                ctx.fill();
                ctx.svg("back", w, w, w * 0.8);
                ui.check_click(() => {
                    ui.back();
                });
                ctx.globalAlpha = 1;
            }
            return;
        }
        const tilt = is_full ? 0 : (chart.lane_pressed[1] ? -2 : 0) + (chart.lane_pressed[2] ? -1 : 0) + (chart.lane_pressed[3] ? 1 : 0) + (chart.lane_pressed[4] ? 2 : 0);
        ui.game.tilt += tilt * 0.001;
        ui.game.tilt *= 0.90909090909090909;
        ui.game.offset = vector.mult(ui.game.offset, 0.90909090909090909);
        if (!is_full)
            ui.game.lanes = math.lerp(ui.game.lanes, ui.game.lanes_target, ui.game.lanes_smoothness);
        else {
            ui.game.lanes = 11;
            size.x *= 2;
        }
        ui.game.separation = math.lerp(ui.game.separation, ui.game.separation_target, ui.game.separation_smoothness);
        ui.game.scale = vector.lerp_v(ui.game.scale, ui.game.scale_target, ui.game.scale_smoothness);
        ctx.save("tilted");
        ctx.translate(v.x, v.y);
        ctx.rotate(ui.game.tilt + ui.game.tilt_);
        ctx.translate(-v.x, -v.y);
        ctx.save("scaled");
        ctx.translate(v.x, v.y);
        ctx.scale(ui.game.scale.x, ui.game.scale.y);
        ctx.translate(-v.x, -v.y);
        let xx = v.x;
        let yy = v.y - size.y / 2;
        let lanewidth = size.x / ui.game.lanes;
        let lanesep = lanewidth * ui.game.separation;
        let lanes = is_full ? 58 : Math.max(ui.game.lanes_target, math.round(ui.game.lanes + 0.45));
        const total_lane_width = is_full ? lanewidth + lanesep * 10 : lanewidth + lanesep * (ui.game.lanes - 1);
        xx -= total_lane_width / 2;
        if (is_full) {
            for (let i = 10; i <= lanes; i++) {
                if (!chart?.lane_pressed[i])
                    continue;
                const row = lane_to_row[i];
                const col = lane_to_col[i];
                ctx.fillStyle = color["keyboard_row_" + row];
                ctx.globalAlpha = (i === 57 ? 0.04 : 0.1);
                ctx.beginPath();
                x = xx + (col - 1) * lanesep;
                ctx.rect(x, yy, (i === 57 ? 6 : 1) * lanewidth, size.y);
                ctx.fill();
            }
            ctx.globalAlpha = 0.1;
            for (let i = 10; i <= lanes; i++) {
                if (true)
                    continue;
                const row = lane_to_row[i];
                const col = lane_to_col[i];
                ctx.fillStyle = color["keyboard_row_" + row];
                x = xx + (col - 1) * lanesep;
                ctx.line(x, yy, x, yy + size.y);
                x += lanewidth;
                ctx.line(x, yy, x, yy + size.y);
            }
        }
        else {
            ctx.fillStyle = color.white;
            ctx.globalAlpha = 0.1;
            for (let i = 1; i <= lanes; i++) {
                if (!chart.lane_pressed[i])
                    continue;
                ctx.beginPath();
                x = xx + (ui.lane_x(i) - 1) * lanesep;
                ctx.rect(x, yy, ui.lane_w(i) * lanewidth, size.y);
                ctx.fill();
            }
            ctx.strokeStyle = color.white;
            ctx.lineWidth = 2;
            for (let i = 1; i <= lanes; i++) {
                x = xx + (ui.lane_x(i) - 1) * lanesep;
                ctx.globalAlpha = 0.6 + 0.2 * Math.abs(i - 2);
                ctx.line(x, yy, x, yy + size.y);
                x += lanewidth;
                ctx.line(x, yy, x, yy + size.y);
            }
        }
        ctx.globalAlpha = 1;
        const line_offset = (0.9 + settings.line_offset / 1000);
        y = yy + size.y * line_offset;
        ctx.strokeStyle = color.white;
        ctx.lineWidth = 2;
        ctx.line(xx, y, xx + total_lane_width, y);
        ctx.save("draw_board");
        if (!is_full) {
            ctx.beginPath();
            ctx.rect(xx, yy, total_lane_width, size.y);
            ctx.clip();
        }
        else {
            ctx.fillStyle = color.white;
        }
        const notespeed = (ui.game.notespeed_set ?? (settings.notespeed * ui.game.notespeed_mult)) * size.y / 700;
        const seems = size.y * (line_offset + 0.2) / notespeed;
        for (const note of Object.values(chart.active_notes)) {
            const time_to = sound.time_to(note.time);
            const notesize = vector.mult(size, ui.lane_w(note.lane) / ui.game.lanes);
            if (time_to > seems)
                continue;
            if (note.type === note_type.hold) {
                const time_to_2 = sound.time_to(note.time2);
                const length = time_to_2 - time_to;
                if (note.hit > 0 && note.release < 0) {
                    ctx.fillStyle = ui.lane_c(note.lane);
                    ctx.globalAlpha = 0.8;
                }
                else {
                    ctx.fillStyle = ui.lane_c(note.lane);
                    ctx.globalAlpha = (note.hit === 0 || note.release === 0) ? 0.2 : 0.55;
                }
                if (note.lane === 57)
                    ctx.globalAlpha *= 0.4;
                ctx.beginPath();
                ctx.round_rectangle(xx + (ui.lane_x(note.lane) - 1) * lanesep + lanewidth / 2, y - (sound.time_to(note.time) + length / 2) * notespeed, notesize.x, notesize.y * 0.2 + length * notespeed, size.y * 0.02);
                ctx.fill();
                ctx.fillStyle = color.white;
                ctx.globalAlpha = 1;
                ui.draw_note(note_type.normal, xx + (ui.lane_x(note.lane) - 1) * lanesep + lanewidth / 2, y - sound.time_to(note.time) * notespeed, notesize, note);
            }
            if (note.hit >= 0) {
                const t = -sound.time_to(note.hit_time);
                if (t < 200) {
                    if (ui.game.hit_force) {
                        ui.game.offset.y += ui.game.hit_force;
                    }
                    ctx.fillStyle = color[["red", "yellow", "green", "blue", "purple"][note.hit]];
                    ctx.globalAlpha = (200 - t) / 300;
                    ui.draw_note(note.type, xx + (ui.lane_x(note.lane) - 1) * lanesep + lanewidth / 2, y - (time_to + t) * notespeed, notesize, note);
                    ctx.globalAlpha = 1;
                }
                else if (note.type !== note_type.hold || t > 200 + (note.duration ?? 0)) {
                    chart.deactivate_note(note);
                }
            }
            else if (note.type !== note_type.hold) {
                if (!note.visible)
                    continue;
                ctx.fillStyle = color.white;
                ctx.globalAlpha = 1;
                ui.draw_note(note.type, xx + (ui.lane_x(note.lane) - 1) * lanesep + lanewidth / 2, y - sound.time_to(note.time) * notespeed, notesize, note);
                continue;
            }
        }
        for (const effect of Object.values(chart.active_effects)) {
            const time_to = sound.time_to(effect.time);
            if (time_to > seems)
                continue;
            if (time_to <= 0) {
                ui.draw_effect(effect, time_to);
                const time_to_2 = sound.time_to(effect.time2);
                if (time_to_2 <= 0) {
                    chart.deactivate_effect(effect);
                }
            }
        }
        ctx.restore("draw_board");
        ctx.restore("scaled");
        const result = chart.result;
        h = size.y * 0.4;
        y = yy + size.y - h;
        ctx.set_font_mono(h * 0.12);
        ctx.textAlign = "left";
        x = v.x + size.x * Math.abs(ui.game.scale.x) / 2 + size.x * 0.08;
        if (x_constrained) {
            x = v.x + size.x * Math.abs(ui.game.scale.x) / 2 + (ui.width - size.x) / 4;
            ctx.textAlign = "center";
        }
        for (let i = 4; i >= 0; i--) {
            ctx.fillStyle = color[["red", "yellow", "green", "blue", "purple"][i]];
            ctx.text((x_constrained ? "" : (["miss", "bad", "good", "perfect", "perfect+"][i] + ": ")) + result[i], x, y + i * h / 5);
        }
        ctx.set_font_mono(h * 0.15);
        let text = "";
        if (settings.display_number === "score") {
            ctx.fillStyle = color["grade_" + Chart.grade(chart.score)];
            text = "" + chart.score;
        }
        else if (settings.display_number === "accuracy") {
            ctx.fillStyle = color["grade_" + Chart.grade(chart.accuracy * 1010000)];
            text = (chart.accuracy * 100).toFixed(2) + "%";
        }
        else if (settings.display_number === "accuracy+") {
            ctx.fillStyle = color["grade_" + Chart.grade(chart.accuracy * 1010000)];
            text = (chart.accuracy * 101).toFixed(2) + "%";
        }
        else if (settings.display_number === "highest") {
            ctx.fillStyle = color["grade_" + Chart.grade(chart.highest_score)];
            text = "" + chart.highest_score;
        }
        else if (settings.display_number === "predict") {
            ctx.fillStyle = color["grade_" + Chart.grade(Math.round(chart.accuracy * 1010000))];
            text = "" + Math.round(chart.accuracy * 1010000);
        }
        ctx.text(text, v.x, x_constrained ? h * 0.3 : h * 0.2);
        if (x_constrained) {
            ctx.set_font_mono(h * 0.2);
            ctx.fillStyle = color["special_" + Chart.special_grade(result)];
            ctx.text("" + chart.combo, v.x, yy + h * 0.3);
        }
        else {
            ctx.fillStyle = color.white;
            ctx.set_font_mono(h * 0.12);
            ctx.textAlign = "left";
            ctx.text("score: " + chart.score, x, yy + h * 0.2);
            ctx.text("combo: " + chart.combo, x, yy + h * 0.4);
            ctx.set_font_mono(h * 0.08);
            ctx.textAlign = "left";
            ctx.text("offset: " + chart.avg_offset.toFixed(2), x, yy + h * 0.6);
            ctx.text(chart.notes_played + "/" + chart.total_notes + " notes", x, yy + h * 0.72);
            y = v.y + size.y / 2 - h;
            x = v.x - size.x * Math.abs(ui.game.scale.x) / 2 - size.x * 0.08;
            ctx.set_font_mono(h * 0.15, "", "right");
            ctx.fillStyle = color.white;
            ctx.text("max combo", x, y + h * 0.2);
            ctx.fillStyle = color["special_" + Chart.special_grade(result)];
            ctx.set_font_mono(h * 0.3, "", "right");
            ctx.text("" + chart.max_combo, x, y + h * 0.6);
        }
        if (chart.metadata.chart_name === "beeps") {
            ctx.set_font_mono(h * 0.12);
            ctx.fillStyle = color.white;
            ctx.text("offset: " + ui.game.calibration.mean.toFixed(2), v.x, yy + h * 0.25);
            ctx.text("variance: " + ui.game.calibration.variance.toFixed(0), v.x, yy + h * 0.5);
        }
        ctx.restore("tilted");
        if (ui.mobile) {
            ctx.save("mobile");
            w = ui.width / ui.game.lanes;
            for (let i = 1; i <= lanes; i++) {
                x = (ui.lane_x(i) - 1) * w;
                let ww = ui.lane_w(i) * w;
                ctx.fillStyle = (mouse.lanes[i] ? color.green : color.red);
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.rect(x, ui.height - w, ww, w);
                ctx.fill();
                if (ui.lane_x(i) < lanes) {
                    ctx.fillStyle = color.white;
                    ctx.strokeStyle = color.white;
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 1;
                    ctx.line(x + ww, ui.height - w, x + ww, ui.height);
                }
            }
            w = Math.min(ui.width, ui.height) * 0.2;
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = ui.game.restarting > 0 ? color.red : color.yellow;
            ctx.beginPath();
            ctx.round_rect(ui.width - w * 1.5, w * 0.5, w, w, w * 0.2);
            ctx.fill();
            ctx.svg("restart", ui.width - w, w, w * 0.8);
            ui.check_click(() => {
                if (ui.game.restarting <= 0)
                    ui.game.restarting = ui.time;
                else
                    ui.restart();
            });
            if (ui.game.restarting && ui.time - ui.game.restarting > 120) {
                ui.game.restarting = 0;
            }
            w = Math.min(ui.width, ui.height) * 0.2;
            ctx.fillStyle = ui.game.backing > 0 ? color.red : color.yellow;
            ctx.beginPath();
            ctx.round_rect(w * 0.5, w * 0.5, w, w, w * 0.2);
            ctx.fill();
            ctx.svg("back", w, w, w * 0.8);
            ui.check_click(() => {
                if (ui.game.backing <= 0)
                    ui.game.backing = ui.time;
                else
                    ui.back();
            });
            if (ui.game.backing && ui.time - ui.game.backing > 120) {
                ui.game.backing = 0;
            }
            ctx.restore("mobile");
        }
    },
    lane_x: function (i, override_lanes_target) {
        if (ui.game.lanes_type === "four") {
            const t = override_lanes_target ?? ui.game.lanes_target;
            if (t === 4) {
                if (ui.game.lanes_prev > 4 && Math.abs(ui.game.lanes - ui.game.lanes_target) > 0.05) {
                    return this.lane_x(i, ui.game.lanes_prev);
                }
                else {
                    return i;
                }
            }
            else if (t === 5) {
                if (i <= 2)
                    return i;
                if (i <= 4)
                    return ui.game.lanes + 1 - (5 - i);
                if (i <= 5)
                    return 3;
                if (i <= 6)
                    return ui.game.lanes + 1;
            }
            else if (t === 6) {
                if (i <= 4)
                    return (ui.game.lanes - 4) / 2 + i;
                if (i <= 5)
                    return 1;
                if (i <= 6)
                    return (ui.game.lanes - 4) / 2 + 5;
                if (i <= 7)
                    return ui.game.lanes + 1;
            }
            else if (t === 7) {
            }
            return i;
        }
        else {
            if (i === 57)
                return 4.5;
            return lane_to_col[i];
        }
    },
    lane_w: function (i) {
        if (ui.game.lanes_type === "full") {
            if (i === 57)
                return 6;
            else
                return 1;
        }
        else {
            if (i <= 4)
                return 1;
            if (ui.game.lanes_target === 4) {
                if (i <= 5)
                    return ui.game.lanes - 4;
                if (i <= 6)
                    return Math.max(0, ui.game.lanes - 5);
            }
            else if (ui.game.lanes_target === 5) {
                if (i <= 5)
                    return ui.game.lanes - 4;
            }
            else if (ui.game.lanes_target === 6) {
                if (i <= 5)
                    return (ui.game.lanes - 4) / 2;
                if (i <= 6)
                    return (ui.game.lanes - 4) / 2;
            }
            else if (ui.game.lanes_target === 7) {
            }
        }
        return 1;
    },
    lane_c: function (i) {
        if (ui.game.lanes_type === "four") {
            return color.white;
        }
        else {
            return color["keyboard_row_" + lane_to_row[i]];
        }
    },
    draw_note: function (type, x, y, size, note) {
        if (ui.game.lanes_type === "four") {
            if (type === note_type.normal || type === note_type.hold) {
                ctx.beginPath();
                if (ui.game.skin === "tetris" && ctx.globalAlpha === 1) {
                    ctx.fillStyle = color["tetris_" + (note.duration ?? 0)];
                    const a = size.x * ui.game.scale.x / ui.game.scale.y;
                    ctx.round_rectangle(x, y, size.x, a, size.y * 0.05);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.beginPath();
                }
                else if (ui.game.skin === "kahoot" && ctx.globalAlpha === 1) {
                    ctx.fillStyle = color["kahoot_" + (note.lane ?? 0)];
                }
                ctx.round_rectangle(x, y, size.x, size.y * 0.2, size.y * 0.08);
                ctx.fill();
            }
            else if (type === note_type.spam) {
                ctx.beginPath();
                ctx.circle(x, y, size.y * 0.1);
                ctx.fill();
            }
            else if (type === note_type.inverse) {
                const r = size.y * 0.1;
                ctx.beginPath();
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = size.y * 0.04;
                ctx.line(x - r, y - r, x + r, y + r);
                ctx.line(x + r, y - r, x - r, y + r);
            }
        }
        else {
            if (type === note_type.normal || type === note_type.hold) {
                h = size.x;
                if (note.lane === 57) {
                    h /= 6;
                    ctx.globalAlpha *= 0.4;
                }
                ctx.beginPath();
                ctx.round_rectangle(x, y, size.x, h, h * 0.1);
                ctx.fill();
                if (ctx.fillStyle === color.white) {
                    ctx.fillStyle = ui.lane_c(note.lane);
                    ctx.globalAlpha *= 0.7;
                    ctx.beginPath();
                    ctx.round_rectangle(x, y, size.x, h, h * 0.1);
                    ctx.fill();
                    ctx.fillStyle = color.black;
                    ctx.set_font_mono(size.x * 0.8, "bold");
                    ctx.fillText(lane_to_key[note.lane].toUpperCase(), x, y);
                }
            }
            else if (type === note_type.spam) {
                ctx.beginPath();
                ctx.circle(x, y, size.x * 0.25);
                ctx.fill();
                if (ctx.fillStyle === color.white) {
                    ctx.fillStyle = ui.lane_c(note.lane);
                    ctx.globalAlpha *= 0.7;
                    ctx.beginPath();
                    ctx.circle(x, y, size.x * 0.25);
                    ctx.fill();
                }
            }
            else if (type === note_type.inverse) {
                const r = size.y * 0.1;
                ctx.beginPath();
                ctx.strokeStyle = ctx.fillStyle;
                ctx.lineWidth = size.y * 0.04;
                ctx.line(x - r, y - r, x + r, y + r);
                ctx.line(x + r, y - r, x - r, y + r);
            }
            else if (type === note_type.hex) {
                ctx.beginPath();
                ctx.polygon(6, size.x, x, y);
                ctx.fill();
                if (ctx.fillStyle === color.white) {
                    ctx.fillStyle = ui.lane_c(note.lane);
                    ctx.globalAlpha *= 0.7;
                    ctx.beginPath();
                    ctx.polygon(6, size.x, x, y);
                    ctx.fill();
                }
            }
        }
    },
    draw_effect: function (e, time_to) {
        const type = e.type;
        if (type === "tilt") {
            ui.game.tilt += vector.deg_to_rad(e.a);
        }
        else if (type === "tilt+") {
            ui.game.tilt_ = vector.deg_to_rad(e.a) * e.ratio(-time_to);
        }
        else if (type === "x") {
            ui.game.offset.x += e.a;
        }
        else if (type === "y") {
            ui.game.offset.y += e.a;
        }
        else if (type === "x+") {
            ui.game.offset_.x = e.a * e.ratio(-time_to);
        }
        else if (type === "y+") {
            ui.game.offset_.y = e.a * e.ratio(-time_to);
        }
        else if (type === "scale_x") {
            ui.game.scale.x = 1 + (e.a - 1) * e.ratio(-time_to);
            ui.game.scale_target.x = ui.game.scale.x;
        }
        else if (type === "scale_y") {
            ui.game.scale.y = 1 + (e.a - 1) * e.ratio(-time_to);
            ui.game.scale_target.y = ui.game.scale.y;
        }
        else if (type === "scalex") {
            if (ui.game.scale_target.x === e.a)
                return;
            ui.game.scale_target.x = e.a;
            ui.game.scale_smoothness.x = 60 / e.duration;
        }
        else if (type === "scaley") {
            if (ui.game.scale_target.y === e.a)
                return;
            ui.game.scale_target.y = e.a;
            ui.game.scale_smoothness.y = 60 / e.duration;
        }
        else if (type === "lanes") {
            if (ui.game.lanes_target === e.a)
                return;
            if (Chart.current)
                Chart.current.lanes = e.a;
            ui.game.lanes_prev = ui.game.lanes_target;
            ui.game.lanes_target = e.a;
            ui.game.lanes_smoothness = 60 / e.duration;
            config.lanes = e.a;
        }
        else if (type === "separation") {
            if (ui.game.separation_target === e.a)
                return;
            ui.game.separation_target = e.a;
            ui.game.separation_smoothness = 60 / e.duration;
        }
        else if (type === "hit_force") {
            ui.game.hit_force = e.a;
        }
        else if (type === "skin") {
            ui.game.skin = ui.game.skins[e.a];
        }
        else if (type === "notespeed_mult") {
            ui.game.notespeed_mult = e.a;
        }
        else if (type === "notespeed_set") {
            if (e.a)
                ui.game.notespeed_set = e.a;
            else
                ui.game.notespeed_set = undefined;
        }
    },
    reset_effects: function () {
        config.lanes = 4;
        ui.game.lanes = 4;
        ui.game.lanes_target = 4;
        ui.game.lanes_smoothness = 0.05;
        ui.game.lanes_type = Chart.current?.type ?? "four";
        ui.game.separation = 1;
        ui.game.separation_target = 1;
        ui.game.separation_smoothness = 0.05;
        ui.game.offset = vector.create();
        ui.game.offset_ = vector.create();
        ui.game.scale = vector.create(1, 1);
        ui.game.scale_target = vector.create(1, 1);
        ui.game.scale_smoothness = vector.create(0.05, 0.05);
        ui.game.tilt = 0;
        ui.game.tilt_ = 0;
        ui.game.notespeed_mult = 1;
        ui.game.notespeed_set = undefined;
        ui.game.hit_force = 0;
        ui.game.skin = ui.game.skins[0];
    },
    draw_practice: function () {
        w = this.width - 113.2 - 16 * 2;
        y = this.height - 70;
        const checkpoints = Chart.current?.checkpoints || [];
        const length = Sound.current?.length || 0;
        if (length <= 0 || checkpoints.length <= 0 || !Chart.current || !Sound.current)
            return;
        for (let i = 0; i <= 9; i++) {
            if (checkpoints[i] < 0)
                continue;
            x = 113.2 + 16 + w * checkpoints[i] / length;
            ctx.beginPath();
            ctx.circle(x, y, 8);
            ctx.fillStyle = color.white;
            ctx.fill();
            ctx.strokeStyle = color.white;
            ctx.line(x, y, x, this.height);
            ctx.set_font_mono(10, "", "center");
            ctx.text("" + i, x, y - 20);
        }
    },
    draw_results: function (v, size, x_constrained = false) {
        const chart = Chart.current;
        const sound = Sound.current;
        if (!chart || !sound) {
            return;
        }
        chart.finish();
        const result = chart.result;
        const score = chart.score;
        const old_score = chart.old_score;
        const grade = Chart.grade(score);
        const special = Chart.special_grade(result);
        h = Math.min(200, size.x * 0.6);
        if (x_constrained) {
            h = Math.min(h, ui.width * 0.22);
        }
        ctx.set_font_mono(h * 0.45, "bold", "center");
        const w1 = ctx.text_width("" + score);
        ctx.set_font_mono([0, h * 0.75, h * 0.675, h * 0.625][grade.length], "bold", "center");
        const w2 = ctx.text_width(grade);
        w = w1 + w2 + h * 0.375;
        ctx.fillStyle = color.black;
        ctx.strokeStyle = color.white;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.round_rectangle(v.x, v.y, w + h * 0.75, h * 1.15, h * 0.05);
        ctx.fill();
        ctx.stroke();
        ui.check_click(ui.enter);
        ctx.set_font_mono(h * 0.45, "bold", "center");
        ctx.fillStyle = color.white;
        ctx.strokeStyle = color["grade_" + grade];
        ctx.lineWidth = 0.5;
        ctx.text("" + score, v.x + w / 2 - w1 / 2, v.y - h * 0.125);
        ctx.strokeText("" + score, v.x + w / 2 - w1 / 2, v.y - h * 0.125);
        ctx.set_font_mono(h * 0.2, "bold", "center");
        ctx.text("BEST: " + old_score, v.x + w / 2 - w1 / 2, v.y + h * 0.275);
        ctx.set_font_mono([0, h * 0.75, h * 0.675, h * 0.625][grade.length], "bold", "center");
        ctx.fillStyle = color["grade_" + grade];
        ctx.text(grade, v.x - w / 2 + w2 / 2, v.y);
        if (special.length > 0) {
            ctx.set_font_mono(h * 0.3, "bold", "center");
            ctx.fillStyle = color["special_" + special];
            ctx.save("draw_results_special");
            ctx.translate(v.x - (w + h * 0.75) / 2, v.y - h / 2);
            ctx.rotate(-Math.PI * 0.1);
            ctx.text(special, 0, 0);
            ctx.restore("draw_results_special");
        }
    },
    make_toplist: function (uid, name) {
        if (document.getElementById("toplist")) {
            document.body.removeChild(document.getElementById("toplist"));
        }
        const main = document.createElement("div");
        main.id = "toplist";
        main.classList.add("centerbox");
        document.body.appendChild(main);
        main.innerHTML = `
      ${uid ?
            `<h3>${name}</h3><h3>total skill: <span id="totalskill"></span></h3><h3 id="toplist-back" style="position: absolute; left: 1.2em; top: 0%;"><a href="#">back</a></h3>` :
            `<h3>total skill: <span id="totalskill"></span></h3>`}
      <table id="chair" style="margin: 0 auto;">
        <tr><th>#</th><th>name</th><th colspan="2">diff</th><th>score</th><th colspan="2">grade</th><th>skill</th><th>date</th></tr>
      </table>
      <p>total score: <span id="totalscore"></span></p>
      <p>
        <span style="color: ${color["special_FC"]};">FC <span id="special1"></span></span><br>
        <span style="color: ${color["special_FC+"]};">FC+ <span id="special2"></span></span><br>
        <span style="color: ${color["special_AP"]};">AP <span id="special3"></span></span><br>
        <span style="color: ${color["special_AP+"]};">AP+ <span id="special4"></span></span><br>
      </p>
    `;
        const table = document.getElementById("chair");
        const fn = function (list, others = true) {
            list.sort(scores.compare_fn);
            let totalskill = 0;
            let totalscore = 0;
            let special_count = [0, 0, 0, 0, 0];
            for (let i = 0; i < list.length; i++) {
                const score = list[i];
                const chart = chart_map[score.chart];
                const tr = document.createElement("tr");
                const gr = Chart.grade(score.value);
                const sp = Chart.special_grades[score.special];
                for (let j = 0; j <= score.special; j++)
                    special_count[j]++;
                const d = new Date();
                const dt = new Date(score.time ?? (1735689599999 + d.getTimezoneOffset() * 60000));
                const tdy = dt.toLocaleDateString("en-SG") === d.toLocaleDateString("en-SG");
                tr.innerHTML = `
          <td>${i + 1}</td>
          <td>${chart.song_name}</td>
          <td style="color: ${color["difficulty_" + chart.song_type]};">${chart.song_type}</td>
          <td style="color: ${color["difficulty_" + chart.song_type]};">${chart.song_difficulty}</td>
          <td style="color: ${color["grade_" + gr]};">${score.value}</td>
          <td style="color: ${color["grade_" + gr]};">${gr}</td>
          <td style="color: ${color["special_" + sp]};">${sp}</td>
          <td title="${parseFloat(score.skill.toPrecision(15))}"><b>${score.skill.toFixed(3)}</b></td>
          <td title="${dt.toLocaleTimeString("en-SG")}">${tdy ? dt.toLocaleTimeString("en-SG") : dt.toLocaleDateString("en-SG")}</td>
        `;
                table.appendChild(tr);
                totalskill += score.skill;
                totalscore += score.value;
            }
            const span_skill = document.getElementById("totalskill");
            span_skill.textContent = totalskill.toFixed(3);
            span_skill.title = "" + totalskill;
            const span_score = document.getElementById("totalscore");
            span_score.textContent = totalscore.toFixed(0);
            span_score.title = "" + totalscore;
            for (let j = 1; j <= 4; j++) {
                const span_special = document.getElementById("special" + j);
                span_special.textContent = special_count[j] + "/" + config.charts;
                span_special.title = "" + special_count[j];
            }
            if (ui.mobile)
                main.addEventListener("click", function () {
                    ui.cancel_click();
                    ui.hide_box("toplist");
                });
            if (!others)
                ui.hide_box("toplist");
            else
                document.getElementById("toplist-back")?.addEventListener("click", function () {
                    ui.close_boxes();
                    ui.show_box("leaderboard");
                });
        };
        if (uid)
            firebase.get_toplist(uid, fn);
        else
            fn(scores.get_list(), false);
    },
    make_toplist_chart: function (chart_name, leaderboard = false) {
        if (document.getElementById("toplist_chart")) {
            document.body.removeChild(document.getElementById("toplist_chart"));
        }
        const main = document.createElement("div");
        main.id = "toplist_chart";
        main.classList.add("centerbox");
        document.body.appendChild(main);
        const chart = chart_map[chart_name];
        ui.list.leaderboard = leaderboard;
        if (leaderboard) {
            main.innerHTML = `<p> loading leaderboard... </p>`;
            firebase.get_scores(chart_name, (leaderboard) => {
                if (!leaderboard)
                    leaderboard = [];
                if (!firebase.signed_in || !firebase.user) {
                    const list = scores.map[chart_name];
                    if (list && list[0])
                        leaderboard.push({
                            uid: "",
                            username: "you",
                            userskill: scores.total_skill,
                            score: list[0],
                        });
                    leaderboard.sort((a, b) => b.score.skill - a.score.skill);
                }
                if (leaderboard.length === 0) {
                    main.innerHTML = `<p> not played yet </p>`;
                }
                else {
                    main.innerHTML = `
            <h3> ${chart.song_name} <span style="color: ${color["difficulty_" + chart.song_type]};">${chart.song_type} ${chart.song_difficulty}</span>: leaderboard </h3>
            <table id="chair_chart" style="margin-left: auto; margin-right: auto;">
              <tr><th>#</th><th>username</th><th>score</th><th colspan="2">grade</th><th>skill</th><th>date</th></tr>
            </table>
            <p> <button id="switch"> switch to local scores </button> </p>
          `;
                    const table = document.getElementById("chair_chart");
                    for (let i = 0; i < leaderboard.length; i++) {
                        const entry = leaderboard[i];
                        const score = entry.score;
                        const tr = document.createElement("tr");
                        const gr = Chart.grade(score.value);
                        const sp = Chart.special_grades[score.special];
                        const d = new Date();
                        const dt = new Date(score.time ?? (1735689599999 + d.getTimezoneOffset() * 60000));
                        const tdy = dt.toLocaleDateString("en-SG") === d.toLocaleDateString("en-SG");
                        tr.innerHTML = `
              <td>${i + 1}</td>
              <td title="skill: ${entry.userskill.toFixed(3)}">${entry.username}</td>
              <td style="color: ${color["grade_" + gr]};">${score.value}</td>
              <td style="color: ${color["grade_" + gr]};">${gr}</td>
              <td style="color: ${color["special_" + sp]};">${sp}</td>
              <td title="${parseFloat(score.skill.toPrecision(15))}"><b>${score.skill.toFixed(3)}</b></td>
              <td title="${dt.toLocaleTimeString("en-SG")}">${tdy ? dt.toLocaleTimeString("en-SG") : dt.toLocaleDateString("en-SG")}</td>
            `;
                        if (firebase.user?.uid === entry.uid || !entry.uid)
                            tr.style.color = color.green;
                        table.appendChild(tr);
                    }
                    document.getElementById("switch")?.addEventListener("click", function (event) {
                        event.stopPropagation();
                        ui.make_toplist_chart(chart_name, false);
                    });
                }
            });
        }
        else {
            const list = scores.map[chart_name];
            if (!list || list.length === 0) {
                main.innerHTML = `
          <h3> ${chart.song_name} <span style="color: ${color["difficulty_" + chart.song_type]};">${chart.song_type} ${chart.song_difficulty}</span>: scores </h3>
          <br><p> not played yet </p><br>
          <p> <button id="switch"> switch to leaderboard </button> </p>
        `;
            }
            else {
                list?.sort(scores.compare_fn);
                main.innerHTML = `
          <h3> ${chart.song_name} <span style="color: ${color["difficulty_" + chart.song_type]};">${chart.song_type} ${chart.song_difficulty}</span>: scores </h3>
          <table id="chair_chart" style="margin-left: auto; margin-right: auto;">
            <tr><th>#</th><th>score</th><th colspan="2">grade</th><th>max<br>combo</th><th>skill</th><th>date</th></tr>
          </table>
          <p> <button id="switch"> switch to leaderboard </button> </p>
        `;
                const table = document.getElementById("chair_chart");
                for (let i = 0; i < list.length; i++) {
                    const score = list[i];
                    const tr = document.createElement("tr");
                    const gr = Chart.grade(score.value);
                    const sp = Chart.special_grades[score.special];
                    const d = new Date();
                    const dt = new Date(score.time ?? (1735689599999 + d.getTimezoneOffset() * 60000));
                    const tdy = dt.toLocaleDateString("en-SG") === d.toLocaleDateString("en-SG");
                    tr.innerHTML = `
            <td>${i + 1}</td>
            <td style="color: ${color["grade_" + gr]};">${score.value}</td>
            <td style="color: ${color["grade_" + gr]};">${gr}</td>
            <td style="color: ${color["special_" + sp]};">${sp}</td>
            <td style="color: ${color["special_" + sp]};">${score.max_combo}</td>
            <td title="${parseFloat(score.skill.toPrecision(15))}"><b>${score.skill.toFixed(3)}</b></td>
            <td title="${dt.toLocaleTimeString("en-SG")}">${tdy ? dt.toLocaleTimeString("en-SG") : dt.toLocaleDateString("en-SG")}</td>
          `;
                    table.appendChild(tr);
                }
            }
            document.getElementById("switch")?.addEventListener("click", function (event) {
                event.stopPropagation();
                ui.make_toplist_chart(chart_name, true);
            });
        }
        if (ui.mobile)
            main.addEventListener("click", function () {
                ui.hide_box("toplist_chart");
            });
    },
    make_leaderboard: function () {
        if (document.getElementById("leaderboard")) {
            document.body.removeChild(document.getElementById("leaderboard"));
        }
        const main = document.createElement("div");
        main.id = "leaderboard";
        main.classList.add("centerbox");
        document.body.appendChild(main);
        main.innerHTML = "loading leaderboard...";
        firebase.get_leaderboard((leaderboard) => {
            main.innerHTML = `
        <h3> leaderboard </h3>
        <table id="choir" style="margin-left: auto; margin-right: auto;">
          <tr><th>#</th><th>username</th><th>peak skill</th><th>total skill</th></tr>
        </table>
        <p><button id="leaderboard_refresh"> refresh </button></p>
      `;
            const table = document.getElementById("choir");
            let inside = false;
            for (const entry of leaderboard) {
                if (firebase.user?.uid === entry.uid)
                    inside = true;
            }
            if (!inside) {
                leaderboard.push({
                    uid: "",
                    username: "you",
                    peak: scores.peak_skill,
                    skill: scores.total_skill,
                });
                leaderboard.sort(scores.compare_fn);
            }
            for (let i = 0; i < leaderboard.length; i++) {
                const entry = leaderboard[i];
                const tr = document.createElement("tr");
                tr.innerHTML = `
          <td>${i + 1}</td>
          <td title="${entry.uid}"><a href="#">${entry.username}</a></td>
          <td title="${parseFloat(entry.peak.toPrecision(15))}">${(entry.peak ?? 0).toFixed(3)}</td>
          <td title="${parseFloat(entry.skill.toPrecision(15))}">${(entry.skill ?? 0).toFixed(3)}</td>
        `;
                if (firebase.user?.uid === entry.uid || !entry.uid)
                    tr.style.color = color.green;
                tr.querySelector("a")?.addEventListener("click", function (event) {
                    ui.hide_box("leaderboard");
                    ui.make_toplist(entry.uid, entry.username);
                    setTimeout(() => ui.show_box("toplist"), 100);
                });
                table.appendChild(tr);
            }
            document.getElementById("leaderboard_refresh")?.addEventListener("click", function (event) {
                event.stopPropagation();
                ui.make_leaderboard();
                ui.show_box("leaderboard");
            });
        });
        if (ui.mobile)
            main.addEventListener("click", function () {
                ui.cancel_click();
                ui.hide_box("leaderboard");
            });
        ui.hide_box("leaderboard");
    },
    make_credits: function () {
        if (document.getElementById("credits")) {
            document.body.removeChild(document.getElementById("credits"));
        }
        const main = document.createElement("div");
        main.id = "credits";
        main.classList.add("centerbox");
        document.body.appendChild(main);
        main.innerHTML = `
      <h2> how? </h2>
      <p>use the <kbd>D</kbd><kbd>F</kbd><kbd>J</kbd><kbd>K</kbd> keys to <em>hit</em> the notes as they touch the line</p>
      <p><img src="${config.cdn_i}tutorial.jpg" style="width: max(60%, 250px);"></p>
      <p>your score depends on how accurately you can <em>hit</em> them</p>
      <table style="margin: 0 auto;">
        <tr><th></th><th>time</th><th>score</th></tr>
        <tr style="color: ${color.purple};"><td>perfect+&nbsp;</td><td>±40 ms</td><td>101%</td></tr>
        <tr style="color: ${color.blue};"><td>perfect</td><td>±80 ms</td><td>100%</td></tr>
        <tr style="color: ${color.green};"><td>good</td><td>±120 ms</td><td>70%</td></tr>
        <tr style="color: ${color.yellow};"><td>bad</td><td>±160 ms</td><td>30%</td></tr>
        <tr style="color: ${color.red};"><td>miss</td><td>&gt;160 ms</td><td>0%</td></tr>
      </table>
      <p>sometimes after you <em>hit</em> you have to hold the key down (long rectangles)</p>
      <p>sometimes the keys just has to be held down, no hitting needed (circles)</p>
      <p>sometimes when you solve a puzzle you can scroll all the way down</p>
      <h2>controls</h2>
      <table style="margin: 0 auto;">
        <tr><td><kbd>esc</kbd> <kbd>backspace</kbd></td><td>b<b>a</b>ck</td></tr>
        <tr><td><kbd>enter</kbd> <kbd>space</kbd></td><td>confi<b>r</b>m</td></tr>
        <tr><td><kbd>A</kbd> <kbd>⬅️</kbd> / <kbd>D</kbd> <kbd>➡️</kbd></td><td>change diffi<b>c</b>ulty</td></tr>
        <tr><td><kbd>W</kbd> <kbd>⬆️</kbd> / <kbd>S</kbd> <kbd>⬇️</kbd></td><td>ch<b>a</b>nge song</td></tr>
        <tr><td><kbd>shift</kbd> <kbd>tab</kbd></td><td>view lea<b>d</b>erboard</td></tr>
        <tr><td><kbd>D</kbd> <kbd>F</kbd> <kbd>J</kbd> <kbd>K</kbd></td><td><em>h<b>i</b>t</em></td></tr>
        <tr><td><kbd>R</kbd><td>rest<b>a</b>rt</td></tr>
      </table>
      <h1> credits </h1>
      <div style="text-align: left; width: max(50vw, 40ch); margin: 0 auto;" id="real_credits">
        <h3 style="text-align: center;"> music </h3>
        <p><a href="https://squirkymusic.sourceaudio.com/track/25689665" target="_blank"><span> piano_music_01.mp3 <l></l></span><span> Crispin Merrell </span></a></p>
        <p><a href="https://youtu.be/fCNQMJba86A" target="_blank"><span> Deep Under <l></l></span><span> Whitesand </span></a></p>
        <p><a href="https://soundcloud.com/liwingyankobe/loneliness" target="_blank"><span> Loneliness <l></l></span><span> infiniteXforever </span></a></p>
        <p><a href="https://kadthemusiclad.bandcamp.com/track/dusk-approach" target="_blank"><span> Dusk approach <l></l></span><span> kad </span></a></p>
        <p><a href="https://youtu.be/NmCCQxVBfyM" target="_blank"><span> ⠞⠧⠶⠳⡇⠼⠗ <l></l></span><span> folk / Hip Tanaka </span></a></p>
        <p><a href="https://music.apple.com/song/happiness/698628232" target="_blank"><span> Happiness <l></l></span><span> Lin Hai </span></a></p>
        <h3 style="text-align: center;"> images </h3>
        <p><a href="${config.cdn_i}deepunder.jpg" target="_blank"><span> congratulations.jpg <l></l></span><span> rnightshroud </span></a></p>
      </div>
      <h1> versions </h1>
      <div style="text-align: left;">
      <h3> 0.7.1 | 24-02-2026 | 🎶 9  📊 21 📈 2 </h3>
      <p> - remove unlock requirements </p>
      <h3> 0.7.0 | 27-05-2025 | 🎶 9  📊 21 📈 2 </h3>
      <p> - new mode... ⬢ </p>
      <h3> 0.6.3 | 01-04-2025 | 🎶 9  📊 21 </h3>
      <p> - added kahoot theme (displayed as <a href="${config.cdn_v}kahoot.mp3">▲ ⯁ ⬤ ◼</a>)! </p>
      <p> - made easy chart for ▲ ⯁ ⬤ ◼ </p>
      <p> - what day is it today? </p>
      <h3> 0.6.2 | 29-03-2025 | 🎶 8  📊 20 </h3>
      <p> - added scrolling on mobile! </p>
      <p> - improved some other ui stuff (i hope) </p>
      <h3> 0.6.1 | 17-03-2025 | 🎶 8  📊 20 </h3>
      <p> - added more chart effects... you'll see </p>
      <p> - added hard chart for ⠞⠧⠶⠳⡇⠼⠗ </p>
      <h3> 0.6.0 | 08-03-2025 | 🎶 8  📊 19 </h3>
      <p> - made calibration way more useful 🙂 exiting the calibration chart after hitting at least 4 notes will make a pop-up pop up </p>
      <p> - added medium chart for 🧪🥧✳️ </p>
      <h3> 0.5.9 | 02-03-2025 | 🎶 8  📊 18 </h3>
      <p> - added hard chart for happiness >:) </p>
      <h3> 0.5.8 | 01-03-2025 | 🎶 8  📊 17 </h3>
      <p> - how? </p>
      <p> - added easy chart for 🧪🥧✳️ </p>
      <h3> 0.5.7 | 26-02-2025 | 🎶 7  📊 16 </h3>
      <p> - added easy chart for happiness :) </p>
      <h3> 0.5.6 | 24-02-2025 | 🎶 7  📊 15 </h3>
      <p> - added medium chart for happiness (score AA on loneliness easy to unlock it) </p>
      <h3> 0.5.5 | 22-02-2025 | 🎶 7  📊 14 </h3>
      <p> - added new song: <a href="${config.cdn_v}happiness.mp3" target="_blank">Happiness</a> </p>
      <p> - added unlock conditions to the new song (related to loneliness) and to piano_music_01.mp3 extreme</p>
      <h3> 0.5.4 | 18-02-2025 | 🎶 6  📊 14 </h3>
      <p> - added an option in settings to change what statistic the display number shows, and made the display number show up on computer also </p>
      <p> - types of statistics: score, accuracy, accuracy+ (accuracy considering perfect+ as 101%), highest possible score now, and predicted score based on performance (basically the same as accuracy+ * 1000000)</p>
      <p> - that's all </p>
      <h3> 0.5.3 | 15-02-2025 | 🎶 6  📊 14 </h3>
      <p> - added something... you'll see </p>
      <p> - added medium chart for tetris theme </p>
      <h3> 0.5.2 | 08-02-2025 | 🎶 6  📊 13 </h3>
      <p> - split the practice mode into view mode and practice mode </p>
      <p> - you can actually practice in practice mode now </p>
      <p> - added checkpoints in practice mode! (for computer only, use <em>number keys</em> to jump to checkpoints and <em>shift + number keys</em> to set them) </p>
      <h3> 0.5.1 | 07-02-2025 | 🎶 6  📊 13 </h3>
      <p> - added experimental chart viewer ("practice mode" in settings) </p>
      <h3> 0.5.0 | 01-02-2025 | 🎶 6  📊 13 </h3>
      <p> - added chart effects... you'll see </p>
      <p> - added easy chart for tetris theme </p>
      <h3> 0.4.9 | 26-01-2025 | 🎶 6  📊 12 </h3>
      <p> - added tetris theme (displayed as <a href="${config.cdn_v}tetris.mp3" target="_blank">⠞⠧⠶⠳⡇⠼⠗</a>) </p>
      <h3> 0.4.8 | 25-01-2025 | 🎶 5  📊 12 </h3>
      <p> - added the other half of the hard chart for loneliness (it's done!) </p>
      <h3> 0.4.7 | 18-01-2025 | 🎶 5  📊 11.5 </h3>
      <p> - added simple profiles! (just top scores list for now) </p>
      <p> - added half of the hard chart for loneliness </p>
      <p> - controls can be changed in settings </p>
      <h3> 0.4.6 | 12-01-2025 | 🎶 5  📊 11 </h3>
      <p> - added medium chart for dusk approach </p>
      <p> - total number of notes appears in song list </p>
      <p> - guest users now appear in chart leaderboards (only seen by themselves) </p>
      <h3> 0.4.5 | 11-01-2025 | 🎶 5  📊 10 </h3>
      <p> - added <a href="${config.cdn_v}dusk_approach.mp3" target="_blank">dusk approach</a> </p>
      <p> - added easy chart for dusk approach </p>
      <p> - fixed occasional audio sync issue </p>
      <p> - fixed score updating (across devices) </p>
      <h3> 0.4.4 | 09-01-2025 | 🎶 4  📊 9 </h3>
      <p> - added extreme chart for piano_music_01.mp3 </p>
      <h3> 0.4.3 | 07-01-2025 | 🎶 4  📊 8 </h3>
      <p> - guest users can appear in the main leaderboard (only seen by themselves) </p>
      <p> - possibly adding a new difficulty type soon... </p>
      <h3> 0.4.2 | 05-01-2025 | 🎶 4  📊 8 </h3>
      <p> - music will no longer play in the background (like when screen is off) </p>
      <p> - added refresh button to leaderboard </p>
      <h3> 0.4.1 | 04-01-2025 | 🎶 4  📊 8 </h3>
      <p> - added a leaderboard for each chart! </p>
      <p> - added automatic and manual score updating! </p>
      <p> - added blurred background for pop-ups! </p>
      <p> - you can also cancel pop-ups by clicking on the background! </p>
      <p> - even more exclamation marks! </p>
      <h3> 0.4.0 | 04-01-2025 | 🎶 4  📊 8 </h3>
      <p> - added accounts! </p>
      <p> - added a leaderboard! </p>
      <p> - 10 highscores are saved for each chart! (press shift) </p>
      <p> - timestamps for scores! </p>
      <h3> 0.3.9 | 01-01-2025 | 🎶 4  📊 8 </h3>
      <p> - hi 2025 </p>
      <h3> 0.3.8 | 29-12-2024 | 🎶 4  📊 8 </h3>
      <p> - preparing for accounts... coming soon i hope </p>
      <p> - changed skill rate system: scores above 980000, especially APs, are not so good now </p>
      <h3> 0.3.7 | 27-12-2024 | 🎶 4  📊 8 </h3>
      <p> - fixed Z AP+ issue (i hope) </p>
      <p> - very slightly moved FC/AP indicators in song list </p>
      <h3> 0.3.6 | 26-12-2024 | 🎶 4  📊 8 </h3>
      <p> - fixed sync issue for loneliness </p>
      <h3> 0.3.5 | 25-12-2024 | 🎶 4  📊 8 </h3>
      <p> - added medium chart for loneliness </p>
      <p> - added mobile finger sliding control support </p>
      <h3> 0.3.4 | 24-12-2024 | 🎶 4  📊 7 </h3>
      <p> - added easy chart for loneliness </p>
      <p> - slightly improved song list ui </p>
      <h3> 0.3.3 | 23-12-2024 | 🎶 4  📊 6 </h3>
      <p> - spent like 3 hours typing this versions list </p>
      <p> - added credits </p>
      <h3> 0.3.2 | 23-12-2024 | 🎶 4  📊 6 </h3>
      <p> - slightly modified piano_music_01.mp3 hard </p>
      <p> - finally added 2 seconds of silence in <a href="${config.cdn_v}loneliness.mp3" target="_blank">Loneliness</a> </p>
      <p> - added more back buttons on mobile </p>
      <h3> 0.3.1 | 22-12-2024 | 🎶 4  📊 6 </h3>
      <p> - added song playback speed option in settings </p>
      <h3> 0.3.0 | 21-12-2024 | 🎶 4  📊 6 </h3>
      <p> - created the main menu! </p>
      <h3> 0.2.7 | 20-12-2024 | 🎶 4  📊 6 </h3>
      <p> - made a better mobile song list </p>
      <h3> 0.2.6 | 18-12-2024 | 🎶 4  📊 6 </h3>
      <p> - added line offset option in settings </p>
      <p> - improved results screen for mobile </p>
      <h3> 0.2.5 | 16-12-2024 | 🎶 4  📊 6 </h3>
      <p> - added <a href="${config.cdn_v}loneliness.mp3" target="_blank">Loneliness</a> </p>
      <p> - added easy chart for Deep Under </p>
      <h3> 0.2.4 | 15-12-2024 | 🎶 3  📊 5 </h3>
      <p> - changed picture of piano_music_01.mp3 </p>
      <p> - modified a few difficulty numbers </p>
      <h3> 0.2.3 | 15-12-2024 | 🎶 3  📊 5 </h3>
      <p> - added pictures in the song list </p>
      <p> - made back and restart button for mobile </p>
      <h3> 0.2.2 | 14-12-2024 | 🎶 3  📊 5 </h3>
      <p> - added mobile gameplay controls! (full mobile support!) </p>
      <h3> 0.2.1 | 13-12-2024 | 🎶 3  📊 5 </h3>
      <p> - added mobile GUI controls! </p>
      <h3> 0.2.0 | 12-12-2024 | 🎶 3  📊 5 </h3>
      <p> - created the song list! </p>
      <p> - added a hard chart for Deep Under </p>
      <h3> 0.1.3 | ??-12-2024 | 🎶 3  📊 4 </h3>
      <p> - added <a href="${config.cdn_v}deepunder.mp3" target="_blank">Deep Under</a> internally </p>
      <p> - added hard chart and updated easy chart for piano_music_01.mp3 </p>
      <h3> 0.1.2 | ??-12-2024 | 🎶 2  📊 3 </h3>
      <p> - added <a href="${config.cdn_v}beeps.mp3" target="_blank">beeps</a> as calibration for audio offset in settings </p>
      <p> - also added easy chart for piano_music_01.mp3 </p>
      <h3> 0.1.1 | ??-12-2024 | 🎶 1  📊 1 </h3>
      <p> - added settings (just the audio offset) </p>
      <h3> 0.1.0 | 10-12-2024 | 🎶 1  📊 1 </h3>
      <p> - added <a href="${config.cdn_v}saloon.mp3" target="_blank">piano_music_01.mp3</a> </p>
      <p> - and made a chart for it (it's now the medium one) </p>
      <p> - this started working </p>
      <h3> 0.0.1 | 09-12-2024 | 🎶 0  📊 0 </h3>
      <p> - started working on this </p>
      <h3> 0.0.0 | 09-12-2024 | 🎶 0  📊 0 </h3>
      <p> - site created! </p>
      <h3> 0.0.-1 | 09-12-2024 | 🎶 -1  📊 -1 </h3>
      <p> - this page is actually created in version 0.4.1 or something </p>
      <h3> ?.?.? | ??-??-???? | 🎶 ?  📊 ? </h3>
      <p> <input type="text" id="answer" placeholder="enter answer"> <button id="answered"> submit </button> </p>
      <p id="answer_result"> </p>
      <h3> ?.?.? | ??-??-???? | 🎶 ? 📊 ? </h3>
      <!--<p> <button id="store_data"> save data </button> </p>
      <p> <button id="load_data"> load data </button> </p>
      <p> <button id="clear_data"> clear data </button> </p>-->
      <p id="debug_result"> </p>
      </div>
    `;
        const debug_p = document.getElementById("debug_result");
        document.getElementById("store_data")?.addEventListener("click", function (event) {
            event.stopPropagation();
            firebase.set("/test/data/", localStorage.getItem("scores"));
        });
        document.getElementById("load_data")?.addEventListener("click", function (event) {
            event.stopPropagation();
            firebase.get("/test/data/", (s) => localStorage.setItem("scores", s));
        });
        document.getElementById("clear_data")?.addEventListener("click", function (event) {
            event.stopPropagation();
            firebase.set("/test/data/", "");
        });
        const answer = document.getElementById("answer");
        const answered = document.getElementById("answered");
        const answer_result = document.getElementById("answer_result");
        const go = function () {
            const v = answer.value.toLowerCase().replaceAll(/\s+/g, "");
            const url = `/puzzl/${v}.html`;
            key.check_url(url, (status) => {
                if (status === 404) {
                    answer_result.textContent = "incorrect!";
                    answer_result.style.color = color.red;
                }
                else if (status === 200) {
                    answer_result.innerHTML = `correct! <a href="${url}"><button> go </button></a>`;
                    answer_result.style.color = color.green;
                }
                else {
                    answer_result.textContent = "unknown status code: " + status;
                    answer_result.style.color = color.yellow;
                }
            });
        };
        answer.addEventListener("keydown", function (event) {
            if (event.code === "Enter" && !event.repeat)
                go();
        });
        answered.addEventListener("click", function (event) {
            go();
        });
        if (ui.mobile)
            main.addEventListener("click", function () {
                ui.cancel_click();
                ui.hide_box("credits");
            });
        ui.hide_box("credits");
    },
    make_account: function () {
        const was_open = ui.check_box("account");
        if (document.getElementById("account")) {
            document.body.removeChild(document.getElementById("account"));
        }
        const main = document.createElement("div");
        main.id = "account";
        main.classList.add("centerbox");
        document.body.appendChild(main);
        main.innerHTML = (!firebase.signed_in) ? `
      <h3> log in! </h3>
      <style>.abcRioButton{border-radius:1px;box-shadow:0 2px 4px 0 rgba(0,0,0,.25);-moz-box-sizing:border-box;box-sizing:border-box;-webkit-transition:background-color .218s,border-color .218s,box-shadow .218s;transition:background-color .218s,border-color .218s,box-shadow .218s;user-select:none;-webkit-user-select:none;appearance:none;-webkit-appearance:none;background-color:#fff;background-image:none;color:#262626;cursor:pointer;outline:none;overflow:hidden;position:relative;text-align:center;vertical-align:middle;white-space:nowrap;width:auto}.abcRioButton:hover{box-shadow:0 0 3px 3px rgba(66,133,244,.3)}.abcRioButtonBlue{background-color:#4285f4;border:none;color:#fff}.abcRioButtonBlue:hover{background-color:#4285f4}.abcRioButtonBlue:active{background-color:#3367d6}.abcRioButtonLightBlue{background-color:#fff;color:#757575}.abcRioButtonLightBlue:active{background-color:#eee;color:#6d6d6d}.abcRioButtonIcon{float:left}.abcRioButtonBlue .abcRioButtonIcon{background-color:#fff;border-radius:1px}.abcRioButtonSvg{display:block}.abcRioButtonContents{font-family:Roboto,arial,sans-serif;font-size:14px;font-weight:500;letter-spacing:.21px;margin-left:6px;margin-right:6px;vertical-align:top}.abcRioButtonContentWrapper{height:100%;width:100%}.abcRioButtonBlue .abcRioButtonContentWrapper{border:1px solid transparent}.abcRioButtonErrorWrapper,.abcRioButtonWorkingWrapper{display:none;height:100%;width:100%}.abcRioButtonErrorIcon,.abcRioButtonWorkingIcon{margin-left:auto;margin-right:auto}.abcRioButtonErrorState,.abcRioButtonWorkingState{border:1px solid #d5d5d5;border:1px solid rgba(0,0,0,.17);box-shadow:0 1px 0 rgba(0,0,0,.05);color:#262626}.abcRioButtonErrorState:hover,.abcRioButtonWorkingState:hover{border:1px solid #aaa;border:1px solid rgba(0,0,0,.25);box-shadow:0 1px 0 rgba(0,0,0,.1)}.abcRioButtonErrorState:active,.abcRioButtonWorkingState:active{border:1px solid #aaa;border:1px solid rgba(0,0,0,.25);box-shadow:inset 0 1px 0 #ddd;color:#262626}.abcRioButtonWorkingState,.abcRioButtonWorkingState:hover{background-color:#f5f5f5}.abcRioButtonWorkingState:active{background-color:#e5e5e5}.abcRioButtonErrorState,.abcRioButtonErrorState:hover{background-color:#fff}.abcRioButtonErrorState:active{background-color:#e5e5e5}.abcRioButtonErrorState .abcRioButtonErrorWrapper,.abcRioButtonWorkingState .abcRioButtonWorkingWrapper{display:block}.abcRioButtonErrorState .abcRioButtonContentWrapper,.abcRioButtonErrorState .abcRioButtonWorkingWrapper,.abcRioButtonWorkingState .abcRioButtonContentWrapper{display:none} @keyframes abcRioButtonWorkingIconPathSpinKeyframes {0% {-webkit-transform: rotate(0deg)}}</style>
      <div id="goggle" class="googly" style="text-align: center; padding: 1em 5em; cursor: pointer;">
      <div style="height:50px;width:240px;" class="abcRioButton abcRioButtonBlue"><div class="abcRioButtonContentWrapper"><div class="abcRioButtonIcon" style="padding:15px;"><div style="width:18px;height:18px;" class="abcRioButtonSvgImageWithFallback abcRioButtonIconImage abcRioButtonIconImage18"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 48 48" class="abcRioButtonSvg"><g><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></g></svg></div></div><span style="font-size:16px;line-height:48px;" class="abcRioButtonContents"><span id="sign_in_text">Sign in with Google</span></span></div></div>
      </div>
      <p id="result"></p>
      ` : `
      <h3> account </h3>
      <p>name: <input id="change_input" placeholder="name" type="text" pattern="[a-zA-Z0-9 ._\\-]+" maxlength="20"><button id="change_button"> change </button></p>
      <p><button id="update_button"> update scores </button></p>
      <p>
        <button id="logout_clear_button"> log out </button>
        <!-- <button id="logout_button" style="font-size: 0.6em;"> log out and keep progress </button> -->
      </p>
      <p id="result"></p>
    `;
        if (!firebase.signed_in) {
            document.getElementById("sign_in_text").innerHTML = "sign in with goggle";
            const goggle = document.getElementById("goggle");
            goggle?.addEventListener("click", function (_) {
                firebase.login_goggle_user("");
            });
        }
        else {
            const change_button = document.getElementById("change_button");
            const change_input = document.getElementById("change_input");
            change_input.value = firebase.username;
            change_input.addEventListener("click", function (event) {
                event.stopPropagation();
            });
            change_input.addEventListener("input", function (event) {
                event.stopPropagation();
                if (change_input.validity.valid)
                    change_button.removeAttribute("disabled");
                else
                    change_button.setAttribute("disabled", "true");
            });
            change_button.addEventListener("click", function (event) {
                event.stopPropagation();
                firebase.change_username(change_input.value);
            });
            document.getElementById("update_button")?.addEventListener("click", function (event) {
                event.stopPropagation();
                firebase.update_scores();
            });
            document.getElementById("logout_button")?.addEventListener("click", function (event) {
                event.stopPropagation();
                firebase.logout_user(false);
            });
            document.getElementById("logout_clear_button")?.addEventListener("click", function (event) {
                event.stopPropagation();
                firebase.logout_user(true);
            });
        }
        if (ui.mobile)
            main.addEventListener("click", function () {
                ui.cancel_click();
                ui.hide_box("account");
            });
        if (!was_open)
            ui.hide_box("account");
        else
            firebase.redisplay_result();
    },
    make_calibration_popup: function () {
        if (document.getElementById("calibration_popup")) {
            document.body.removeChild(document.getElementById("calibration_popup"));
        }
        const main = document.createElement("div");
        main.id = "calibration_popup";
        main.classList.add("centerbox");
        document.body.appendChild(main);
        const new_offset = math.round_to(settings.offset + ui.game.calibration.mean, 5);
        const variance = Math.round(ui.game.calibration.variance);
        const grade = variance_rate(variance);
        main.innerHTML = `
      <h3> calibration done! </h3>
      <p style="color: ${color["grade_" + grade]};"> consistency: ${grade} (σ² = ${variance}) </p>
      <p> set offset to ${new_offset} ms? </p>
      <p> <button id="yes"> yes </button> &nbsp; <button id="no"> no </button> </p>
    `;
        document.getElementById("yes")?.addEventListener("click", function (event) {
            settings.offset = new_offset;
            ui.gui.save();
            ui.gui.updateDisplay();
            ui.cancel_click();
            ui.hide_box("calibration_popup");
        });
        document.getElementById("no")?.addEventListener("click", function (event) {
            ui.cancel_click();
            ui.hide_box("calibration_popup");
        });
    },
    close_boxes() {
        let closed = false;
        for (const id of ["toplist", "toplist_chart", "leaderboard", "credits", "account", "calibration_popup"]) {
            if (ui.check_box(id)) {
                ui.hide_box(id);
                closed = true;
            }
        }
        return closed;
    },
    is_box_open() {
        for (const id of ["toplist", "toplist_chart", "leaderboard", "credits", "account", "calibration_popup"]) {
            if (ui.check_box(id)) {
                return true;
            }
        }
        return false;
    },
    check_box: function (id) {
        return document?.getElementById(id)?.classList?.contains("hide") === false;
    },
    show_box: function (id) {
        document?.getElementById(id)?.classList?.remove("hide");
    },
    hide_box: function (id) {
        document?.getElementById(id)?.classList?.add("hide");
    },
    cancel_click: function () {
        mouse.buttons[0] = false;
        mouse.down_buttons[0] = false;
        mouse.up_buttons[0] = false;
        mouse.down_position[0] = vector.create(-1000, -1000);
    },
    resize: function () {
        ui.width = window.innerWidth;
        ui.height = window.innerHeight;
    },
    mobile: key.mobile,
};
