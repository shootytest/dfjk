import { init_canvas } from "./util/canvas.js";
import { key, mouse } from "./util/key.js";
import { Chart, charts } from "./chart.js";
import { Sound, sounds } from "./sound.js";
import { ui } from "./ui.js";
import { scores, settings } from "./settings.js";

const main = function() {

  init();
  tick();

};

const init = function() {

  init_canvas();
  scores.init();
  key.init();
  ui.init();
  key.add_key_listener("Space", ui.enter);
  key.add_key_listener("Enter", ui.enter);
  key.add_key_listener("KeyR", ui.restart);
  key.add_key_listener("Escape", ui.back);
  key.add_key_listener("Backquote", ui.back);
  key.add_key_listener("Digit1", function() {
    if (Sound.current) Sound.current.element.currentTime = 86.000;
  });
  key.add_key_listener("Backspace", ui.back);
  key.add_key_listener("KeyP", function() {
    if (Sound.current?.paused) {
      Sound.current?.play();
    } else {
      Sound.current?.pause();
    }
  });
  /*for (let i = 0; i < 4; i++) {
    key.add_key_listener("Key" + "DFJK"[i], function() {
      Chart.current?.key_hit(i + 1);
    });
  }*/
  key.add_keydown_listener(function(event) {
    if (event.repeat) return;
    for (let i = 0; i < 4; i++) {
      if (event.code === "Key" + "DFJK"[i]) {
        Chart.current?.key_hit(i + 1);
      }
    }
  });
  key.add_keyup_listener(function(event) {
    if (event.repeat) return;
    for (let i = 0; i < 4; i++) {
      if (event.code === "Key" + "DFJK"[i]) {
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
    ui.up();
  });
  key.add_key_listener("KeyS", function() {
    ui.down();
  });
  key.add_key_listener("KeyA", function() {
    ui.left();
  });
  key.add_key_listener("KeyD", function() {
    ui.right();
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