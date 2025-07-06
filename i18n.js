// 多言語辞書
const LANGUAGES = {
  ja: {
    // ポップアップ
    extensionTitle: 'YouTube Channel Blocker',
    subtitle: 'ブロック中のチャンネル管理',
    addChannelManually: 'チャンネルを手動で追加',
    channelUrlPlaceholder: 'チャンネルURL または @ChannelName',
    addButton: '追加',
    helpText: '例: https://www.youtube.com/@channelname または @channelname',
    blockedChannels: 'ブロック中のチャンネル',
    channelsCount: 'チャンネル',
    emptyStateMessage: '📝 ブロック中のチャンネルはありません',
    emptyStateHint: 'YouTube で動画の「❌」ボタンをクリックして追加してください',
    clearAllButton: 'すべてクリア',
    exportButton: 'エクスポート',
    importButton: 'インポート',
    removeButton: '削除',
    language: '言語',
    
    // ステータスメッセージ
    channelAdded: 'チャンネル "{name}" を追加しました',
    channelRemoved: 'チャンネル "{name}" を削除しました',
    allChannelsRemoved: 'すべてのチャンネルを削除しました',
    dataExported: 'データをエクスポートしました',
    dataImported: '{count}個のチャンネルをインポートしました',
    invalidChannelId: '有効なチャンネルIDまたはURLを入力してください',
    channelAlreadyBlocked: 'このチャンネルは既にブロック済みです',
    noChannelsToRemove: 'ブロック中のチャンネルはありません',
    dataLoadError: 'データの読み込みに失敗しました',
    dataSaveError: 'データの保存に失敗しました',
    importError: 'インポートに失敗しました',
    invalidDataFormat: '無効なデータ形式です',
    
    // 確認メッセージ
    confirmClearAll: '{count}個のブロック中チャンネルをすべて削除しますか？',
    confirmImport: '{count}個のチャンネルをインポートしますか？\\n\\n現在のデータは上書きされます。',
    
    // コンテンツスクリプト
    blockButton: '❌',
    blockButtonTitle: 'チャンネル "{name}" をブロック',
    channelBlocked: 'チャンネル "{name}" をブロックしました'
  },
  
  en: {
    // Popup
    extensionTitle: 'YouTube Channel Blocker',
    subtitle: 'Manage blocked channels',
    addChannelManually: 'Add channel manually',
    channelUrlPlaceholder: 'Channel URL or @ChannelName',
    addButton: 'Add',
    helpText: 'e.g. https://www.youtube.com/@channelname or @channelname',
    blockedChannels: 'Blocked Channels',
    channelsCount: 'channels',
    emptyStateMessage: '📝 No blocked channels',
    emptyStateHint: 'Click the "❌" button on YouTube videos to add channels',
    clearAllButton: 'Clear All',
    exportButton: 'Export',
    importButton: 'Import',
    removeButton: 'Remove',
    language: 'Language',
    
    // Status messages
    channelAdded: 'Channel "{name}" added',
    channelRemoved: 'Channel "{name}" removed',
    allChannelsRemoved: 'All channels removed',
    dataExported: 'Data exported successfully',
    dataImported: '{count} channels imported',
    invalidChannelId: 'Please enter a valid channel ID or URL',
    channelAlreadyBlocked: 'This channel is already blocked',
    noChannelsToRemove: 'No channels to remove',
    dataLoadError: 'Failed to load data',
    dataSaveError: 'Failed to save data',
    importError: 'Import failed',
    invalidDataFormat: 'Invalid data format',
    
    // Confirmation messages
    confirmClearAll: 'Remove all {count} blocked channels?',
    confirmImport: 'Import {count} channels?\\n\\nCurrent data will be overwritten.',
    
    // Content script
    blockButton: '❌',
    blockButtonTitle: 'Block channel "{name}"',
    channelBlocked: 'Channel "{name}" blocked'
  }
};

// 現在の言語を取得
let currentLanguage = 'ja'; // デフォルトは日本語

// 言語設定を読み込み
async function loadLanguage() {
  try {
    const result = await chrome.storage.sync.get(['language']);
    currentLanguage = result.language || 'ja';
  } catch (error) {
    console.error('Error loading language setting:', error);
  }
}

// 言語設定を保存
async function saveLanguage(lang) {
  try {
    await chrome.storage.sync.set({ language: lang });
    currentLanguage = lang;
  } catch (error) {
    console.error('Error saving language setting:', error);
  }
}

// テキストを取得
function getText(key, replacements = {}) {
  let text = LANGUAGES[currentLanguage]?.[key] || LANGUAGES['ja'][key] || key;
  
  // プレースホルダーを置換
  Object.keys(replacements).forEach(placeholder => {
    text = text.replace(`{${placeholder}}`, replacements[placeholder]);
  });
  
  return text;
}

// 言語変更イベント
const languageChangeListeners = [];
function addLanguageChangeListener(callback) {
  languageChangeListeners.push(callback);
}

function notifyLanguageChange() {
  languageChangeListeners.forEach(callback => callback(currentLanguage));
}

// ブラウザの言語を検出
function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('ja')) {
    return 'ja';
  } else {
    return 'en';
  }
}

// 初期化時にブラウザ言語を設定（初回のみ）
async function initializeLanguage() {
  try {
    const result = await chrome.storage.sync.get(['language']);
    if (!result.language) {
      // 初回起動時はブラウザの言語を検出
      const detectedLang = detectBrowserLanguage();
      await saveLanguage(detectedLang);
    } else {
      currentLanguage = result.language;
    }
  } catch (error) {
    console.error('Error initializing language:', error);
  }
}