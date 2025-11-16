/**
 * 音频上下文管理模块
 * 负责创建和管理Web Audio API的AudioContext
 */

/**
 * 音频上下文管理器类
 * @class
 */
class AudioContextManager {
  /**
   * 创建AudioContextManager实例
   * @constructor
   */
  constructor() {
    this.audioContext = null;
    this.isContextReady = false;
    this.addAudioContextErrorHandling();
  }

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
   * 确保音频上下文存在且处于运行状态
   * @returns {Promise} 音频上下文准备就绪的Promise
   */
  async ensureContext() {
    // 如果音频上下文不存在，在用户交互后创建
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        console.info('AudioContextManager: 用户交互后创建音频上下文');
      } else {
        console.warn('AudioContextManager: 浏览器不支持Web Audio API');
        return Promise.resolve();
      }
    }

    // 如果上下文被挂起，恢复它
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
      console.info('AudioContextManager: 音频上下文恢复成功');
    }

    this.isContextReady = true;
    return Promise.resolve();
  }

  /**
   * 获取当前音频上下文
   * @returns {AudioContext|null} 当前音频上下文或null
   */
  getContext() {
    return this.audioContext;
  }

  /**
   * 检查音频上下文是否就绪
   * @returns {boolean} 音频上下文是否就绪
   */
  isReady() {
    return this.isContextReady && this.audioContext && this.audioContext.state !== 'suspended';
  }

  /**
   * 重置音频上下文
   */
  resetContext() {
    if (this.audioContext) {
      try {
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }
      } catch (error) {
        console.warn('AudioContextManager: 关闭音频上下文时出错', error);
      }
    }
    
    this.audioContext = null;
    this.isContextReady = false;
  }
}

// 将类添加到全局对象，以便其他脚本可以使用
window.AudioContextManager = AudioContextManager;