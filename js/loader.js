/**
 * 加载管理器类 - 简化版本，直接显示音域选择
 * 负责管理应用加载流程和初始化顺序
 * @class
 */
class LoaderManager {
  /**
   * LoaderManager类的构造函数
   * 实现单例模式，确保全局只有一个加载管理器实例
   * 初始化加载管理器的必要元素和状态
   * @constructor
   */
  constructor() {
    // 单例检查：如果window上已存在loaderManagerInstance，则警告并返回现有实例
    if (window.loaderManagerInstance) {
      console.warn('LoaderManager: 实例已存在，返回现有实例');
      return window.loaderManagerInstance;
    }
    // 将当前实例挂载到window对象上，实现单例
    window.loaderManagerInstance = this;

    // 获取加载器相关的DOM元素
    this.loader = document.getElementById('loader');
    this.loaderText = document.getElementById('loader-text');
    this.loaderBar = document.getElementById('loader-bar');

    // 输出初始化信息
    console.info('LoaderManager: 初始化加载管理器');
    // 启动加载管理器
    this.start();
  }

  async start() {
    console.info('LoaderManager: 开始简化流程');

    // blckBackground元素的显示与淡出
    const blackBackground = document.getElementById('black-background');

    if (blackBackground) {
      blackBackground.style.display = 'block';// 显示
      setTimeout(() => {
        blackBackground.classList.add('fade-out'); // 淡出
        setTimeout(() => {
          blackBackground.style.display = 'none';
        }, 200)
      }, 1250);//入场动画的800ms和模式选择的淡入的350ms
    }

    // // 加载入场音效
    // const introSound = new Audio('https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/welcome.mp3');
    // // 播放音效
    // introSound.play().catch(e => console.error('入场效播放失败:', e));

    // 显示并隐藏入场动画
    const animationContainer = document.getElementById('animation-container');
    if (animationContainer) {
      animationContainer.style.display = 'block'; // 显示动画
      setTimeout(() => {
        animationContainer.classList.add('fade-out'); // 触发淡出动画
        setTimeout(() => {
          animationContainer.style.display = 'none'; // 隐藏动画容器
          
          // 入场动画完成后，检查设备类型
          this.checkDeviceType();
        }, 200); // 淡出动画的持续时间
      }, 600); // 0.6秒后触发淡出动画
    }
  }

  /**
   * 检查设备类型
   * 如果是非移动设备，显示提示窗口并阻止继续
   */
  checkDeviceType() {
    // 检查是否为移动设备
    if (!isMobileDevice()) {
      console.log('检测到非移动设备，显示提示窗口');
      
      // 显示设备提示窗口
      const deviceWarning = document.getElementById('device-warning');
      if (deviceWarning) {
        deviceWarning.style.display = 'flex';
        deviceWarning.style.zIndex = '10001'; // 确保在最上层
      }
      
      // 不继续执行后续逻辑，阻止用户在桌面端使用
      return;
    }
    
    // 如果是移动设备，继续正常流程并启动横屏检测
    console.log('检测到移动设备，继续正常流程');
    
    // 启动横屏检测
    if (typeof initOrientationDetection === 'function') {
      initOrientationDetection();
      console.log('横屏检测已启动');
    }
    
    this.waitForModeSelection();
  }

  /**
   * 等待音域选择完成
   * 等待用户选择音域模式的异步方法
   * @returns {Promise} 返回一个Promise对象，用于异步等待音域选择完成
   */
  waitForModeSelection() {
    return new Promise(async (resolve) => {
      console.info('LoaderManager: 开始等待音域选择');

      // 禁止页面滚动
      document.body.style.overflow = 'hidden';

      // 监听音域选择事件
      window.addEventListener('pianoAppModeSelected', async () => {
        console.info('LoaderManager: 音域已选择，继续初始化');
        // 恢复页面滚动
        document.body.style.overflow = 'auto';
        
        // 等待音频加载完成后再resolve
        await this.continueAfterModeSelection();
        resolve();
      });
    });
  }

  /**
   * 音域选择完成后继续初始化
   */
  async continueAfterModeSelection() {
    console.info('LoaderManager: 音域选择后继续初始化');

    // 根据选择的模式决定是否显示加载界面
    if (window.pianoApp && window.pianoApp.selectedMode === 'audio') {
      // 显示加载界面进行音频加载 - 等待加载完成
      console.log('LoaderManager: 开始音频预加载');
      await this.setupPreloadWithAudio();
      console.log('LoaderManager: 音频预加载完成');
    } else {
      // 振荡器模式或默认模式，直接继续
      this.initializeMainApp();
    }
  }

  /**
   * 带音频预加载的设置
   */
  async setupPreloadWithAudio() {
    try {
      // 初始化全局音频加载状态
      if (!window.audioLoadingState) {
        window.audioLoadingState = {
          isLoading: false,
          progress: 0,
          error: null,
          hasStarted: false  // 新增：加载是否已开始
        };
      }
      
      // 设置全局加载状态 - 立即标记为已开始
      console.log('LoaderManager: 音频加载开始');
      window.audioLoadingState.isLoading = true;
      window.audioLoadingState.progress = 0;
      window.audioLoadingState.error = null;
      window.audioLoadingState.hasStarted = true;  // 标记加载已开始
      
      // 显示加载进度
      this.updateProgress(0, '音频');

      // 等待音频加载完成
      if (window.pianoApp && window.pianoApp.audioManager) {
        // 监听音频加载进度
        const audioManager = window.pianoApp.audioManager;
        if (audioManager.preloadAll) {
          await audioManager.preloadAll((progress) => {
            window.audioLoadingState.progress = progress;
            this.updateProgress(progress, '音频');
          });
        }
      }

      this.updateProgress(100, '音频');
      
      // 加载完成后更新全局状态
      window.audioLoadingState.isLoading = false;
      window.audioLoadingState.progress = 100;
      console.info('LoaderManager: 音频加载完成');

      // 音频加载完成后初始化主应用
      this.initializeMainApp();

    } catch (error) {
      console.error('LoaderManager: 音频预加载失败', error);
      
      // 加载失败也要更新状态
      window.audioLoadingState.isLoading = false;
      window.audioLoadingState.error = error;
      
      this.initializeMainApp();
    }
  }

  /**
   * 初始化主应用
   */
  async initializeMainApp() {
    console.info('LoaderManager: 开始初始化主应用');

    try {
      // 确保PianoApp类存在
      if (window.PianoApp) {
        // 创建主应用实例
        this.pianoApp = new window.PianoApp();
        console.info('LoaderManager: 主应用初始化完成');
      } else {
        console.warn('LoaderManager: PianoApp类未找到');
      }
    } catch (error) {
      console.error('LoaderManager: 主应用初始化失败', error);
    }
  }

  /**
   * 更新加载进度
   * @param {number} progress - 加载进度百分比 (0-100)
   * @param {string} type - 加载类型描述
   */
  updateProgress(progress, type = '') {
    if (this.loaderText) {
      this.loaderText.textContent = `正在加载${type} ${progress}%`;
    }

    if (this.loaderBar) {
      this.loaderBar.style.width = `${progress}%`;
    }
  }

  /**
   * 处理加载错误
   * @param {string} errorMessage - 错误信息
   */
  handleLoadError(errorMessage) {
    console.error('LoaderManager: 加载错误 -', errorMessage);

    if (this.loaderText) {
      this.loaderText.textContent = errorMessage;
    }
  }
}

// 安全的初始化
if (!window.loaderManagerInstance) {
  const initLoader = () => {
    if (!window.loaderManagerInstance) {
      try {
        window.loaderManager = new LoaderManager();
      } catch (error) {
        console.error('LoaderManager: 初始化失败', error);
        // 降级：直接隐藏加载器
        const loader = document.getElementById('loader');
        if (loader) {
          loader.style.display = 'none';
        }
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader);
  } else {
    initLoader();
  }
}