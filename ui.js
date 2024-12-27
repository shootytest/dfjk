import { canvas, ctx } from "./util/canvas.js";
import { Chart, note_type } from "./chart.js";
import { Sound, sounds } from "./sound.js";
import dat from "./dat.js";
import { math } from "./util/math.js";
import { key, mouse } from "./util/key.js";
import { scores, settings, songs, chart_map } from "./settings.js";
// globals, why not?
let x, y, w, h;
let r, c, size;
let o;
let hover, hovering, clicking;
export const color = {
    white: "#eeeeee",
    black: "#111111",
    red: "#db6353",
    yellow: "#cfc04c",
    green: "#54f088",
    blue: "#7a8eff", // "#4c75cf",
    purple: "#9c7aff", // "#664ccf",
    ["difficulty_easy"]: "#73f586",
    ["difficulty_medium"]: "#e8e864",
    ["difficulty_hard"]: "#f59c73",
    ["difficulty_expert"]: "#e864aa",
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
};
export const ui = {
    time: 0,
    width: window.innerWidth,
    height: window.innerHeight,
    gui: new dat.GUI(),
    menu: "main",
    main: {
        index: 0,
        index_target: 0,
        svg: ["play", "chart", "settings", "about"],
        text: ["play!", "top performance", "settings", "info"],
        color: ["green", "blue", "purple", "white"],
    },
    list: {
        index: 0,
        index_circle: 0,
        index_target: 0,
        type: 0,
        type_target: 0,
        playing: sounds.beeps_preview,
    },
    game: {
        tilt: 0,
        backing: 0,
        restarting: 0,
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
        /*const c2 = gui.add(settings, "CHART_NAME", { easy: "saloon_1", medium: "saloon_2", hard: "saloon_3", calibration: "beeps", });
        c2.name("difficulty");*/
        const c3 = gui.add(settings, "offset", -200, 400, 10);
        c3.name("offset");
        const c4 = gui.add(settings, "line_offset", -100, 100, 10);
        c4.name("line offset");
        const c5 = gui.add(settings, "hit_volume", 0, 10, 1);
        c5.name("hit volume");
        const c6 = gui.add(settings, "play_speed", 0.5, 2, 0.25);
        c6.name("play speed");
        settings.play_speed = 1;
        c6.updateDisplay();
        c6.onChange(() => {
            for (const sound of Object.values(sounds)) {
                sound.element.playbackRate = settings.play_speed;
            }
        });
        const hidden = gui.addFolder("hidden");
        hidden.add(ui.list, "index_target", 0, songs.length - 1);
        hidden.add(ui.list, "type_target", 0, 100);
        gui.__folders.hidden.hide();
        // gui.show();
        gui.close();
        for (const song of songs) {
            const image = document.createElement("img");
            image.setAttribute("src", "https://res.cloudinary.com/dzzjrhgkb/image/upload/dfjk/" + song.image);
            ui.images[song.image] = image;
        }
        ui.make_toplist();
        ui.hide_box("toplist");
        ui.make_credits();
        ui.hide_box("credits");
    },
    tick: function () {
        ui.time++;
    },
    check_hover: function (hover_f) {
        if (ctx.point_in_path_v(mouse)) {
            hover_f();
        }
    },
    check_click: function (click_f, hover_f) {
        if (ctx.point_in_path_v(mouse)) {
            if (hover_f)
                hover_f();
            if (mouse.down_buttons[0] && ctx.point_in_path_v(mouse.down_position[0])) {
                click_f();
            }
        }
    },
    draw: function () {
        ctx.clear(color.black);
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
            this.draw_board(v, size, x_constrained);
            if (Chart.current?.sound.finished) {
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
        ctx.lineWidth = 0.5;
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
            ui.show_box("toplist");
        }
        else if (i === 2) {
        }
        else if (i === 3) {
            ui.show_box("credits");
        }
    },
    draw_list: function (v) {
        const size = { x: ui.width, y: ui.height };
        const x_constrained = size.y >= size.x * 1.6;
        // overall size, everything is scaled by this
        r = x_constrained ? (size.y * 0.8) : (size.x * 0.92);
        // song index and type
        ui.list.index_circle = math.lerp_circle(ui.list.index_circle, ui.list.index_target, songs.length, 0.1);
        ui.list.index = math.lerp(ui.list.index, ui.list.index_target, 0.1);
        const index = ui.list.index;
        const index_circle = ui.list.index_circle;
        const indices = [];
        for (let i = 0; i < 3; i++) {
            indices.push(Math.round(index_circle - 1 + i + songs.length) % songs.length);
        }
        ui.list.type = math.lerp(ui.list.type, ui.list.type_target, 0.1);
        const type = ui.list.type;
        // circles
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
        const rr = 0.14 * r;
        for (let i = 0; i < 3; i++) {
            const ii = indices[i];
            const song = songs[ii];
            const type_target = Math.min(ui.list.type_target, song.types.length - 1);
            const score = scores.map[song.charts[type_target]];
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
                // ctx.text("max combo: " + score.max_combo, 0, r * 1.1 + rr);
                ctx.text("rating: " + score.skill.toFixed(2), 0, r * 1.088 + rr);
                ctx.strokeStyle = color["grade_" + Chart.grade(score.value)];
            }
            else {
                ctx.fillStyle = diff < 0 ? color.red : color.yellow;
                ctx.set_font_mono(r * 0.025);
                ctx.text(diff < 0 ? "unavailable" : "not played yet", 0, r * 1.06 + rr);
                ctx.strokeStyle = color.grade_Z;
            }
            ctx.beginPath();
            ctx.circle(0, r, rr);
            ctx.stroke();
            let rotato = false;
            if (i === 1)
                ui.check_click(ui.list_enter, () => { rotato = true; });
            else
                ui.check_click(() => {
                    ui.list_change_index(ii - ui.list.index_target);
                });
            ctx.clip();
            ctx.translate(0, r);
            if (rotato)
                ctx.rotate(ui.time * 0.5); // todo better effect lol
            ctx.draw_image(ui.images[songs[ii].image], -0.15 * r, -0.15 * r, 0.3 * r, 0.3 * r);
            // reset :(
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
        // divider
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
        for (let i = 0; i < songs.length; i++) {
            const song = songs[i];
            const type_target = Math.min(ui.list.type_target, song.types.length - 1);
            const score = scores.map[song.charts[type_target]];
            const angle = 0.2 * (i - index);
            ctx.translate(x, y + Math.sin(angle) * r / 2);
            ctx.scale(1, Math.cos(angle));
            if (i === ui.list.index_target) {
                // ctx.fillStyle = color.green;
                const grade = Chart.grade(score?.value ?? 0);
                ctx.fillStyle = color["grade_" + grade];
                ctx.globalAlpha = 0.2;
                ctx.beginPath();
                ctx.rectangle(0, 0, w * 7 / 6 - 3, h * 1.12);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.fillStyle = color.black;
                ctx.beginPath();
                ctx.round_rectangle(0, 0, w, h, h * 0.1);
                ctx.fill();
            }
            // check click
            ctx.beginPath();
            ctx.rectangle(0, 0, w, h);
            ui.check_click(() => {
                const change = i - ui.list.index_target;
                if (change !== 0)
                    ui.list_change_index(change);
            }, () => {
                ctx.fillStyle = color.white + "11";
                ctx.fill();
            });
            ctx.set_font_mono(h * 0.3);
            /*ctx.save("draw_list_right_text");
            ctx.beginPath();
            ctx.rectangle(0, 0, w - h * 2, h);
            ctx.clip();*/
            ctx.fillStyle = color.white;
            ctx.text(song.name, 0, 0);
            // ctx.restore("draw_list_right_text");
            // ctx.save("draw_list_right_type");
            ctx.fillStyle = color["difficulty_" + song.types[type_target]];
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.round_rectangle(h / 2 - w / 2, 0, h, h, h * 0.1);
            ui.check_click(() => ui.list_change_type(1), () => ctx.globalAlpha = 0.2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.set_font_mono(h * 0.4);
            ctx.text("" + Math.floor(song.difficulties[type_target]), h / 2 - w / 2, 0);
            // ctx.restore("draw_list_right_type");
            // ctx.save("draw_list_right_score");
            const grade = Chart.grade(score?.value ?? 0);
            ctx.fillStyle = color["grade_" + grade];
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.round_rectangle(w / 2 - h / 2, 0, h, h, h * 0.1);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.set_font_mono(h * 0.4);
            ctx.text(grade, w / 2 - h / 2, 0);
            ctx.beginPath();
            ctx.round_rectangle(0, 0, w, h, h * 0.1);
            ctx.stroke();
            const special = Chart.special_grades[score?.special ?? 0];
            ctx.fillStyle = color["special_" + special];
            ctx.translate(w * 0.475, -h / 2);
            ctx.rotate(Math.PI * 0.1);
            ctx.strokeText(special, 0, 0);
            ctx.text(special, 0, 0);
            // ctx.restore("draw_list_right_score");
            ctx.resetTransform();
        }
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
                if (ui.game.backing <= 0)
                    ui.game.backing = ui.time;
                else
                    ui.back();
            });
            if (ui.game.backing && ui.time - ui.game.backing > 120) {
                ui.game.backing = 0;
            }
            ctx.globalAlpha = 1;
        }
    },
    list_change_index: function (delta) {
        if (ui.menu !== "list")
            return;
        ui.list.index_target += delta + songs.length;
        ui.list.index_target %= songs.length;
        const song = songs[ui.list.index_target];
        ui.list.playing.pause();
        ui.list.playing.reset();
        ui.list.playing = sounds[song.preview];
        ui.list.playing.reset();
        ui.list.playing.play();
    },
    list_change_type: function (delta) {
        if (ui.menu !== "list")
            return;
        const song = songs[ui.list.index_target];
        ui.list.type_target += delta + Math.max(song.difficulties.length, 3);
        ui.list.type_target %= Math.max(song.difficulties.length, 3);
        ui.list.playing.play();
    },
    list_enter: function () {
        if (ui.menu !== "list")
            return;
        const song = songs[ui.list.index_target];
        settings.current_chart.song_id = song.id;
        settings.current_chart.song_type = Math.min(ui.list.type_target, song.charts.length - 1);
        settings.current_chart.chart_name = song.charts[settings.current_chart.song_type];
        if (song.difficulties[settings.current_chart.song_type] === -1)
            return;
        ui.list.playing.pause();
        ui.list.playing.reset();
        ui.menu = "game";
        ui.game.backing = 0;
        ui.game.restarting = 0;
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
            Sound.current?.play_after(1000);
            if (Sound.current)
                Sound.current.element.playbackRate = settings.play_speed;
            const sound = sfxr.generate("pickupCoin");
            sfxr.play(sound);
        }
        else if (ui.menu === "game" && Sound.current?.finished) {
            ui.menu = "list";
            ui.list_change_index(0);
            Sound.current = undefined;
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
        }
        else if (ui.menu === "game") {
            ui.menu = "list";
            ui.list_change_index(0);
            Sound.current?.pause();
            Sound.current?.reset();
            Chart.current?.reset();
            Sound.current = undefined;
        }
        else {
            // can't go back lol
        }
    },
    up: function () {
        if (ui.menu === "main") {
            ui.main.index_target += ui.main.svg.length - 1;
            ui.main.index_target %= ui.main.svg.length;
        }
        else if (ui.menu === "list") {
            ui.list_change_index(-1);
        }
    },
    down: function () {
        if (ui.menu === "main") {
            ui.main.index_target += 1;
            ui.main.index_target %= ui.main.svg.length;
        }
        else if (ui.menu === "list") {
            ui.list_change_index(1);
        }
    },
    left: function () {
        if (ui.menu === "main") {
            ui.main.index_target += ui.main.svg.length - 1;
            ui.main.index_target %= ui.main.svg.length;
        }
        else if (ui.menu === "list") {
            ui.list_change_type(-1);
        }
    },
    right: function () {
        if (ui.menu === "main") {
            ui.main.index_target += 1;
            ui.main.index_target %= ui.main.svg.length;
        }
        else if (ui.menu === "list") {
            ui.list_change_type(1);
        }
    },
    draw_board: function (v, size, x_constrained = false) {
        r = Math.min(size.y / 2, size.x);
        const chart = Chart.current;
        const sound = Sound.current;
        if (!chart || !sound) {
            const difftype = songs[settings.current_chart.song_id].types[settings.current_chart.song_type];
            const diffnumber = songs[settings.current_chart.song_id].difficulties[settings.current_chart.song_type];
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
                    if (ui.game.backing <= 0)
                        ui.game.backing = ui.time;
                    else
                        ui.back();
                });
                if (ui.game.backing && ui.time - ui.game.backing > 120) {
                    ui.game.backing = 0;
                }
                ctx.globalAlpha = 1;
            }
            return;
        }
        const tilt = (chart.lane_pressed[1] ? -2 : 0) + (chart.lane_pressed[2] ? -1 : 0) + (chart.lane_pressed[3] ? 1 : 0) + (chart.lane_pressed[4] ? 2 : 0);
        ui.game.tilt += tilt * 0.001;
        ui.game.tilt *= 0.9;
        ctx.save("tilted");
        ctx.translate(v.x, v.y);
        ctx.rotate(ui.game.tilt);
        ctx.translate(-v.x, -v.y);
        let xx = v.x - size.x / 2;
        let yy = v.y - size.y / 2;
        let lanewidth = size.x / 4;
        ctx.fillStyle = color.white;
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 4; i++) {
            if (!chart.lane_pressed[i + 1])
                continue;
            ctx.beginPath();
            x = xx + i * lanewidth;
            ctx.rect(x, yy, lanewidth, size.y);
            ctx.fill();
        }
        ctx.strokeStyle = color.white;
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            x = xx + i * lanewidth;
            ctx.globalAlpha = 0.6 + 0.2 * Math.abs(i - 2);
            ctx.line(x, yy, x, yy + size.y);
        }
        const line_offset = (0.9 + settings.line_offset / 1000);
        y = yy + size.y * line_offset;
        ctx.line(xx, y, xx + size.x, y);
        ctx.save("draw_board");
        ctx.beginPath();
        ctx.rect(xx, yy, size.x, size.y);
        ctx.clip();
        const notespeed = settings.notespeed * size.y / 700;
        const seems = size.y * (line_offset + 0.2) / notespeed; // see_ms, number of milliseconds the player sees ahead at this notespeed
        for (const note of Object.values(chart.active_notes)) {
            const time_to = sound.time_to(note.time);
            if (time_to > seems)
                continue;
            if (note.type === note_type.hold) {
                const time_to_2 = sound.time_to(note.time2);
                const length = time_to_2 - time_to;
                if (note.hit > 0 && note.release < 0) {
                    ctx.fillStyle = color.white;
                    ctx.globalAlpha = 0.8;
                }
                else {
                    ctx.fillStyle = color.white;
                    ctx.globalAlpha = (note.hit === 0 || note.release === 0) ? 0.2 : 0.6;
                }
                ctx.beginPath();
                ctx.round_rectangle(xx + (note.lane - 0.5) * lanewidth, y - (sound.time_to(note.time) + length / 2) * notespeed, lanewidth, size.y * 0.05 + length * notespeed, size.y * 0.02);
                ctx.fill();
                ctx.globalAlpha = 1;
                ctx.fillStyle = color.white;
                ui.draw_note(note_type.normal, xx + (note.lane - 0.5) * lanewidth, y - sound.time_to(note.time) * notespeed, size);
            }
            if (note.hit >= 0) {
                const t = -sound.time_to(note.hit_time);
                if (t < 200) {
                    ctx.fillStyle = color[["red", "yellow", "green", "blue", "purple"][note.hit]];
                    ctx.globalAlpha = (200 - t) / 300;
                    ui.draw_note(note.type, xx + (note.lane - 0.5) * lanewidth, y - (time_to + t) * notespeed, size);
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
                ui.draw_note(note.type, xx + (note.lane - 0.5) * lanewidth, y - sound.time_to(note.time) * notespeed, size);
                continue;
            }
        }
        ctx.restore("draw_board");
        const result = chart.result;
        h = size.y * 0.4;
        y = yy + size.y - h;
        ctx.set_font_mono(h * 0.12);
        ctx.textAlign = "left";
        x = xx + size.x * 1.1;
        if (x_constrained) {
            x = xx + size.x + (ui.width - size.x) / 4;
            ctx.textAlign = "center";
        }
        for (let i = 4; i >= 0; i--) { // 5 judgements
            ctx.fillStyle = color[["red", "yellow", "green", "blue", "purple"][i]];
            ctx.text((x_constrained ? "" : (["miss", "bad", "good", "perfect", "perfect+"][i] + ": ")) + result[i], x, y + i * h / 5);
        }
        ctx.fillStyle = "white";
        if (x_constrained) {
            ctx.set_font_mono(h * 0.15);
            ctx.fillStyle = color["grade_" + Chart.grade(chart.score)];
            ctx.text("" + chart.score, xx + size.x * 0.5, h * 0.3);
            ctx.set_font_mono(h * 0.2);
            ctx.fillStyle = color["special_" + Chart.special_grade(result)];
            ctx.text("" + chart.combo, xx + size.x * 0.5, yy + h * 0.3);
        }
        else {
            ctx.text("score: " + chart.score, xx + size.x * 1.1, yy + h * 0.2);
            ctx.text("combo: " + chart.combo, xx + size.x * 1.1, yy + h * 0.4);
            ctx.set_font_mono(h * 0.08);
            ctx.textAlign = "left";
            ctx.text("offset: " + chart.avg_offset.toFixed(2), xx + size.x * 1.1, yy + h * 0.6);
            ctx.text(chart.notes_played + "/" + chart.total_notes + " notes", xx + size.x * 1.1, yy + h * 0.72);
            y = v.y + size.y / 2 - h;
            x = v.x - size.x * 0.6;
            ctx.set_font_mono(h * 0.15, "", "right");
            ctx.fillStyle = color.white;
            ctx.text("max combo", x, y + h * 0.2);
            ctx.fillStyle = color["special_" + Chart.special_grade(result)];
            ctx.set_font_mono(h * 0.3, "", "right");
            ctx.text("" + chart.max_combo, x, y + h * 0.6);
        }
        if (ui.mobile) {
            w = ui.width / 4;
            for (let i = 0; i < 4; i++) {
                ctx.fillStyle = (mouse.lanes[i + 1] ? color.green : color.red);
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.rect(i * w, ui.height - w, w, w);
                ctx.fill();
                if (i < 3) {
                    ctx.fillStyle = color.white;
                    ctx.lineWidth = 3;
                    // ctx.line(i * w + w, ui.height / 2, i * w + w, ui.height - w);
                    ctx.globalAlpha = 1;
                    ctx.line(i * w + w, ui.height - w, i * w + w, ui.height);
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
            // ctx.globalAlpha = 0.3;
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
        }
        ctx.restore("tilted");
    },
    draw_note: function (type, x, y, size) {
        if (type === note_type.normal || type === note_type.hold) {
            ctx.beginPath();
            ctx.round_rectangle(x, y, size.x * 0.25, size.y * 0.05, size.y * 0.02);
            ctx.fill();
        }
        else if (type === note_type.spam) {
            ctx.beginPath();
            ctx.circle(x, y, size.y * 0.025);
            ctx.fill();
        }
        else if (type === note_type.inverse) {
            ctx.beginPath();
            ctx.circle(x, y, size.y * 0.025);
            ctx.fill();
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
        // measure text widths
        h = Math.min(200, size.x * 0.6);
        if (x_constrained) {
            h = Math.min(h, ui.width * 0.22);
        }
        ctx.set_font_mono(h * 0.45, "bold", "center");
        // ctx.text("" + score, v.x + h * 0.625, v.y);
        const w1 = ctx.text_width("" + score);
        ctx.set_font_mono([0, h * 0.75, h * 0.675, h * 0.625][grade.length], "bold", "center");
        const w2 = ctx.text_width(grade);
        w = w1 + w2 + h * 0.375;
        // draw bounding rectangle
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
    make_toplist: function () {
        if (document.getElementById("toplist")) {
            document.removeChild(document.getElementById("toplist"));
        }
        const main = document.createElement("div");
        main.id = "toplist";
        main.classList.add("centerbox");
        document.body.appendChild(main);
        main.innerHTML = `
      <p><b>total skill: <span id="totalskill"></span></b></p>
      <table id="chair">
        <tr><th>#</th><th>name</th><th colspan="2">diff</th><th>score</th><th colspan="2">grade</th><th>skill</th></tr>
      </table>
    `;
        const table = document.getElementById("chair");
        let changed = false;
        for (const score of scores.list) {
            if (true || !score.skill) { // todo change
                changed = true;
                const diff = chart_map[score.chart].song_difficulty;
                score.skill = Chart.skill_rate(diff, score.value, score.special);
            }
        }
        scores.list.sort((s1, s2) => (s2.skill - s1.skill));
        let total = 0;
        for (let i = 0; i < scores.list.length; i++) {
            const score = scores.list[i];
            const chart = chart_map[score.chart];
            const tr = document.createElement("tr");
            const gr = Chart.grade(score.value);
            const sp = Chart.special_grades[score.special];
            tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${songs[chart.song_id].name}</td>
        <td style="color: ${color["difficulty_" + chart.song_type]};">${chart.song_type}</td>
        <td style="color: ${color["difficulty_" + chart.song_type]};">${chart.song_difficulty}</td>
        <td style="color: ${color["grade_" + gr]};">${score.value}</td>
        <td style="color: ${color["grade_" + gr]};">${gr}</td>
        <td style="color: ${color["special_" + sp]};">${sp}</td>
        <td title="${score.skill}">${score.skill.toFixed(2)}</td>`;
            table.appendChild(tr);
            total += score.skill;
        }
        document.getElementById("totalskill").textContent = total.toFixed(3);
        // console.log(scores.list);
        if (changed)
            scores.save();
        if (ui.mobile)
            main.addEventListener("click", function () {
                ui.hide_box("toplist");
            });
    },
    make_credits: function () {
        if (document.getElementById("credits")) {
            document.removeChild(document.getElementById("credits"));
        }
        const main = document.createElement("div");
        main.id = "credits";
        main.classList.add("centerbox");
        document.body.appendChild(main);
        main.innerHTML = `
      <h1> Credits </h1>
      <div style="text-align: left;" id="real_credits">
        <h3 style="text-align: center;"> Music </h3>
        <p style="width: max(40vw, 50ch);"><a href="https://squirkymusic.sourceaudio.com/track/25689665" target="_blank"><span> piano_music_01.mp3 <l></l></span><span> Crispin Merrell </span></a></p>
        <p><a href="https://youtu.be/fCNQMJba86A" target="_blank"><span> Deep Under <l></l></span><span> Whitesand </span></a></p>
        <p><a href="https://soundcloud.com/liwingyankobe/loneliness" target="_blank"><span> Loneliness <l></l></span><span> infiniteXforever </span></a></p>
        <h3 style="text-align: center;"> Images </h3>
        <p><a href="https://res.cloudinary.com/dzzjrhgkb/image/upload/dfjk/deepunder.jpg" target="_blank"><span> level 40's congratulations.jpg <l></l></span><span> rnightshroud </span></a></p>
      </div>
      <h1> Versions </h1>
      <div style="text-align: left;">
      <h3> 0.3.6 | 26-12-2024 | 🎶 4  📊 8 </h3>
      <p> - fixed sync issue for loneliness </p>
      <p> - very slightly moved FC/AP indicators in song list </p>
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
      <p> - finally added 2 seconds of silence in <a href="https://res.cloudinary.com/dzzjrhgkb/video/upload/v1734967578/dfjk/loneliness.mp3" target="_blank">Loneliness</a> </p>
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
      <p> - added <a href="https://res.cloudinary.com/dzzjrhgkb/video/upload/dfjk/loneliness.mp3" target="_blank">Loneliness</a> </p>
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
      <p> - added <a href="https://res.cloudinary.com/dzzjrhgkb/video/upload/dfjk/deepunder.mp3" target="_blank">Deep Under</a> internally </p>
      <p> - added hard chart and updated easy chart for piano_music_01.mp3 </p>
      <h3> 0.1.2 | ??-12-2024 | 🎶 2  📊 3 </h3>
      <p> - added <a href="https://res.cloudinary.com/dzzjrhgkb/video/upload/dfjk/beeps.mp3" target="_blank">beeps</a> as calibration for audio offset in settings </p>
      <p> - also added easy chart for piano_music_01.mp3 </p>
      <h3> 0.1.1 | ??-12-2024 | 🎶 1  📊 1 </h3>
      <p> - added settings (just the audio offset) </p>
      <h3> 0.1.0 | 10-12-2024 | 🎶 1  📊 1 </h3>
      <p> - added <a href="https://res.cloudinary.com/dzzjrhgkb/video/upload/dfjk/saloon.mp3" target="_blank">piano_music_01.mp3</a> </p>
      <p> - and made a chart for it (it's now the medium one) </p>
      <p> - this started working </p>
      <h3> 0.0.1 | 09-12-2024 | 🎶 0  📊 0 </h3>
      <p> - started working on this </p>
      <h3> 0.0.0 | 09-12-2024 | 🎶 0  📊 0 </h3>
      <p> - site created! </p>
      </div> 
    `;
        if (ui.mobile)
            main.addEventListener("click", function () {
                ui.hide_box("credits");
            });
    },
    close_boxes() {
        let closed = false;
        for (const id of ["toplist", "credits"]) {
            if (ui.check_box(id)) {
                ui.hide_box(id);
                closed = true;
            }
        }
        return closed;
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
    resize: function () {
        ui.width = window.innerWidth;
        ui.height = window.innerHeight;
    },
    mobile: key.mobile,
};
