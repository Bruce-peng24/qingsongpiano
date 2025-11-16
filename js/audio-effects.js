/**
 * 音频效果处理模块
 * 负责音频效果的处理，包括淡入淡出等
 */

/**
 * 音频效果处理器类
 * @class
 */
class AudioEffects {
  /**
   * 创建AudioEffects实例
   * @constructor
   * @param {AudioContext} audioContext - 音频上下文
   */
  constructor(audioContext) {
    this.audioContext = audioContext;
  }

  /**
   * 创建淡入效果
   * @param {AudioParam} gainParam - 增益参数
   * @param {number} targetValue - 目标值
   * @param {number} duration - 持续时间（秒）
   * @param {number} startTime - 开始时间（可选，默认为当前时间）
   */
  createFadeIn(gainParam, targetValue, duration, startTime = null) {
    const start = startTime || this.audioContext.currentTime;

    // 设置初始音量为0
    gainParam.setValueAtTime(0, start);

    // 线性淡入到目标值
    gainParam.linearRampToValueAtTime(targetValue, start + duration);
  }

  /**
   * 创建淡出效果
   * @param {AudioParam} gainParam - 增益参数
   * @param {number} duration - 持续时间（秒）
   * @param {number} startTime - 开始时间（可选，默认为当前时间）
   * @param {number} endValue - 结束值（可选，默认为0.001）
   */
  createFadeOut(gainParam, duration, startTime = null, endValue = 0.001) {
    const start = startTime || this.audioContext.currentTime;

    // 指数淡出到结束值
    gainParam.exponentialRampToValueAtTime(endValue, start + duration);
  }

  /**
   * 创建淡入淡出效果
   * @param {AudioParam} gainParam - 增益参数
   * @param {number} targetValue - 目标值
   * @param {number} fadeInDuration - 淡入时间（秒）
   * @param {number} fadeOutDuration - 淡出时间（秒）
   * @param {number} totalDuration - 总持续时间（秒）
   * @param {number} startTime - 开始时间（可选，默认为当前时间）
   */
  createFadeInOut(gainParam, targetValue, fadeInDuration, fadeOutDuration, totalDuration, startTime = null) {
    const start = startTime || this.audioContext.currentTime;

    // 设置初始音量为0
    gainParam.setValueAtTime(0, start);

    // 淡入
    gainParam.linearRampToValueAtTime(targetValue, start + fadeInDuration);

    // 保持音量直到开始淡出
    gainParam.setValueAtTime(targetValue, start + totalDuration - fadeOutDuration);

    // 淡出
    gainParam.linearRampToValueAtTime(0.001, start + totalDuration);
  }
}

// 将类添加到全局对象，以便其他脚本可以使用
window.AudioEffects = AudioEffects;