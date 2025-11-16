/**
 * 核心音频管理器类
 * 负责音频播放、音量控制和音频资源管理
 * 整合音频上下文管理和音频播放功能
 */

/**
 * 核心音频管理器类
 * @class
 */
class AudioManager {
  /**
   * 创建AudioManager实例
   * @constructor
   */
  constructor() {
    this.isReady = false;
    this.volume = window.AudioConfig.AUDIO_CONFIG.defaultVolume;
    this.notes = window.AudioConfig.NOTES;
    this.notesMap = window.AudioConfig.NOTES_MAP;
    this.currentTimbre = 'audio'; // 默认音色：音频文件

    // 初始化音频上下文管理器
    this.contextManager = new window.AudioContextManager();

    // 初始化音频播放器（将在音频上下文就绪后创建）
    this.player = null;

    // 初始化音频播放控制器（将在音频播放器就绪后创建）
    this.playbackController = null;

    // 初始化音频加载器（将在音频上下文就绪后创建）
    this.loader = null;

    console.info('AudioManager: 音频管理器初始化（简化版本）');
    this.init();
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
    await this.contextManager.ensureContext();

    // 如果播放器尚未创建，现在创建它
    if (!this.player && this.contextManager.isReady()) {
      this.player = new window.AudioPlayer(this.contextManager.getContext());

      // 创建音频播放控制器
      this.playbackController = new window.AudioPlaybackController(this.player);

      // 创建音频加载器
      this.loader = new window.AudioLoader(this.contextManager.getContext());
    }

    return Promise.resolve();
  }

  /**
   * 播放音符
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @returns {string|null} 音频源ID或null
   */
  playNote(noteName, velocity = 0.7) {
    console.group(`AudioManager: 播放音符 ${noteName}`);
    console.info(`当前音色: ${this.currentTimbre}`);
    console.info(`系统就绪: ${this.isReady}`);
    
    if (!this.isReady) {
      console.warn('音频系统未就绪');
      console.groupEnd();
      return null;
    }

    let result = null;
    
    // 根据当前音色选择播放方式
    if (this.currentTimbre === 'oscillator') {
      console.info('使用振荡器模式');
      result = this.playNoteWithOscillator(noteName, velocity);
    } else {
      // 如果没有音频上下文，使用降级方案
      if (!this.contextManager.getContext()) {
        console.info('音频上下文不可用，使用降级方案');
        result = this.playNoteWithOscillator(noteName, velocity);
      } else {
        // 如果播放控制器已创建，使用它来处理播放逻辑
        if (this.playbackController) {
          console.info('使用播放控制器');
          result = this.playbackController.playNote(noteName, velocity, 'audioFile');
        } else if (this.player) {
          // 降级处理：直接使用播放器
          console.info('使用音频播放器');
          result = this.player.playNoteWithAudioFile(noteName, velocity);
        } else {
          console.warn('没有可用的播放器');
        }
      }
    }
    
    console.info(`播放结果: ${result ? '成功' : '失败'}`);
    console.groupEnd();
    
    return result;
  }

  /**
   * 从音频精灵播放音符
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @returns {string|null} 音频源ID或null
   */
  playNoteFromSprite(noteName, velocity = 0.7) {
    if (!this.player) {
      console.warn('AudioManager: 播放器未初始化');
      return null;
    }

    return this.player.playNoteFromSprite(noteName, velocity);
  }

  /**
   * 使用振荡器播放音符
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @returns {string|null} 音频源ID或null
   */
  playNoteWithOscillator(noteName, velocity = 0.7) {
    console.info(`AudioManager: 使用振荡器播放音符 ${noteName}`);
    
    // 如果没有音频上下文，使用降级方案
    if (!this.contextManager.getContext()) {
      console.warn('AudioManager: 音频上下文不可用，无法使用振荡器');
      return null;
    }

    try {
      // 使用新的振荡器模块
      const audioContext = this.contextManager.getContext();
      
      // 获取或创建振荡器实例
      let oscillator = window.OscillatorManager.getOscillator('audio-core');
      if (!oscillator) {
        oscillator = window.OscillatorManager.createOscillator(audioContext, 'audio-core');
      }
      
      // 设置音量
      oscillator.setVolume(this.volume);
      
      // 播放音符
      return oscillator.playNote(noteName, velocity);
      
    } catch (error) {
      console.error('AudioManager: 振荡器播放失败', error);
      return null;
    }
  }

  /**
   * 预初始化振荡器实例
   * 确保在切换到电音模式时振荡器实例已经创建
   */
  preinitializeOscillator() {
    console.info('AudioManager: 预初始化振荡器实例');
    
    if (!this.contextManager.getContext()) {
      console.warn('AudioManager: 音频上下文不可用，无法预初始化振荡器');
      return;
    }

    try {
      const audioContext = this.contextManager.getContext();
      
      // 获取或创建振荡器实例
      let oscillator = window.OscillatorManager.getOscillator('audio-core');
      if (!oscillator) {
        oscillator = window.OscillatorManager.createOscillator(audioContext, 'audio-core');
        console.info('AudioManager: 振荡器实例创建成功');
      } else {
        console.info('AudioManager: 振荡器实例已存在');
      }
      
      // 设置音量
      oscillator.setVolume(this.volume);
      
    } catch (error) {
      console.error('AudioManager: 预初始化振荡器失败', error);
    }
  }

  /**
   * 停止特定音符的播放
   * @param {string} noteName - 要停止的音符名称
   */
  stopNote(noteName) {
    // 如果播放控制器已创建，使用它来处理停止逻辑
    if (this.playbackController) {
      return this.playbackController.stopNote(noteName);
    }

    // 降级处理：直接使用播放器
    if (this.player) {
      return this.player.stopNote(noteName);
    }
  }

  /**
   * 停止所有音频
   */
  stopAll() {
    // 如果播放控制器已创建，使用它来处理停止逻辑
    if (this.playbackController) {
      return this.playbackController.stopAll();
    }

    // 降级处理：直接使用播放器
    if (this.player) {
      return this.player.stopAll();
    }
  }

  /**
   * 停止最早的音频源
   */
  stopOldestSource() {
    if (!this.player) return;
    this.player.stopOldestSource();
  }

  /**
   * 设置音量
   * @param {number} vol - 音量值 (0-1)
   */
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));

    // 如果播放控制器已创建，使用它来处理音量设置
    if (this.playbackController) {
      this.playbackController.setVolume(this.volume);
    }
    // 降级处理：直接使用播放器
    else if (this.player) {
      this.player.setVolume(this.volume);
    }

    console.info(`AudioManager: 音量设置为 ${this.volume}`);
  }

  /**
   * 获取音符对应的频率
   * @param {string} noteName - 音符名称
   * @returns {number} 音符频率
   */
  getFrequencyForNote(noteName) {
    if (!this.player) {
      // 简化的音符频率映射
      const baseFreq = 261.63; // C4
      const noteIndex = parseInt(noteName) - 1;
      return baseFreq * Math.pow(2, noteIndex / 12);
    }
    return this.player.getFrequencyForNote(noteName);
  }

  /**
   * 预加载所有音频资源
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise} 预加载完成的Promise
   */
  async preloadAll(progressCallback) {
    console.info('AudioManager: 开始预加载音频资源');

    try {
      // 第一步：确保有用户交互后再初始化音频上下文
      if (!this.contextManager.getContext()) {
        console.info('AudioManager: 延迟创建音频上下文直到用户交互');
        // 直接完成预加载，不尝试创建音频上下文
        if (progressCallback) {
          for (let i = 10; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 20));
            progressCallback(i);
          }
        }
        return Promise.resolve();
      }

      // 第二步：恢复音频上下文（如果被挂起）
      if (this.contextManager.getContext().state === 'suspended') {
        console.info('AudioManager: 尝试恢复挂起的音频上下文');
        try {
          await this.contextManager.getContext().resume();
          console.info('AudioManager: 音频上下文恢复成功');
        } catch (error) {
          console.warn('AudioManager: 音频上下文恢复失败', error);
          if (progressCallback) progressCallback(100);
          return Promise.resolve(); // 不阻止应用继续
        }
      }

      if (progressCallback) progressCallback(10);

      // 第三步：使用AudioLoader加载所有音频资源
      if (this.loader) {
        await this.loader.preloadAll((progress) => {
          // 将加载进度映射到10-90的范围
          const mappedProgress = 10 + Math.round(progress * 0.8);
          if (progressCallback) progressCallback(mappedProgress);
        });
      } else {
        // 降级处理：模拟加载进度
        for (let i = 20; i <= 90; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 30));
          if (progressCallback) progressCallback(i);
        }
      }

      // 完成加载
      if (progressCallback) progressCallback(100);
      console.info('AudioManager: 音频资源预加载完成');
      return Promise.resolve();

    } catch (error) {
      console.error('AudioManager: 音频预加载失败', error);
      // 即使失败也继续，使用振荡器降级方案
      if (progressCallback) progressCallback(100);
      return Promise.resolve();
    }
  }

  /**
   * 加载音频精灵
   * @param {string} spriteFilePath - 音频精灵文件路径
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise} 加载完成的Promise
   */
  async loadAudioSprite(spriteFilePath, progressCallback) {
    if (!this.loader) {
      console.warn('AudioManager: 音频加载器未初始化');
      return Promise.resolve();
    }

    return this.loader.loadAudioSprite(spriteFilePath, progressCallback);
  }

  /**
   * 清理音符资源
   * @param {string} noteId - 要清理的音符ID
   */
  cleanup(noteId) {
    if (!this.player) return;

    // 添加多重安全检查
    if (!this.player.activeNotes) {
      console.warn('AudioManager: activeNotes未初始化');
      return;
    }

    if (typeof this.player.activeNotes.delete === 'function') {
      this.player.activeNotes.delete(noteId);
    }
  }

  /**
   * 清理音频源
   * @param {string} sourceId - 要清理的音频源ID
   */
  cleanupSource(sourceId) {
    if (!this.player) return;
    this.player.cleanupSource(sourceId);
  }

  /**
   * 批量清理所有音频源
   */
  cleanupAllSources() {
    if (!this.player) return;
    this.player.cleanupAllSources();
  }

  /**
   * 切换音色
   * @param {string} timbre - 音色类型 ('audio', 'golden' 或 'oscillator')
   */
  setTimbre(timbre) {
    console.group(`🎵 AudioManager: 开始切换音色到 ${timbre}`);
    console.log('1. 检查音色类型是否支持');
    
    if (timbre === 'audio' || timbre === 'golden' || timbre === 'oscillator') {
      console.log(`2. 音色类型 ${timbre} 支持，开始切换`);
      this.currentTimbre = timbre;
      console.info(`AudioManager: 音色切换为 ${timbre}`);
      
      // 如果是电音模式，预初始化振荡器实例
      if (timbre === 'oscillator') {
        console.log('3. 电音模式，预初始化振荡器');
        this.preinitializeOscillator();
      } else if (timbre === 'golden') {
        console.log('3. 黄金音域模式，处理音频方案切换');
        // 如果是黄金音域模式，确保音频方案也切换
        if (this.switchAudioScheme && timbre === 'golden') {
          console.log('4. 调用音频方案切换');
          this.switchAudioScheme('golden').then(() => {
            console.info('AudioManager: 音频方案切换完成');
          }).catch(error => {
            console.error('AudioManager: 音频方案切换失败', error);
          });
        }
      } else if (timbre === 'audio') {
        console.log('3. 流行音域模式，处理音频方案切换');
        // 如果是流行音域模式，确保音频方案也切换
        if (this.switchAudioScheme) {
          console.log('4. 调用音频方案切换');
          this.switchAudioScheme('popular').then(() => {
            console.info('AudioManager: 音频方案切换完成');
          }).catch(error => {
            console.error('AudioManager: 音频方案切换失败', error);
          });
        }
      }
      
      // 触发音色切换事件
      console.log('5. 触发音色切换事件');
      window.dispatchEvent(new CustomEvent('timbreChanged', {
        detail: { timbre: timbre }
      }));
      
      console.info(`AudioManager: 音色切换完成`);
      console.groupEnd();
    } else {
      console.error(`AudioManager: 不支持的音色类型 ${timbre}`);
      console.error(`AudioManager: 支持的音色类型: audio, golden, oscillator`);
      console.groupEnd();
    }
  }

  /**
   * 获取当前音色
   * @returns {string} 当前音色类型
   */
  getCurrentTimbre() {
    return this.currentTimbre;
  }

  /**
   * 切换音频方案
   * @param {string} schemeId - 音频方案ID ('popular' 或 'golden')
   * @returns {Promise<boolean>} 切换是否成功的Promise
   */
  async switchAudioScheme(schemeId) {
    console.group(`🎵 AudioManager: 开始切换音频方案到 ${schemeId}`);
    console.log('1. 检查音频方案是否存在');
    
    // 定义音频方案配置
    const audioSchemes = {
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
    
    if (!audioSchemes[schemeId]) {
      console.error(`AudioManager: 未知的音频方案: ${schemeId}`);
      console.error(`AudioManager: 可用的音频方案: ${Object.keys(audioSchemes).join(', ')}`);
      console.groupEnd();
      return false;
    }

    console.log(`2. 正在切换到音频方案: ${audioSchemes[schemeId].name}`);
    console.log(`3. 当前音频方案: ${this.currentScheme || '未设置'}`);
    
    // 清空音频缓冲区缓存，确保使用新的音频文件
    console.log('4. 清空音频缓冲区缓存');
    if (this.loader && this.loader.audioBuffers) {
      this.loader.audioBuffers.clear();
      console.log('5. 音频缓冲区缓存已清空');
    }
    
    // 切换音频方案
    console.log('6. 更新音频方案配置');
    this.currentScheme = schemeId;
    this.notesMap = audioSchemes[schemeId].notesMap;

    console.log(`7. 切换完成，当前音频方案: ${this.currentScheme}`);
    console.log(`8. 新notesMap大小: ${Object.keys(this.notesMap).length}`);
    
    console.info(`AudioManager: 已切换到音频方案: ${audioSchemes[schemeId].name}`);
    console.groupEnd();
    return true;
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
    volume: window.AudioConfig.AUDIO_CONFIG.defaultVolume,
    playNote: (note) => console.log('播放音符:', note),
    setVolume: (vol) => console.log('设置音量:', vol),
    preloadAll: () => Promise.resolve(),
    ensureContext: () => Promise.resolve(),
    notes: window.AudioConfig.NOTES,
    notesMap: window.AudioConfig.NOTES_MAP,
    setTimbre: (timbre) => console.log('设置音色:', timbre),
    getCurrentTimbre: () => 'audio'
  };
}

// 将类添加到全局对象，以便其他脚本可以使用
window.AudioManager = AudioManager;