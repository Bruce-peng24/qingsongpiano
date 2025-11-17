/**
 * 音域选择器类 - 负责处理音域选择相关逻辑
 * @class
 */
class ModeSelector {
  /**
   * 创建ModeSelector实例
   * @constructor
   * @param {Object} appInstance - 应用程序实例
   */
  constructor(appInstance) {
    this.app = appInstance;
    this.selectedMode = null; // 存储用户选择的音域模式
    this.isModeSelected = false; // 标记是否已完成音域选择
    this.buttonSound = new Audio('https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/button.mp3');
    console.info('ModeSelector: 创建音域选择器实例');
  }

  /**
   * 显示音域选择界面
   */
  showSelector() {
    console.info('ModeSelector: 显示音域选择界面');

    const modeSelector = document.getElementById('window-selector');
    if (!modeSelector) {
      console.warn('ModeSelector: 未找到音域选择界面，使用默认模式');
      this.app.continueWithDefaultMode();
      return;
    }

    // 确保音域选择界面显示在最前面
    modeSelector.style.display = 'flex';
    modeSelector.style.zIndex = '10000';

    // 设置音域选择按钮事件
    this.setupModeSelection();
  }

  /**
   * 设置音域选择事件
   */
  setupModeSelection() {
    const audioModeBtn = document.getElementById('audio-mode');
    const goldenModeBtn = document.getElementById('golden-mode');
    const oscillatorModeBtn = document.getElementById('oscillator-mode');
    const welcomeSound = new Audio('https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/welcome.mp3');

    if (audioModeBtn && goldenModeBtn && oscillatorModeBtn) {
      audioModeBtn.addEventListener('click', () => {
        this.buttonSound.play(); // 播放按钮点击音效
        this.handleSelection('audio');

        console.log('播放入场音效');
        welcomeSound.play();
      });

      goldenModeBtn.addEventListener('click', () => {
        this.buttonSound.play(); // 播放按钮点击音效
        this.handleSelection('golden');

        console.log('播放入场音效');
        welcomeSound.play();
      });

      oscillatorModeBtn.addEventListener('click', () => {
        this.buttonSound.play(); // 播放按钮点击音效
        this.handleSelection('oscillator');

        console.log('播放入场音效');
        welcomeSound.play();
      });
    } else {
      console.warn('ModeSelector: 音域选择按钮未找到，使用默认模式');
      this.app.continueWithDefaultMode();
    }
  }

  /**
   * 处理音域选择
   * @param {string} mode - 用户选择的模式 ('audio' 或 'oscillator')
   */
  handleSelection(mode) {
    console.info(`ModeSelector: 用户选择了 ${mode} 模式`);

    this.selectedMode = mode;
    this.isModeSelected = true;

    // 触发事件，通知其他模块（如loader.js）
    window.dispatchEvent(new CustomEvent('pianoAppModeSelected'));

    // 隐藏音域选择界面
    const modeSelector = document.getElementById('window-selector');
    if (modeSelector) {
      setTimeout(() => {
        modeSelector.style.display = 'none';
      }, 250); // 0.25秒后隐藏模式选择窗口
    }

    // 确保在用户交互后初始化音频上下文
    if (window.audioManager) {
      window.audioManager.ensureContext();
    }

    // 通知主应用处理选择结果
    this.app.onModeSelected(mode);
  }

  /**
   * 获取当前选择的模式
   * @returns {string|null} 选择的模式或null
   */
  getSelectedMode() {
    return this.selectedMode;
  }

  /**
   * 检查是否已完成模式选择
   * @returns {boolean} 是否已完成模式选择
   */
  hasSelection() {
    return this.isModeSelected;
  }
}

// 导出到全局
window.ModeSelector = ModeSelector;

console.info('ModeSelector: mode-selector.js 加载完成');