console.log('YouTube Channel Blocker: Popup script loaded');

// DOM要素の取得
const channelInput = document.getElementById('channelInput');
const addBtn = document.getElementById('addBtn');
const channelList = document.getElementById('channelList');
const channelCount = document.getElementById('channelCount');
const clearAllBtn = document.getElementById('clearAllBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');
const status = document.getElementById('status');
const languageSelect = document.getElementById('languageSelect');

// ブロック済みチャンネルのデータ
let blockedChannels = [];
let channelNames = {}; // チャンネルIDと名前のマッピング

// 多言語化関数
function updateTexts() {
  // data-i18n 属性を持つ要素を更新
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = getText(key);
  });
  
  // placeholder を更新
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = getText(key);
  });
  
  // チャンネル数表示を更新
  updateChannelCountText();
}

// ステータスメッセージを表示
function showStatus(messageKey, type = 'info', replacements = {}) {
  const message = getText(messageKey, replacements);
  status.textContent = message;
  status.className = `status ${type}`;
  
  setTimeout(() => {
    status.textContent = '';
    status.className = 'status';
  }, 3000);
}

// チャンネルIDを正規化
function normalizeChannelId(input) {
  if (!input) return null;
  
  input = input.trim();
  
  // URLの場合は抽出
  if (input.includes('youtube.com')) {
    // @チャンネル名の形式
    const handleMatch = input.match(/@([^/?]+)/);
    if (handleMatch) {
      return '@' + handleMatch[1];
    }
    
    // /channel/ID の形式
    const channelMatch = input.match(/\/channel\/([^/?]+)/);
    if (channelMatch) {
      return channelMatch[1];
    }
    
    // /c/チャンネル名 の形式
    const customMatch = input.match(/\/c\/([^/?]+)/);
    if (customMatch) {
      return '/c/' + customMatch[1];
    }
    
    // /user/ユーザー名 の形式
    const userMatch = input.match(/\/user\/([^/?]+)/);
    if (userMatch) {
      return '/user/' + userMatch[1];
    }
  }
  
  // @で始まる場合はそのまま
  if (input.startsWith('@')) {
    return input;
  }
  
  // その他の場合は@を付ける
  return '@' + input;
}

// データの読み込み
async function loadData() {
  try {
    const result = await chrome.storage.sync.get(['blockedChannels', 'channelNames']);
    blockedChannels = result.blockedChannels || [];
    channelNames = result.channelNames || {};
    
    console.log('Loaded data:', { blockedChannels, channelNames });
    updateUI();
  } catch (error) {
    console.error('Error loading data:', error);
    showStatus('dataLoadError', 'error');
  }
}

// データの保存
async function saveData() {
  try {
    await chrome.storage.sync.set({
      blockedChannels: blockedChannels,
      channelNames: channelNames
    });
    console.log('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
    showStatus('dataSaveError', 'error');
  }
}

// チャンネルを追加
async function addChannel(channelId, channelName = '') {
  const normalizedId = normalizeChannelId(channelId);
  
  if (!normalizedId) {
    showStatus('invalidChannelId', 'error');
    return;
  }
  
  if (blockedChannels.includes(normalizedId)) {
    showStatus('channelAlreadyBlocked', 'error');
    return;
  }
  
  blockedChannels.push(normalizedId);
  
  // チャンネル名を保存（提供されている場合）
  if (channelName) {
    channelNames[normalizedId] = channelName;
  } else {
    // デフォルトの表示名を設定
    channelNames[normalizedId] = normalizedId;
  }
  
  await saveData();
  updateUI();
  
  showStatus('channelAdded', 'success', { name: channelNames[normalizedId] });
  
  // 入力フィールドをクリア
  channelInput.value = '';
}

// チャンネルを削除
async function removeChannel(channelId) {
  const index = blockedChannels.indexOf(channelId);
  if (index > -1) {
    blockedChannels.splice(index, 1);
    const channelName = channelNames[channelId] || channelId;
    delete channelNames[channelId];
    
    await saveData();
    updateUI();
    
    showStatus('channelRemoved', 'success', { name: channelName });
  }
}

// すべてクリア
async function clearAll() {
  if (blockedChannels.length === 0) {
    showStatus('noChannelsToRemove', 'error');
    return;
  }
  
  const confirmMessage = getText('confirmClearAll', { count: blockedChannels.length });
  if (confirm(confirmMessage)) {
    blockedChannels = [];
    channelNames = {};
    
    await saveData();
    updateUI();
    
    showStatus('allChannelsRemoved', 'success');
  }
}

// データをエクスポート
function exportData() {
  const data = {
    blockedChannels: blockedChannels,
    channelNames: channelNames,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `youtube-blocked-channels-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showStatus('dataExported', 'success');
}

// データをインポート
function importData(file) {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.blockedChannels || !Array.isArray(data.blockedChannels)) {
        throw new Error(getText('invalidDataFormat'));
      }
      
      const confirmMessage = getText('confirmImport', { count: data.blockedChannels.length });
      
      if (confirm(confirmMessage)) {
        blockedChannels = data.blockedChannels;
        channelNames = data.channelNames || {};
        
        await saveData();
        updateUI();
        
        showStatus('dataImported', 'success', { count: blockedChannels.length });
      }
    } catch (error) {
      console.error('Import error:', error);
      showStatus('importError', 'error');
    }
  };
  
  reader.readAsText(file);
}

// 安全にテキストをHTML要素に設定する関数
function safeSetText(element, text) {
  element.textContent = text;
}

// 安全にHTMLを作成する関数
function createSafeHTML(channelId, channelName) {
  const container = document.createElement('div');
  container.className = 'channel-item';
  
  const infoDiv = document.createElement('div');
  infoDiv.className = 'channel-info';
  
  const nameDiv = document.createElement('div');
  nameDiv.className = 'channel-name';
  safeSetText(nameDiv, channelName);
  
  const idDiv = document.createElement('div');
  idDiv.className = 'channel-id';
  safeSetText(idDiv, channelId);
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = getText('removeButton');
  removeBtn.addEventListener('click', () => {
    removeChannel(channelId);
  });
  
  infoDiv.appendChild(nameDiv);
  infoDiv.appendChild(idDiv);
  container.appendChild(infoDiv);
  container.appendChild(removeBtn);
  
  return container;
}

// チャンネル数表示を更新
function updateChannelCountText() {
  const countElement = document.getElementById('channelCount');
  if (countElement) {
    const channelsText = getText('channelsCount');
    countElement.innerHTML = `${blockedChannels.length} <span>${channelsText}</span>`;
  }
}

// UIを更新
function updateUI() {
  // チャンネル数を更新
  updateChannelCountText();
  
  // チャンネルリストを更新
  if (blockedChannels.length === 0) {
    channelList.innerHTML = `
      <div class="empty-state">
        <p>${getText('emptyStateMessage')}</p>
        <p class="hint">${getText('emptyStateHint')}</p>
      </div>
    `;
  } else {
    // 既存の内容をクリア
    channelList.innerHTML = '';
    
    // 各チャンネルアイテムを安全に作成
    blockedChannels.forEach(channelId => {
      const channelName = channelNames[channelId] || channelId;
      const channelItem = createSafeHTML(channelId, channelName);
      channelList.appendChild(channelItem);
    });
  }
}

// 言語変更時の処理
function onLanguageChange() {
  updateTexts();
  updateUI();
  
  // 言語設定を保存
  saveLanguage(languageSelect.value);
}

// 初期化
async function initialize() {
  // 言語設定を初期化
  await initializeLanguage();
  
  // 言語選択を設定
  languageSelect.value = currentLanguage;
  
  // テキストを更新
  updateTexts();
  
  // データを読み込み
  await loadData();
  
  // 言語変更リスナーを追加
  addLanguageChangeListener(() => {
    updateTexts();
    updateUI();
  });
}

// イベントリスナーの設定
addBtn.addEventListener('click', () => {
  const input = channelInput.value.trim();
  if (input) {
    addChannel(input);
  }
});

channelInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const input = channelInput.value.trim();
    if (input) {
      addChannel(input);
    }
  }
});

clearAllBtn.addEventListener('click', clearAll);

exportBtn.addEventListener('click', exportData);

importBtn.addEventListener('click', () => {
  importInput.click();
});

importInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    importData(file);
    // ファイル選択をリセット
    e.target.value = '';
  }
});

languageSelect.addEventListener('change', onLanguageChange);

// 初期化実行
initialize();