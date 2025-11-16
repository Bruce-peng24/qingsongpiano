// sw.js - Service Worker 缓存策略
const CACHE_NAME = 'piano-simulator-v2.1';
const STATIC_CACHE = 'piano-static-v2.1';

// 需要缓存的资源列表
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/piano.css',
  '/js/audio.js',
  '/js/piano.js',
  '/js/loader.js',
  '/js/main.js',
  '/audio/f4-b5/a01.mp3',
  '/audio/f4-b5/a02.mp3',
  '/audio/f4-b5/a03.mp3',
  '/audio/f4-b5/a04.mp3',
  '/audio/f4-b5/a05.mp3',
  '/audio/f4-b5/a06.mp3',
  '/audio/f4-b5/a07.mp3',
  '/audio/f4-b5/a08.mp3',
  '/audio/f4-b5/a09.mp3',
  '/audio/f4-b5/a10.mp3',
  '/audio/f4-b5/a11.mp3',
  '/audio/f4-b5/a12.mp3',
  '/audio/f4-b5/a13.mp3',
  '/audio/f4-b5/a14.mp3',
  '/audio/f4-b5/a15.mp3',
  '/audio/f4-b5/a16.mp3',
  '/audio/f4-b5/a17.mp3',
  '/audio/f4-b5/a18.mp3',
  '/audio/f4-b5/a19.mp3'
];

// 安装阶段 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: 安装中...');
  console.log('要缓存的资源:', STATIC_RESOURCES);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('缓存静态资源');
        return cache.addAll(STATIC_RESOURCES)
          .then(() => {
            console.log('静态资源缓存成功');
          })
          .catch(error => {
            console.error('静态资源缓存失败:', error);
          });
      })
      .then(() => {
        console.log('Service Worker: 安装完成，跳过等待');
        return self.skipWaiting();
      })
  );
});

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 激活中...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // 跳过chrome扩展等不支持缓存的scheme
  if (event.request.url.startsWith('chrome-extension:') ||
    event.request.url.startsWith('safari-extension:')) {
    return;
  }

  // 对于音频文件，使用更精确的缓存匹配策略
  const url = new URL(event.request.url);
  const isAudioFile = url.pathname.includes('/audio/');

  event.respondWith(
    caches.match(event.request, { ignoreSearch: false })
      .then((cachedResponse) => {
        // 如果有缓存，返回缓存
        if (cachedResponse) {
          console.log('SW: 缓存命中', event.request.url);
          return cachedResponse;
        }

        console.log('SW: 缓存未命中，从网络获取', event.request.url);
        
        // 对于音频文件，尝试使用路径匹配
        if (isAudioFile) {
          return caches.open(STATIC_CACHE)
            .then(cache => {
              // 尝试使用路径匹配
              return cache.match(url.pathname)
                .then(pathCachedResponse => {
                  if (pathCachedResponse) {
                    console.log('SW: 路径缓存命中', url.pathname);
                    return pathCachedResponse;
                  }
                  
                  // 如果路径匹配也失败，从网络获取
                  return fetch(event.request)
                    .then((response) => {
                      // 只缓存成功的响应
                      if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                      }

                      // 克隆响应以进行缓存
                      const responseToCache = response.clone();

                      // 存储到缓存中
                      return cache.put(event.request, responseToCache)
                        .then(() => {
                          console.log('SW: 成功缓存音频资源', event.request.url);
                          return response;
                        })
                        .catch(error => {
                          console.warn('SW缓存存储失败:', error);
                          return response; // 即使缓存失败也返回响应
                        });
                    })
                    .catch(() => {
                      // 网络失败时的降级处理
                      return new Response('网络连接失败', { status: 408 });
                    });
                });
            });
        }

        // 非音频文件的处理逻辑
        return fetch(event.request)
          .then((response) => {
            // 只缓存成功的响应
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应以进行缓存
            const responseToCache = response.clone();

            // 打开缓存并存储（添加错误处理）
            caches.open(STATIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache)
                  .then(() => {
                    console.log('SW: 成功缓存资源', event.request.url);
                  })
                  .catch(error => {
                    console.warn('SW缓存存储失败:', error);
                  });
              })
              .catch(error => {
                console.warn('SW缓存打开失败:', error);
              });

            return response;
          })
          .catch(() => {
            // 网络失败时的降级处理
            if (event.request.url.includes('.html')) {
              return caches.match('/index.html');
            }
            return new Response('网络连接失败', { status: 408 });
          });
      })
  );
});