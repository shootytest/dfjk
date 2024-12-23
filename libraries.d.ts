declare namespace sfxr {

  function generate(name: string): Sound_;
  function play(sound: Sound_);
  function toAudio(data: string | sound_options): Sound_;
  function b58encode(sound: Sound_): string;
  function b58decode(data: string): Sound_;
  class Sound {
    play(): void;
  }
  interface sound_options {
    oldParams: boolean,
    wave_type: number,
    p_env_attack: number,
    p_env_sustain: number,
    p_env_punch: number,
    p_env_decay: number,
    p_base_freq: number,
    p_freq_limit: number,
    p_freq_ramp: number,
    p_freq_dramp: number,
    p_vib_strength: number,
    p_vib_speed: number,
    p_arp_mod: number,
    p_arp_speed: number,
    p_duty: number,
    p_duty_ramp: number,
    p_repeat_speed: number,
    p_pha_offset: number,
    p_pha_ramp: number,
    p_lpf_freq: number,
    p_lpf_ramp: number,
    p_lpf_resonance: number,
    p_hpf_freq: number,
    p_hpf_ramp: number,
    sound_vol: number,
    sample_rate: number,
    sample_size: number
  }

}

declare namespace zipson {

  function parse(s: string): any;
  function stringify(o: any): string;

}