console.log('YouTube Channel Blocker: Content script loaded');

// ブロック済みチャンネルのリストを管理
let blockedChannels = new Set();

// ストレージからブロックリストを読み込み
async function loadBlockedChannels() {
  try {
    const result = await chrome.storage.sync.get(['blockedChannels']);
    blockedChannels = new Set(result.blockedChannels || []);
    console.log('Loaded blocked channels:', Array.from(blockedChannels));
  } catch (error) {
    console.error('Error loading blocked channels:', error);
  }
}

// チャンネルをブロックリストに追加
async function addToBlockedChannels(channelId, channelName) {
  blockedChannels.add(channelId);
  try {
    await chrome.storage.sync.set({
      blockedChannels: Array.from(blockedChannels)
    });
    console.log(`Channel blocked: ${channelName} (${channelId})`);
    
    // メッセージを表示
    showMessage(`チャンネル "${channelName}" をブロックしました`);
    
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
          channelName = link.textContent.trim();
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
  blockBtn.textContent = '🚫 ブロック';
  blockBtn.title = `チャンネル "${channelName}" をブロック`;
  
  blockBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`チャンネル "${channelName}" をブロックしますか？\n\nこのチャンネルのすべての動画が非表示になります。`)) {
      addToBlockedChannels(channelId, channelName);
    }
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

// URL変更の監視（SPAのため）
let currentUrl = location.href;
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    console.log('URL changed:', currentUrl);
    
    // 少し遅延を入れて動画をチェック
    setTimeout(() => {
      hideBlockedVideos();
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// 初期化
(async function init() {
  await loadBlockedChannels();
  
  // ページ読み込み完了時とDOMContentLoaded時に実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideBlockedVideos);
  } else {
    hideBlockedVideos();
  }
  
  // 追加の遅延実行（YouTube の動的ロードに対応）
  setTimeout(hideBlockedVideos, 2000);
  setTimeout(hideBlockedVideos, 5000);
})();

// ストレージの変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.blockedChannels) {
    blockedChannels = new Set(changes.blockedChannels.newValue || []);
    console.log('Blocked channels updated:', Array.from(blockedChannels));
    hideBlockedVideos();
  }
});