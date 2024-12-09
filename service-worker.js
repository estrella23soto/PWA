const CACHE_NAME = "flashlight-pwa-cache-v1";
console.log("Service Worker");

// Función para registrar dinámicamente los archivos necesarios para el caché
const dynamicUrlsToCache = () => {
  const baseFiles = [
    "/",
    "/index.html",
    "/stylePrincipal.css",
    "/css/styleIndex.css",
    "/js/script.js",
    "/img/Naruto.jpg",
    "/img/Kanye.jpg"
  ];

  // Recorrer carpetas específicas y añadir archivos comunes (opcionalmente, desde un backend o script dinámico)
  const folders = ["pages", "css", "js", "img"];
  folders.forEach(folder => {
    if (folder === "pages") {
      baseFiles.push(
        "/pages/acercaDelProyecto.html",
        "/pages/crudTareas.html",
        "/pages/flash.html",
        "/pages/huella.html"
      );
    } else if (folder === "css") {
      baseFiles.push(
        "/css/styleAcercaDelProyecto.css",
        "/css/styleCrud.css",
        "/css/styleFlash.css"
      );
    }
  });

  return baseFiles;
};

const urlsToCache = dynamicUrlsToCache();

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Cache opened and files added:", CACHE_NAME);
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("Error caching files:", error);
      });
    })
  );
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );
});

// Intercepta solicitudes y sirve desde la caché si está disponible
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("Serving from cache:", event.request.url);
      } else {
        console.log("Fetching from network:", event.request.url);
      }
      return response || fetch(event.request);
    })
  );
});
