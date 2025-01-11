import { config, settings } from "./settings.js";
export class Sound {
    static current;
    static current_time = 0;
    static play_sfx = function (name) {
        return sfx[name].play();
    };
    static tick = function () {
        Sound.current_time = Sound.current?.time ?? 0;
    };
    ctx;
    element;
    track;
    playing = false;
    playing_delay = false;
    play_timestamp = -1; // negative = haven't started playing yet
    pause_timestamp = -1;
    pause_time_total = 0;
    options = {};
    finished = false;
    constructor(path, volume = 1, start, end) {
        this.ctx = new AudioContext();
        this.element = document.createElement("audio");
        this.element.crossOrigin = "anonymous";
        this.element.src = config.cdn_v + path;
        (document.getElementById("audio") ?? document.body).appendChild(this.element);
        this.track = this.ctx.createMediaElementSource(this.element);
        // this.track.connect(this.ctx.destination);
        const gain = this.ctx.createGain();
        this.track.connect(gain).connect(this.ctx.destination);
        gain.gain.value = volume;
        this.element.playbackRate = settings.play_speed;
        this.element.addEventListener("play", () => {
            this.playing = true;
            // time stuff
            if (this.play_timestamp > 0 && !this.playing_delay) {
                this.pause_timestamp = -1;
                this.pause_time_total += performance.now() - this.pause_timestamp;
            }
            else if (this.play_timestamp > 0) {
                this.play_timestamp = performance.now();
            }
            this.playing_delay = false;
        });
        this.element.addEventListener("pause", () => {
            this.playing = false;
            this.pause_timestamp = performance.now();
        });
        this.element.addEventListener("ended", () => {
            this.finished = true;
            this.pause();
            this.element.currentTime = 0;
        });
        if (end) {
            this.element.loop = true;
        }
        this.options.start = start;
        this.options.end = end;
        this.reset();
    }
    play_after(delay_ms) {
        if (this.play_timestamp < 0) {
            this.playing_delay = true;
            this.play_timestamp = performance.now() + delay_ms;
        }
        this.options.timeout = setTimeout(() => {
            this.play();
        }, delay_ms);
    }
    play() {
        if (this.playing || document.hidden)
            return;
        // play!
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
        this.element.play(); // trigger #play event
        this.make_interval();
    }
    make_interval() {
        if (!this.options.start || !this.options.end)
            return;
        this.options.interval = setInterval(() => {
            if (!this.options.start || !this.options.end)
                return;
            if (this.element.currentTime * 1000 >= this.options.end) {
                this.element.currentTime = this.options.start / 1000;
            }
        }, 1);
    }
    clear_interval() {
        if (!this.options.start || !this.options.end)
            return;
        clearInterval(this.options.interval);
    }
    pause() {
        if (!this.playing)
            return;
        this.element.pause(); // trigger #pause event
        this.clear_interval();
    }
    reset() {
        this.finished = false;
        this.play_timestamp = -1;
        this.pause_timestamp = -1;
        this.pause_time_total = 0;
        this.element.currentTime = (this.options.start ?? 0) / 1000;
        clearTimeout(this.options.timeout);
        clearInterval(this.options.interval);
        // this.element.pause();
    }
    restart() {
        this.reset();
        this.play();
    }
    get time() {
        return this.element.currentTime * 1000 - settings.offset * settings.play_speed;
        if (this.play_timestamp < 0) {
            return -1000; // todo replace with play delay
        }
        else if (this.pause_timestamp < 0) {
            return this.element.currentTime * 1000;
            const now = performance.now();
            return now - this.play_timestamp - this.pause_time_total;
        }
        else { // in a pause right now
            return this.pause_timestamp - this.play_timestamp - this.pause_time_total;
        }
    }
    get paused() {
        return this.pause_timestamp > 0;
    }
    // measures the time to another event (in this sound's coordinates)
    time_to(other_timestamp) {
        return other_timestamp - this.time;
    }
    time_of(timestamp) {
        if (this.pause_timestamp > 0) {
        }
        return timestamp - this.play_timestamp; // todo
    }
}
;
export const sounds = {
    beeps: new Sound("beeps.mp3", 0.7),
    beeps_preview: new Sound("beeps.mp3", 0.7, 2000, 52000),
    saloon: new Sound("saloon.mp3", 0.4),
    saloon_preview: new Sound("saloon.mp3", 0.4, 2200, 31900),
    loneliness: new Sound("loneliness.mp3", 0.7),
    loneliness_preview: new Sound("loneliness.mp3", 0.7, 72300, 96350),
    deepunder: new Sound("deepunder.mp3", 1),
    deepunder_preview: new Sound("deepunder.mp3", 1, 41950, 64725),
    dusk_approach: new Sound("dusk_approach.mp3", 1),
    dusk_approach_preview: new Sound("dusk_approach.mp3", 1, 68631, 115288),
};
const sfx_make = {
    hit: "111118CvBfBFjoUuukiKaP7emd7z4u3mbuxJGrb7zny1cJghYj9Ri4puRHguBYi1EEJFExsnakGq55F6MNZZo9Tt5p5QhqC16R6s4Ssj9v2yEbQqptiLtqAo",
    hit_old: "7BMHBG9qJUh4Mxak1fWXKLRFQAm1E73gnEP5uaMQctgN9XHfQZjJWnMHb4d2D8socrBj1qZjMnk7VFREGQRSSLLhZR3HnxQAitdsSZMg1T17X3ahK4WwDRSx7",
};
for (let i = 1; i <= 10; i++) {
    sfx_make["hit" + i] = {
        "oldParams": true,
        "wave_type": 1,
        "p_env_attack": 0,
        "p_env_sustain": 0.06328822670688675,
        "p_env_punch": 0.565165917709796,
        "p_env_decay": 0.18443013350709903,
        "p_base_freq": 0.7433740021219238,
        "p_freq_limit": 0,
        "p_freq_ramp": 0,
        "p_freq_dramp": 0,
        "p_vib_strength": 0,
        "p_vib_speed": 0,
        "p_arp_mod": 0.5751861670586618,
        "p_arp_speed": 0.5032812631287724,
        "p_duty": 0,
        "p_duty_ramp": 0,
        "p_repeat_speed": 0,
        "p_pha_offset": 0,
        "p_pha_ramp": 0,
        "p_lpf_freq": 1,
        "p_lpf_ramp": 0,
        "p_lpf_resonance": 0,
        "p_hpf_freq": 0,
        "p_hpf_ramp": 0,
        "sound_vol": 0,
        "sample_rate": 44100,
        "sample_size": 8
    };
    sfx_make["hit" + i].sound_vol = 0.2 * Math.pow(0.5, 6 - (i - 1) / 10 * 6);
}
export const sfx = {};
for (const k in sfx_make) {
    sfx[k] = sfxr.toAudio(sfx_make[k]);
}
