/**
 * 音频配置和常量
 * 包含音符定义、音频文件映射和其他音频相关配置
 */

// 音符定义
const NOTES = [
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

// 精确的音符到音频文件映射
const NOTES_MAP = {
  '1': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a01.mp3', start: 0, duration: 1.5 },
  '2': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a02.mp3', start: 0, duration: 1.5 },
  '3': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a03.mp3', start: 0, duration: 1.5 },
  '4': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a04.mp3', start: 0, duration: 1.5 },
  '5': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a05.mp3', start: 0, duration: 1.5 },
  '6': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a06.mp3', start: 0, duration: 1.5 },
  '7': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a07.mp3', start: 0, duration: 1.5 },
  '8': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a08.mp3', start: 0, duration: 1.5 },
  '9': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a09.mp3', start: 0, duration: 1.5 },
  '10': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a10.mp3', start: 0, duration: 1.5 },
  '11': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a11.mp3', start: 0, duration: 1.5 },
  '12': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a12.mp3', start: 0, duration: 1.5 },
  '13': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a13.mp3', start: 0, duration: 1.5 },
  '14': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a14.mp3', start: 0, duration: 1.5 },
  '15': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a15.mp3', start: 0, duration: 1.5 },
  '16': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a16.mp3', start: 0, duration: 1.5 },
  '17': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a17.mp3', start: 0, duration: 1.5 },
  '18': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a18.mp3', start: 0, duration: 1.5 },
  '19': { file: 'https://cdn.jsdelivr.net/gh/bruce-peng24/qingsongpiano@main/audio/f4-b5/a19.mp3', start: 0, duration: 1.5 }
};

// 音频播放配置
const AUDIO_CONFIG = {
  fadeDuration: 0.02, // 20ms淡入淡出，普通人难以察觉
  minPlayInterval: 35, // 最小播放间隔35ms
  maxConcurrent: 40, // 最大同时播放数
  debounceTime: 150, // 防抖时间(毫秒)
  defaultVolume: 0.7 // 默认音量
};

// 音符频率映射（用于振荡器模式）
const NOTE_FREQUENCIES = [
  261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00,
  415.30, 440.00, 466.16, 493.88, 523.25, 554.37, 587.33, 622.25,
  659.25, 698.46, 739.99
];

// 浏览器检测
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// 将所有常量添加到全局对象，以便其他脚本可以使用
window.AudioConfig = {
  NOTES,
  NOTES_MAP,
  AUDIO_CONFIG,
  NOTE_FREQUENCIES,
  isSafari
};