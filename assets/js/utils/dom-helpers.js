/* NEW in v2 — cuts 115x getElementById repetition. No behaviour change. */
export const $ = (id) => document.getElementById(id);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export function setDisplay(id, value) {
  const el = document.getElementById(id);
  if (el) el.style.display = value;
}
