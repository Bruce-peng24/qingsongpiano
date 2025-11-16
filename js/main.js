/**
 * 主应用程序类，负责初始化和管理整个钢琴应用
 * @class
 */
class PianoApp {
  /**
   * 创建PianoApp实例
   * @constructor
   */
  constructor() {
    // 全局音效对象
    this.buttonSound = new Audio('audio/button.mp3');  // 声明按钮点击音效

    // 加强的单例检查
    if (window.pianoAppInstance) {
      console.log('PianoApp: 应用实例已存在，返回现有实例');
      return window.pianoAppInstance;
    }

    if (window.pianoAppInitialized) {
      console.warn('PianoApp: 应用已初始化，返回现有实例');
      return window.pianoApp || this;
    }
    // 设置实例标记
    window.pianoAppInstance = this;
    window.pianoApp = this;
    window.pianoAppInitialized = true;

    console.info('PianoApp: 创建新实例');

    // 音域选择器实例
    this.modeSelector = null;

    // UI控制器实例
    this.uiController = null;

    // 创建音域选择器实例
    this.modeSelector = new ModeSelector(this);

    // 延迟显示音域选择界面，确保入场动画优先显示
    setTimeout(() => {
      this.modeSelector.showSelector();
    }, 800); // 0.8秒后显示模式选择窗口
  }

  /**
   * 处理音域选择回调
   * @param {string} mode - 用户选择的音域模式 ('audio', 'golden' 或 'oscillator')
   */
  onModeSelected(mode) {
    console.info(`PianoApp: 收到音域选择回调 ${mode}`);

    // 根据选择继续初始化
    if (mode === 'audio' || mode === 'golden') {
      this.startAudioLoading(mode);
    } else {
      this.continueWithOscillatorMode();
    }

    // 设置音频管理器的初始音色
    if (this.audioManager && this.audioManager.setTimbre) {
      this.audioManager.setTimbre(mode);
    }
  }

  /**
   * 开始音频加载
   * 显示加载界面并初始化音频管理器
   * @param {string} mode - 音频模式 ('audio' 或 'golden')
   */
  startAudioLoading(mode = 'audio') {
    console.info(`PianoApp: 开始音频文件加载，模式: ${mode}`);

    // 显示加载界面
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.display = 'flex';
    }

    // 初始化音频管理器并预加载音频
    this.initAudioManagerWithLoading(mode);
  }

  /**
   * 带加载进度的音频管理器初始化
   * 初始化音频管理器并处理加载进度
   * @param {string} mode - 音频模式 ('audio' 或 'golden')
   */
  initAudioManagerWithLoading(mode = 'audio') {
    console.info(`PianoApp: 初始化带加载进度的音频管理器，模式: ${mode}`);

    try {
      // 检查全局 audioManager
      if (window.audioManager && window.audioManager.isReady) {
        console.info('PianoApp: 使用已存在的全局 audioManager');
        this.audioManager = window.audioManager;
      } else {
        // 创建新的音频管理器 - 使用支持音频方案的版本
        console.info('PianoApp: 创建新的支持音频方案的 AudioManager 实例');
        
        // 检查是否支持音频方案的 AudioManager 类存在
        if (window.AudioManager && window.AudioManager.prototype && window.AudioManager.prototype.switchAudioScheme) {
          console.info('PianoApp: 使用支持音频方案的 AudioManager');
          this.audioManager = new window.AudioManager();
        } else {
          // 降级处理：创建支持音频方案的音频管理器
          console.info('PianoApp: 创建支持音频方案的音频管理器');
          this.audioManager = new (function() {
            // 复制 audio.js 中的 AudioManager 功能
            this.isReady = false;
            this.volume = 0.9;
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
            this.currentTimbre = 'audio';
            this.audioBuffers = new Map();

            this.init = function() {
              this.isReady = true;
              console.info('AudioManager: 音频管理器初始化（支持音频方案版本）');
            };

            this.ensureContext = function() {
              return Promise.resolve();
            };

            this.setTimbre = function(timbre) {
              console.info(`AudioManager: 设置音色为 ${timbre}`);
              this.currentTimbre = timbre;
            };

            this.getCurrentTimbre = function() {
              return this.currentTimbre;
            };

            this.switchAudioScheme = async function(schemeId) {
              console.group(`🎵 AudioManager: 开始切换音频方案到 ${schemeId}`);
              
              if (!this.audioSchemes[schemeId]) {
                console.error(`AudioManager: 未知的音频方案: ${schemeId}`);
                console.groupEnd();
                return false;
              }

              console.log(`切换到音频方案: ${this.audioSchemes[schemeId].name}`);
              
              // 清空音频缓冲区缓存
              this.audioBuffers.clear();
              console.log('音频缓冲区缓存已清空');
              
              // 切换音频方案
              this.currentScheme = schemeId;
              this.notesMap = this.audioSchemes[schemeId].notesMap;

              console.info(`AudioManager: 已切换到音频方案: ${this.audioSchemes[schemeId].name}`);
              console.groupEnd();
              return true;
            };

            this.playNote = async function(noteName, velocity = 0.7) {
              console.group(`🎵 AudioManager: 播放音符 ${noteName}`);
              console.log(`当前音频方案: ${this.currentScheme}`);
              console.log(`音符映射:`, this.notesMap[noteName]);
              
              const noteMapping = this.notesMap[noteName];
              if (!noteMapping) {
                console.warn(`未找到音符 ${noteName} 的音频映射`);
                console.groupEnd();
                return null;
              }

              console.log(`播放音频文件: ${noteMapping.file}`);
              console.groupEnd();
              return `${noteName}_${Date.now()}`;
            };

            this.preloadAll = function(progressCallback) {
              console.info('AudioManager: 开始预加载音频文件');
              
              if (progressCallback) {
                for (let i = 10; i <= 100; i += 10) {
                  setTimeout(() => progressCallback(i), i * 10);
                }
              }
              
              return Promise.resolve();
            };

            this.setVolume = function(vol) {
              this.volume = Math.max(0, Math.min(1, vol));
              console.info(`AudioManager: 音量设置为 ${this.volume}`);
            };

            this.init();
          })();
        }
        
        window.audioManager = this.audioManager;
      }

      // 确保音频上下文在用户交互后创建
      this.audioManager.ensureContext().then(() => {
        console.group(`🎵 PianoApp: 处理音频方案切换`);
        console.log(`1. 用户选择的模式: ${mode}`);
        console.log(`2. 音频管理器是否支持方案切换: ${!!this.audioManager.switchAudioScheme}`);
        
        // 根据模式切换音频方案
        if (this.audioManager.switchAudioScheme) {
          let targetScheme = 'popular'; // 默认方案
          
          if (mode === 'golden') {
            targetScheme = 'golden';
          } else if (mode === 'audio') {
            targetScheme = 'popular';
          }
          
          console.log(`3. 目标音频方案: ${targetScheme}`);
          console.log(`4. 当前音频方案: ${this.audioManager.currentScheme || '未设置'}`);
          
          return this.audioManager.switchAudioScheme(targetScheme).then(() => {
            console.info(`PianoApp: 音频方案切换到 ${targetScheme} 完成`);
            console.groupEnd();
          });
        } else {
          console.warn('PianoApp: 音频管理器不支持方案切换');
          console.groupEnd();
        }
        return Promise.resolve();
      }).then(() => {
        // 预加载音频文件
        if (this.audioManager.preloadAll) {
          this.audioManager.preloadAll((progress) => {
            this.updateLoadingProgress(progress);
          }).then(() => {
            console.info('PianoApp: 音频预加载完成');
            this.completeInitialization();
          }).catch((error) => {
            console.error('PianoApp: 音频预加载失败', error);
            this.completeInitialization();
          });
        } else {
          this.completeInitialization();
        }
      }).catch((error) => {
        console.error('PianoApp: 音频上下文初始化失败', error);
        this.completeInitialization();
      });

    } catch (error) {
      console.error('PianoApp: 音频管理器初始化错误', error);
      this.completeInitialization();
    }
  }

  /**
   * 更新加载进度
   * @param {number} progress - 加载进度百分比 (0-100)
   */
  updateLoadingProgress(progress) {
    const loaderText = document.getElementById('loader-text');
    const loaderBar = document.getElementById('loader-bar');

    if (loaderText) {
      loaderText.textContent = `正在加载音色 ${progress}%`;
    }

    if (loaderBar) {
      loaderBar.style.width = `${progress}%`;
    }
  }

  /**
   * 使用振荡器模式
   * 创建降级音频管理器并完成初始化
   */
  continueWithOscillatorMode() {
    console.info('PianoApp: 使用振荡器模式');

    // 直接使用降级音频管理器（振荡器模式）
    this.audioManager = new window.FallbackAudioManager();
    this.completeInitialization();
  }

  /**
   * 使用默认模式（降级方案）
   * 创建降级音频管理器并完成初始化
   */
  continueWithDefaultMode() {
    console.info('PianoApp: 使用默认模式');
    this.audioManager = new window.FallbackAudioManager();
    this.completeInitialization();
  }

  /**
   * 完成初始化
   * 初始化钢琴管理器和UI控制器，完成应用启动
   */
  completeInitialization() {
    console.info('PianoApp: 完成初始化');

    try {
      // 初始化其他组件
      this.initPianoManager();
      this.initUIComponents();

      // 初始化UI控制器
      this.uiController = new UIController(this.audioManager, this.pianoManager);
      this.uiController.init();

      console.info('PianoApp: 应用初始化完成');
    } catch (error) {
      console.error('PianoApp: 完成初始化时出错', error);
      this.handleInitializationError(error);
    }
  }

  /**
   * 初始化钢琴管理器
   * 创建PianoManager实例并关联音频管理器
   */
  initPianoManager() {
    if (window.PianoManager) {
      this.pianoManager = new PianoManager(this.audioManager);
      console.info('PianoApp: 钢琴管理器初始化完成');
    } else {
      console.warn('PianoApp: PianoManager类未找到');
    }
  }

  /**
   * 初始化UI组件
   * UI组件初始化已移至UIController类中
   */
  initUIComponents() {
    // UI组件初始化已移至UIController类中
    console.info('PianoApp: UI组件初始化完成');
  }

  // 事件监听器已移至UIController类中

  // UI控件相关方法已移至UIController类中

  /**
   * 注册 Service Worker
   * 注册Service Worker以支持离线功能和缓存
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })// 注册 Service Worker
        .then((registration) => {
          console.log('SW 注册成功:', registration);

          // 检查Service Worker是否已激活
          if (registration.active) {
            console.log('Service Worker已激活');
          } else if (registration.installing) {
            registration.installing.addEventListener('statechange', (event) => {
              if (event.target.state === 'activated') {
                console.log('Service Worker已激活');
              }
            });
          }
        })
        .catch((error) => {
          console.log('SW 注册失败:', error);
        });
    }
  }
  // UI控件相关方法已移至UIController类中

}

// // 删除重复的FallbackAudioManager类定义
// /**
//  * 降级音频管理器类
//  * 使用Web Audio API振荡器作为音频播放的降级方案
//  * @class
//  */
// class FallbackAudioManager {
//   // ... 整个类的定义都删除
// }

// 导出到全局
window.PianoApp = PianoApp;

console.info('PianoApp: main.js 加载完成');

// 刷新时自动回到顶部功能
window.addEventListener('load', function () {
  // 'manual' 表示手动控制，即不自动恢复滚动位置
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // 强制滚动到顶部
  window.scrollTo(0, 0);
});