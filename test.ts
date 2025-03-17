import { canvas, init_canvas } from "./util/canvas.js";
import { key, mouse } from "./util/key.js";
import { Chart, charts } from "./chart.js";
import { Sound, sounds } from "./sound.js";
import { ui } from "./ui.js";
import { config, scores, settings } from "./settings.js";
import { firebase } from "./firebase.js";
import { math } from "./util/math.js";

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
    if (ui.game.lanes_target % 2 === 1) return;
    ui.enter();
  });
  key.add_key_listener("Enter", function() {
    if (document.activeElement?.id === "answer") return;
    ui.enter();
  });
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
      // Sound.current.element.currentTime = 6.442953 * 7 + 0.201342 * 0; // tetris
      // Sound.current.element.currentTime = 7.61904762 * 19 + 0.4762 * 0; // happiness
      // Sound.current.element.currentTime = 8 * 8 + 0.5 * 0; // nush
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
  /*for (let i = 0; i < 5; i++) {
    key.add_key_listener("Key" + settings.controls.toUpperCase()[i], function() {
      Chart.current?.key_hit(i + 1);
    });
  }*/
  key.add_keydown_listener(function(event) {
    if (event.repeat) return;
    for (let i = 0; i < 4; i++) {
      if (event.code === "Key" + settings.controls[i].toUpperCase()) {
        Chart.current?.key_hit(i + 1);
      }
    }
    if (ui.game.lanes_target === 5 && (event.code === "Space" || event.code === "KeyG" || event.code === "KeyH")) Chart.current?.key_hit(5);
    if (ui.game.lanes_target > 5) for (let i = 5; i <= ui.game.lanes_target; i++) {
      if (event.code === [0, 1, 2, 3, 4, "KeyS", "KeyL", "Space"][i]) {
        Chart.current?.key_hit(i);
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
      if (event.code === "Key" + settings.controls[i].toUpperCase()) {
        Chart.current?.key_release(i + 1);
      }
    }
    if (ui.game.lanes_target === 5 && (event.code === "Space" || event.code === "KeyG" || event.code === "KeyH")) Chart.current?.key_release(5);
    if (ui.game.lanes_target > 5) for (let i = 5; i <= ui.game.lanes_target; i++) {
      if (event.code === [0, 1, 2, 3, 4, "KeyS", "KeyL", "Space"][i]) {
        Chart.current?.key_release(i);
      }
    }
  });

  key.add_lane_hit(function(lane) {
    const lanes = config.lanes;
    Chart.current?.key_hit(math.lane_hit_x(lanes, lane));
  });
  key.add_lane_release(function(lane) {
    const lanes = config.lanes;
    Chart.current?.key_release(math.lane_hit_x(lanes, lane));
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