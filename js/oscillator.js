/**
 * 振荡器模块
 * 统一管理Web Audio API振荡器的创建、配置和播放逻辑
 * 提供丰富的波形类型和参数控制
 */

/**
 * 振荡器类
 * @class
 */
class Oscillator {
  /**
   * 创建Oscillator实例
   * @constructor
   * @param {AudioContext} audioContext - 音频上下文
   * @param {Object} options - 配置选项
   * @param {string} options.type - 波形类型 ('sine', 'square', 'triangle', 'sawtooth')
   * @param {number} options.volume - 音量 (0-1)
   * @param {number} options.duration - 持续时间 (秒)
   * @param {number} options.attack - 起音时间 (秒)
   * @param {number} options.decay - 衰减时间 (秒)
   * @param {number} options.sustain - 持续音量 (0-1)
   * @param {number} options.release - 释音时间 (秒)
   */
  constructor(audioContext, options = {}) {
    this.audioContext = audioContext;
    this.options = {
      type: options.type || 'sine',
      volume: Math.max(0, Math.min(1, options.volume || 0.3)),
      duration: Math.max(0.1, options.duration || 0.5),
      attack: Math.max(0, options.attack || 0.01),
      decay: Math.max(0, options.decay || 0.1),
      sustain: Math.max(0, Math.min(1, options.sustain || 0.3)),
      release: Math.max(0, options.release || 0.5)
    };

    this.activeSources = new Map();
    this.sustainMode = options.sustainMode || false; // 新增持续发音模式
    this.activeSustainedNotes = new Map(); // 存储持续发音的音符
    this.currentPitch = options.pitch || 'medium'; // 当前音调设置

    console.info('Oscillator: 振荡器实例创建成功');
  }

  /**
   * 播放音符
   * @param {string} noteName - 音符名称
   * @param {number} velocity - 力度 (0-1)
   * @param {Object} customOptions - 自定义选项（可选）
   * @returns {string|null} 音频源ID
   */
  playNote(noteName, velocity = 0.7, customOptions = {}) {
    try {
      const options = { ...this.options, ...customOptions };

      // 如果是持续发音模式
      if (options.sustainMode || this.sustainMode) {
        return this.playSustainedNote(noteName, velocity, options);
      }

      const frequency = this.getFrequencyForNote(noteName);

      if (!frequency) {
        console.warn(`Oscillator: 无法获取音符 ${noteName} 的频率`);
        return null;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // 设置振荡器参数
      oscillator.frequency.value = frequency;
      oscillator.type = options.type;

      // 应用ADSR包络
      this.applyADSREnvelope(gainNode.gain, velocity * options.volume, options);

      const startTime = this.audioContext.currentTime;
      oscillator.start(startTime);
      oscillator.stop(startTime + options.duration);

      const sourceId = `osc_${noteName}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      this.activeSources.set(sourceId, {
        oscillator: oscillator,
        gainNode: gainNode,
        noteName: noteName,
        startTime: startTime,
        type: 'oscillator'
      });

      // 设置结束回调
      oscillator.onended = () => {
        this.cleanupSource(sourceId);
      };

      console.log(`Oscillator: 播放音符 ${noteName}，频率 ${frequency}Hz，波形 ${options.type}`);
      return sourceId;

    } catch (error) {
      console.error('Oscillator: 播放音符失败', error);
      return null;
    }
  }

  /**
   * 播放持续发音音符
   * @param {string} noteName - 音符名称
   * @param {number} velocity - 力度 (0-1)
   * @param {Object} options - 配置选项
   * @returns {string|null} 音频源ID
   */
  playSustainedNote(noteName, velocity, options) {
    try {
      // 检查是否已经在持续发音
      if (this.activeSustainedNotes.has(noteName)) {
        console.log(`Oscillator: 音符 ${noteName} 已在持续发音中`);
        return this.activeSustainedNotes.get(noteName).id;
      }

      const frequency = this.getFrequencyForNote(noteName);
      if (!frequency) {
        console.warn(`Oscillator: 无法获取音符 ${noteName} 的频率`);
        return null;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = options.type;

      // 设置初始音量并保持
      gainNode.gain.setValueAtTime(velocity * options.volume, this.audioContext.currentTime);

      oscillator.start(this.audioContext.currentTime);

      const sourceId = `sustain_${noteName}_${Date.now()}`;
      this.activeSustainedNotes.set(noteName, {
        id: sourceId,
        oscillator: oscillator,
        gainNode: gainNode
      });

      console.log(`Oscillator: 开始持续发音 ${noteName}，频率 ${frequency}Hz，波形 ${options.type}`);
      return sourceId;

    } catch (error) {
      console.error('Oscillator: 播放持续发音音符失败', error);
      return null;
    }
  }

  /**
   * 停止持续发音音符
   * @param {string} noteName - 音符名称
   */
  stopSustainedNote(noteName) {
    const noteInfo = this.activeSustainedNotes.get(noteName);
    if (!noteInfo) return;

    const { oscillator, gainNode } = noteInfo;

    try {
      // 使用控制面板设置的持续时间作为淡出时间
      const releaseTime = this.options.duration;
      const now = this.audioContext.currentTime;

      // 添加淡出效果 - 先设置当前值，然后应用指数淡出
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

      // 延迟停止振荡器
      setTimeout(() => {
        try {
          oscillator.stop(this.audioContext.currentTime);
          oscillator.disconnect();
          gainNode.disconnect();
        } catch (e) {
          // 忽略已停止的源
        }
      }, releaseTime * 1000);

      this.activeSustainedNotes.delete(noteName);
      console.log(`Oscillator: 停止持续发音 ${noteName}`);

    } catch (error) {
      console.error('Oscillator: 停止持续发音音符失败', error);
    }
  }

  /**
   * 应用ADSR包络
   * @param {AudioParam} gainParam - 增益参数
   * @param {number} peakVolume - 峰值音量
   * @param {Object} options - 包络参数
   */
  applyADSREnvelope(gainParam, peakVolume, options) {
    const now = this.audioContext.currentTime;

    // 设置初始音量
    gainParam.setValueAtTime(0, now);

    // 起音阶段
    gainParam.linearRampToValueAtTime(peakVolume, now + options.attack);

    // 衰减阶段
    gainParam.exponentialRampToValueAtTime(
      peakVolume * options.sustain,
      now + options.attack + options.decay
    );

    // 持续阶段（保持音量）
    const sustainEndTime = now + options.duration - options.release;
    gainParam.setValueAtTime(peakVolume * options.sustain, sustainEndTime);

    // 释音阶段
    gainParam.exponentialRampToValueAtTime(0.001, now + options.duration);
  }

  /**
   * 获取音符对应的频率
   * @param {string} noteName - 音符名称
   * @returns {number} 音符频率
   */
  getFrequencyForNote(noteName) {
    try {
      const noteIndex = parseInt(noteName) - 1;

      // 使用音频配置中的频率映射
      if (window.AudioConfig && window.AudioConfig.NOTE_FREQUENCIES) {
        const frequencies = window.AudioConfig.NOTE_FREQUENCIES;
        if (noteIndex >= 0 && noteIndex < frequencies.length) {
          let frequency = frequencies[noteIndex];

          // 根据音调设置调整频率
          switch (this.currentPitch) {
            case 'low':
              frequency *= 0.5; // 降低一个八度
              break;
            case 'high':
              frequency *= 2; // 升高一个八度
              break;
            case 'medium':
            default:
              // 保持原频率
              break;
          }

          // 为正弦波和三角波调高一个度（一个半音）
          if (this.options.type === 'sine' || this.options.type === 'triangle') {
            frequency *= Math.pow(2, 1 / 12); // 升高一个半音
          }

          return frequency;
        }
      }

      // 降级方案：基于C4的十二平均律计算
      let baseFreq = 261.63; // C4

      // 根据音调设置调整基础频率
      switch (this.currentPitch) {
        case 'low':
          baseFreq *= 0.5; // 降低一个八度
          break;
        case 'high':
          baseFreq *= 2; // 升高一个八度
          break;
        case 'medium':
        default:
          // 保持原频率
          break;
      }

      let frequency = baseFreq * Math.pow(2, noteIndex / 12);

      // 为正弦波和三角波调高一个度（一个半音）
      if (this.options.type === 'sine' || this.options.type === 'triangle') {
        frequency *= Math.pow(2, 1 / 12); // 升高一个半音
      }

      return frequency;

    } catch (error) {
      console.error('Oscillator: 获取频率失败', error);
      return 440; // 默认频率A4
    }
  }

  /**
   * 设置波形类型
   * @param {string} type - 波形类型 ('sine', 'square', 'triangle', 'sawtooth')
   */
  setType(type) {
    const validTypes = ['sine', 'square', 'triangle', 'sawtooth'];
    if (validTypes.includes(type)) {
      this.options.type = type;
      console.info(`Oscillator: 波形类型设置为 ${type}`);
    } else {
      console.warn(`Oscillator: 不支持的波形类型 ${type}`);
    }
  }

  /**
   * 设置音量
   * @param {number} volume - 音量 (0-1)
   */
  setVolume(volume) {
    this.options.volume = Math.max(0, Math.min(1, volume));
    console.info(`Oscillator: 音量设置为 ${this.options.volume}`);
  }

  /**
   * 设置持续时间
   * @param {number} duration - 持续时间 (秒)
   */
  setDuration(duration) {
    this.options.duration = Math.max(0.1, duration);
    console.info(`Oscillator: 持续时间设置为 ${this.options.duration}s`);
  }

  /**
   * 设置音调
   * @param {string} pitch - 音调类型 ('low', 'medium', 'high')
   */
  setPitch(pitch) {
    this.currentPitch = pitch;
    console.info(`Oscillator: 音调设置为 ${pitch}`);
  }

  /**
   * 设置ADSR包络参数
   * @param {Object} adsrParams - ADSR参数
   * @param {number} adsrParams.attack - 起音时间
   * @param {number} adsrParams.decay - 衰减时间
   * @param {number} adsrParams.sustain - 持续音量
   * @param {number} adsrParams.release - 释音时间
   */
  setADSREnvelope(adsrParams) {
    if (adsrParams.attack !== undefined) {
      this.options.attack = Math.max(0, adsrParams.attack);
    }
    if (adsrParams.decay !== undefined) {
      this.options.decay = Math.max(0, adsrParams.decay);
    }
    if (adsrParams.sustain !== undefined) {
      this.options.sustain = Math.max(0, Math.min(1, adsrParams.sustain));
    }
    if (adsrParams.release !== undefined) {
      this.options.release = Math.max(0, adsrParams.release);
    }

    console.info('Oscillator: ADSR包络参数已更新', this.options);
  }

  /**
   * 停止特定音符
   * @param {string} noteName - 音符名称
   */
  stopNote(noteName) {
    const sourcesToStop = [];

    for (const [id, sourceInfo] of this.activeSources.entries()) {
      if (sourceInfo.noteName === noteName) {
        sourcesToStop.push(id);
      }
    }

    sourcesToStop.forEach(id => {
      this.cleanupSource(id);
    });
  }

  /**
   * 停止所有音符
   */
  stopAll() {
    for (const sourceId of this.activeSources.keys()) {
      this.cleanupSource(sourceId);
    }
    this.activeSources.clear();

    // 停止所有持续发音的音符
    this.stopAllSustainedNotes();
  }

  /**
   * 停止所有持续发音的音符
   */
  stopAllSustainedNotes() {
    for (const noteName of this.activeSustainedNotes.keys()) {
      this.stopSustainedNote(noteName);
    }
    this.activeSustainedNotes.clear();
  }

  /**
   * 清理音频源
   * @param {string} sourceId - 音频源ID
   */
  cleanupSource(sourceId) {
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

      // 然后停止振荡器
      if (sourceInfo.oscillator) {
        try {
          if (typeof sourceInfo.oscillator.stop === 'function') {
            sourceInfo.oscillator.stop(0);
          }
        } catch (e) {
          // 忽略已停止的源
        }
        if (typeof sourceInfo.oscillator.disconnect === 'function') {
          sourceInfo.oscillator.disconnect();
        }
      }
    } catch (error) {
      console.warn('Oscillator: 清理音频源时发生错误', error);
    }

    this.activeSources.delete(sourceId);
  }

  /**
   * 获取当前配置
   * @returns {Object} 当前配置选项
   */
  getConfig() {
    return { ...this.options };
  }

  /**
   * 获取支持的波形类型
   * @returns {string[]} 支持的波形类型列表
   */
  getSupportedTypes() {
    return ['sine', 'square', 'triangle', 'sawtooth'];
  }
}

/**
 * 振荡器管理器类
 * 提供振荡器实例的创建和管理
 */
class OscillatorManager {
  constructor() {
    this.oscillators = new Map();
    this.defaultOptions = {
      type: 'triangle',
      volume: 0.3,
      duration: 0.5,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.3,
      release: 0.2
    };
  }

  /**
   * 创建振荡器实例
   * @param {AudioContext} audioContext - 音频上下文
   * @param {string} id - 实例ID
   * @param {Object} options - 配置选项
   * @returns {Oscillator} 振荡器实例
   */
  createOscillator(audioContext, id = 'default', options = {}) {
    const oscillator = new Oscillator(audioContext, { ...this.defaultOptions, ...options });
    this.oscillators.set(id, oscillator);
    return oscillator;
  }

  /**
   * 获取振荡器实例
   * @param {string} id - 实例ID
   * @returns {Oscillator|null} 振荡器实例
   */
  getOscillator(id = 'default') {
    return this.oscillators.get(id) || null;
  }

  /**
   * 删除振荡器实例
   * @param {string} id - 实例ID
   */
  removeOscillator(id = 'default') {
    const oscillator = this.oscillators.get(id);
    if (oscillator) {
      oscillator.stopAll();
      this.oscillators.delete(id);
    }
  }

  /**
   * 设置默认配置
   * @param {Object} options - 默认配置选项
   */
  setDefaultOptions(options) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
  }
}

// 创建全局振荡器管理器
window.OscillatorManager = new OscillatorManager();
window.Oscillator = Oscillator;

console.info('Oscillator: 振荡器模块加载完成');