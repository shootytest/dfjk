import { canvas, init_canvas } from "./util/canvas.js";
import { key, mouse } from "./util/key.js";
import { Chart, charts } from "./chart.js";
import { Sound, sounds } from "./sound.js";
import { ui } from "./ui.js";
import { scores, settings } from "./settings.js";
import { firebase } from "./firebase.js";

const main = function() {

  init();
  tick();

};

const init = function() {

  firebase.increment("/test/pageviews/", 1);
  init_canvas();
  scores.init();
  key.init();
  ui.init();
  key.add_key_listener("Space", function() {
    if (document.activeElement?.tagName.toLowerCase() === "input") return;
    ui.enter();
  });
  key.add_key_listener("Enter", ui.enter);
  key.add_key_listener("Tab", ui.shift);
  key.add_key_listener("ShiftLeft", ui.shift);
  key.add_key_listener("ShiftRight", ui.shift);
  key.add_key_listener("KeyR", function() {
    if (document.activeElement?.tagName.toLowerCase() === "input") return;
    ui.restart();
  });
  key.add_key_listener("Escape", ui.back);
  key.add_key_listener("Backquote", function() {
    if (Sound.current) {
      ui.restart();
      // Sound.current.element.currentTime = 15.975 * 0 + 0.1248 * 0; // loneliness
      Sound.current.element.currentTime = 6.442953 * 8 + 0.201342 * 0; // tetris
    }
  });
  key.add_key_listener("Backspace", function() {
    if (document.activeElement?.tagName.toLowerCase() === "input") return;
    ui.back();
  });
  key.add_key_listener("KeyP", function() {
    if (Sound.current?.paused) {
      Sound.current?.play();
    } else {
      Sound.current?.pause();
    }
  });
  /*for (let i = 0; i < 4; i++) {
    key.add_key_listener("Key" + settings.controls.toUpperCase()[i], function() {
      Chart.current?.key_hit(i + 1);
    });
  }*/
  key.add_keydown_listener(function(event) {
    if (event.repeat) return;
    for (let i = 0; i < 4; i++) {
      if (event.code === "Key" + settings.controls.toUpperCase()[i]) {
        Chart.current?.key_hit(i + 1);
      }
    }
    if (settings.practice_mode && Chart.current && Sound.current) {
      for (let i = 0; i <= 9; i++) {
        if (event.code === "Digit" + i) {
          if (event.shiftKey) {
            Chart.current.checkpoints[i] = Math.round(Sound.current.time);
          } else if (Chart.current.checkpoints[i] >= 0) {
            Sound.current.element.currentTime = Chart.current.checkpoints[i] / 1000;
          }
        }
      }
    }
  });
  key.add_keyup_listener(function(event) {
    if (event.repeat) return;
    for (let i = 0; i < 4; i++) {
      if (event.code === "Key" + settings.controls.toUpperCase()[i]) {
        Chart.current?.key_release(i + 1);
      }
    }
  });
  
  key.add_lane_hit(function(lane) {
    Chart.current?.key_hit(lane);
  });
  key.add_lane_release(function(lane) {
    Chart.current?.key_release(lane);
  });

  key.add_key_listener("ArrowUp", function() {
    ui.up();
  });
  key.add_key_listener("ArrowDown", function() {
    ui.down();
  });
  key.add_key_listener("ArrowLeft", function() {
    ui.left();
  });
  key.add_key_listener("ArrowRight", function() {
    ui.right();
  });
  key.add_key_listener("KeyW", function() {
    if (ui.menu === "game") return;
    ui.up();
  });
  key.add_key_listener("KeyS", function() {
    if (ui.menu === "game") return;
    ui.down();
  });
  key.add_key_listener("KeyA", function() {
    if (ui.menu === "game") return;
    ui.left();
  });
  key.add_key_listener("KeyD", function() {
    if (ui.menu === "game") return;
    ui.right();
  });

  document.addEventListener("visibilitychange", () => {
    if (ui.menu === "list") {
      if (document.hidden) {
        ui.list.playing.pause();
      } else {
        ui.list.playing.play();
      }
    } else if (ui.menu === "game") {
      if (document.hidden) {
        Sound.current?.pause();
      } else {
        Sound.current?.play();
      }
    }
  });

};

const tick = function(time?: number) {
  Sound.tick();
  Chart.current?.tick();
  ui.tick();
  ui.draw();
  mouse.tick();
  requestAnimationFrame(tick);
};

window.addEventListener("load", main);