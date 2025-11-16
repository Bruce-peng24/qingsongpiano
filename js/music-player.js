/**
 * 背景音乐播放器类
 * 负责背景音乐的播放、暂停、切换和音量控制
 */
class MusicPlayer {
  constructor() {
    // 音乐列表 - 使用外部URL链接，背景音乐URL
    this.playlist = [
      {
        id: 1,
        title: '轻松旋律',
        artist: '青松音乐',
        url: 'https://cdn.tosound.com:3321/preview?file=youtube%2F0%2F0%2F634532.mp3&token=eW91dHViZSUyRjAlMkYwJTJGNjM0NTMyLm1wMw==&sound=audio.mp3'
      },
      {
        id: 2,
        title: '古典钢琴',
        artist: '青松音乐',
        url: 'https://cdn.tosound.com:3321/preview?file=youtube%2F0%2F1%2F635949.mp3&token=eW91dHViZSUyRjAlMkYxJTJGNjM1OTQ5Lm1wMw==&sound=audio.mp3'
      }
    ];

    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.audio = null;
    this.volume = 0.4;

    // UI元素
    this.playPauseBtn = null;
    this.prevBtn = null;
    this.nextBtn = null;
    this.volumeSlider = null;
    this.titleElement = null;
    this.artistElement = null;
  }

  /**
   * 初始化音乐播放器
   */
  init() {
    // 获取UI元素
    this.playPauseBtn = document.getElementById('music-play-pause-btn');
    this.prevBtn = document.getElementById('music-prev-btn');
    this.nextBtn = document.getElementById('music-next-btn');
    this.volumeSlider = document.getElementById('background-music-volume');
    this.titleElement = document.getElementById('current-music-title');
    this.artistElement = document.getElementById('current-music-artist');

    // 绑定事件
    this.bindEvents();

    // 初始化音频元素
    this.initAudio();

    // 更新UI显示当前曲目
    this.updateTrackInfo();

    console.info('MusicPlayer: 音乐播放器初始化完成');
  }

  /**
   * 初始化音频元素
   */
  initAudio() {
    this.audio = new Audio();
    this.audio.volume = this.volume;
    this.audio.loop = true;

    // 加载当前曲目
    this.loadCurrentTrack();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 播放/暂停按钮
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => {
        this.togglePlayPause();
      });
    }

    // 上一首按钮
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => {
        this.playPrevious();
      });
    }

    // 下一首按钮
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => {
        this.playNext();
      });
    }

    // 音量控制
    if (this.volumeSlider) {
      this.volumeSlider.addEventListener('input', (e) => {
        this.setVolume(e.target.value / 100);
      });
    }

    // 音频结束事件（虽然设置了循环，但作为备用）
    if (this.audio) {
      this.audio.addEventListener('ended', () => {
        this.playNext();
      });
    }
  }

  /**
   * 播放/暂停切换
   */
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * 播放音乐
   */
  play() {
    // 确保音频元素已初始化
    if (!this.audio) {
      this.initAudio();
    }

    // 确保有音频源
    if (!this.audio.src) {
      this.loadCurrentTrack();
    }

    this.audio.play()
      .then(() => {
        this.isPlaying = true;
        this.updatePlayPauseButton();
        console.info('MusicPlayer: 开始播放背景音乐');
      })
      .catch(error => {
        console.error('MusicPlayer: 播放失败:', error);
      });
  }

  /**
   * 暂停音乐
   */
  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updatePlayPauseButton();
    console.info('MusicPlayer: 暂停背景音乐');
  }

  /**
   * 播放上一首
   */
  playPrevious() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadCurrentTrack();
    this.updateTrackInfo();

    if (this.isPlaying) {
      this.play();
    }
  }

  /**
   * 播放下一首
   */
  playNext() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
    this.loadCurrentTrack();
    this.updateTrackInfo();

    if (this.isPlaying) {
      this.play();
    }
  }

  /**
   * 加载当前曲目
   */
  loadCurrentTrack() {
    const currentTrack = this.playlist[this.currentTrackIndex];
    this.audio.src = currentTrack.url;
    console.info(`MusicPlayer: 加载曲目: ${currentTrack.title}`);
  }

  /**
   * 更新曲目信息显示
   */
  updateTrackInfo() {
    const currentTrack = this.playlist[this.currentTrackIndex];
    if (this.titleElement) {
      this.titleElement.textContent = currentTrack.title;
    }
    if (this.artistElement) {
      this.artistElement.textContent = currentTrack.artist;
    }
  }

  /**
   * 更新播放/暂停按钮状态
   */
  updatePlayPauseButton() {
    if (this.playPauseBtn) {
      this.playPauseBtn.textContent = this.isPlaying ? '⏸' : '▶';
    }
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    this.volume = volume;
    if (this.audio) {
      this.audio.volume = volume;
    }
  }
}