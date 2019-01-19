// replace process.cwd in order to permit to use npm run ng script
export function cwd() {
  return process.env.INIT_CWD || process.cwd();
}
