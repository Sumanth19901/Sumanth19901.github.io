const $ = (q) => document.querySelector(q);
  const $$ = (q) => Array.from(document.querySelectorAll(q));
  const fmtDate = (s) => new Date(s).toLocaleString();