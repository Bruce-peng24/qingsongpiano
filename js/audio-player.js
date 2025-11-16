/**
 * 音频播放模块
 * 负责处理音频播放、停止和音频源管理
 */

/**
 * 音频播放器类
 * @class
 */
class AudioPlayer {
  /**
   * 创建AudioPlayer实例
   * @constructor
   * @param {AudioContext} audioContext - 音频上下文
   */
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.activeSources = new Map(); // 存储活跃的音频源
    this.volume = window.AudioConfig.AUDIO_CONFIG.defaultVolume;

    // 初始化音频效果处理器
    this.effects = new window.AudioEffects(audioContext);

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
      console.warn('AudioPlayer: 清理音频源时发生错误', error);
    }

    this.activeSources.delete(sourceId);
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
          sourceInfo.gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + 0.03);

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
  playNoteWithAudioFile(noteName, velocity = 0.7) {
    try {
      // 使用 AudioManager 实例的 notesMap 精确映射音符到音频文件
      let noteMapping = null;
      
      // 优先使用 AudioManager 实例的 notesMap
      if (window.audioManager && window.audioManager.notesMap) {
        noteMapping = window.audioManager.notesMap[noteName];
        console.log(`AudioPlayer: 使用 AudioManager notesMap 查找音符 ${noteName}`);
        console.log(`AudioPlayer: AudioManager notesMap 内容:`, window.audioManager.notesMap);
        console.log(`AudioPlayer: 查找到的映射:`, noteMapping);
      }
      
      // 如果 AudioManager 中没有找到，使用全局配置作为降级方案
      if (!noteMapping && window.AudioConfig && window.AudioConfig.NOTES_MAP) {
        noteMapping = window.AudioConfig.NOTES_MAP[noteName];
        console.log(`AudioPlayer: 使用全局 AudioConfig notesMap 查找音符 ${noteName}`);
        console.log(`AudioPlayer: 全局 AudioConfig notesMap 内容:`, window.AudioConfig.NOTES_MAP);
      }
      
      if (!noteMapping) {
        console.warn(`AudioPlayer: 未找到音符 ${noteName} 的音频映射`);
        return null;
      }

      const audioFile = noteMapping.file;
      console.log(`AudioPlayer: 播放音符 ${noteName}，音频文件: ${audioFile}`);
      
      const audioElement = new Audio(audioFile);
      audioElement.volume = velocity * this.volume;

      // 添加错误处理
      audioElement.addEventListener('error', (e) => {
        console.error(`AudioPlayer: 音频文件加载失败 ${audioFile}`, e);
      });

      // 播放前添加视觉反馈
      const pianoKey = document.querySelector(`.piano-key[data-note="${noteName}"]`);
      if (pianoKey) {
        pianoKey.classList.add('active');
      }

      audioElement.play().catch((error) => {
        console.error(`AudioPlayer: 音频播放失败 ${audioFile}`, error);
        // 播放失败时移除视觉反馈
        if (pianoKey) {
          pianoKey.classList.remove('active');
        }
      });

      const sourceId = `${noteName}_${Date.now()}`;
      this.activeSources.set(sourceId, {
        source: audioElement,
        noteName: noteName,
        startTime: Date.now(),
        type: 'htmlAudio' // 标记类型便于清理时区分
      });



      // 清理函数
      const cleanup = () => {
        try {
          audioElement.pause();
          audioElement.currentTime = 0;
          this.activeSources.delete(sourceId);
          // 播放结束后移除视觉反馈
          if (pianoKey) {
            pianoKey.classList.remove('active');
          }
        } catch (e) {
          // 忽略清理错误
        }
      };

      audioElement.onended = cleanup;
      // 增加超时时间以确保音频播放完成
      setTimeout(cleanup, 5000); // 超时清理

      console.log(`AudioPlayer: 播放音符 ${noteName}`);
      return sourceId;

    } catch (error) {
      console.error('AudioPlayer: 播放失败', error);
      return null;
    }
  }

  /**
   * 使用振荡器播放音符
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @returns {string|null} 音频源ID或null
   */
  playNoteWithOscillator(noteName, velocity = 0.7) {
    try {
      // 使用新的振荡器模块
      let oscillator = window.OscillatorManager.getOscillator('audio-player');
      if (!oscillator) {
        oscillator = window.OscillatorManager.createOscillator(this.audioContext, 'audio-player');
      }
      
      // 设置音量
      oscillator.setVolume(this.volume);
      
      // 播放音符
      return oscillator.playNote(noteName, velocity);

    } catch (error) {
      console.error('AudioPlayer: 播放音符失败', error);
      return null;
    }
  }

  /**
   * 从音频精灵播放音符
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @returns {string|null} 音频源ID或null
   */
  playNoteFromSprite(noteName, velocity = 0.7) {
    if (!this.audioBuffer) {
      console.warn('AudioPlayer: 音频精灵未就绪，使用振荡器');
      return this.playNoteWithOscillator(noteName, velocity);
    }

    try {
      const timing = window.AudioConfig.AUDIO_SPRITE_TIMINGS[noteName];
      if (!timing) {
        console.warn(`AudioPlayer: 未找到音符 ${noteName} 的映射`);
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

      // 使用AudioEffects创建淡入淡出效果
      this.effects.createFadeInOut(
        gainNode.gain,
        velocity * this.volume,
        0.07,      // 淡入时间
        0.8,       // 淡出时间
        duration   // 总持续时间
      );

      // 播放音频
      source.start(startTime, timing.start, duration);

      // 生成唯一ID
      const sourceId = `${noteName}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // 存储音频源用于管理
      this.activeSources.set(sourceId, {
        source: source,
        gainNode: gainNode,
        noteName: noteName,
        startTime: startTime,
        type: 'webAudio' // 标记类型便于清理时区分
      });



      // 清理函数
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
          this.activeSources.delete(sourceId);
        } catch (e) {
          // 忽略已停止的源
        }
      };

      // 设置结束回调
      source.onended = cleanup;

      // 安全超时清理
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
          this.activeSources.delete(sourceId);
        } catch (e) {
          // 忽略已停止的源
        }
      }, duration * 1000 + 500);

      console.log(`AudioPlayer: 播放音符 ${noteName}, 时长: ${duration}s`);
      return sourceId;

    } catch (error) {
      console.error('AudioPlayer: 音频精灵播放失败', error);
      return null;
    }
  }


  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    console.info(`AudioPlayer: 音量设置为 ${this.volume}`);
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
}

// 将类添加到全局对象，以便其他脚本可以使用
window.AudioPlayer = AudioPlayer;