self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Sem cache: os dados das descargas têm de ser sempre os mais recentes.
// O handler de fetch existe porque o Chrome o exige para oferecer a instalação.
self.addEventListener('fetch', () => {});