/**
 * UI控制器类 - 负责处理所有UI控件相关逻辑
 * @class
 */
class UIController {
  /**
   * 创建UIController实例
   * @constructor
   * @param {Object} audioManager - 音频管理器实例
   * @param {Object} pianoManager - 钢琴管理器实例
   */
  constructor(audioManager, pianoManager) {
    this.audioManager = audioManager;
    this.pianoManager = pianoManager;
    this.buttonSound = new Audio('https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/button.mp3');
    this.activeTouches = {};

    // 背景音乐相关属性
    this.backgroundMusic = null;
    this.isMusicPlaying = false;
    this.musicUrl = 'https://freesound-down.audiodown.com:3321/preview?file=FTUM%2F%F0%9F%8E%81+Peaceful+Piano+Melody+%5BNo+Copyright+Music%5D+%EF%BD%9C+Last+Christmas+by+Epic+Spectrum.mp3';
  }

  /**
   * 显示短暂提示框
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长（毫秒，默认3000）
   */
  showToast(message, duration = 3000) {
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    if (toast && toastMessage) {
      toastMessage.textContent = message;
      toast.style.display = 'block';

      // 自动隐藏
      setTimeout(() => {
        toast.style.display = 'none';
      }, duration);
    }
  }

  /**
   * 初始化UI控件
   */
  init() {
    this.setupEventListeners();
    this.setupPianoKeyListeners();
    this.loadCachedSettings();
    this.setupBackgroundMusic();

    // 延迟同步音色选择器，确保音频管理器已完全初始化
    setTimeout(() => {
      this.syncTimbreSelector();
    }, 100);
  }

  /**
   * 设置背景音乐功能 - 已废弃，使用新的音乐播放器
   */
  setupBackgroundMusic() {
    console.info('UIController: 背景音乐功能已迁移到新的音乐播放器');
  }

  /**
   * 开始播放背景音乐 - 已废弃，使用新的音乐播放器
   */
  startBackgroundMusic() {
    console.info('UIController: 背景音乐功能已迁移到新的音乐播放器');
  }

  /**
   * 停止播放背景音乐 - 已废弃，使用新的音乐播放器
   */
  stopBackgroundMusic() {
    console.info('UIController: 背景音乐功能已迁移到新的音乐播放器');
  }

  /**
   * 设置背景音乐音量 - 已废弃，使用新的音乐播放器
   * @param {number} volume - 音量值 (0-1)
   */
  setBackgroundMusicVolume(volume) {
    console.info('UIController: 背景音乐功能已迁移到新的音乐播放器');
  }

  /**
   * 设置所有事件监听器
   */

  /**
   * 设置所有事件监听器
   */
  setupEventListeners() {
    console.info('UIController: 开始设置事件监听器');
    
    // 设置振荡器波形选择事件
    this.setupOscillatorControls();

    // 设置隐藏钢琴按钮事件
    const hidePianoBtn = document.getElementById('hide-piano-btn');
    if (hidePianoBtn) {
      hidePianoBtn.addEventListener('click', () => {
        this.buttonSound.play();
        const pianoContainer = document.getElementById('piano-container');
        pianoContainer.style.display = 'none';
      });
      console.info('UIController: 隐藏钢琴按钮事件已设置');
    }

    // 设置显示钢琴按钮事件
    const showPianoBtn = document.getElementById('show-piano-btn');
    if (showPianoBtn) {
      showPianoBtn.addEventListener('click', () => {
        this.buttonSound.play();
        // ------------------------------------------------------
        this.showNeonOverlay()
        //------------------------------------------------------
        // 音频加载状态检查 - 增强版本（解决网络延迟问题）
        console.group('UIController: 音频加载状态检查');

        // 检查全局状态对象是否存在
        console.log('1. 检查全局状态对象是否存在:', !!window.audioLoadingState);
        if (window.audioLoadingState) {
          console.log('2. 全局状态详情:', {
            isLoading: window.audioLoadingState.isLoading,
            progress: window.audioLoadingState.progress,
            error: window.audioLoadingState.error,
            hasStarted: window.audioLoadingState.hasStarted
          });

          // 检查加载是否已开始但未完成
          if (window.audioLoadingState.hasStarted &&
            (window.audioLoadingState.isLoading || window.audioLoadingState.progress < 100)) {
            console.warn('UIController: 音频加载已开始但未完成，请等待');
            this.showToast('音频加载中，请稍候...', 2000);
            console.groupEnd();
            return; // 停止后续逻辑执行
          }

          if (window.audioLoadingState.isLoading) {
            console.warn('UIController: 全局状态报告音频正在加载中');
            this.showToast('音频正在加载，请稍候...', 2000);
            console.groupEnd();
            return; // 停止后续逻辑执行
          }
        } else {
          console.log('3. 全局音频加载状态未定义，跳过全局状态检查');
        }

        // 检查音频管理器是否初始化
        console.log('4. 检查音频管理器是否初始化:', !!this.audioManager);
        if (!this.audioManager) {
          console.warn('UIController: 音频管理器未初始化');
          this.showToast('音频管理器未初始化，请稍候...', 2000);
          console.groupEnd();
          return; // 停止后续逻辑执行
        }

        // 检查AudioLoader实例是否存在
        console.log('5. 检查音频管理器的loader属性:', !!this.audioManager.loader);
        if (this.audioManager.loader && typeof this.audioManager.loader.getIsLoading === 'function') {
          const isLoading = this.audioManager.loader.getIsLoading();
          console.log('6. AudioLoader加载状态:', isLoading);

          if (isLoading) {
            console.warn('UIController: AudioLoader报告音频正在加载中');
            this.showToast('音频正在加载，请稍候...', 2000);
            console.groupEnd();
            return; // 停止后续逻辑执行
          }
        }

        console.info('UIController: 音频加载检查通过，可以显示钢琴');
        console.groupEnd();

        // ===============
        const pianoContainer = document.getElementById('piano-container');
        pianoContainer.style.display = 'block';

        // 延迟计算黑键位置，确保钢琴容器已显示且白键已正确渲染
        setTimeout(() => {
          if (this.pianoManager && this.pianoManager.calculateBlackKeyPositions) {
            this.pianoManager.calculateBlackKeyPositions();
            console.info('UIController: 显示钢琴后黑键位置已重新计算');
          }
        }, 300);
      });
      console.info('UIController: 显示钢琴按钮事件已设置');
    }

    // 设置全屏按钮事件
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        this.buttonSound.play();
        this.toggleFullscreen();
      });
      console.info('UIController: 全屏按钮事件已设置');
    }

    // 设置退出全屏按钮事件
    const exitFullscreenBtn = document.getElementById('back-to-menu-btn');
    if (exitFullscreenBtn) {
      exitFullscreenBtn.addEventListener('click', () => {
        this.buttonSound.play();
        this.exitFullscreen();
      });
      console.info('UIController: 退出全屏按钮事件已设置');
    }

    // 设置钢琴标签开关事件
    const labelToggleSwitch = document.getElementById('label-toggle-switch');
    if (labelToggleSwitch) {
      labelToggleSwitch.addEventListener('change', (e) => {
        this.buttonSound.play();
        this.toggleLabels(e.target.checked);
      });
      console.info('UIController: 钢琴标签开关事件已设置');
    }

    // 设置钢琴音量控制事件
    const volumeControl = document.getElementById('volume');
    if (volumeControl) {
      volumeControl.addEventListener('input', (e) => {
        if (this.audioManager) {
          this.audioManager.setVolume(parseFloat(e.target.value) / 100);
        }
      });
      console.info('UIController: 钢琴音量控制事件已设置');
    }

    // 背景音乐音量控制已迁移到新的音乐播放器

    // 选项卡切换功能 
    document.querySelectorAll('.tab-btn').forEach(button => {
      button.addEventListener('click', () => {
        // 播放按钮音效
        try {
          this.buttonSound.play();
          console.info('UIController: 选项卡切换按钮音效播放成功');
        } catch (error) {
          console.warn('UIController: 选项卡切换按钮音效播放失败:', error);
        }

        // 移除所有active类 
        document.querySelectorAll('.tab-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });

        // 添加active类到当前按钮和对应内容 
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });

    // 设置音色选择事件
    const timbreSelector = document.getElementById('timbre-selector');
    if (timbreSelector) {
      timbreSelector.addEventListener('change', (e) => {
        this.handleTimbreChange(e.target.value);
      });
      console.info('UIController: 音色选择器事件已设置');
    }

    // 监听音色切换事件，保持下拉框同步
    window.addEventListener('timbreChanged', (e) => {
      this.syncTimbreSelector();
    });

    console.info('UIController: 事件监听器设置完成');
  }

  /**
   * 切换全屏模式
   */
  toggleFullscreen() {
    const element = document.documentElement;

    if (!document.fullscreenElement) {
      // 进入全屏
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }

      console.info('UIController: 进入全屏模式');

      // 在全屏后延迟计算黑键位置
      setTimeout(() => {
        if (this.pianoManager && this.pianoManager.calculateBlackKeyPositions) {
          this.pianoManager.calculateBlackKeyPositions();
          console.info('UIController: 全屏后黑键位置已重新计算');
        }
      }, 200);
    } else {
      // 退出全屏
      this.exitFullscreen();
    }
  }

  /**
   * 退出全屏模式
   */
  exitFullscreen() {
    if (document.fullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }

    console.info('UIController: 退出全屏模式');

    // 在退出全屏后延迟计算黑键位置
    setTimeout(() => {
      if (this.pianoManager && this.pianoManager.calculateBlackKeyPositions) {
        this.pianoManager.calculateBlackKeyPositions();
        console.info('UIController: 退出全屏后黑键位置已重新计算');
      }
    }, 200);
  }

  /**
   * 切换标签显示/隐藏
   * @param {boolean} showLabels - 是否显示标签
   */
  toggleLabels(showLabels = null) {
    const pianoContainer = document.getElementById('piano-container');
    if (!pianoContainer) return;

    const labelToggleSwitch = document.getElementById('label-toggle-switch');
    if (!labelToggleSwitch) return;

    // 如果没有传入参数，则切换当前状态
    if (showLabels === null) {
      showLabels = pianoContainer.classList.contains('hide-labels');
    }

    if (showLabels) {
      // 显示标签
      pianoContainer.classList.remove('hide-labels');
      labelToggleSwitch.checked = true;
      console.info('UIController: 显示标签');
    } else {
      // 隐藏标签
      pianoContainer.classList.add('hide-labels');
      labelToggleSwitch.checked = false;
      console.info('UIController: 隐藏标签');
    }
  }

  /**
   * 设置钢琴键点击事件
   */
  setupPianoKeyListeners() {
    const pianoContainer = document.getElementById('piano-container');
    if (!pianoContainer) return;

    // 使用事件委托处理钢琴键点击
    pianoContainer.addEventListener('click', (event) => {
      const pianoKey = event.target.closest('.piano-key');
      if (!pianoKey) return;

      const note = pianoKey.getAttribute('data-note');
      if (!note) return;

      // 播放音符
      if (this.audioManager && this.audioManager.playNote) {
        this.audioManager.playNote(note).catch(error => {
          console.warn('UIController: 播放音符失败', note, error);
        });

        // 视觉反馈
        pianoKey.classList.add('active');
        setTimeout(() => {
          pianoKey.classList.remove('active');
        }, 150);

        console.info(`UIController: 播放音符 ${note}`);
      }
    });

    // 添加触摸事件支持
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });

    console.info('UIController: 钢琴键事件监听器已设置');
  }

  /**
   * 触摸开始处理
   * @param {TouchEvent} e - 触摸事件对象
   */
  handleTouchStart(e) {
    let shouldPrevent = false;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const keyEl = this.getKeyElementFromTouch(touch);
      if (keyEl) {
        shouldPrevent = true;
        break;
      }
    }

    if (shouldPrevent) e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const keyEl = this.getKeyElementFromTouch(touch);
      if (keyEl) {
        const note = keyEl.getAttribute('data-note');
        this.playNote(note);
        this.activeTouches[touch.identifier] = {
          note: note,
          startTime: Date.now(),
          isSustaining: false
        };
      }
    }
  }

  /**
   * 触摸移动处理
   * @param {TouchEvent} e - 触摸事件对象
   */
  handleTouchMove(e) {
    let shouldPrevent = false;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const keyEl = this.getKeyElementFromTouch(touch);
      if (keyEl) {
        shouldPrevent = true;
        break;
      }
    }

    if (shouldPrevent) e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const keyEl = this.getKeyElementFromTouch(touch);
      const prevTouchInfo = this.activeTouches[touch.identifier];

      if (keyEl) {
        const note = keyEl.getAttribute('data-note');
        
        // 只有当手指移动到不同的琴键时才播放新音符
        if (prevTouchInfo && note !== prevTouchInfo.note) {
          this.playNote(note);
          
          // 检查是否开启了持续发音模式
          const sustainToggle = document.getElementById('sustain-toggle');
          const isSustainMode = sustainToggle ? sustainToggle.checked : false;
          
          if (isSustainMode) {
            // 在持续发音模式下，停止上一个琴键的持续发音
            this.stopSustainedNote(prevTouchInfo.note);
          } else {
            // 在普通模式下，释放上一个琴键的音符
            this.releaseNote(prevTouchInfo.note);
          }
          
          this.activeTouches[touch.identifier] = {
            note: note,
            startTime: prevTouchInfo.startTime,
            isSustaining: prevTouchInfo.isSustaining
          };
        } else if (!prevTouchInfo) {
          // 如果没有之前的触摸信息，说明是新的触摸点
          this.playNote(note);
          this.activeTouches[touch.identifier] = {
            note: note,
            startTime: Date.now(),
            isSustaining: false
          };
        }
        // 如果手指在同一个琴键上滑动，不触发任何操作
      } else if (prevTouchInfo) {
        // 检查是否开启了持续发音模式
        const sustainToggle = document.getElementById('sustain-toggle');
        const isSustainMode = sustainToggle ? sustainToggle.checked : false;
        
        if (isSustainMode) {
          // 在持续发音模式下，停止持续发音
          this.stopSustainedNote(prevTouchInfo.note);
        } else {
          // 在普通模式下，释放音符
          this.releaseNote(prevTouchInfo.note);
        }
        delete this.activeTouches[touch.identifier];
      }
    }
  }

  /**
   * 触摸结束处理
   * @param {TouchEvent} e - 触摸事件对象
   */
  handleTouchEnd(e) {
    let shouldPrevent = false;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const keyEl = this.getKeyElementFromTouch(touch);
      if (keyEl) {
        shouldPrevent = true;
        break;
      }
    }

    if (shouldPrevent) e.preventDefault();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const touchInfo = this.activeTouches[touch.identifier];
      if (touchInfo) {
        // 检查是否开启了持续发音模式
        const sustainToggle = document.getElementById('sustain-toggle');
        const isSustainMode = sustainToggle ? sustainToggle.checked : false;
        
        if (isSustainMode) {
          // 停止持续发音
          this.stopSustainedNote(touchInfo.note);
        } else {
          // 原有的释放逻辑
          this.releaseNote(touchInfo.note);
        }
        
        delete this.activeTouches[touch.identifier];
      }
    }
  }

  /**
   * 从触摸点获取琴键元素
   * @param {Touch} touch - 触摸点对象
   * @returns {Element|null} 琴键元素或null
   */
  getKeyElementFromTouch(touch) {
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    return el && el.closest && el.closest('.piano-key');
  }

  /**
   * 播放音符
   * @param {string} note - 要播放的音符名称
   */
  async playNote(note) {
    try {
      if (this.audioManager && this.audioManager.playNote) {
        const result = await this.audioManager.playNote(note);
        if (result === null) {
          console.warn('UIController: 播放音符失败或跳过', note);
        }
      }

      // 视觉反馈
      const pianoKey = document.querySelector(`.piano-key[data-note="${note}"]`);
      if (pianoKey) {
        pianoKey.classList.add('active');
      }
    } catch (error) {
      console.warn('UIController: 播放音符失败', note, error);
    }
  }

  /**
   * 释放音符
   * @param {string} note - 要释放的音符名称
   */
  releaseNote(note) {
    try {
      // 移除视觉反馈
      const pianoKey = document.querySelector(`.piano-key[data-note="${note}"]`);
      if (pianoKey) {
        pianoKey.classList.remove('active');
      }
    } catch (error) {
      console.warn('UIController: 释放音符失败', note, error);
    }
  }

  /**
   * 停止持续发音音符
   * @param {string} note - 要停止的音符名称
   */
  stopSustainedNote(note) {
    try {
      // 移除视觉反馈
      const pianoKey = document.querySelector(`.piano-key[data-note="${note}"]`);
      if (pianoKey) {
        pianoKey.classList.remove('active');
      }
      
      // 停止所有振荡器实例中的持续发音
      const oscillators = ['audio-core', 'audio-player', 'fallback'];
      oscillators.forEach(id => {
        const oscillator = window.OscillatorManager.getOscillator(id);
        if (oscillator && typeof oscillator.stopSustainedNote === 'function') {
          oscillator.stopSustainedNote(note);
        }
      });
      
      console.info(`UIController: 停止持续发音音符 ${note}`);
      
    } catch (error) {
      console.warn('UIController: 停止持续发音音符失败', note, error);
    }
  }

  /**
   * 缓存用户设置
   */
  cacheUserSettings() {
    const settings = {
      volume: this.audioManager?.volume || 0.9,
      lastUsed: Date.now()
    };

    try {
      localStorage.setItem('piano-settings', JSON.stringify(settings));
    } catch (error) {
      console.warn('设置缓存失败:', error);
    }
  }

  /**
   * 读取缓存设置
   */
  loadCachedSettings() {
    try {
      const cached = localStorage.getItem('piano-settings');
      if (cached) {
        const settings = JSON.parse(cached);
        if (settings.volume && this.audioManager) {
          this.audioManager.setVolume(settings.volume);
        }
      }
    } catch (error) {
      console.warn('读取缓存设置失败:', error);
    }
  }

  /**
   * 显示遮罩层
   */
  showOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.style.display = 'block';
      document.body.style.overflow = 'hidden';
      document.getElementById('overlay').addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  /**
   * 隐藏遮罩层
   */
  hideOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * 同步音色选择器显示状态
   */
  syncTimbreSelector() {
    const timbreSelector = document.getElementById('timbre-selector');
    if (!timbreSelector) {
      console.warn('UIController: 音色选择器元素未找到');
      return;
    }

    // 检查音频管理器是否可用
    if (!this.audioManager) {
      console.warn('UIController: 音频管理器未初始化');
      // 设置默认值
      timbreSelector.value = 'audio';
      return;
    }

    // 检查音色获取方法是否存在
    if (typeof this.audioManager.getCurrentTimbre !== 'function') {
      console.warn('UIController: 音频管理器不支持音色获取');
      timbreSelector.value = 'audio';
      return;
    }

    try {
      const currentTimbre = this.audioManager.getCurrentTimbre();
      console.info(`UIController: 获取到当前音色: ${currentTimbre}`);
      
      if (currentTimbre === 'audio' || currentTimbre === 'golden' || currentTimbre === 'oscillator') {
        timbreSelector.value = currentTimbre;
        console.info(`UIController: 同步音色选择器为 ${currentTimbre}`);
      } else {
        console.warn(`UIController: 无效的音色值 ${currentTimbre}，使用默认值 audio`);
        console.warn(`UIController: 支持的音色值: audio, golden, oscillator`);
        timbreSelector.value = 'audio';
      }
    } catch (error) {
      console.error('UIController: 同步音色选择器时出错', error);
      console.error('UIController: 错误详情:', error.message, error.stack);
      timbreSelector.value = 'audio';
    }
  }

  /**
   * 处理音色切换
   * @param {string} timbre - 选择的音色类型
   */
  handleTimbreChange(timbre) {
    console.group('UIController: 音色切换处理');
    console.info(`用户选择音色: ${timbre}`);

    // 播放按钮音效
    try {
      this.buttonSound.play();
      console.info('按钮音效播放成功');
    } catch (error) {
      console.warn('按钮音效播放失败:', error);
    }

    // 检查音频管理器
    if (!this.audioManager) {
      console.error('音频管理器未初始化');
      console.groupEnd();
      return;
    }

    // 检查音色设置方法
    if (typeof this.audioManager.setTimbre !== 'function') {
      console.error('音频管理器不支持音色设置方法');
      console.groupEnd();
      return;
    }

    // 在切换音色前重置持续发音状态
    this.resetSustainModeOnTimbreChange();

    // 更新音频管理器的音色设置
    try {
      console.info('开始设置音色...');
      this.audioManager.setTimbre(timbre);
      console.info('音色设置成功');

      // 如果是音频模式（流行音域或黄金音域），重新加载音频文件
      if (timbre === 'audio' || timbre === 'golden') {
        console.info(`音色切换到音频模式，触发音频重新加载: ${timbre}`);
        this.reloadAudioFiles(timbre);
      }

      // 验证音色是否真的改变了
      setTimeout(() => {
        if (typeof this.audioManager.getCurrentTimbre === 'function') {
          const currentTimbre = this.audioManager.getCurrentTimbre();
          console.info(`音色验证: 当前音色为 ${currentTimbre}`);

          if (currentTimbre !== timbre) {
            console.error(`音色设置失败: 期望 ${timbre}，实际 ${currentTimbre}`);
          } else {
            console.info('音色设置验证成功');
          }
        }
      }, 100);

    } catch (error) {
      console.error('音色设置失败:', error);
    }

    console.groupEnd();
  }

  /**
   * 在切换音色时重置持续发音状态
   */
  resetSustainModeOnTimbreChange() {
    console.info('UIController: 切换音色，重置持续发音状态');
    
    // 关闭持续发音开关
    const sustainToggle = document.getElementById('sustain-toggle');
    if (sustainToggle) {
      sustainToggle.checked = false;
    }
    
    // 停止所有持续发音的音符
    const oscillators = ['audio-core', 'audio-player', 'fallback'];
    oscillators.forEach(id => {
      const oscillator = window.OscillatorManager.getOscillator(id);
      if (oscillator && oscillator.activeSustainedNotes) {
        // 停止所有持续发音的音符
        for (const noteName of oscillator.activeSustainedNotes.keys()) {
          oscillator.stopSustainedNote(noteName);
        }
      }
    });
    
    // 恢复防抖设置
    this.updateDebounceForSustainMode(false);
  }

  /**
   * 处理音色选择按钮点击
   */
  handleTimbreSelection() {
    function selectOption(button) {
      // 移除所有按钮的选中状态
      const allButtons = document.querySelectorAll('.timbre-option-but');
      allButtons.forEach(btn => {
        btn.classList.remove('selected');
      });

      // 为当前点击的按钮添加选中状态
      button.classList.add('selected');

      // 这里可以添加其他逻辑，如根据选择执行不同操作
      console.log('已选择：' + button.textContent);
    }

    // 默认选中第一个选项
    document.addEventListener('DOMContentLoaded', function () {
      const firstButton = document.querySelector('.timbre-option-but');
      if (firstButton) {
        firstButton.classList.add('selected');
      }
    });
  }

  showNeonOverlay() {
    const neonOverlay = document.getElementById('neon-overlay');
    const particles = document.getElementById('particles');

    // 创建粒子效果
    this.createParticles(particles);

    // 显示遮罩
    neonOverlay.style.display = 'flex';

    // 秒后隐藏
    setTimeout(() => {
      neonOverlay.style.display = 'none';
      // 清空粒子
      particles.innerHTML = '';
    }, 600);
  }
  createParticles(container) {
    // 开始创建粒子效果
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';

      // 随机位置
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const size = Math.random() * 3 + 2;
      const duration = Math.random() * 4 + 3;
      const delay = Math.random() * 2;

      particle.style.left = left + '%';
      particle.style.top = top + '%';
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.animationDuration = duration + 's';
      particle.style.animationDelay = delay + 's';

      // 随机颜色
      const colors = ['#00FFFF', '#1E90FF', '#FF00FF'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.background = color;
      particle.style.boxShadow = `0 0 10px ${color}`;

      container.appendChild(particle);
    }
  }

  /**
   * 设置振荡器控制功能
   */
  setupOscillatorControls() {
    console.info('UIController: 设置振荡器控制功能');

    // 设置波形类型选择事件（单选按钮）
    const waveformRadios = document.querySelectorAll('input[name="waveform"]');
    if (waveformRadios.length > 0) {
      waveformRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (e.target.checked) {
            // 播放按钮音效
            try {
              this.buttonSound.play();
            } catch (error) {
              console.warn('按钮音效播放失败:', error);
            }
            this.handleWaveformChange(e.target.value);
          }
        });
      });
      console.info('UIController: 波形选择器事件已设置（单选按钮）');
    }

    // 设置持续时间控制事件
    const oscillatorDurationControl = document.getElementById('oscillator-duration');
    if (oscillatorDurationControl) {
      oscillatorDurationControl.addEventListener('input', (e) => {
        this.handleOscillatorDurationChange(parseFloat(e.target.value) / 100);
      });
      console.info('UIController: 振荡器持续时间控制事件已设置');
    }

    // 设置长按持续发音开关事件
    const sustainToggle = document.getElementById('sustain-toggle');
    if (sustainToggle) {
      sustainToggle.addEventListener('change', (e) => {
        this.handleSustainToggle(e.target.checked);
      });
      console.info('UIController: 长按持续发音开关事件已设置');
    }

    // 设置音调选择事件（单选按钮）
    const pitchRadios = document.querySelectorAll('input[name="pitch"]');
    if (pitchRadios.length > 0) {
      pitchRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (e.target.checked) {
            this.handlePitchChange(e.target.value);
          }
        });
      });
      console.info('UIController: 音调选择事件已设置（单选按钮）');
    }
  }

  /**
   * 处理波形类型变化
   * @param {string} waveform - 波形类型
   */
  handleWaveformChange(waveform) {
    console.info(`UIController: 波形类型切换为 ${waveform}`);

    // 更新所有振荡器实例的波形类型
    const oscillators = ['audio-core', 'audio-player', 'fallback'];
    oscillators.forEach(id => {
      const oscillator = window.OscillatorManager.getOscillator(id);
      if (oscillator) {
        oscillator.setType(waveform);
      }
    });
  }

  /**
   * 处理振荡器持续时间变化
   * @param {number} duration - 持续时间系数 (0-1)
   */
  handleOscillatorDurationChange(duration) {
    // 将系数转换为实际持续时间 (0.1-2秒)
    const actualDuration = 0.1 + (duration * 1.9);
    console.info(`UIController: 振荡器持续时间设置为 ${actualDuration.toFixed(2)}秒`);
    
    // 更新所有振荡器实例的持续时间
    const oscillators = ['audio-core', 'audio-player', 'fallback'];
    oscillators.forEach(id => {
      const oscillator = window.OscillatorManager.getOscillator(id);
      if (oscillator) {
        oscillator.setDuration(actualDuration);
      }
    });
  }

  /**
   * 处理长按持续发音开关
   * @param {boolean} isEnabled - 是否启用持续发音
   */
  handleSustainToggle(isEnabled) {
    console.info(`UIController: 长按持续发音 ${isEnabled ? '开启' : '关闭'}`);
    
    // 播放按钮音效
    try {
      this.buttonSound.play();
    } catch (error) {
      console.warn('按钮音效播放失败:', error);
    }
    
    // 确保音频上下文已创建
    this.ensureAudioContextForSustainMode();
    
    // 更新所有振荡器实例的持续发音模式
    const oscillators = ['audio-core', 'audio-player', 'fallback'];
    oscillators.forEach(id => {
      const oscillator = window.OscillatorManager.getOscillator(id);
      if (oscillator) {
        oscillator.sustainMode = isEnabled;
      } else if (isEnabled) {
        // 如果振荡器实例不存在但需要开启持续发音，尝试创建实例
        this.createOscillatorInstance(id);
      }
    });
    
    // 如果关闭开关，停止所有持续发音的音符
    if (!isEnabled) {
      oscillators.forEach(id => {
        const oscillator = window.OscillatorManager.getOscillator(id);
        if (oscillator && oscillator.activeSustainedNotes) {
          // 停止所有持续发音的音符
          for (const noteName of oscillator.activeSustainedNotes.keys()) {
            oscillator.stopSustainedNote(noteName);
          }
        }
      });
    }
    
    // 在持续发音模式下禁用防抖
    this.updateDebounceForSustainMode(isEnabled);
  }

  /**
   * 处理音调变化
   * @param {string} pitch - 音调类型 ('low', 'medium', 'high')
   */
  handlePitchChange(pitch) {
    console.info(`UIController: 音调切换为 ${pitch}`);
    
    // 播放按钮音效
    try {
      this.buttonSound.play();
    } catch (error) {
      console.warn('按钮音效播放失败:', error);
    }
    
    // 更新所有振荡器实例的音调设置
    const oscillators = ['audio-core', 'audio-player', 'fallback'];
    oscillators.forEach(id => {
      const oscillator = window.OscillatorManager.getOscillator(id);
      if (oscillator) {
        oscillator.setPitch(pitch);
      }
    });
  }

  /**
   * 确保音频上下文已创建，用于持续发音模式
   */
  ensureAudioContextForSustainMode() {
    if (this.audioManager && this.audioManager.contextManager) {
      try {
        this.audioManager.contextManager.ensureContext();
        console.info('UIController: 音频上下文已确保');
      } catch (error) {
        console.warn('UIController: 确保音频上下文失败', error);
      }
    }
  }

  /**
   * 创建振荡器实例
   * @param {string} id - 振荡器实例ID
   */
  createOscillatorInstance(id) {
    try {
      let audioContext = null;
      
      // 根据ID获取对应的音频上下文
      if (id === 'audio-core' && this.audioManager && this.audioManager.contextManager) {
        audioContext = this.audioManager.contextManager.getContext();
      } else if (id === 'fallback' && this.audioManager && this.audioManager.audioContext) {
        audioContext = this.audioManager.audioContext;
      }
      
      if (audioContext) {
        const oscillator = window.OscillatorManager.createOscillator(audioContext, id);
        if (oscillator) {
          oscillator.sustainMode = true; // 设置为持续发音模式
          console.info(`UIController: 创建振荡器实例 ${id} 成功`);
        }
      }
    } catch (error) {
      console.warn(`UIController: 创建振荡器实例 ${id} 失败`, error);
    }
  }

  /**
   * 根据持续发音模式更新防抖设置
   * @param {boolean} isSustainMode - 是否持续发音模式
   */
  updateDebounceForSustainMode(isSustainMode) {
    // 获取音频播放控制器
    if (this.audioManager && this.audioManager.playbackController) {
      if (isSustainMode) {
        // 持续发音模式下禁用防抖
        this.audioManager.playbackController.setDebounceTime(0);
        console.info('UIController: 持续发音模式下防抖已禁用');
      } else {
        // 恢复默认防抖时间
        this.audioManager.playbackController.setDebounceTime(150);
        console.info('UIController: 防抖时间已恢复为150ms');
      }
    }
  }

  /**
   * 重新加载音频文件
   * 复制进入页面时的音频加载逻辑，确保切换音色后音频文件正确加载
   * @param {string} timbre - 音色类型
   */
  reloadAudioFiles(timbre) {
    console.group('UIController: 重新加载音频文件');
    console.info(`音色模式: ${timbre}`);

    // 检查音频管理器是否支持音频方案切换
    if (this.audioManager && this.audioManager.switchAudioScheme) {
      console.info('音频管理器支持音频方案切换');
      
      // 根据音色确定目标音频方案
      let targetScheme = 'popular'; // 默认方案
      if (timbre === 'golden') {
        targetScheme = 'golden';
      } else if (timbre === 'audio') {
        targetScheme = 'popular';
      }
      
      console.info(`目标音频方案: ${targetScheme}`);
      
      // 切换音频方案
      this.audioManager.switchAudioScheme(targetScheme).then((success) => {
        if (success) {
          console.info(`音频方案切换到 ${targetScheme} 成功`);
          
          // 如果音频加载器存在，重新加载音频文件
          if (this.audioManager.loader) {
            console.info('开始重新加载音频文件');
            this.audioManager.loader.preloadAll((progress) => {
              console.log(`音频加载进度: ${progress}%`);
              
              // 显示加载提示
              if (progress < 100) {
                this.showToast(`音频加载中... ${progress}%`, 1000);
              } else {
                this.showToast('音频加载完成', 2000);
              }
            }).then(() => {
              console.info('音频文件重新加载完成');
            }).catch((error) => {
              console.error('音频文件重新加载失败', error);
              this.showToast('音频加载失败，请重试', 2000);
            });
          } else {
            console.warn('音频加载器不存在，跳过重新加载');
          }
        } else {
          console.error('音频方案切换失败');
          this.showToast('音色切换失败', 2000);
        }
      }).catch((error) => {
        console.error('音频方案切换异常', error);
        this.showToast('音色切换异常', 2000);
      });
    } else {
      console.warn('音频管理器不支持音频方案切换，使用默认逻辑');
      
      // 降级处理：直接调用音频管理器的预加载方法
      if (this.audioManager.preloadAll) {
        console.info('调用音频管理器的预加载方法');
        this.audioManager.preloadAll((progress) => {
          console.log(`音频加载进度: ${progress}%`);
          
          // 显示加载提示
          if (progress < 100) {
            this.showToast(`音频加载中... ${progress}%`, 1000);
          } else {
            this.showToast('音频加载完成', 2000);
          }
        }).then(() => {
          console.info('音频文件重新加载完成');
        }).catch((error) => {
          console.error('音频文件重新加载失败', error);
          this.showToast('音频加载失败，请重试', 2000);
        });
      } else {
        console.warn('音频管理器不支持预加载方法');
      }
    }
    
    console.groupEnd();
  }

  /**
   * 获取波形类型的显示名称
   * @param {string} waveform - 波形类型
   * @returns {string} 显示名称
   */
  getWaveformDisplayName(waveform) {
    const names = {
      'sine': '正弦波',
      'square': '方波',
      'triangle': '三角波',
      'sawtooth': '锯齿波'
    };
    return names[waveform] || waveform;
  }
}

// 导出到全局
window.UIController = UIController;

// 控制帮助提示的显示与隐藏
let isTooltipVisible = false;

// 切换帮助提示显示状态
function toggleHelp() {
  const tooltip = document.getElementById('helpTooltip');
  const helpIcon = document.querySelector('.help-icon');
  isTooltipVisible = !isTooltipVisible;

  if (isTooltipVisible) {
    tooltip.style.display = 'block';
    helpIcon.style.transform = 'scale(1.5)';
    helpIcon.style.color = '#0056b3';
  } else {
    tooltip.style.display = 'none';
    helpIcon.style.transform = 'scale(1)';
    helpIcon.style.color = '#007bff';
  }
}

// 点击页面其他区域关闭提示
document.addEventListener('click', function (event) {
  const tooltip = document.getElementById('helpTooltip');
  const helpIcon = document.querySelector('.help-icon');

  if (isTooltipVisible &&
    !tooltip.contains(event.target) &&
    !helpIcon.contains(event.target)) {
    tooltip.style.display = 'none';
    isTooltipVisible = false;
    helpIcon.style.transform = 'scale(1)';
    helpIcon.style.color = '#007bff';
  }
});

// -----------------------悬浮标签
// 智能滚动检测
let lastScrollTop = 0;
const floatingLabel = document.querySelector('.floating-label');

// 点击交互功能
floatingLabel.addEventListener('click', function () {
  alert('悬浮标签被点击了！');
});

// 滚动事件监听
window.addEventListener('scroll', function () {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > lastScrollTop) {
    // 向下滚动
    floatingLabel.classList.add('scrolled-down');
  } else {
    // 向上滚动
    floatingLabel.classList.remove('scrolled-down');
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
});
// -----------------------以上--------