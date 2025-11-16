/**
 * 钢琴界面管理模块
 * 负责钢琴键盘的创建、渲染和交互
 * @class
 */
class PianoManager {
  /**
   * 创建PianoManager实例
   * @constructor
   * @param {Object} audioManager - 音频管理器实例
   */
  constructor(audioManager) {
    // 防御性检查
    if (!audioManager) {
      console.error('PianoManager: audioManager参数缺失');
      // 尝试使用全局audioManager
      audioManager = window.audioManager;
    }

    this.audioManager = audioManager;
    // 旋转功能已移除
    this.debounceTimer = null;
    // 初始化日志，便于调试
    try {
      console.info('PianoManager: initialized', { hasAudioManager: !!audioManager, notesCount: audioManager && Array.isArray(audioManager.notes) ? audioManager.notes.length : 0 });
    } catch (e) {
      // 在极端环境下保护日志调用
      /* noop */
    }
    this.init();
  }

  /**
   * 初始化钢琴管理器
   */
  init() {
    this.initPianoKeys();

    // 窗口大小变化时重新计算（防抖）
    // window.addEventListener('resize', () => {
    //   this.debouncedCalculatePositions();
    // });
  }

  /**
   * 防抖函数，避免频繁计算
   */
  debouncedCalculatePositions() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.calculateBlackKeyPositions();
    }, 250);
  }

  /**
   * 初始化钢琴键盘界面
   * 创建并渲染所有白键和黑键，设置键盘布局
   * 支持垂直排列的钢琴键盘布局
   */
  initPianoKeys() {
    // 获取钢琴键盘容器元素
    const pianoKeys = document.getElementById('piano-keys');
    // 如果容器不存在，直接返回避免错误
    if (!pianoKeys) return;

    // 防御性检查：确保 audioManager 和 notes 可用
    if (!this.audioManager || !Array.isArray(this.audioManager.notes)) {
      // 如果没有音符数据，清空容器并返回，避免后续抛错
      pianoKeys.innerHTML = '';
      console.warn('PianoManager.initPianoKeys: audioManager.notes not available');
      return;
    }

    // 清空现有键，准备重新创建
    pianoKeys.innerHTML = '';

    // 创建白键 - 遍历所有音符数据
    this.audioManager.notes.forEach(note => {
      // 只处理白键类型的音符
      if (note.type === 'white') {
        // 创建白键DOM元素
        const keyElement = document.createElement('div');
        // 设置白键的CSS类名
        keyElement.className = `piano-key white-key`;
        // 设置数据属性，存储音符名称
        keyElement.setAttribute('data-note', note.name);

        // 创建键标签元素
        const label = document.createElement('div');
        // 设置标签的CSS类名
        label.className = 'key-label';
        // 设置标签文本内容，将's'替换为音乐符号'♯'
        label.textContent = note.name.replace('s', '♯');
        // 将标签添加到键元素中
        keyElement.appendChild(label);

        // 将白键添加到钢琴键盘容器中
        pianoKeys.appendChild(keyElement);
      }
    });

    // 创建黑键 - 遍历所有音符数据
    this.audioManager.notes.forEach(note => {
      // 只处理黑键类型的音符
      if (note.type === 'black') {
        // 创建黑键DOM元素
        const keyElement = document.createElement('div');
        // 设置黑键的CSS类名
        keyElement.className = `piano-key black-key`;
        // 设置数据属性，存储音符名称
        keyElement.setAttribute('data-note', note.name);

        // 创建键标签元素
        const label = document.createElement('div');
        // 设置标签的CSS类名
        label.className = 'key-label';
        // 设置标签文本内容，将's'替换为音乐符号'♯'
        label.textContent = note.name.replace('s', '♯');
        // 将标签添加到键元素中
        keyElement.appendChild(label);

        // 将黑键添加到钢琴键盘容器中
        pianoKeys.appendChild(keyElement);
      }
    });

    // 使用MutationObserver监听白键渲染完成
    this.waitForWhiteKeysRenderedWithObserver()
      .then(() => {
        // 调用黑键位置计算方法
        this.calculateBlackKeyPositions();
      })
      .catch(error => {
        console.error('等待白键渲染失败:', error);
        // 即使失败也尝试计算黑键位置（使用备用方案）
        this.calculateBlackKeyPositions();
      });

    // 调试信息：打印创建的键数量和名称，帮助定位渲染问题
    try {
      // 统计白键数量
      const whiteCount = document.querySelectorAll('.white-key').length;
      // 统计黑键数量
      const blackCount = document.querySelectorAll('.black-key').length;
      // 获取所有白键的音符名称
      const whiteNames = Array.from(document.querySelectorAll('.white-key')).map(k => k.getAttribute('data-note'));
      // 获取所有黑键的音符名称
      const blackNames = Array.from(document.querySelectorAll('.black-key')).map(k => k.getAttribute('data-note'));
      // 输出调试信息到控制台
      console.info('initPianoKeys: created keys', { whiteCount, blackCount, whiteNames, blackNames });
    } catch (e) {
      // 捕获并记录调试日志失败的错误
      console.warn('initPianoKeys: debug logging failed', e);
    }
  }

  /**
   * 计算并设置黑键位置 - 适配垂直布局
   * 该方法负责在垂直排列的钢琴键盘中精确定位黑键的位置
   * 通过计算相邻白键的相对位置来确定黑键的垂直位置
   * 包含多种容错机制，确保在不同渲染状态下都能正常工作
   */
  calculateBlackKeyPositions() {
    // 获取钢琴键盘容器元素
    const pianoKeys = document.getElementById('piano-keys');
    // 防御性检查：如果容器不存在则直接返回，避免后续操作出错
    if (!pianoKeys) return;

    // 获取所有白键和黑键的DOM元素集合
    const whiteKeys = document.querySelectorAll('.white-key');  // 所有白键元素
    const blackKeys = document.querySelectorAll('.black-key');  // 所有黑键元素

    // 添加详细的调试信息，帮助定位渲染问题
    console.log('钢琴键盘容器信息:', {
      pianoKeysHeight: pianoKeys.offsetHeight,        // 容器总高度
      pianoKeysTop: pianoKeys.getBoundingClientRect().top,     // 容器顶部绝对位置
      pianoKeysBottom: pianoKeys.getBoundingClientRect().bottom, // 容器底部绝对位置
      whiteKeyCount: whiteKeys.length,               // 白键数量
      blackKeyCount: blackKeys.length                // 黑键数量
    });

    // 存储白键位置信息的对象，键名为音符名称，值为位置数据
    let whiteKeyPositions = {};
    // 标志位：是否使用备用方案进行计算
    let useFallback = false;

    // 第一阶段：尝试使用实际DOM位置进行精确计算
    // 遍历所有白键，计算每个白键相对于钢琴容器的位置
    whiteKeys.forEach((key, index) => {
      // 获取白键的音符名称（如'1', '3', '5'等）
      const note = key.getAttribute('data-note');
      // 获取白键的边界矩形信息
      const rect = key.getBoundingClientRect();
      // 获取钢琴容器的边界矩形信息
      const pianoKeysRect = pianoKeys.getBoundingClientRect();

      // 计算白键相对于钢琴容器的垂直位置
      // relativeTop: 白键顶部相对于容器顶部的距离
      const relativeTop = rect.top - pianoKeysRect.top;
      // relativeBottom: 白键底部相对于容器顶部的距离
      const relativeBottom = rect.bottom - pianoKeysRect.top;

      // 存储白键的位置信息，包括顶部位置、底部位置、高度和索引
      whiteKeyPositions[note] = {
        top: relativeTop,        // 相对于容器的顶部位置
        bottom: relativeBottom,  // 相对于容器的底部位置
        height: rect.height,     // 白键的实际高度
        index: index            // 白键在集合中的索引
      };

      // 输出详细的位置调试信息
      console.log(`白键 ${note}: 绝对位置(top=${rect.top}, bottom=${rect.bottom}), 相对位置(top=${relativeTop}, bottom=${relativeBottom}), 高度=${rect.height}`);
    });

    // 检测DOM渲染状态：如果所有白键的高度都是0，说明DOM可能还没有正确渲染
    const allHeightsZero = Object.values(whiteKeyPositions).every(pos => pos.height === 0);

    // 如果检测到DOM渲染异常，启用备用方案
    if (allHeightsZero) {
      console.warn('检测到白键DOM渲染异常，使用强制重排和备用方案');
      useFallback = true;

      // 强制浏览器重排：通过访问offsetHeight属性触发重排，确保DOM正确渲染
      pianoKeys.offsetHeight; // 触发重排

      // 重新获取白键位置信息（重排后）
      whiteKeys.forEach((key, index) => {
        const note = key.getAttribute('data-note');
        const rect = key.getBoundingClientRect();
        const pianoKeysRect = pianoKeys.getBoundingClientRect();

        const relativeTop = rect.top - pianoKeysRect.top;
        const relativeBottom = rect.bottom - pianoKeysRect.top;

        whiteKeyPositions[note] = {
          top: relativeTop,
          bottom: relativeBottom,
          height: rect.height,
          index: index
        };

        console.log(`白键 ${note} (重排后): 高度=${rect.height}, top=${relativeTop}`);
      });

      // 再次检查重排后是否仍然存在渲染问题
      const stillAllHeightsZero = Object.values(whiteKeyPositions).every(pos => pos.height === 0);
      if (stillAllHeightsZero) {
        console.warn('重排后白键高度仍为0，使用完全备用方案');
        useFallback = true;
      }
    }

    // 检测布局异常：如果所有白键的top位置都是0，说明布局计算有问题
    const allTopsZero = Object.values(whiteKeyPositions).every(pos => pos.top === 0);
    if (allTopsZero) {
      console.warn('检测到白键位置计算异常，使用备用方案');
      useFallback = true;
    }

    // 第二阶段：如果检测到问题，使用备用方案进行计算
    if (useFallback) {
      // 备用方案：使用简单的等分方法计算白键位置
      // 获取容器高度，如果获取失败则使用默认高度1000px
      const pianoKeysHeight = pianoKeys.offsetHeight || 1000;
      // 计算每个白键的平均高度
      const whiteKeyHeight = pianoKeysHeight / whiteKeys.length;

      // 使用等分算法重新计算每个白键的位置
      whiteKeys.forEach((key, index) => {
        const note = key.getAttribute('data-note');
        // 计算白键的顶部位置：索引 × 平均高度
        const top = index * whiteKeyHeight;

        // 使用等分算法重新设置白键位置信息
        whiteKeyPositions[note] = {
          top: top,                      // 等分计算的顶部位置
          bottom: top + whiteKeyHeight,  // 等分计算的底部位置
          height: whiteKeyHeight,        // 等分计算的高度
          index: index                   // 索引保持不变
        };

        console.log(`白键 ${note} (备用方案): top=${top}, bottom=${top + whiteKeyHeight}, 高度=${whiteKeyHeight}`);
      });
    }

    // 第三阶段：基于白键位置计算黑键位置
    // 遍历所有黑键，为每个黑键计算并设置正确的位置
    blackKeys.forEach(blackKey => {
      // 获取黑键的音符名称
      const note = blackKey.getAttribute('data-note');
      // 查找与该黑键相邻的两个白键
      const adjacentWhiteKeys = this.findAdjacentWhiteKeys(note);

      // 确保找到了两个相邻白键（黑键总是位于两个白键之间）
      if (adjacentWhiteKeys.length === 2) {
        // 获取上方白键和下方白键的位置信息
        const upperKey = whiteKeyPositions[adjacentWhiteKeys[0]];  // 上方白键
        const lowerKey = whiteKeyPositions[adjacentWhiteKeys[1]];  // 下方白键

        // 确保两个相邻白键的位置信息都存在
        if (upperKey && lowerKey) {
          // 计算黑键的中心位置：取上方白键底部和下方白键顶部的中间点
          const centerPosition = (upperKey.bottom + lowerKey.top) / 2;
          // 获取黑键的实际高度，如果获取失败则使用默认高度30px
          const blackKeyHeight = blackKey.offsetHeight || 30;

          // 设置黑键的垂直位置：中心位置减去一半高度，使黑键垂直居中
          blackKey.style.top = `${centerPosition - blackKeyHeight / 2}px`;
          // 设置黑键的水平位置：距离右侧20%，使黑键位于白键的右侧
          blackKey.style.right = '20%';

          // 输出黑键位置计算的详细调试信息
          console.log(`黑键 ${note}: 上方白键=${adjacentWhiteKeys[0]}(top=${upperKey.top}), 下方白键=${adjacentWhiteKeys[1]}(top=${lowerKey.top}), 黑键top=${centerPosition - blackKeyHeight / 2}`);
        } else {
          // 如果相邻白键位置信息缺失，输出警告信息
          console.warn(`黑键 ${note}: 未找到相邻白键位置`, { upperKey, lowerKey });
        }
      } else {
        // 如果未找到正确的相邻白键，输出警告信息
        console.warn(`黑键 ${note}: 未找到相邻白键`, adjacentWhiteKeys);
      }
    });

    // 输出最终计算完成的信息，标明使用的计算方案
    console.log('黑键位置计算完成 (使用' + (useFallback ? '备用' : '实际DOM') + '方案)');
  }

  /**
   * 查找与黑键相邻的白键
   * @param {string} blackNote - 黑键音符名称
   * @returns {Array} 相邻白键名称数组
   */
  findAdjacentWhiteKeys(blackNote) {
    // 修正黑键与相邻白键的映射关系（F4到B5共19个键）
    const noteMap = {
      '2': ['1', '3'],   // 黑键2位于白键1和白键3之间
      '4': ['3', '5'],   // 黑键4位于白键3和白键5之间
      '6': ['5', '7'],   // 黑键6位于白键5和白键7之间
      '9': ['8', '10'],  // 黑键9位于白键8和白键10之间
      '11': ['10', '12'], // 黑键11位于白键10和白键12之间
      '14': ['13', '15'], // 黑键14位于白键13和白键15之间
      '16': ['15', '17'], // 黑键16位于白键15和白键17之间
      '18': ['17', '19']  // 黑键18位于白键17和白键19之间
    };

    return noteMap[blackNote] || [];
  }

  /**
   * 获取下一个白键
   * @param {string} note - 当前白键音符名称
   * @returns {string} 下一个白键音符名称
   */
  getNextWhiteKey(note) {
    // 根据音符名称返回下一个白键
    const noteOrder = ['1', '3', '5', '7', '8', '10', '12', '13', '15', '17', '19'];
    const currentIndex = noteOrder.indexOf(note);
    return noteOrder[currentIndex + 1] || note;
  }

  /**
   * 激活琴键
   * @param {string} note - 要激活的音符名称
   */
  activateKey(note) {
    const keyElement = document.querySelector(`.piano-key[data-note="${note}"]`);
    if (keyElement) {
      keyElement.classList.add('active');
    }
  }

  /**
   * 取消激活琴键
   * @param {string} note - 要取消激活的音符名称
   */
  deactivateKey(note) {
    const keyElement = document.querySelector(`.piano-key[data-note="${note}"]`);
    if (keyElement) {
      keyElement.classList.remove('active');
    }
  }

  /**
   * 取消激活所有琴键
   */
  deactivateAllKeys() {
    const activeKeys = document.querySelectorAll('.piano-key.active');
    activeKeys.forEach(key => {
      key.classList.remove('active');
    });
  }

  /**
   * 使用MutationObserver等待白键完成渲染
   * 该方法通过监听DOM变化来检测白键是否完成渲染
   * 使用更现代的API，比轮询更高效
   * @returns {Promise} 当白键完成渲染时解析的Promise
   */
  waitForWhiteKeysRenderedWithObserver() {
    return new Promise((resolve, reject) => {
      // 获取钢琴键盘容器
      const pianoKeys = document.getElementById('piano-keys');
      if (!pianoKeys) {
        reject(new Error('钢琴键盘容器未找到'));
        return;
      }

      // 获取所有白键
      const whiteKeys = document.querySelectorAll('.white-key');

      // 如果白键已经渲染完成，立即解析
      if (whiteKeys.length > 0 && this.areWhiteKeysRendered(whiteKeys)) {
        console.log('白键已渲染完成，立即开始计算黑键位置');
        resolve();
        return;
      }

      // 创建MutationObserver来监听DOM变化
      const observer = new MutationObserver(() => {
        // 检查白键是否已渲染完成
        const currentWhiteKeys = document.querySelectorAll('.white-key');
        if (currentWhiteKeys.length > 0 && this.areWhiteKeysRendered(currentWhiteKeys)) {
          observer.disconnect();
          console.log('MutationObserver检测到白键渲染完成');
          resolve();
        }
      });

      // 配置观察选项：监听子节点变化和属性变化
      const observerConfig = {
        childList: true,    // 监听子节点的添加和移除
        subtree: true,      // 监听所有后代节点的变化
        attributes: true,   // 监听属性变化
        attributeFilter: ['style', 'class'] // 只监听style和class属性变化
      };

      // 开始观察
      observer.observe(pianoKeys, observerConfig);

      // 同时监听整个文档的变化，确保能捕获到所有可能的渲染事件
      const documentObserver = new MutationObserver(() => {
        const currentWhiteKeys = document.querySelectorAll('.white-key');
        if (currentWhiteKeys.length > 0 && this.areWhiteKeysRendered(currentWhiteKeys)) {
          observer.disconnect();
          documentObserver.disconnect();
          console.log('文档MutationObserver检测到白键渲染完成');
          resolve();
        }
      });

      documentObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    });
  }

  /**
   * 检查白键是否已渲染完成
   * @param {NodeList} whiteKeys - 白键元素列表
   * @returns {boolean} 是否所有白键都已渲染
   */
  areWhiteKeysRendered(whiteKeys) {
    return Array.from(whiteKeys).every(key => {
      const rect = key.getBoundingClientRect();
      return rect.height > 0 && rect.width > 0;
    });
  }
}

// 导出或绑定到全局
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PianoManager;
}

// 确保PianoManager在全局可用
if (typeof window !== 'undefined') {
  window.PianoManager = PianoManager;
}
console.info('PianoManager: 已注册到全局');
