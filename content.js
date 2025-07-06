console.log('YouTube Channel Blocker: Content script loaded');

// ブロック済みチャンネルのリストを管理
let blockedChannels = new Set();
let blockedChannelNames = new Set(); // チャンネル名ベースのブロック
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
    
    // チャンネル名のセットも作成（高速検索用）
    blockedChannelNames = new Set();
    Object.entries(channelNames).forEach(([channelId, channelName]) => {
      if (blockedChannels.has(channelId)) {
        blockedChannelNames.add(channelName.toLowerCase().trim());
      }
    });
    
    console.log('Loaded blocked channels:', Array.from(blockedChannels));
    console.log('Loaded blocked channel names:', Array.from(blockedChannelNames));
  } catch (error) {
    console.error('Error loading blocked channels:', error);
  }
}

// チャンネル名がブロック対象かチェック
function isChannelBlocked(channelId, channelName) {
  // チャンネルIDでのチェック
  if (channelId && blockedChannels.has(channelId)) {
    return true;
  }
  
  // チャンネル名でのチェック
  if (channelName) {
    const normalizedName = channelName.toLowerCase().trim();
    if (blockedChannelNames.has(normalizedName)) {
      return true;
    }
    
    // 部分マッチもチェック（より柔軟な対応）
    for (const blockedName of blockedChannelNames) {
      if (normalizedName.includes(blockedName) || blockedName.includes(normalizedName)) {
        return true;
      }
    }
  }
  
  return false;
}

// チャンネルをブロックリストに追加
async function addToBlockedChannels(channelId, channelName) {
  blockedChannels.add(channelId);
  
  // チャンネル名を適切にエンコードして保存
  if (channelName) {
    channelNames[channelId] = channelName;
    blockedChannelNames.add(channelName.toLowerCase().trim());
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

// 関連動画（ytd-compact-video-renderer）からチャンネル情報を抽出
function extractChannelFromCompactVideo(compactVideoElement) {
  console.log('[DEBUG] Processing compact video element:', compactVideoElement);
  
  // チャンネル名要素を探す
  const channelNameElement = compactVideoElement.querySelector('ytd-channel-name yt-formatted-string');
  
  if (channelNameElement) {
    const channelName = channelNameElement.textContent?.trim();
    if (channelName && channelName.length > 0) {
      // チャンネル名からチャンネルIDを生成（@形式）
      const channelId = '@' + channelName.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');
      
      console.log('[DEBUG] Extracted channel from compact video:', { id: channelId, name: channelName });
      return {
        id: channelId,
        name: channelName
      };
    }
  }
  
  console.log('[DEBUG] No channel extracted from compact video');
  return null;
}

// ブロックされた動画を非表示にする
function hideBlockedVideos() {
  console.log('[DEBUG] hideBlockedVideos called');
  
  // 従来の動画コンテナ（メインページ用）
  const traditionalVideoSelectors = [
    'ytd-video-renderer',
    'ytd-rich-item-renderer', 
    'ytd-grid-video-renderer'
  ];
  
  // 従来の動画要素を処理
  traditionalVideoSelectors.forEach(selector => {
    const videos = document.querySelectorAll(selector);
    console.log(`[DEBUG] Found ${videos.length} ${selector} elements`);
    
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
      
      if (isChannelBlocked(channelId, channelName)) {
        // 動画を非表示にする
        video.style.display = 'none';
        console.log(`Blocked traditional video from channel: ${channelName} (${channelId})`);
      } else if (channelId) {
        // ブロックボタンを追加
        addBlockButton(video, channelId, channelName);
      }
      
      video.setAttribute('data-channel-blocker-processed', 'true');
    });
  });
  
  // 関連動画（ytd-compact-video-renderer）を処理
  const compactVideos = document.querySelectorAll('ytd-compact-video-renderer');
  console.log(`[DEBUG] Found ${compactVideos.length} ytd-compact-video-renderer elements`);
  
  compactVideos.forEach((compactVideo, index) => {
    console.log(`[DEBUG] Processing compact video ${index}`);
    
    if (compactVideo.hasAttribute('data-channel-blocker-processed')) {
      console.log(`[DEBUG] Compact video ${index} already processed`);
      return;
    }
    
    // チャンネル情報を抽出
    const channelInfo = extractChannelFromCompactVideo(compactVideo);
    console.log(`[DEBUG] Compact video ${index} channel info:`, channelInfo);
    
    if (channelInfo) {
      const { id: channelId, name: channelName } = channelInfo;
      
      if (isChannelBlocked(channelId, channelName)) {
        // 関連動画を非表示にする
        compactVideo.style.display = 'none';
        console.log(`Blocked compact video from channel: ${channelName} (${channelId})`);
      } else {
        // ブロックボタンを追加
        console.log(`[DEBUG] Adding block button to compact video ${index}`);
        addBlockButtonToCompactVideo(compactVideo, channelId, channelName);
      }
    } else {
      console.log(`[DEBUG] No channel info extracted for compact video ${index}`);
    }
    
    compactVideo.setAttribute('data-channel-blocker-processed', 'true');
  });
  
  // 旧式のyt-lockup-view-model要素も処理（後方互換性）
  const lockupElements = document.querySelectorAll('yt-lockup-view-model');
  console.log(`[DEBUG] Found ${lockupElements.length} yt-lockup-view-model elements`);
  
  lockupElements.forEach((lockup, index) => {
    console.log(`[DEBUG] Processing lockup ${index}`);
    
    if (lockup.hasAttribute('data-channel-blocker-processed')) {
      console.log(`[DEBUG] Lockup ${index} already processed`);
      return;
    }
    
    // 旧式の処理ロジック（既存コードを維持）
    const channelInfo = extractChannelFromLockup(lockup);
    console.log(`[DEBUG] Lockup ${index} channel info:`, channelInfo);
    
    if (channelInfo) {
      const { id: channelId, name: channelName } = channelInfo;
      
      if (isChannelBlocked(channelId, channelName)) {
        lockup.style.display = 'none';
        console.log(`Blocked lockup video from channel: ${channelName} (${channelId})`);
      } else {
        console.log(`[DEBUG] Adding block button to lockup ${index}`);
        addBlockButtonToLockup(lockup, channelId, channelName);
      }
    } else {
      console.log(`[DEBUG] No channel info extracted for lockup ${index}`);
    }
    
    lockup.setAttribute('data-channel-blocker-processed', 'true');
  });
}

// yt-lockup-view-model からチャンネル名を抽出（後方互換性用）
function extractChannelFromLockup(lockupElement) {
  console.log('[DEBUG] Processing lockup element:', lockupElement);
  
  // より広範囲でテキスト要素を探す
  const allTextElements = lockupElement.querySelectorAll('*');
  let metadataText = '';
  
  // すべてのテキストコンテンツを結合
  allTextElements.forEach(el => {
    const text = el.textContent?.trim();
    if (text && text.length > 10 && text.includes('回視聴')) {
      metadataText = text;
    }
  });
  
  console.log('[DEBUG] Found metadata text:', metadataText);
  
  if (!metadataText) {
    // フォールバック: lockup全体のテキストを使用
    metadataText = lockupElement.textContent?.trim() || '';
    console.log('[DEBUG] Fallback metadata text:', metadataText);
  }
  
  if (metadataText) {
    // 複数のパターンを試行
    const patterns = [
      // パターン1: 「チャンネル名」数字「回視聴」
      /([^\d\[\]【】\n]+?)(\d+(?:[,.]\d+)*(?:[万千億])?\s*回視聴)/,
      // パターン2: より緩い「チャンネル名」数字「万」「回視聴」
      /([^0-9\[\]【】\n]{2,30})(\d+[万千億]?\s*回視聴)/,
      // パターン3: 「】」の後のテキスト
      /】([^0-9\[\]【】\n]{2,30})(\d+[万千億]?\s*回視聴)/
    ];
    
    for (const pattern of patterns) {
      const match = metadataText.match(pattern);
      console.log('[DEBUG] Trying pattern:', pattern, 'Result:', match);
      
      if (match && match[1]) {
        let channelCandidate = match[1].trim();
        
        // 不要な文字を除去
        channelCandidate = channelCandidate.replace(/^[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+/, '');
        channelCandidate = channelCandidate.replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/, '');
        
        console.log('[DEBUG] Cleaned channel candidate:', channelCandidate);
        
        if (channelCandidate.length >= 2 && channelCandidate.length <= 50) {
          const channelId = '@' + channelCandidate.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '');
          console.log('[DEBUG] Extracted channel:', { id: channelId, name: channelCandidate });
          return {
            id: channelId,
            name: channelCandidate
          };
        }
      }
    }
  }
  
  console.log('[DEBUG] No channel extracted from lockup');
  return null;
}

// 従来の動画要素にブロックボタンを追加
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

// ytd-compact-video-renderer要素にブロックボタンを追加
function addBlockButtonToCompactVideo(compactVideoElement, channelId, channelName) {
  console.log('[DEBUG] addBlockButtonToCompactVideo called with:', channelId, channelName);
  
  // 既にブロックボタンが存在するかチェック
  if (compactVideoElement.querySelector('.channel-block-btn-compact')) {
    console.log('[DEBUG] Block button already exists');
    return;
  }
  
  // ブロックボタンを作成
  const blockBtn = document.createElement('button');
  blockBtn.className = 'channel-block-btn-compact';
  blockBtn.textContent = getContentText('blockButton');
  blockBtn.title = getContentText('blockButtonTitle', { name: channelName });
  
  console.log('[DEBUG] Created block button:', blockBtn);
  
  blockBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[DEBUG] Block button clicked for:', channelName);
    
    // 確認ダイアログを削除し、直接ブロック実行
    addToBlockedChannels(channelId, channelName);
  });
  
  // compact video要素の適切な場所に配置
  const metadataContainer = compactVideoElement.querySelector('#metadata, ytd-video-meta-block, .ytd-video-meta-block');
  if (metadataContainer) {
    console.log('[DEBUG] Found metadata container, adding button');
    metadataContainer.style.position = 'relative';
    blockBtn.style.position = 'absolute';
    blockBtn.style.top = '5px';
    blockBtn.style.right = '5px';
    blockBtn.style.zIndex = '1000';
    metadataContainer.appendChild(blockBtn);
  } else {
    console.log('[DEBUG] Metadata container not found, using fallback');
    // フォールバック: compact video要素の最後に追加
    compactVideoElement.style.position = 'relative';
    compactVideoElement.appendChild(blockBtn);
  }
  
  console.log('[DEBUG] Block button added successfully');
}

// yt-lockup-view-model要素にブロックボタンを追加（後方互換性）
function addBlockButtonToLockup(lockupElement, channelId, channelName) {
  console.log('[DEBUG] addBlockButtonToLockup called with:', channelId, channelName);
  
  // 既にブロックボタンが存在するかチェック
  if (lockupElement.querySelector('.channel-block-btn-lockup')) {
    console.log('[DEBUG] Block button already exists');
    return;
  }
  
  // ブロックボタンを作成
  const blockBtn = document.createElement('button');
  blockBtn.className = 'channel-block-btn-lockup';
  blockBtn.textContent = getContentText('blockButton');
  blockBtn.title = getContentText('blockButtonTitle', { name: channelName });
  
  console.log('[DEBUG] Created block button:', blockBtn);
  
  blockBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[DEBUG] Block button clicked for:', channelName);
    
    // 確認ダイアログを削除し、直接ブロック実行
    addToBlockedChannels(channelId, channelName);
  });
  
  // lockup要素の適切な場所に配置
  const contentDiv = lockupElement.querySelector('.yt-lockup-view-model-wiz');
  if (contentDiv) {
    console.log('[DEBUG] Found content div, adding button');
    // 相対位置でボタンを配置
    contentDiv.style.position = 'relative';
    blockBtn.style.position = 'absolute';
    blockBtn.style.top = '5px';
    blockBtn.style.right = '5px';
    blockBtn.style.zIndex = '1000';
    contentDiv.appendChild(blockBtn);
  } else {
    console.log('[DEBUG] Content div not found, using fallback');
    // フォールバック: lockup要素の最後に追加
    lockupElement.style.position = 'relative';
    lockupElement.appendChild(blockBtn);
  }
  
  console.log('[DEBUG] Block button added successfully');
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
  const existingButtons = document.querySelectorAll('.channel-block-btn, .channel-block-btn-lockup, .channel-block-btn-compact');
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
      
      // チャンネル名のセットも更新
      blockedChannelNames = new Set();
      Object.entries(channelNames).forEach(([channelId, channelName]) => {
        if (blockedChannels.has(channelId)) {
          blockedChannelNames.add(channelName.toLowerCase().trim());
        }
      });
      
      hideBlockedVideos();
    }
    if (changes.channelNames) {
      channelNames = changes.channelNames.newValue || {};
      console.log('Channel names updated:', channelNames);
      
      // チャンネル名のセットも更新
      blockedChannelNames = new Set();
      Object.entries(channelNames).forEach(([channelId, channelName]) => {
        if (blockedChannels.has(channelId)) {
          blockedChannelNames.add(channelName.toLowerCase().trim());
        }
      });
    }
    if (changes.language) {
      currentLanguage = changes.language.newValue || 'ja';
      console.log('Language updated:', currentLanguage);
      // 既存のボタンテキストを更新
      updateExistingBlockButtons();
    }
  }
});