/**
 * 音频资源加载模块
 * 负责音频文件的预加载、缓存和资源管理
 */

/**
 * 音频加载器类
 * @class
 */
class AudioLoader {
  /**
   * 创建AudioLoader实例
   * @constructor
   * @param {AudioContext} audioContext - 音频上下文
   */
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.audioBuffers = new Map(); // 存储已加载的音频缓冲区
    this.audioElements = new Map(); // 存储已加载的HTML音频元素
    this.loadingPromises = new Map(); // 存储加载中的Promise
    this.loadedFiles = new Set(); // 存储已加载的文件路径
    this.isLoading = false; // 是否正在加载
    this.loadProgress = 0; // 加载进度 (0-100)
  }

  /**
   * 预加载所有音频资源
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise} 预加载完成的Promise
   */
  async preloadAll(progressCallback) {
    if (this.isLoading) {
      console.warn('AudioLoader: 已有加载任务在进行中');
      return Promise.resolve();
    }

    this.isLoading = true;
    this.loadProgress = 0;
    console.info('AudioLoader: 开始预加载音频资源');

    try {
      // 获取所有需要加载的音频文件
      const audioFiles = this._getAllAudioFiles();
      const totalFiles = audioFiles.length;
      let loadedCount = 0;

      // 并行加载所有音频文件
      const loadPromises = audioFiles.map(async (file) => {
        try {
          await this.loadAudioFile(file);
          loadedCount++;
          const progress = Math.round((loadedCount / totalFiles) * 100);
          this.loadProgress = progress;
          
          if (progressCallback) {
            progressCallback(progress);
          }
          
          console.log(`AudioLoader: 已加载 ${loadedCount}/${totalFiles} 个文件`);
        } catch (error) {
          console.error(`AudioLoader: 加载文件失败 ${file}`, error);
          // 即使单个文件加载失败，也继续加载其他文件
          loadedCount++;
          const progress = Math.round((loadedCount / totalFiles) * 100);
          this.loadProgress = progress;
          
          if (progressCallback) {
            progressCallback(progress);
          }
        }
      });

      await Promise.all(loadPromises);
      
      console.info('AudioLoader: 音频资源预加载完成');
      this.isLoading = false;
      return Promise.resolve();
    } catch (error) {
      console.error('AudioLoader: 音频预加载失败', error);
      this.isLoading = false;
      return Promise.reject(error);
    }
  }

  /**
   * 加载单个音频文件
   * @param {string} filePath - 音频文件路径
   * @returns {Promise} 加载完成的Promise
   */
  async loadAudioFile(filePath) {
    // 如果文件已经加载过，直接返回
    if (this.loadedFiles.has(filePath)) {
      return Promise.resolve();
    }

    // 如果文件正在加载中，返回现有的Promise
    if (this.loadingPromises.has(filePath)) {
      return this.loadingPromises.get(filePath);
    }

    // 创建新的加载Promise
    const loadPromise = this._fetchAndDecodeAudio(filePath);
    this.loadingPromises.set(filePath, loadPromise);

    try {
      await loadPromise;
      this.loadedFiles.add(filePath);
      this.loadingPromises.delete(filePath);
      return Promise.resolve();
    } catch (error) {
      this.loadingPromises.delete(filePath);
      return Promise.reject(error);
    }
  }

  /**
   * 获取音频缓冲区
   * @param {string} filePath - 音频文件路径
   * @returns {AudioBuffer|null} 音频缓冲区或null
   */
  getAudioBuffer(filePath) {
    return this.audioBuffers.get(filePath) || null;
  }

  /**
   * 获取HTML音频元素
   * @param {string} filePath - 音频文件路径
   * @returns {HTMLAudioElement|null} HTML音频元素或null
   */
  getAudioElement(filePath) {
    return this.audioElements.get(filePath) || null;
  }

  /**
   * 检查文件是否已加载
   * @param {string} filePath - 音频文件路径
   * @returns {boolean} 是否已加载
   */
  isFileLoaded(filePath) {
    return this.loadedFiles.has(filePath);
  }

  /**
   * 获取加载进度
   * @returns {number} 加载进度 (0-100)
   */
  getLoadProgress() {
    return this.loadProgress;
  }

  /**
   * 检查是否正在加载
   * @returns {boolean} 是否正在加载
   */
  getIsLoading() {
    return this.isLoading;
  }

  /**
   * 获取所有需要加载的音频文件
   * @returns {Array<string>} 音频文件路径数组
   * @private
   */
  _getAllAudioFiles() {
    const files = [];
    
    // 从NOTES_MAP中获取所有音频文件
    const notesMap = window.AudioConfig.NOTES_MAP;
    for (const note in notesMap) {
      const mapping = notesMap[note];
      if (mapping && mapping.file && !files.includes(mapping.file)) {
        files.push(mapping.file);
      }
    }
    
    return files;
  }

  /**
   * 获取并解码音频文件
   * @param {string} filePath - 音频文件路径
   * @returns {Promise} 解码完成的Promise
   * @private
   */
  async _fetchAndDecodeAudio(filePath) {
    try {
      let response = null;
      let source = ''; // 记录数据来源：'cache' 或 'network'
      
      // 第一步：先检查Service Worker缓存
      console.log(`AudioLoader: 检查Service Worker缓存 ${filePath}`);
      if ('caches' in window) {
        try {
          const cache = await caches.open('piano-static-v2.1');
          const cachedResponse = await cache.match(filePath);
          
          if (cachedResponse) {
            console.log(`AudioLoader: ✅ 从Service Worker缓存获取音频文件 ${filePath}`);
            response = cachedResponse;
            source = 'cache';
          } else {
            console.log(`AudioLoader: ❌ Service Worker缓存未命中 ${filePath}`);
            
            // 如果缓存未命中，检查缓存中是否有该文件（调试用）
            const keys = await cache.keys();
            console.log(`AudioLoader: 缓存中现有键数量: ${keys.length}`);
            let foundMatch = false;
            keys.forEach(key => {
              if (key.url.includes(filePath)) {
                console.log(`AudioLoader: 找到匹配的缓存键: ${key.url}`);
                foundMatch = true;
              }
            });
            
            if (!foundMatch) {
              console.log(`AudioLoader: 缓存中未找到 ${filePath} 的任何匹配项`);
            }
          }
        } catch (cacheError) {
          console.warn(`AudioLoader: Service Worker缓存访问失败 ${filePath}:`, cacheError);
        }
      }
      
      // 第二步：如果没有缓存，从网络获取（让Service Worker处理缓存）
      if (!response) {
        console.log(`AudioLoader: 从网络获取音频文件 ${filePath}`);
        
        // 使用fetch而不是直接访问缓存，让Service Worker处理缓存逻辑
        response = await fetch(filePath, {
          cache: 'default' // 让浏览器和Service Worker处理缓存
        });
        source = 'network';
        
        // 如果获取成功，手动缓存到Service Worker
        if (response.ok && 'caches' in window) {
          try {
            const cache = await caches.open('piano-static-v2.1');
            await cache.put(filePath, response.clone());
            console.log(`AudioLoader: ✅ 手动缓存音频文件 ${filePath}`);
          } catch (cacheError) {
            console.warn(`AudioLoader: 手动缓存失败 ${filePath}:`, cacheError);
          }
        }
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      // 解码音频数据
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // 存储解码后的音频缓冲区
      this.audioBuffers.set(filePath, audioBuffer);
      
      // 同时创建HTML音频元素作为备用
      const audioElement = new Audio(filePath);
      audioElement.preload = 'auto';
      this.audioElements.set(filePath, audioElement);
      
      console.log(`AudioLoader: 成功加载音频文件 ${filePath} (来源: ${source})`);
      return Promise.resolve();
    } catch (error) {
      console.error(`AudioLoader: 加载音频文件失败 ${filePath}`, error);
      return Promise.reject(error);
    }
  }

  /**
   * 加载音频精灵
   * @param {string} spriteFilePath - 音频精灵文件路径
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise} 加载完成的Promise
   */
  async loadAudioSprite(spriteFilePath, progressCallback) {
    if (this.isLoading) {
      console.warn('AudioLoader: 已有加载任务在进行中');
      return Promise.resolve();
    }

    this.isLoading = true;
    this.loadProgress = 0;
    console.info('AudioLoader: 开始加载音频精灵');

    try {
      if (progressCallback) progressCallback(10);
      
      // 加载音频精灵文件
      await this.loadAudioFile(spriteFilePath);
      
      if (progressCallback) progressCallback(50);
      
      // 模拟处理进度
      for (let i = 60; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 30));
        if (progressCallback) progressCallback(i);
      }
      
      console.info('AudioLoader: 音频精灵加载完成');
      this.isLoading = false;
      return Promise.resolve();
    } catch (error) {
      console.error('AudioLoader: 音频精灵加载失败', error);
      this.isLoading = false;
      return Promise.reject(error);
    }
  }

  /**
   * 清理所有加载的资源
   */
  cleanup() {
    this.audioBuffers.clear();
    this.audioElements.clear();
    this.loadingPromises.clear();
    this.loadedFiles.clear();
    this.isLoading = false;
    this.loadProgress = 0;
    console.info('AudioLoader: 已清理所有音频资源');
  }

  /**
   * 获取音符对应的音频文件路径
   * @param {string} noteName - 音符名称
   * @returns {string|null} 音频文件路径或null
   */
  getFilePathForNote(noteName) {
    const mapping = NOTES_MAP[noteName];
    return mapping ? mapping.file : null;
  }

  /**
   * 获取音符在音频精灵中的时序信息
   * @param {string} noteName - 音符名称
   * @returns {Object|null} 时序信息或null
   */
  getSpriteTimingForNote(noteName) {
    return window.AudioConfig.AUDIO_SPRITE_TIMINGS[noteName] || null;
  }
}

// 将类添加到全局对象，以便其他脚本可以使用
window.AudioLoader = AudioLoader;