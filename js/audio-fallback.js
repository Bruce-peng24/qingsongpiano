/**
 * 降级音频管理器类
 * 使用Web Audio API振荡器作为音频播放的降级方案
 * @class
 */
class FallbackAudioManager {
  /**
   * 创建FallbackAudioManager实例
   * @constructor
   */
  constructor() {
    this.isReady = true;
    this.volume = 0.9;
    this.audioContext = null;
    this.currentTimbre = 'oscillator'; // 降级管理器默认使用振荡器模式
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
    console.info('FallbackAudioManager: 创建降级音频管理器');
  }

  /**
   * 确保音频上下文存在且处于运行状态
   * @returns {Promise<boolean>} 音频上下文是否可用
   */
  async ensureContext() {
    try {
      // 如果音频上下文不存在，创建它
      if (!this.audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioContext = new AudioContext();

          // 添加错误监听
          this.audioContext.onstatechange = () => {
            console.log('FallbackAudioManager AudioContext state:', this.audioContext.state);
          };

          this.audioContext.onerror = (e) => {
            console.error('FallbackAudioManager AudioContext error:', e.error);
          };

          console.info('FallbackAudioManager: 音频上下文创建成功');
        } else {
          console.warn('FallbackAudioManager: 浏览器不支持Web Audio API');
          return false;
        }
      }

      // 如果上下文被挂起，恢复它
      if (this.audioContext.state === 'suspended') {
        console.info('FallbackAudioManager: 尝试恢复挂起的音频上下文');
        try {
          await this.audioContext.resume();
          console.info('FallbackAudioManager: 音频上下文恢复成功');
        } catch (error) {
          console.warn('FallbackAudioManager: 音频上下文恢复失败', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('FallbackAudioManager: 确保音频上下文失败', error);
      return false;
    }
  }

  /**
   * 播放音符
   * 根据当前音色设置选择播放方式
   * @param {string} note - 要播放的音符名称
   */
  async playNote(note) {
    console.info(`FallbackAudioManager: 播放音符 ${note}，当前音色: ${this.currentTimbre}`);
    
    // 根据当前音色选择播放方式
    if (this.currentTimbre === 'audio') {
      // 音频模式：尝试使用音频文件播放
      await this.playNoteWithAudio(note);
    } else {
      // 振荡器模式：使用Web Audio API振荡器
      await this.playNoteWithOscillator(note);
    }
  }

  /**
   * 使用音频文件播放音符
   * @param {string} note - 要播放的音符名称
   */
  async playNoteWithAudio(note) {
    try {
      // 将音符编号转换为音频文件名（例如：8 -> a08.mp3）
      const noteNumber = parseInt(note);
      const audioFileName = `a${noteNumber.toString().padStart(2, '0')}.mp3`;
      const audioFilePath = `https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/${audioFileName}`;
      
      console.info(`FallbackAudioManager: 尝试加载音频文件 ${audioFilePath}`);
      
      // 创建音频元素播放音频文件
      const audio = new Audio(audioFilePath);
      audio.volume = this.volume;
      
      // 监听音频加载错误，如果音频文件不存在则降级到振荡器
      audio.addEventListener('error', () => {
        console.warn(`FallbackAudioManager: 音频文件 ${audioFilePath} 加载失败，降级到振荡器`);
        this.playNoteWithOscillator(note);
      });
      
      // 尝试播放音频
      await audio.play();
      console.info(`FallbackAudioManager: 使用音频文件播放音符 ${note} (${audioFilePath})`);
      
    } catch (error) {
      console.warn(`FallbackAudioManager: 音频播放失败，降级到振荡器:`, error);
      this.playNoteWithOscillator(note);
    }
  }

  /**
   * 使用振荡器播放音符
   * @param {string} note - 要播放的音符名称
   */
  async playNoteWithOscillator(note) {
    try {
      // 确保音频上下文存在且未挂起
      const contextReady = await this.ensureContext();
      if (!contextReady || !this.audioContext) {
        console.warn('FallbackAudioManager: 音频上下文未就绪，跳过播放');
        return;
      }

      // 使用新的振荡器模块
      let oscillator = window.OscillatorManager.getOscillator('fallback');
      if (!oscillator) {
        oscillator = window.OscillatorManager.createOscillator(this.audioContext, 'fallback');
      }
      
      // 设置音量
      oscillator.setVolume(this.volume);
      
      // 播放音符
      oscillator.playNote(note, 0.7);

    } catch (error) {
      console.error('FallbackAudioManager: 振荡器播放失败', error);
      // 如果出错，重置音频上下文以便下次重新创建
      this.audioContext = null;
    }
  }


  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 切换音色
   * @param {string} timbre - 音色类型 ('audio', 'golden' 或 'oscillator')
   */
  setTimbre(timbre) {
    if (timbre === 'audio' || timbre === 'golden' || timbre === 'oscillator') {
      this.currentTimbre = timbre;
      console.info(`FallbackAudioManager: 音色切换为 ${timbre}`);
      
      // 如果是电音模式，预初始化振荡器实例
      if (timbre === 'oscillator') {
        this.preinitializeOscillator();
      }
      
      // 触发音色切换事件
      window.dispatchEvent(new CustomEvent('timbreChanged', {
        detail: { timbre: timbre }
      }));
    } else {
      console.warn(`FallbackAudioManager: 不支持的音色类型 ${timbre}`);
    }
  }

  /**
   * 预初始化振荡器实例
   * 确保在切换到电音模式时振荡器实例已经创建
   */
  async preinitializeOscillator() {
    console.info('FallbackAudioManager: 预初始化振荡器实例');
    
    // 确保音频上下文存在且未挂起
    const contextReady = await this.ensureContext();
    if (!contextReady || !this.audioContext) {
      console.warn('FallbackAudioManager: 音频上下文不可用，无法预初始化振荡器');
      return;
    }

    try {
      // 获取或创建振荡器实例
      let oscillator = window.OscillatorManager.getOscillator('fallback');
      if (!oscillator) {
        oscillator = window.OscillatorManager.createOscillator(this.audioContext, 'fallback');
        console.info('FallbackAudioManager: 振荡器实例创建成功');
      } else {
        console.info('FallbackAudioManager: 振荡器实例已存在');
      }
      
      // 设置音量
      oscillator.setVolume(this.volume);
      
    } catch (error) {
      console.error('FallbackAudioManager: 预初始化振荡器失败', error);
    }
  }

  /**
   * 获取当前音色
   * @returns {string} 当前音色类型
   */
  getCurrentTimbre() {
    return this.currentTimbre;
  }
}

// 导出到全局
window.FallbackAudioManager = FallbackAudioManager;