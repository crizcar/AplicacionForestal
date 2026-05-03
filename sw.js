// Nombre de nuestra bóveda de caché
const CACHE_NAME = 'carga-forestal-v2';

// Archivos que necesitamos guardar para que funcione sin internet
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './script.js',
    // Agregamos la librería de Excel para que se descargue y quede disponible offline
    'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// Fase 1: Instalación (Guardar los archivos en la bóveda)
self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Archivos guardados en caché correctamente');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fase 2: Intercepción de peticiones (El trabajo en terreno)
self.addEventListener('fetch', (evento) => {
    evento.respondWith(
        // Busca si el archivo solicitado ya está en nuestra bóveda
        caches.match(evento.request)
            .then((respuesta) => {
                // Si está en la bóveda, lo entrega de inmediato (Offline)
                if (respuesta) {
                    return respuesta;
                }
                // Si no está, intenta buscarlo en internet
                return fetch(evento.request);
            })
    );
});
