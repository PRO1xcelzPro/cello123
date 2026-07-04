// ==UserScript==
// @name         Bicolink Auto Skip (Generic)
// @namespace    local-generic-safelink-skip
// @version      1.0
// @description  Coba skip timer/tombol lanjut di bicolink.com secara otomatis. Pola generic — mungkin perlu disesuaikan jika struktur halaman berubah.
// @match        *://bicolink.com/*
// @match        *://*.bicolink.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const log = (...a) => console.log('[BicolinkSkip]', ...a);

  // 1) Coba cari link tujuan yang disimpan di atribut data-*, meta refresh, atau variabel global umum
  function findHiddenTarget() {
    // Pola umum: <meta http-equiv="refresh" content="5;url=https://...">
    const meta = document.querySelector('meta[http-equiv="refresh"]');
    if (meta) {
      const match = meta.content.match(/url=(.+)$/i);
      if (match) return match[1].trim();
    }

    // Pola umum: elemen dengan data-url / data-href / data-link
    const el = document.querySelector('[data-url], [data-href], [data-link], [data-target]');
    if (el) {
      return el.dataset.url || el.dataset.href || el.dataset.link || el.dataset.target;
    }

    // Pola umum: variabel global window.finalUrl / window.destination dsb.
    const candidates = ['finalUrl', 'destination', 'targetUrl', 'redirectUrl', 'shortlinkUrl'];
    for (const key of candidates) {
      if (window[key]) return window[key];
    }

    return null;
  }

  // 2) Set semua countdown/timer JS ke 0 supaya tombol lanjut langsung aktif
  function killCountdowns() {
    // Override setInterval/setTimeout dengan delay besar (biasanya delay countdown) jadi instan
    const origSetInterval = window.setInterval;
    window.setInterval = function (fn, delay, ...rest) {
      if (delay > 500) delay = 10;
      return origSetInterval(fn, delay, ...rest);
    };
    const origSetTimeout = window.setTimeout;
    window.setTimeout = function (fn, delay, ...rest) {
      if (delay > 500) delay = 10;
      return origSetTimeout(fn, delay, ...rest);
    };
  }

  // 3a) Cari elemen (link/button) berdasarkan teks yang tampil, bukan id/class
  //     (lebih tahan terhadap perubahan struktur HTML dibanding selector CSS)
  function findByText(texts) {
    const nodes = document.querySelectorAll('a, button, [role="button"], input[type="submit"]');
    for (const node of nodes) {
      const label = (node.innerText || node.value || '').trim().toLowerCase();
      if (texts.some(t => label.includes(t))) return node;
    }
    return null;
  }

  // 3b) Auto-klik tombol "Lanjutkan Akses Biasa" / "Continue" / "Skip" / "Get Link"
  //     begitu ketemu dan tidak disabled. Sengaja HANYA klik opsi gratis/biasa,
  //     bukan opsi premium berbayar.
  function autoClickContinue() {
    const freeLabels = [
      'lanjutkan akses biasa', 'akses biasa', 'lanjutkan', 'continue',
      'get link', 'skip ad', 'lewati', 'dapatkan link'
    ];
    const interval = setInterval(() => {
      const btn = findByText(freeLabels);
      if (btn && !btn.disabled && btn.offsetParent !== null) {
        log('Klik otomatis:', btn.innerText || btn.value);
        btn.click();
      }
    }, 1000);
    // stop setelah 30 detik supaya tidak jalan terus-terusan
    setTimeout(() => clearInterval(interval), 30000);
  }

  killCountdowns();

  const target = findHiddenTarget();
  if (target) {
    log('Ditemukan target langsung:', target);
    window.location.href = target;
  } else {
    log('Target tidak ditemukan otomatis, fallback ke auto-klik tombol.');
    autoClickContinue();
  }
})();
