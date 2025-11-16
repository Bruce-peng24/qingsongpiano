/**
 * 音频播放控制模块
 * 负责处理音频播放的高级控制逻辑，包括防抖、并发限制和音符冷却
 */

/**
 * 音频播放控制器类
 * @class
 */
class AudioPlaybackController {
  /**
   * 创建AudioPlaybackController实例
   * @constructor
   * @param {AudioPlayer} audioPlayer - 音频播放器实例
   */
  constructor(audioPlayer) {
    this.audioPlayer = audioPlayer;
    this.lastPlayTimes = {}; // 记录上次播放时间
    this.noteCooldown = new Set(); // 初始化音符冷却集合
    this.maxConcurrent = window.AudioConfig.AUDIO_CONFIG.maxConcurrent || 40; // 最大同时播放数
    this.debounceTime = window.AudioConfig.AUDIO_CONFIG.debounceTime || 150; // 防抖时间(毫秒)
  }

  /**
   * 播放音符，包含防抖和并发控制逻辑
   * @param {string} noteName - 要播放的音符名称
   * @param {number} velocity - 音符力度 (0-1)
   * @param {string} playbackMethod - 播放方法 ('audioFile', 'oscillator', 'sprite')
   * @returns {string|null} 音频源ID或null
   */
  playNote(noteName, velocity = 0.7, playbackMethod = 'audioFile') {
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

    // 防抖处理：避免快速连续点击同一音符
    if (lastPlayTime !== 0 && now - lastPlayTime < this.debounceTime) {
      console.log(`AudioPlaybackController: 音符 ${noteName} 防抖跳过`);
      console.groupEnd();
      return null;
    }

    // 限制同时播放数量
    if (this.audioPlayer.activeSources.size >= this.maxConcurrent) {
      this.audioPlayer.stopOldestSource();
    }

    // 停止同音符的先前播放（避免重叠）
    this.audioPlayer.stopNote(noteName);

    this.lastPlayTimes[noteName] = now;
    console.log('3. 更新最后播放时间:', now);
    console.log('4. ✅ 通过防抖检查 - 继续播放');
    console.groupEnd();

    // 根据指定的播放方法播放音符
    switch (playbackMethod) {
      case 'oscillator':
        return this.audioPlayer.playNoteWithOscillator(noteName, velocity);
      case 'sprite':
        return this.audioPlayer.playNoteFromSprite(noteName, velocity);
      case 'audioFile':
      default:
        return this.audioPlayer.playNoteWithAudioFile(noteName, velocity);
    }
  }

  /**
   * 停止特定音符的播放
   * @param {string} noteName - 要停止的音符名称
   */
  stopNote(noteName) {
    this.audioPlayer.stopNote(noteName);
  }

  /**
   * 停止所有音频
   */
  stopAll() {
    this.audioPlayer.stopAll();
  }

  setVolume(vol) {
    this.audioPlayer.setVolume(vol);
  }

  /**
   * 检查音符是否在冷却中
   * @param {string} noteName - 音符名称
   * @returns {boolean} 是否在冷却中
   */
  isNoteInCooldown(noteName) {
    return this.noteCooldown.has(noteName);
  }

  /**
   * 将音符添加到冷却集合
   * @param {string} noteName - 音符名称
   */
  addNoteToCooldown(noteName) {
    this.noteCooldown.add(noteName);
  }

  /**
   * 从冷却集合中移除音符
   * @param {string} noteName - 音符名称
   */
  removeNoteFromCooldown(noteName) {
    this.noteCooldown.delete(noteName);
  }

  /**
   * 清空音符冷却集合
   */
  clearNoteCooldown() {
    this.noteCooldown.clear();
  }

  /**
   * 设置防抖时间
   * @param {number} time - 防抖时间(毫秒)
   */
  setDebounceTime(time) {
    this.debounceTime = time;
  }

  /**
   * 设置最大并发播放数
   * @param {number} max - 最大并发数
   */
  setMaxConcurrent(max) {
    this.maxConcurrent = max;
  }

  /**
   * 获取音符的上次播放时间
   * @param {string} noteName - 音符名称
   * @returns {number} 上次播放时间戳
   */
  getLastPlayTime(noteName) {
    return this.lastPlayTimes[noteName] || 0;
  }

  /**
   * 重置播放控制状态
   */
  reset() {
    this.lastPlayTimes = {};
    this.noteCooldown.clear();
  }
}

// 将类添加到全局对象，以便其他脚本可以使用
window.AudioPlaybackController = AudioPlaybackController;