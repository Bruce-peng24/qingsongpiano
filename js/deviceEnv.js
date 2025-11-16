/**
 * 检测设备环境的js
 * =====================================================================
 */

/**
 * 检测用户设备是否为移动端
 * @returns {boolean} true-移动端, false-桌面端
 */
function isMobileDevice() {
  // 获取用户代理字符串
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  console.log('用户代理字符串:', userAgent);

  // 移动设备关键词正则表达式
  const mobileKeywords = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|windows phone|phone|webos|kindle|tablet/i;

  // 检测用户代理是否包含移动设备特征
  const isMobileUA = mobileKeywords.test(userAgent);
  console.log('用户代理检测结果:', isMobileUA ? '匹配到移动设备特征' : '未匹配到移动设备特征');

  // 检测触摸支持
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  console.log('触摸支持检测:', isTouchDevice ? '支持触摸' : '不支持触摸');

  // 更精确的综合判断：
  // 1. 如果用户代理明确是移动设备，则认为是移动设备
  // 2. 如果用户代理不是移动设备，但支持触摸且屏幕较小，则认为是移动设备
  // 3. 其他情况认为是桌面设备
  const result = isMobileUA || isTouchDevice;

  console.log('最终检测结果:', result ? '移动设备' : '桌面设备');
  console.log('----------------------------------------');

  return result;
}

/**
 * 检测设备是否为横屏状态
 * @returns {boolean} true-横屏, false-竖屏
 */
function isLandscape() {
  // 检测屏幕方向
  const isLandscapeMode = window.innerWidth > window.innerHeight;
  console.log('屏幕方向检测:', isLandscapeMode ? '横屏' : '竖屏');
  return isLandscapeMode;
}

/**
 * 横屏检测管理器
 * 监听屏幕方向变化，并在横屏时显示提示窗口
 */
class OrientationManager {
  constructor() {
    this.orientationWarning = null;
    this.isMonitoring = false;
    this.init();
  }

  init() {
    // 获取横屏提示窗口元素
    this.orientationWarning = document.getElementById('orientation-warning');

    if (!this.orientationWarning) {
      console.log();
      ('横屏提示窗口元素未找到，将创建新的提示窗口');
      this.createOrientationWarning();
    }

    // 开始监听屏幕方向变化
    this.startMonitoring();
  }

  /**
   * 创建横屏提示窗口（如果不存在）
   */
  createOrientationWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.id = 'orientation-warning';
    warningDiv.className = 'modal';
    warningDiv.style.display = 'none';
    warningDiv.style.zIndex = '10002'; // 确保在最上层

    warningDiv.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>屏幕方向提示</h2>
        </div>
        <div class="modal-body">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 3rem; margin-bottom: 15px;">  &#x1F4F1;
</div>
            <p style="font-size: 1.1rem; line-height: 1.6;">
              请将设备切换为竖屏模式<br>
              以获得最佳使用体验<br>
              竖屏后本提示将自动消失
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(warningDiv);
    this.orientationWarning = warningDiv;
  }

  /**
   * 开始监听屏幕方向变化
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    // 立即检查一次当前方向
    this.checkOrientation();

    // 监听窗口大小变化（包括屏幕旋转）
    window.addEventListener('resize', () => {
      this.checkOrientation();
    });

    // 监听屏幕方向变化事件（移动设备专用）
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', () => {
        this.checkOrientation();
      });
    }

    this.isMonitoring = true;
    console.log('横屏检测管理器已启动');
  }

  /**
   * 检查屏幕方向并显示/隐藏提示窗口
   */
  checkOrientation() {
    if (!this.orientationWarning) return;

    const isLandscapeMode = isLandscape();

    if (isLandscapeMode) {
      // 横屏状态，显示提示窗口
      this.orientationWarning.style.display = 'flex';
      console.log('检测到横屏，显示提示窗口');
    } else {
      // 竖屏状态，隐藏提示窗口
      this.orientationWarning.style.display = 'none';
      console.log('检测到竖屏，隐藏提示窗口');
    }
  }

  /**
   * 停止监听屏幕方向变化
   */
  stopMonitoring() {
    window.removeEventListener('resize', this.checkOrientation);
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.removeEventListener('change', this.checkOrientation);
    }
    this.isMonitoring = false;
    console.log('横屏检测管理器已停止');
  }
}

// 全局横屏管理器实例
let orientationManager = null;

/**
 * 初始化横屏检测
 */
function initOrientationDetection() {
  if (!orientationManager) {
    orientationManager = new OrientationManager();
  }
  return orientationManager;
}

// 使用示例和测试代码
console.log('开始设备类型检测...');
console.log('----------------------------------------');

// 立即检测并显示结果
if (isMobileDevice()) {
  console.log('🎯 当前使用移动端设备');
  // 如果是移动设备，初始化横屏检测
  initOrientationDetection();
} else {
  console.log('💻 当前使用桌面端设备');
}
// =====================================================================
