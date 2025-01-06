/*export as namespace firebase;

export const register_user: (username: string, password: string) => void;
export const login_user: (username: string, password: string) => void;
export const register_goggle_user: (username: string) => void;
export const login_goggle_user: (username: string) => void;*/

export declare namespace firebase {
  
  let user: any;
  let signed_in: boolean;
  let stored_username: string;

  function listen(path: string, listener: (o: any) => void, error_function: (e: Error | null) => void): void;
  function get(path: string, getter_function: (o: any) => void, error_function: (e: Error | null) => void = (e: Error | null) => {}): void;
  async function promise_get(path: string, getter_function: (o: any) => void, error_function: (e: Error | null) => void): void;
  function set(path: string, value: any): Promise<void>;
  function update(updates: { [key: string]: any }): Promise<void>;
  function bare_transaction(path: string, setter_function: (o: any) => any): void;
  function transaction(path: string, setter_function: (o: any) => any): void;
  function increment(path: string, number: number = 1): Promise<void>;
  function remove(path: string): Promise<void>;

  function register_user(username: string, password: string): void;
  function login_user(username: string, password: string): void;
  function register_goggle_user(username: string): void;
  function login_goggle_user(username: string): void;
  function logout_user(clear_scores: boolean, resolve_fn: () => void = () => {}): void;

  function save_scores(uid: string): Promise<void>;
  function merge_scores(other_map: { [key: string]: Score[] }): { [key: string]: Score[] };
  function update_scores(fn: () => void = () => {}): void;
  function get_scores(chart_name: string, fn: (scores: { uid: string, username: string, userskill: number, score: Score, }[]) => void): void;
  function get_leaderboard(fn: (leaderboard: { uid: string, username: string, peak: number, skill: number, }[]) => void): void;

  let username: string;
  function change_username(new_username: string): void;

  function redisplay_result(): void;

};