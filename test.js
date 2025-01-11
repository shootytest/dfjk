import { init_canvas } from "./util/canvas.js";
import { key, mouse } from "./util/key.js";
import { Chart } from "./chart.js";
import { Sound } from "./sound.js";
import { ui } from "./ui.js";
import { scores } from "./settings.js";
import { firebase } from "./firebase.js";
const main = function () {
    init();
    tick();
};
const init = function () {
    firebase.increment("/test/pageviews/", 1);
    init_canvas();
    scores.init();
    key.init();
    ui.init();
    key.add_key_listener("Space", function () {
        if (document.activeElement?.tagName.toLowerCase() === "input")
            return;
        ui.enter();
    });
    key.add_key_listener("Enter", ui.enter);
    key.add_key_listener("Tab", ui.shift);
    key.add_key_listener("ShiftLeft", ui.shift);
    key.add_key_listener("ShiftRight", ui.shift);
    key.add_key_listener("KeyR", function () {
        if (document.activeElement?.tagName.toLowerCase() === "input")
            return;
        ui.restart();
    });
    key.add_key_listener("Escape", ui.back);
    key.add_key_listener("Backquote", ui.back);
    key.add_key_listener("Digit1", function () {
        if (Sound.current)
            Sound.current.element.currentTime = 30 / 9 * 34;
    });
    key.add_key_listener("Backspace", function () {
        if (document.activeElement?.tagName.toLowerCase() === "input")
            return;
        ui.back();
    });
    key.add_key_listener("KeyP", function () {
        if (Sound.current?.paused) {
            Sound.current?.play();
        }
        else {
            Sound.current?.pause();
        }
    });
    /*for (let i = 0; i < 4; i++) {
      key.add_key_listener("Key" + "DFJK"[i], function() {
        Chart.current?.key_hit(i + 1);
      });
    }*/
    key.add_keydown_listener(function (event) {
        if (event.repeat)
            return;
        for (let i = 0; i < 4; i++) {
            if (event.code === "Key" + "DFJK"[i]) {
                Chart.current?.key_hit(i + 1);
            }
        }
    });
    key.add_keyup_listener(function (event) {
        if (event.repeat)
            return;
        for (let i = 0; i < 4; i++) {
            if (event.code === "Key" + "DFJK"[i]) {
                Chart.current?.key_release(i + 1);
            }
        }
    });
    key.add_lane_hit(function (lane) {
        Chart.current?.key_hit(lane);
    });
    key.add_lane_release(function (lane) {
        Chart.current?.key_release(lane);
    });
    key.add_key_listener("ArrowUp", function () {
        ui.up();
    });
    key.add_key_listener("ArrowDown", function () {
        ui.down();
    });
    key.add_key_listener("ArrowLeft", function () {
        ui.left();
    });
    key.add_key_listener("ArrowRight", function () {
        ui.right();
    });
    key.add_key_listener("KeyW", function () {
        ui.up();
    });
    key.add_key_listener("KeyS", function () {
        ui.down();
    });
    key.add_key_listener("KeyA", function () {
        ui.left();
    });
    key.add_key_listener("KeyD", function () {
        ui.right();
    });
    document.addEventListener("visibilitychange", () => {
        if (ui.menu === "list") {
            if (document.hidden) {
                ui.list.playing.pause();
            }
            else {
                ui.list.playing.play();
            }
        }
        else if (ui.menu === "game") {
            if (document.hidden) {
                Sound.current?.pause();
            }
            else {
                Sound.current?.play();
            }
        }
    });
};
const tick = function (time) {
    Sound.tick();
    Chart.current?.tick();
    ui.tick();
    ui.draw();
    mouse.tick();
    requestAnimationFrame(tick);
};
window.addEventListener("load", main);
