var CACHE_NAME = 'katusa-v1';
var urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './data.js',
    './app.js',
    './images/katusa_roka_emblem.jpg',
    './images/eighth_army_hq.jpg'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                if (response) return response;
                return fetch(event.request);
            })
    );
});
