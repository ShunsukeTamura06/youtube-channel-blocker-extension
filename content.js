console.log('YouTube Channel Blocker: Content script loaded');

// ブロック済みチャンネルのリストを管理
let blockedChannels = new Set();
let channelNames = {}; // チャンネル名のマッピング
let currentLanguage = 'ja'; // デフォルト言語

// 言語設定を読み込み（簡略版）
async function loadLanguageFromStorage() {
  try {
    const result = await chrome.storage.sync.get(['language']);
    currentLanguage = result.language || 'ja';
  } catch (error) {
    console.error('Error loading language setting:', error);
  }
}

// 多言語辞書（コンテンツスクリプト用）
const CONTENT_TEXTS = {
  ja: {
    blockButton: '🚫 ブロック',
    blockButtonTitle: 'チャンネル "{name}" をブロック',
    channelBlocked: 'チャンネル "{name}" をブロックしました'
  },
  en: {
    blockButton: '🚫 Block',
    blockButtonTitle: 'Block channel "{name}"',
    channelBlocked: 'Channel "{name}" blocked'
  }
};

// テキストを取得（コンテンツスクリプト用）
function getContentText(key, replacements = {}) {
  let text = CONTENT_TEXTS[currentLanguage]?.[key] || CONTENT_TEXTS['ja'][key] || key;
  
  // プレースホルダーを置換
  Object.keys(replacements).forEach(placeholder => {
    text = text.replace(`{${placeholder}}`, replacements[placeholder]);
  });
  
  return text;
}

// ストレージからブロックリストを読み込み
async function loadBlockedChannels() {
  try {
    const result = await chrome.storage.sync.get(['blockedChannels', 'channelNames']);
    blockedChannels = new Set(result.blockedChannels || []);
    channelNames = result.channelNames || {};
    console.log('Loaded blocked channels:', Array.from(blockedChannels));
  } catch (error) {
    console.error('Error loading blocked channels:', error);
  }
}

// チャンネルをブロックリストに追加
async function addToBlockedChannels(channelId, channelName) {
  blockedChannels.add(channelId);
  
  // チャンネル名を適切にエンコードして保存
  if (channelName) {
    channelNames[channelId] = channelName;
  }
  
  try {
    await chrome.storage.sync.set({
      blockedChannels: Array.from(blockedChannels),
      channelNames: channelNames
    });
    console.log(`Channel blocked: ${channelName} (${channelId})`);
    
    // メッセージを表示
    showMessage(getContentText('channelBlocked', { name: channelName }));
    
    // ページ上の動画を再チェック
    hideBlockedVideos();
  } catch (error) {
    console.error('Error saving blocked channel:', error);
  }
}

// チャンネル ID を URL から抽出
function extractChannelId(url) {
  if (!url) return null;
  
  // @チャンネル名の形式
  const handleMatch = url.match(/@([^/?]+)/);
  if (handleMatch) {
    return '@' + handleMatch[1];
  }
  
  // /channel/ID の形式
  const channelMatch = url.match(/\/channel\/([^/?]+)/);
  if (channelMatch) {
    return channelMatch[1];
  }
  
  // /c/チャンネル名 の形式
  const customMatch = url.match(/\/c\/([^/?]+)/);
  if (customMatch) {
    return '/c/' + customMatch[1];
  }
  
  // /user/ユーザー名 の形式
  const userMatch = url.match(/\/user\/([^/?]+)/);
  if (userMatch) {
    return '/user/' + userMatch[1];
  }
  
  return null;
}

// チャンネル名を安全に取得
function getChannelName(linkElement) {
  if (!linkElement) return '';
  
  // テキストコンテンツを取得し、前後の空白を削除
  let name = linkElement.textContent || linkElement.innerText || '';
  name = name.trim();
  
  // 空の場合は代替手段を試す
  if (!name) {
    const titleAttr = linkElement.getAttribute('title');
    if (titleAttr) {
      name = titleAttr.trim();
    }
  }
  
  return name;
}

// ブロックされた動画を非表示にする
function hideBlockedVideos() {
  // 様々な動画コンテナを対象に
  const videoSelectors = [
    'ytd-video-renderer',
    'ytd-rich-item-renderer', 
    'ytd-compact-video-renderer',
    'ytd-grid-video-renderer'
  ];
  
  videoSelectors.forEach(selector => {
    const videos = document.querySelectorAll(selector);
    
    videos.forEach(video => {
      if (video.hasAttribute('data-channel-blocker-processed')) {
        return;
      }
      
      // チャンネルリンクを探す
      const channelLinks = video.querySelectorAll(
        'a[href*="/channel/"], a[href*="/@"], a[href*="/c/"], a[href*="/user/"]'
      );
      
      let channelId = null;
      let channelName = '';
      
      for (const link of channelLinks) {
        const id = extractChannelId(link.href);
        if (id) {
          channelId = id;
          channelName = getChannelName(link);
          break;
        }
      }
      
      if (channelId && blockedChannels.has(channelId)) {
        // 動画を非表示にする
        video.style.display = 'none';
        console.log(`Blocked video from channel: ${channelName} (${channelId})`);
      } else if (channelId) {
        // ブロックボタンを追加
        addBlockButton(video, channelId, channelName);
      }
      
      video.setAttribute('data-channel-blocker-processed', 'true');
    });
  });
}

// ブロックボタンを追加
function addBlockButton(videoElement, channelId, channelName) {
  // 既にブロックボタンが存在するかチェック
  if (videoElement.querySelector('.channel-block-btn')) {
    return;
  }
  
  // ブロックボタンを作成
  const blockBtn = document.createElement('button');
  blockBtn.className = 'channel-block-btn';
  blockBtn.textContent = getContentText('blockButton');
  blockBtn.title = getContentText('blockButtonTitle', { name: channelName });
  
  blockBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 確認ダイアログを削除し、直接ブロック実行
    addToBlockedChannels(channelId, channelName);
  });
  
  // ボタンを適切な場所に配置
  const menuContainer = videoElement.querySelector('#menu, ytd-menu-renderer, .ytd-video-meta-block');
  if (menuContainer) {
    menuContainer.appendChild(blockBtn);
  } else {
    // フォールバック: 動画要素の最後に追加
    videoElement.appendChild(blockBtn);
  }
}

// メッセージを表示
function showMessage(text) {
  // 既存のメッセージを削除
  const existingMessage = document.querySelector('.channel-blocker-message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const message = document.createElement('div');
  message.className = 'channel-blocker-message';
  message.textContent = text;
  
  // ページの上部に追加
  document.body.appendChild(message);
  
  // 3秒後に自動削除
  setTimeout(() => {
    message.remove();
  }, 3000);
}

// DOM が準備できるまで待機する関数
function waitForBody() {
  return new Promise((resolve) => {
    if (document.body) {
      resolve();
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        if (document.body) {
          obs.disconnect();
          resolve();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  });
}

// MutationObserver を安全に開始する
async function startObserver() {
  // body が存在するまで待機
  await waitForBody();
  
  // ページの変更を監視
  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldCheck = true;
      }
    });
    
    if (shouldCheck) {
      // 少し遅延を入れて実行
      setTimeout(hideBlockedVideos, 100);
    }
  });

  // 監視開始
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('MutationObserver started successfully');
}

// URL変更の監視（SPAのため）
let currentUrl = location.href;
function watchUrlChanges() {
  const urlObserver = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      console.log('URL changed:', currentUrl);
      
      // 少し遅延を入れて動画をチェック
      setTimeout(() => {
        hideBlockedVideos();
      }, 1000);
    }
  });
  
  urlObserver.observe(document, { subtree: true, childList: true });
}

// 既存のブロックボタンのテキストを更新
function updateExistingBlockButtons() {
  const existingButtons = document.querySelectorAll('.channel-block-btn');
  existingButtons.forEach(button => {
    button.textContent = getContentText('blockButton');
    
    // titleも更新（チャンネル名が必要だが、再取得は複雑なので基本テキストのみ更新）
    const channelName = button.title.match(/チャンネル "(.+)" をブロック|Block channel "(.+)"/);
    if (channelName) {
      const name = channelName[1] || channelName[2];
      button.title = getContentText('blockButtonTitle', { name: name });
    }
  });
}

// 初期化
(async function init() {
  console.log('Initializing YouTube Channel Blocker...');
  
  try {
    // 言語設定を読み込み
    await loadLanguageFromStorage();
    
    // ブロックリストを読み込み
    await loadBlockedChannels();
    
    // MutationObserver を安全に開始
    await startObserver();
    
    // URL変更の監視を開始
    watchUrlChanges();
    
    // ページ読み込み完了時とDOMContentLoaded時に実行
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hideBlockedVideos);
    } else {
      hideBlockedVideos();
    }
    
    // 追加の遅延実行（YouTube の動的ロードに対応）
    setTimeout(hideBlockedVideos, 2000);
    setTimeout(hideBlockedVideos, 5000);
    
    console.log('YouTube Channel Blocker initialized successfully');
    
  } catch (error) {
    console.error('Error initializing YouTube Channel Blocker:', error);
  }
})();

// ストレージの変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    if (changes.blockedChannels) {
      blockedChannels = new Set(changes.blockedChannels.newValue || []);
      console.log('Blocked channels updated:', Array.from(blockedChannels));
      hideBlockedVideos();
    }
    if (changes.channelNames) {
      channelNames = changes.channelNames.newValue || {};
      console.log('Channel names updated:', channelNames);
    }
    if (changes.language) {
      currentLanguage = changes.language.newValue || 'ja';
      console.log('Language updated:', currentLanguage);
      // 既存のボタンテキストを更新
      updateExistingBlockButtons();
    }
  }
});