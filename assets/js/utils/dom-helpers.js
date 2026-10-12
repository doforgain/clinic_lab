/* NEW in v2 — cuts 115x getElementById repetition. No behaviour change. */
export const $ = (id) => document.getElementById(id);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));


export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
