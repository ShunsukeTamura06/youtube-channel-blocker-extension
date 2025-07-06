// YouTube Channel Blocker - Background Script
console.log('YouTube Channel Blocker: Background script loaded');

// 拡張機能がインストールされた時の処理
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('YouTube Channel Blocker installed');
    
    // 初期設定
    chrome.storage.sync.set({
      blockedChannels: [],
      channelNames: {}
    });
  } else if (details.reason === 'update') {
    console.log('YouTube Channel Blocker updated');
  }
});

// ストレージの変更を監視
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    console.log('Storage changed:', changes);
  }
});

// アクションボタンがクリックされた時の処理
chrome.action.onClicked.addListener((tab) => {
  // popup.html が設定されているので、このイベントは通常発生しない
  console.log('Action button clicked on tab:', tab.url);
});

// コンテンツスクリプトからのメッセージを処理
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message, 'from:', sender.tab?.url);
  
  if (message.type === 'channelBlocked') {
    // チャンネルがブロックされた時の通知など
    console.log(`Channel blocked: ${message.channelName} (${message.channelId})`);
  }
  
  sendResponse({ success: true });
});

// YouTube ページでの特別な処理
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    console.log('YouTube page loaded:', tab.url);
    
    // 必要に応じてコンテンツスクリプトに追加の処理を送信
    chrome.tabs.sendMessage(tabId, {
      type: 'pageLoaded',
      url: tab.url
    }).catch((error) => {
      // エラーを無視（コンテンツスクリプトが読み込まれていない場合など）
      console.log('Could not send message to content script:', error.message);
    });
  }
});