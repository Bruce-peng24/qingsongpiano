/**
 * 音频管理器类 - 简化版本
 * 负责音频播放、音量控制和音频资源管理
 * @class
 */
class AudioManager {
  /**
   * 添加音频上下文错误处理
   * 重写AudioContext构造函数以捕获初始化错误
   */
  addAudioContextErrorHandling() {
    // 监听全局的Web Audio错误
    if (window.AudioContext) {
      const OriginalAudioContext = window.AudioContext;

      // 重写AudioContext构造函数以捕获初始化错误
      window.AudioContext = function () {
        try {
          const context = new OriginalAudioContext();

          // 监听上下文状态变化
          context.onstatechange = () => {
            console.log('AudioContext state:', context.state);
            if (context.state === 'suspended') {
              console.warn('AudioContext被挂起，可能需要用户交互');
            }
          };

          // 监听错误事件
          context.onerror = (event) => {
            console.error('AudioContext错误:', event.error);
          };

          return context;
        } catch (error) {
          console.error('AudioContext创建失败:', error);
          throw error;
        }
      };

      window.AudioContext.prototype = OriginalAudioContext.prototype;
    }
  }

  /**
   * 创建AudioManager实例
   * @constructor
   */
  constructor() {
    this.fadeDuration = 0.02; // 20ms淡入淡出，普通人难以察觉
    this.minPlayInterval = 35; // 最小播放间隔50ms

    this.audioContext = null;
    this.isReady = false;
    this.volume = 0.9;
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    this.activeNotes = new Map();
    this.loader = null; // AudioLoader实例
    this.audioCache = new Map(); // 音频缓存，存储已解码的AudioBuffer
    this.audioBuffers = new Map(); // 存储已解码的音频缓冲区

    // 音符定义
    this.notes = [
      { name: '1', type: 'white' }, { name: '2', type: 'black' },
      { name: '3', type: 'white' }, { name: '4', type: 'black' },
      { name: '5', type: 'white' }, { name: '6', type: 'black' },
      { name: '7', type: 'white' }, { name: '8', type: 'white' },
      { name: '9', type: 'black' }, { name: '10', type: 'white' },
      { name: '11', type: 'black' }, { name: '12', type: 'white' },
      { name: '13', type: 'white' }, { name: '14', type: 'black' },
      { name: '15', type: 'white' }, { name: '16', type: 'black' },
      { name: '17', type: 'white' }, { name: '18', type: 'black' },
      { name: '19', type: 'white' }
    ];

    // 音频方案配置
    this.audioSchemes = {
      'popular': {
        name: '流行音域',
        notesMap: {
          '1': { file: '/audio/f4-b5/a01.mp3', start: 0, duration: 1.5 },
          '2': { file: '/audio/f4-b5/a02.mp3', start: 0, duration: 1.5 },
          '3': { file: '/audio/f4-b5/a03.mp3', start: 0, duration: 1.5 },
          '4': { file: '/audio/f4-b5/a04.mp3', start: 0, duration: 1.5 },
          '5': { file: '/audio/f4-b5/a05.mp3', start: 0, duration: 1.5 },
          '6': { file: '/audio/f4-b5/a06.mp3', start: 0, duration: 1.5 },
          '7': { file: '/audio/f4-b5/a07.mp3', start: 0, duration: 1.5 },
          '8': { file: '/audio/f4-b5/a08.mp3', start: 0, duration: 1.5 },
          '9': { file: '/audio/f4-b5/a09.mp3', start: 0, duration: 1.5 },
          '10': { file: '/audio/f4-b5/a10.mp3', start: 0, duration: 1.5 },
          '11': { file: '/audio/f4-b5/a11.mp3', start: 0, duration: 1.5 },
          '12': { file: '/audio/f4-b5/a12.mp3', start: 0, duration: 1.5 },
          '13': { file: '/audio/f4-b5/a13.mp3', start: 0, duration: 1.5 },
          '14': { file: '/audio/f4-b5/a14.mp3', start: 0, duration: 1.5 },
          '15': { file: '/audio/f4-b5/a15.mp3', start: 0, duration: 1.5 },
          '16': { file: '/audio/f4-b5/a16.mp3', start: 0, duration: 1.5 },
          '17': { file: '/audio/f4-b5/a17.mp3', start: 0, duration: 1.5 },
          '18': { file: '/audio/f4-b5/a18.mp3', start: 0, duration: 1.5 },
          '19': { file: '/audio/f4-b5/a19.mp3', start: 0, duration: 1.5 }
        }
      },
      'golden': {
        name: '黄金音域',
        notesMap: {
          '1': { file: '/audio/f4-b5/b01.mp3', start: 0, duration: 1.5 },
          '2': { file: '/audio/f4-b5/b02.mp3', start: 0, duration: 1.5 },
          '3': { file: '/audio/f4-b5/b03.mp3', start: 0, duration: 1.5 },
          '4': { file: '/audio/f4-b5/a01.mp3', start: 0, duration: 1.5 },
          '5': { file: '/audio/f4-b5/a02.mp3', start: 0, duration: 1.5 },
          '6': { file: '/audio/f4-b5/a03.mp3', start: 0, duration: 1.5 },
          '7': { file: '/audio/f4-b5/a04.mp3', start: 0, duration: 1.5 },
          '8': { file: '/audio/f4-b5/a05.mp3', start: 0, duration: 1.5 },
          '9': { file: '/audio/f4-b5/a06.mp3', start: 0, duration: 1.5 },
          '10': { file: '/audio/f4-b5/a07.mp3', start: 0, duration: 1.5 },
          '11': { file: '/audio/f4-b5/a08.mp3', start: 0, duration: 1.5 },
          '12': { file: '/audio/f4-b5/a09.mp3', start: 0, duration: 1.5 },
          '13': { file: '/audio/f4-b5/a10.mp3', start: 0, duration: 1.5 },
          '14': { file: '/audio/f4-b5/a11.mp3', start: 0, duration: 1.5 },
          '15': { file: '/audio/f4-b5/a12.mp3', start: 0, duration: 1.5 },
          '16': { file: '/audio/f4-b5/a13.mp3', start: 0, duration: 1.5 },
          '17': { file: '/audio/f4-b5/a14.mp3', start: 0, duration: 1.5 },
          '18': { file: '/audio/f4-b5/a15.mp3', start: 0, duration: 1.5 },
          '19': { file: '/audio/f4-b5/a16.mp3', start: 0, duration: 1.5 }
        }
      }
    };

    // 当前音频方案
    this.currentScheme = 'popular';
    this.notesMap = this.audioSchemes[this.currentScheme].notesMap;

    console.info('AudioManager: 音频管理器初始化（简化版本）');
    this.init();

    // 添加音频播放控制
    this.activeSources = new Map(); // 存储活跃的音频源
    this.maxConcurrent = 40; // 最大同时播放数
    this.debounceTime = 150; // 防抖时间(毫秒)
    this.lastPlayTimes = {}; // 记录上次播放时间
    this.noteCooldown = new Set(); // 初始化音符冷却集合

    // 添加 cleanupSource 方法
    this.cleanupSource = this.cleanupSource.bind(this);

    // 添加音频节点池（性能优化）
    this.audioNodePool = {
      gainNodes: [],
      getGainNode: function (context) {
        if (this.gainNodes.length > 0) {
          return this.gainNodes.pop();
        }
        return context.createGain();
      },
      returnGainNode: function (node) {
        if (this.gainNodes.length < 10) { // 限制池大小
          node.gain.value = 1.0;
          this.gainNodes.push(node);
        }
      }

    };

  }

  /**
   * 清理音频源
   * 增强清理方法，安全地停止和断开音频源连接
   * @param {string} sourceId - 要清理的音频源ID
   */
  cleanupSource(sourceId) {
    // 检查 activeSources 是否存在
    if (!this.activeSources) {
      console.warn('AudioManager: activeSources 未定义');
      return;
    }

    const sourceInfo = this.activeSources.get(sourceId);
    if (!sourceInfo) return;

    try {
      // 先停止增益节点
      if (sourceInfo.gainNode) {
        try {
          sourceInfo.gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
          sourceInfo.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        } catch (e) {
          // 忽略增益节点错误
        }
        sourceInfo.gainNode.disconnect();
      }

      // 然后停止音频源
      if (sourceInfo.source) {
        try {
          // 检查 source 是否有 stop 方法，防止 HTMLAudioElement 被误当作 Web Audio API 节点处理
          if (typeof sourceInfo.source.stop === 'function') {
            sourceInfo.source.stop(0);
          }
        } catch (e) {
          // 忽略已停止的源
        }
        // 确保 source 有 disconnect 方法再调用
        if (typeof sourceInfo.source.disconnect === 'function') {
          sourceInfo.source.disconnect();
        }
      }
    } catch (error) {
      console.warn('AudioManager: 清理音频源时发生错误', error);
    }

    if (this.activeSources && typeof this.activeSources.delete === 'function') {
      this.activeSources.delete(sourceId);
    }
  }

  /**
   * 批量清理所有音频源
   */
  cleanupAllSources() {
    for (const sourceId of this.activeSources.keys()) {
      this.cleanupSource(sourceId);
    }
  }

  /**
   * 初始化音频管理器
   * 延迟创建音频上下文，直到用户交互后，避免自动播放策略导致的警告
   */
  init() {
    console.info('AudioManager: 延迟创建音频上下文，等待用户交互');
    this.isReady = true;
  }

  /**
   * 确保音频上下文存在且处于运行状态
   * @returns {Promise} 音频上下文准备就绪的Promise
   */
  async ensureContext() {
    // 如果音频上下文不存在，在用户交互后创建
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        console.info('AudioManager: 用户交互后创建音频上下文');
      } else {
        console.warn('AudioManager: 浏览器不支持Web Audio API');
        return Promise.resolve();
      }
    }

    // 确保AudioLoader实例存在，无论音频上下文是否已存在
    if (window.AudioLoader && !this.loader) {
      this.loader = new window.AudioLoader(this.audioContext);
      console.info('AudioManager: AudioLoader实例已创建');
    }

    // 如果上下文被挂起，恢复它
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.info('AudioManager: 音频上下文恢复成功');
    }

    return Promise.resolve();
  }

  /**
   * 播放音符
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @returns {Promise<string|null>} 音频源ID或null的Promise
   */
  async playNote(noteName, velocity = 0.7) {
    if (!this.isReady) {
      console.warn('AudioManager: 音频系统未就绪');
      return null;
    }

    console.group(`🎵 调试音符播放: ${noteName}`);
    console.log('1. 进入 playNote 函数');

    const now = Date.now();

    const lastPlayTime = this.lastPlayTimes[noteName] || 0;

    console.log('2. 时间信息:', {
      当前时间: now,
      上次播放时间: lastPlayTime,
      时间差: lastPlayTime ? now - lastPlayTime : '首次播放',
      防抖阈值: this.debounceTime
    });

    // 如果没有音频上下文，使用降级方案
    if (!this.audioContext) {
      console.log(`AudioManager: 使用降级方案播放音符 ${noteName}`);
      const result = await this.playNoteWithOscillator(noteName, velocity);
      console.groupEnd();
      return result;
    }

    console.log('3. ✅ 通过防抖检查 - 继续播放');

    // 防抖处理：避免快速连续点击同一音符
    if (lastPlayTime !== 0 && now - lastPlayTime < this.debounceTime) {
      console.log(`AudioManager: 音符 ${noteName} 防抖跳过`);
      console.groupEnd();
      return null;
    }

    // 限制同时播放数量
    if (this.activeSources.size >= this.maxConcurrent) {
      this.stopOldestSource();
    }

    // 停止同音符的先前播放（避免重叠）
    this.stopNote(noteName);

    this.lastPlayTimes[noteName] = now;
    console.log('4. 更新最后播放时间:', now);
    console.groupEnd();

    // 直接使用音频文件播放
    const result = await this.playNoteWithOscillator(noteName, velocity);
    return result;
  }

  /**
   * 从音频精灵播放音符（逻辑比较复杂，简化的话，会很容易有噪音）
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @returns {string|null} 音频源ID或null
   */
  playNoteFromSprite(noteName, velocity = 0.7) {
    if (!this.audioBuffer || !this.audioContext) {
      console.warn('AudioManager: 音频精灵未就绪，使用振荡器');
      return null;
    }

    try {
      const timing = this.audioSpriteTimings[noteName];
      if (!timing) {
        console.warn(`AudioManager: 未找到音符 ${noteName} 的映射`);
        return null;
      }

      // 创建音频源节点
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audioBuffer;

      // 创建增益节点用于淡入淡出
      const gainNode = this.audioContext.createGain();

      // 使用增益节点控制音量
      gainNode.gain.value = velocity * this.volume;

      // 连接节点
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // 播放指定时间段的音频
      const startTime = this.audioContext.currentTime;
      const duration = Math.min(timing.duration, 1.2); // 缩短最大持续时间

      // 修复的淡入淡出/渐入渐出实现
      const currentTime = this.audioContext.currentTime;

      // 设置初始音量为0
      gainNode.gain.setValueAtTime(0, currentTime);

      // 淡入（70ms）
      gainNode.gain.linearRampToValueAtTime(velocity * this.volume, currentTime + 0.07);

      // 淡出过程从 currentTime + duration - n 开始，到 currentTime + duration 结束
      // 保持音量直到结束前开始淡出
      gainNode.gain.setValueAtTime(velocity * this.volume, currentTime + duration - 0.8);

      // 淡出（800ms）
      gainNode.gain.linearRampToValueAtTime(0.001, currentTime + duration);

      // 播放音频
      source.start(startTime, timing.start, duration);

      // 生成唯一ID
      const sourceId = `${noteName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 存储音频源用于管理
      this.activeSources.set(sourceId, {
        source: source,
        gainNode: gainNode,
        noteName: noteName,
        startTime: startTime,
        type: 'webAudio' // 标记类型便于清理时区分
      });

      // 添加音符到冷却集合
      if (this.noteCooldown) {
        this.noteCooldown.add(noteName);
      }

      // 清理函数 - 使用闭包保存正确的上下文
      const self = this; // 保存 this 到局部变量
      const cleanup = () => {
        try {
          // 先断开连接再停止
          if (gainNode) {
            gainNode.disconnect();
          }

          // 检查 source 是否还存在且有 stop 方法
          if (source && typeof source.stop === 'function') {
            // 使用精确的停止时间
            source.stop(startTime + duration + 0.1);
          }

          if (source) {
            source.disconnect();
          }

          // 从activeSources中移除
          if (this && this.activeSources && typeof this.activeSources.delete === 'function') {
            this.activeSources.delete(sourceId);
          }
        } catch (e) {
          // 忽略已停止的源
        }
      };

      // 设置结束回调
      source.onended = cleanup;

      // 安全超时清理 - 保存sourceId引用
      const sourceIdRef = sourceId;
      setTimeout(() => {
        try {
          // 先断开连接再停止
          if (gainNode) {
            gainNode.disconnect();
          }

          // 检查 source 是否还存在且有 stop 方法
          if (source && typeof source.stop === 'function') {
            // 使用精确的停止时间
            source.stop(startTime + duration + 0.1);
          }

          if (source) {
            source.disconnect();
          }

          // 从activeSources中移除
          if (this && this.activeSources && typeof this.activeSources.delete === 'function') {
            this.activeSources.delete(sourceIdRef);
          }
        } catch (e) {
          // 忽略已停止的源
        }
      }, duration * 1000 + 500);

      console.log(`AudioManager: 播放音符 ${noteName}, 时长: ${duration}s`);
      return sourceId;

    } catch (error) {
      console.error('AudioManager: 音频精灵播放失败', error);
      return null;
    }
  }

  /**
   * 停止特定音符的播放
   * @param {string} noteName - 要停止的音符名称
   */
  stopNote(noteName) {
    const sourcesToStop = [];

    // 收集所有需要停止音符
    for (const [id, sourceInfo] of this.activeSources.entries()) {
      if (sourceInfo.noteName === noteName) {
        sourcesToStop.push(id);
      }
    }

    // 为每个音频源添加淡出效果后停止
    sourcesToStop.forEach(id => {
      const sourceInfo = this.activeSources.get(id);
      if (sourceInfo && sourceInfo.gainNode) {
        try {
          // 快速淡出而不是立即停止
          const fadeOutTime = this.audioContext.currentTime + 0.02;
          sourceInfo.gainNode.gain.exponentialRampToValueAtTime(0.001, fadeOutTime);
          sourceInfo.gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + 0.03); // 修复变量名

          // 延迟清理
          setTimeout(() => {
            this.cleanupSource(id);
          }, 25);
        } catch (error) {
          this.cleanupSource(id);
        }
      } else {
        this.cleanupSource(id);
      }
    });
  }

  /**
   * 停止所有音频
   */
  stopAll() {
    for (const sourceId of this.activeSources.keys()) {
      this.cleanupSource(sourceId);
    }
    this.activeSources.clear();
  }

  /**
   * 停止最早的音频源
   */
  stopOldestSource() {
    if (this.activeSources.size === 0) return;

    let oldestId = null;
    let oldestTime = Infinity;

    for (const [id, sourceInfo] of this.activeSources.entries()) {
      if (sourceInfo.startTime < oldestTime) {
        oldestTime = sourceInfo.startTime;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.cleanupSource(oldestId);
    }
  }

  /**
   * 使用音频文件播放音符
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @returns {string|null} 音频源ID或null
   */
  async playNoteWithOscillator(noteName, velocity = 0.7) {
    console.group(`🎵 AudioManager: 开始播放音符 ${noteName}`);
    console.log('1. 检查音频上下文状态');

    // 确保音频上下文存在
    if (!this.audioContext) {
      console.log('2. 音频上下文不存在，尝试创建');
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        console.info('AudioManager: 在播放时创建音频上下文');
      } else {
        console.warn('AudioManager: 浏览器不支持Web Audio API');
        console.groupEnd();
        return null;
      }
    } else {
      console.log('2. 音频上下文已存在，状态:', this.audioContext.state);
    }

    try {
      console.log('3. 查找音符映射');
      console.log(`3.1 当前音频方案: ${this.currentScheme}`);
      console.log(`3.2 notesMap键列表: ${Object.keys(this.notesMap).join(', ')}`);
      
      // 使用 notesMap 精确映射音符到音频文件
      const noteMapping = this.notesMap[noteName];
      if (!noteMapping) {
        console.warn(`AudioManager: 未找到音符 ${noteName} 的音频映射`);
        console.warn(`AudioManager: 可用的音符: ${Object.keys(this.notesMap).join(', ')}`);
        console.groupEnd();
        return null;
      }

      const audioFile = noteMapping.file;
      console.log(`4. 音符 ${noteName} 对应音频文件: ${audioFile}`);

      // 检查缓存中是否已有该音频的AudioBuffer
      console.log('5. 检查音频缓存');
      console.log(`6. 当前缓存大小: ${this.audioBuffers.size}`);
      console.log(`7. 缓存键列表:`, Array.from(this.audioBuffers.keys()));

      let audioBuffer = this.audioBuffers.get(audioFile);

      if (!audioBuffer) {
        console.log(`8. 缓存未命中，开始下载音频文件: ${audioFile}`);
        
        // 先检查Service Worker缓存
        if ('caches' in window) {
          try {
            console.log(`8.1 检查Service Worker缓存: ${audioFile}`);
            const cache = await caches.open('piano-static-v2.1');
            
            // 检查缓存中所有键，用于调试
            const cacheKeys = await cache.keys();
            console.log('8.2 缓存中所有键:', cacheKeys.map(key => key.url));
            
            const cachedResponse = await cache.match(audioFile);
            
            if (cachedResponse) {
              console.log('8.3 ✅ 从Service Worker缓存获取音频文件');
              const arrayBuffer = await cachedResponse.arrayBuffer();
              audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
              
              if (audioBuffer) {
                this.audioBuffers.set(audioFile, audioBuffer);
                console.log(`8.4 音频文件已缓存，缓存大小: ${this.audioBuffers.size}`);
                console.log(`8.5 音频缓冲区信息: 时长 ${audioBuffer.duration.toFixed(2)}s, 采样率 ${audioBuffer.sampleRate}Hz`);
              }
            } else {
              console.log('8.6 ❌ Service Worker缓存未命中');
              console.log(`8.7 请求路径: ${audioFile}`);
              console.log('8.8 缓存中匹配的路径:', cacheKeys.filter(key => key.url.includes('audio')).map(key => key.url));
            }
          } catch (cacheError) {
            console.warn('8.9 Service Worker缓存访问失败，继续网络获取:', cacheError);
          }
        }
        
        // 如果Service Worker缓存也没有，从网络获取
        if (!audioBuffer) {
          console.log('8.5 从网络获取音频文件');
          audioBuffer = await this._loadAudioBuffer(audioFile);
          if (audioBuffer) {
            this.audioBuffers.set(audioFile, audioBuffer);
            console.log(`9. 音频文件已缓存，缓存大小: ${this.audioBuffers.size}`);
            console.log(`10. 音频缓冲区信息: 时长 ${audioBuffer.duration.toFixed(2)}s, 采样率 ${audioBuffer.sampleRate}Hz`);
          } else {
            console.error(`11. 音频文件加载失败 ${audioFile}`);
            console.groupEnd();
            return null;
          }
        }
      } else {
        console.log(`8. 缓存命中，使用缓存的音频缓冲区: ${audioFile}`);
        console.log(`9. 音频缓冲区信息: 时长 ${audioBuffer.duration.toFixed(2)}s, 采样率 ${audioBuffer.sampleRate}Hz`);
      }

      console.log('11. 开始播放音频');
      // 使用缓存的AudioBuffer播放音频
      const sourceId = this._playAudioBuffer(audioBuffer, noteName, velocity);
      console.log(`12. 播放完成，源ID: ${sourceId}`);
      console.groupEnd();
      return sourceId;

    } catch (error) {
      console.error('13. AudioManager: 播放失败', error);
      console.groupEnd();
      return null;
    }
  }

  /**
   * 加载音频文件并解码为AudioBuffer
   * @param {string} audioFile - 音频文件路径
   * @returns {Promise<AudioBuffer>} 解码后的音频缓冲区
   */
  async _loadAudioBuffer(audioFile) {
    console.group(`📥 AudioManager: 开始加载音频文件 ${audioFile}`);
    
    try {
      // 第一步：先检查Service Worker缓存
      console.log('1. 检查Service Worker缓存');
      let response = null;
      
      if ('caches' in window) {
        try {
          const cache = await caches.open('piano-static-v2.1');
          const cachedResponse = await cache.match(audioFile);
          
          if (cachedResponse) {
            console.log('2. ✅ 从Service Worker缓存获取音频文件');
            response = cachedResponse;
          } else {
            console.log('2. ❌ Service Worker缓存未命中，从网络获取');
          }
        } catch (cacheError) {
          console.warn('3. Service Worker缓存访问失败，从网络获取:', cacheError);
        }
      }
      
      // 第二步：如果没有缓存，从网络获取
      if (!response) {
        console.log('4. 开始网络fetch请求');
        response = await fetch(audioFile);
        console.log(`5. fetch响应状态: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('6. 开始读取ArrayBuffer');
      const arrayBuffer = await response.arrayBuffer();
      console.log(`7. ArrayBuffer大小: ${arrayBuffer.byteLength} bytes`);
      
      console.log('8. 开始解码音频数据');
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log(`9. 音频解码成功: 时长 ${audioBuffer.duration.toFixed(2)}s, 采样率 ${audioBuffer.sampleRate}Hz`);
      
      console.groupEnd();
      return audioBuffer;
    } catch (error) {
      console.error(`10. AudioManager: 加载音频文件失败 ${audioFile}`, error);
      console.groupEnd();
      return null;
    }
  }

  /**
   * 使用AudioBuffer播放音频
   * @param {AudioBuffer} audioBuffer - 音频缓冲区
   * @param {string} noteName - 音符名称
   * @param {number} velocity - 音符力度
   * @returns {string} 音频源ID
   */
  _playAudioBuffer(audioBuffer, noteName, velocity) {
    console.group(`▶️ AudioManager: 开始播放音频缓冲区`);
    console.log('1. 创建音频源节点');

    // 创建音频源节点
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;

    console.log('2. 创建增益节点');
    // 创建增益节点控制音量
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = velocity * this.volume;

    console.log('3. 连接音频节点');
    // 连接节点
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    console.log('4. 添加视觉反馈');
    // 播放前添加视觉反馈
    const pianoKey = document.querySelector(`.piano-key[data-note="${noteName}"]`);
    if (pianoKey) {
      pianoKey.classList.add('active');
      console.log('5. 钢琴键视觉反馈已添加');
    } else {
      console.warn('5. 未找到对应的钢琴键元素');
    }

    console.log('6. 开始播放音频');
    // 开始播放
    source.start(0);

    const sourceId = `${noteName}_${Date.now()}`;
    console.log(`7. 创建音频源ID: ${sourceId}`);

    this.activeSources.set(sourceId, {
      source: source,
      gainNode: gainNode,
      noteName: noteName,
      startTime: Date.now(),
      type: 'webAudio'
    });

    console.log(`8. 当前活跃音频源数量: ${this.activeSources.size}`);

    // 添加音符到冷却集合
    if (this.noteCooldown) {
      this.noteCooldown.add(noteName);
      console.log(`9. 音符 ${noteName} 已添加到冷却集合`);
    }

    console.log('10. 设置清理函数');
    // 清理函数
    const cleanup = () => {
      console.log(`11. 清理音频源 ${sourceId}`);
      try {
        if (source) {
          source.stop(0);
          source.disconnect();
          console.log('12. 音频源已停止并断开连接');
        }
        if (gainNode) {
          gainNode.disconnect();
          console.log('13. 增益节点已断开连接');
        }
        if (this && this.activeSources && typeof this.activeSources.delete === 'function') {
          this.activeSources.delete(sourceId);
          console.log(`14. 音频源已从活跃集合中移除，剩余数量: ${this.activeSources.size}`);
        }
        // 播放结束后移除视觉反馈
        if (pianoKey) {
          pianoKey.classList.remove('active');
          console.log('15. 钢琴键视觉反馈已移除');
        }
      } catch (e) {
        console.error('16. 清理过程中发生错误:', e);
      }
    };

    source.onended = cleanup;
    console.log('17. 设置音频结束回调');

    // 设置超时清理（音频时长 + 缓冲时间）
    const cleanupTimeout = audioBuffer.duration * 1000 + 1000;
    setTimeout(cleanup, cleanupTimeout);
    console.log(`18. 设置超时清理: ${cleanupTimeout}ms后执行`);

    console.log(`19. 播放完成，返回源ID: ${sourceId}`);
    console.groupEnd();
    return sourceId;
  }

  /**
   * 获取音符对应的频率
   * @param {string} noteName - 音符名称
   * @returns {number} 音符频率
   */
  getFrequencyForNote(noteName) {
    // 简化的音符频率映射
    const baseFreq = 261.63; // C4
    const noteIndex = parseInt(noteName) - 1;
    return baseFreq * Math.pow(2, noteIndex / 12);
  }


  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    console.info(`AudioManager: 音量设置为 ${this.volume}`);
  }

  /**
   * 预加载所有音频资源
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise} 预加载完成的Promise
   */
  async preloadAll(progressCallback) {
    console.info('AudioManager: 开始预加载所有音频文件');
    console.group('AudioManager: 预加载调试信息');

    try {
      // 初始化全局音频加载状态
      if (!window.audioLoadingState) {
        console.log('AudioManager: 创建全局音频加载状态');
        window.audioLoadingState = {
          isLoading: false,
          progress: 0,
          error: null,
          hasStarted: false,
          totalFiles: Object.keys(this.notesMap).length,
          loadedFiles: 0
        };
      } else {
        // 更新总文件数以反映当前音频方案
        window.audioLoadingState.totalFiles = Object.keys(this.notesMap).length;
      }

      // 设置全局加载状态 - 立即标记为已开始
      console.log('AudioManager: 设置全局加载状态为正在加载');
      window.audioLoadingState.isLoading = true;
      window.audioLoadingState.progress = 0;
      window.audioLoadingState.error = null;
      window.audioLoadingState.hasStarted = true;
      window.audioLoadingState.loadedFiles = 0;

      // 第一步：确保有用户交互后再初始化音频上下文
      if (!this.audioContext) {
        console.info('AudioManager: 延迟创建音频上下文直到用户交互');
        console.log('AudioManager: 音频上下文不存在，将模拟加载进度');

        // 直接完成预加载，不尝试创建音频上下文
        if (progressCallback) {
          for (let i = 10; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 20));
            window.audioLoadingState.progress = i;
            console.log(`AudioManager: 模拟加载进度 ${i}%`);
            progressCallback(i);
          }
        }

        // 加载完成
        console.log('AudioManager: 模拟加载完成，设置全局状态为完成');
        window.audioLoadingState.isLoading = false;
        window.audioLoadingState.progress = 100;
        console.groupEnd();
        return Promise.resolve();
      }

      // 第二步：恢复音频上下文（如果被挂起）
      if (this.audioContext.state === 'suspended') {
        console.info('AudioManager: 尝试恢复挂起的音频上下文');
        try {
          await this.audioContext.resume();
          console.info('AudioManager: 音频上下文恢复成功');
        } catch (error) {
          console.warn('AudioManager: 音频上下文恢复失败', error);
          if (progressCallback) progressCallback(100);

          // 加载完成
          window.audioLoadingState.isLoading = false;
          window.audioLoadingState.progress = 100;
          return Promise.resolve(); // 不阻止应用继续
        }
      }

      console.log('AudioManager: 设置加载进度为10%');
      if (progressCallback) progressCallback(10);
      window.audioLoadingState.progress = 10;

      // 第三步：实际预加载所有音频文件到缓存
      console.log('AudioManager: 开始预加载音频文件到缓存');
      const audioFiles = Object.values(this.notesMap).map(note => note.file);
      const uniqueFiles = [...new Set(audioFiles)]; // 去重

      console.log(`AudioManager: 需要预加载 ${uniqueFiles.length} 个音频文件`);

      for (let i = 0; i < uniqueFiles.length; i++) {
        const audioFile = uniqueFiles[i];
        try {
          console.log(`AudioManager: 预加载音频文件 ${i + 1}/${uniqueFiles.length}: ${audioFile}`);

          // 检查是否已经缓存
          if (!this.audioBuffers.has(audioFile)) {
            const audioBuffer = await this._loadAudioBuffer(audioFile);
            if (audioBuffer) {
              this.audioBuffers.set(audioFile, audioBuffer);
              console.log(`AudioManager: 音频文件已缓存: ${audioFile}`);
            }
          } else {
            console.log(`AudioManager: 音频文件已存在缓存中: ${audioFile}`);
          }

          // 更新进度
          const progress = Math.round(10 + (i / uniqueFiles.length) * 80);
          window.audioLoadingState.progress = progress;
          window.audioLoadingState.loadedFiles = i + 1;

          if (progressCallback) progressCallback(progress);

          // 短暂延迟以避免过快的请求
          await new Promise(resolve => setTimeout(resolve, 50));

        } catch (error) {
          console.warn(`AudioManager: 预加载音频文件失败 ${audioFile}`, error);
          // 继续加载其他文件，不中断整个预加载过程
        }
      }

      // 加载完成
      console.log('AudioManager: 音频预加载完成');
      console.log(`AudioManager: 缓存大小: ${this.audioBuffers.size} 个音频缓冲区`);

      window.audioLoadingState.isLoading = false;
      window.audioLoadingState.progress = 100;

      if (progressCallback) progressCallback(100);

      console.info('AudioManager: 音频预加载完成');
      console.groupEnd();
      return Promise.resolve();

    } catch (error) {
      console.error('AudioManager: 音频预加载失败', error);

      // 加载失败
      console.log('AudioManager: 加载失败，设置全局状态为错误');
      window.audioLoadingState.isLoading = false;
      window.audioLoadingState.error = error;

      // 即使失败也继续，使用振荡器降级方案
      if (progressCallback) progressCallback(100);
      console.groupEnd();
      return Promise.resolve();
    }
  }

  /**
   * 切换音频方案
   * @param {string} schemeId - 音频方案ID ('popular' 或 'golden')
   * @returns {Promise<boolean>} 切换是否成功的Promise
   */
  async switchAudioScheme(schemeId) {
    console.group(`🎵 AudioManager: 开始切换音频方案到 ${schemeId}`);
    console.log('1. 检查音频方案是否存在');
    
    if (!this.audioSchemes[schemeId]) {
      console.error(`AudioManager: 未知的音频方案: ${schemeId}`);
      console.error(`AudioManager: 可用的音频方案: ${Object.keys(this.audioSchemes).join(', ')}`);
      console.groupEnd();
      return false;
    }

    console.log(`2. 正在切换到音频方案: ${this.audioSchemes[schemeId].name}`);
    console.log(`3. 当前音频方案: ${this.currentScheme}`);
    console.log(`4. 当前notesMap大小: ${Object.keys(this.notesMap).length}`);
    console.log(`5. 音频缓冲区缓存大小: ${this.audioBuffers.size}`);
    
    // 清空音频缓冲区缓存，确保使用新的音频文件
    console.log('6. 清空音频缓冲区缓存');
    this.audioBuffers.clear();
    console.log('7. 音频缓冲区缓存已清空，新大小:', this.audioBuffers.size);
    
    // 切换音频方案
    console.log('8. 更新音频方案配置');
    this.currentScheme = schemeId;
    this.notesMap = this.audioSchemes[schemeId].notesMap;

    console.log(`9. 切换完成，当前音频方案: ${this.currentScheme}`);
    console.log(`10. 新notesMap大小: ${Object.keys(this.notesMap).length}`);
    console.log('11. 新notesMap内容:', this.notesMap);
    
    console.info(`AudioManager: 已切换到音频方案: ${this.audioSchemes[schemeId].name}`);
    console.groupEnd();
    return true;
  }

  /**
   * 获取当前音频方案信息
   * @returns {Object} 当前音频方案信息
   */
  getCurrentSchemeInfo() {
    return {
      id: this.currentScheme,
      name: this.audioSchemes[this.currentScheme].name
    };
  }

  /**
   * 清理音符资源
   * @param {string} noteId - 要清理的音符ID
   */
  cleanup(noteId) {
    // 添加多重安全检查
    if (!this.activeNotes) {
      console.warn('AudioManager: activeNotes未初始化');
      return;
    }

    if (typeof this.activeNotes.delete === 'function') {
      this.activeNotes.delete(noteId);
    }
  }
}

// 全局实例管理
try {
  if (!window.audioManager) {
    window.audioManager = new AudioManager();
    console.info('AudioManager: 全局实例创建成功（简化版本）');
  } else {
    console.info('AudioManager: 使用已存在的全局实例');
  }
} catch (error) {
  console.error('AudioManager: 全局实例创建失败', error);
  // 创建降级版本
  window.audioManager = {
    isReady: true,
    volume: 0.9,
    playNote: (note) => console.log('播放音符:', note),
    setVolume: (vol) => console.log('设置音量:', vol),
    preloadAll: () => Promise.resolve(),
    ensureContext: () => Promise.resolve(),
    notes: [
      { name: '1', type: 'white' }, { name: '2', type: 'black' },
      { name: '3', type: 'white' }, { name: '4', type: 'black' },
      { name: '5', type: 'white' }, { name: '6', type: 'black' },
      { name: '7', type: 'white' }, { name: '8', type: 'white' },
      { name: '9', type: 'black' }, { name: '10', type: 'white' },
      { name: '11', type: 'black' }, { name: '12', type: 'white' },
      { name: '13', type: 'white' }, { name: '14', type: 'black' },
      { name: '15', type: 'white' }, { name: '16', type: 'black' },
      { name: '17', type: 'white' }, { name: '18', type: 'black' },
      { name: '19', type: 'white' }
    ],
    NotesMap: {
      '1': { file: '/audio/f4-b5/a01.mp3', start: 0, duration: 1.5 },
      '2': { file: '/audio/f4-b5/a02.mp3', start: 0, duration: 1.5 },
      '3': { file: '/audio/f4-b5/a03.mp3', start: 0, duration: 1.5 },
      '4': { file: '/audio/f4-b5/a04.mp3', start: 0, duration: 1.5 },
      '5': { file: '/audio/f4-b5/a05.mp3', start: 0, duration: 1.5 },
      '6': { file: '/audio/f4-b5/a06.mp3', start: 0, duration: 1.5 },
      '7': { file: '/audio/f4-b5/a07.mp3', start: 0, duration: 1.5 },
      '8': { file: '/audio/f4-b5/a08.mp3', start: 0, duration: 1.5 },
      '9': { file: '/audio/f4-b5/a09.mp3', start: 0, duration: 1.5 },
      '10': { file: '/audio/f4-b5/a10.mp3', start: 0, duration: 1.5 },
      '11': { file: '/audio/f4-b5/a11.mp3', start: 0, duration: 1.5 },
      '12': { file: '/audio/f4-b5/a12.mp3', start: 0, duration: 1.5 },
      '13': { file: '/audio/f4-b5/a13.mp3', start: 0, duration: 1.5 },
      '14': { file: '/audio/f4-b5/a14.mp3', start: 0, duration: 1.5 },
      '15': { file: '/audio/f4-b5/a15.mp3', start: 0, duration: 1.5 },
      '16': { file: '/audio/f4-b5/a16.mp3', start: 0, duration: 1.5 },
      '17': { file: '/audio/f4-b5/a17.mp3', start: 0, duration: 1.5 },
      '18': { file: '/audio/f4-b5/a18.mp3', start: 0, duration: 1.5 },
      '19': { file: '/audio/f4-b5/a19.mp3', start: 0, duration: 1.5 }
    }
  };
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager;
}