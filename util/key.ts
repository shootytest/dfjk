import { config } from "../settings.js";
import { canvas } from "./canvas.js";
import { math } from "./math.js";
import { vector } from "./vector.js";

export const keys: { [key: string]: boolean } = {};
const key_listeners: { [key: string]: (() => void)[] } = {};
const keydown_listeners: ((event: KeyboardEvent) => void)[] = [];
const keyup_listeners: ((event: KeyboardEvent) => void)[] = [];
let key_changed = false;

const update_mouse = (buttons: number) => {
  keys["Mouse"] = (buttons & 1) !== 0;
  keys["MouseLeft"] = (buttons & 1) !== 0;
  keys["MouseRight"] = (buttons & 2) !== 0;
  keys["MouseWheel"] = (buttons & 4) !== 0;
};

export const mouse = {
  x: 0,
  y: 0,
  scroll: 0,
  double_click: false,
  old: vector.create(),
  d: vector.create(),
  buttons: [false, false, false],
  down_buttons: [false, false, false],
  up_buttons: [false, false, false],
  lanes: [false, false, false, false, false, false, false, false],
  lane_hit: [] as ((lane: number) => void)[],
  lane_release: [] as ((lane: number) => void)[],
  lane_ids: {} as { [key: number]: number },
  down_position: [vector.create(), vector.create(), vector.create()],
  up_position: [vector.create(), vector.create(), vector.create()],
  drag_vector: [vector.create(), vector.create(), vector.create()] as (vector | false)[],
  drag_vector_old: [vector.create(), vector.create(), vector.create()] as (vector | false)[],
  drag_change: [vector.create(), vector.create(), vector.create()],
  touches: {} as TouchList,
  touch_vectors: [] as vector[],
  old_touches: {} as TouchList,
  // run this tick right at the end!
  tick: () => {
    mouse.down_buttons = [false, false, false];
    mouse.up_buttons = [false, false, false];
    mouse.lanes[0] = false;
    for (let b = 0; b < 3; b++) {
      if (mouse.drag_vector[b] != false && mouse.drag_vector_old[b] != false) {
        mouse.drag_change[b] = vector.sub(mouse.drag_vector[b] || vector.create(), mouse.drag_vector_old[b] || vector.create());
      } else {
        mouse.drag_change[b] = vector.create();
      }
      mouse.drag_vector_old[b] = mouse.drag_vector[b];
    }
    mouse.scroll = 0;
    mouse.double_click = false;
  },
};

export const key = {

  init: () => {
    window.addEventListener("keydown", function(event) {
      key_changed = true;
      if (["Tab"].includes(event.code)) {
        event.preventDefault();
      }
      const key = event.code;
      keys[key] = true;
      if (!event.repeat) {
        if (key_listeners[key] != null) {
          for (const f of key_listeners[key]) {
            f();
          }
        }
      }
      for (const f of keydown_listeners) {
        f(event);
      }
    });

    /*
    window.addEventListener("keypress", function(event) {
      key_changed = true;
      if (["Tab"].includes(event.code)) {
        event.preventDefault();
      }
      const key = event.code;
      keys[key] = true;
    });
    */

    window.addEventListener("keyup", function(event) {
      key_changed = true;
      const key = event.code;
      keys[key] = false;
      for (const f of keyup_listeners) {
        f(event);
      }
    });

    window.addEventListener("focus", function(event) {
      key_changed = true;
      for (const key in keys) {
        keys[key] = false;
      }
    });

    window.addEventListener("mousemove", function(event) {
      key_changed = true;
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.d.x = event.movementX;
      mouse.d.y = event.movementY;
      for (let b = 0; b < 3; b++) {
        if (mouse.buttons[b] && mouse.down_position[b]) {
          const new_mousedrag = vector.sub(vector.create(mouse.x, mouse.y), mouse.down_position[b]);
          mouse.drag_vector[b] = new_mousedrag;
        }
      }
    });

    function update_touch_vectors(touches: TouchList, up_or_down: number = 0) {
      if (up_or_down === 0) {
        mouse.touch_vectors = [];
        mouse.lanes = [true, false, false, false, false, false, false, false];
      }
      for (const t of touches) {
        const v = vector.create(t.clientX, t.clientY);
        let lane = 1 + Math.floor(v.x / (window.innerWidth + 1) * config.lanes);
        if (up_or_down === 0) { // move
          lane = mouse.lane_ids[t.identifier] ?? lane;
          mouse.touch_vectors.push(v);
          const display_lane = math.lane_hit_x(config.lanes, lane);
          mouse.lanes[display_lane] = true;
        } else if (up_or_down === 1) { // down
          mouse.lane_ids[t.identifier] = lane;
          for (const f of mouse.lane_hit) {
            f(lane);
          }
        } else if (up_or_down === -1) { // up
          lane = mouse.lane_ids[t.identifier];
          for (const f of mouse.lane_release) {
            f(lane);
          }
          delete mouse.lane_ids[t.identifier];
        }
      }
    };

    window.addEventListener("touchmove", function(event) {
      key_changed = true;
      const touch = event.touches[0];
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
      // mouse.d.x = touch.movementX;
      // mouse.d.y = touch.movementY;
      mouse.touches = event.touches;
      update_touch_vectors(event.touches, 0);
    });

    const mousedown = (event: MouseEvent | TouchEvent) => {
      if (event instanceof TouchEvent) {
        mouse.touches = event.touches;
        update_touch_vectors(event.touches, 0);
        update_touch_vectors(event.changedTouches, 1);
        const touch = event.touches[0];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
      }
      let b = event instanceof MouseEvent ? event.button : 0;
      if (b === 0) {
        if (keys.AltLeft) b = 2;
        else if (keys.AltRight) b = 1;
      }
      mouse.buttons[b] = true;
      mouse.down_buttons[b] = true;
      mouse.down_position[b] = vector.create(mouse.x, mouse.y);
      mouse.drag_vector[b] = false;
      mouse.drag_vector_old[b] = false;
    };

    canvas.addEventListener("mousedown", function(event) {
      key_changed = true;
      mousedown(event);
      event.preventDefault();
      update_mouse(event.buttons);
    });

    canvas.addEventListener("touchstart", function(event) {
      key_changed = true;
      mousedown(event);
      event.preventDefault();
    });

    canvas.addEventListener("contextmenu", function(event) {
      key_changed = true;
      event.preventDefault();
      update_mouse(event.buttons);
    });

    const mouseup = (event: MouseEvent | TouchEvent) => {
      if (event instanceof TouchEvent) {
        mouse.touches = event.touches;
        update_touch_vectors(event.touches, 0);
        update_touch_vectors(event.changedTouches, -1);
      }
      let b = event instanceof MouseEvent ? event.button : 0;
      if (b === 0) {
        if (keys.AltLeft) b = 2;
        else if (keys.AltRight) b = 1;
      }
      mouse.up_buttons[b] = true;
      mouse.buttons[b] = false;
      mouse.up_position[b] = vector.create(mouse.x, mouse.y);
      mouse.drag_vector[b] = false;
      mouse.drag_vector_old[b] = false;
    };

    canvas.addEventListener("mouseup", function(event) {
      key_changed = true;
      mouseup(event);
      event.preventDefault();
      update_mouse(event.buttons);
    });

    canvas.addEventListener("touchend", function(event) {
      key_changed = true;
      mouseup(event);
      event.preventDefault();
    });

    function wheel(event: WheelEvent) {
      event.preventDefault();
      mouse.scroll = event.deltaY;
      return false;
    };

    function dblclick(event: MouseEvent) {
      event.preventDefault();
      mouse.double_click = true;
      return false;
    };

    canvas.addEventListener("wheel", function(event) {
      wheel(event);
    }, {
      passive: false,
    });

    canvas.addEventListener("dblclick", function(event) {
      dblclick(event);
    });

  },

  update_controls: {

  },

  shift: () => {
    return (keys.ShiftLeft || keys.ShiftRight);
  },
  ctrl: () => {
    return (keys.ControlLeft || keys.ControlRight);
  },
  alt: () => {
    return (keys.AltLeft || keys.AltRight);
  },
  meta: () => {
    return (keys.MetaLeft || keys.MetaRight);
  },

  add_key_listener: (key: string, f: () => void) => {
    if (key_listeners[key] == null) key_listeners[key] = [];
    key_listeners[key].push(f);
  },

  remove_key_listeners: (key: string) => {
    key_listeners[key] = [];
  },

  add_keydown_listener: (f: (event: KeyboardEvent) => void) => {
    keydown_listeners.push(f);
  },

  remove_keydown_listeners: () => {
    keydown_listeners.length = 0;
  },

  add_keyup_listener: (f: (event: KeyboardEvent) => void) => {
    keyup_listeners.push(f);
  },

  remove_keyup_listeners: () => {
    keyup_listeners.length = 0;
  },

  add_lane_hit: (f: (lane: number) => void) => {
    mouse.lane_hit.push(f);
  },

  add_lane_release: (f: (lane: number) => void) => {
    mouse.lane_release.push(f);
  },

  check_keys: function(key_array: string[]) {
    if (!Array.isArray(key_array)) {
      key_array = [key_array];
    }
    for (const key of key_array) {
      if (keys[key]) {
        return true;
      }
    }
    return false;
  },

  board_width: Math.min(window.innerWidth * 0.7, window.innerHeight * 0.4),
  check_touch_x: function(x: number, w: number) {
    for (const t of mouse.touch_vectors) {
      if (Math.abs(t.x - x) <= w / 2) return true;
    }
    return false;
  },

  mobile: (function() {
    let check = false;
    (function(a: string){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent ?? navigator.vendor/*?? window.opera*/);
    return check;
  })(),

  check_url: function(url: string, callback: (status: number) => void) {
    fetch(url, { method: 'head' })
      .then(function(result) {
        callback(result.status);
      });
  },

};

const mouseup_all = () => {
  mouse.up_buttons = [false, false, false];
  mouse.buttons = [false, false, false];
  mouse.up_position = [vector.create(mouse.x, mouse.y), vector.create(mouse.x, mouse.y), vector.create(mouse.x, mouse.y)];
  mouse.drag_vector = [false, false, false];
  mouse.drag_vector_old = [false, false, false];
};

export const alert_ = (...args: any[]) => {
  window.alert(...args);
  mouseup_all();
};

export const prompt_ = (...args: any[]) => {
  const answer = window.prompt(...args);
  mouseup_all();
  return answer;
};