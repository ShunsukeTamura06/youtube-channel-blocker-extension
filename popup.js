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

// ブロック済みチャンネルのデータ
let blockedChannels = [];
let channelNames = {}; // チャンネルIDと名前のマッピング

// ステータスメッセージを表示
function showStatus(message, type = 'info') {
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
    showStatus('データの読み込みに失敗しました', 'error');
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
    showStatus('データの保存に失敗しました', 'error');
  }
}

// チャンネルを追加
async function addChannel(channelId, channelName = '') {
  const normalizedId = normalizeChannelId(channelId);
  
  if (!normalizedId) {
    showStatus('有効なチャンネルIDまたはURLを入力してください', 'error');
    return;
  }
  
  if (blockedChannels.includes(normalizedId)) {
    showStatus('このチャンネルは既にブロック済みです', 'error');
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
  
  showStatus(`チャンネル "${channelNames[normalizedId]}" を追加しました`, 'success');
  
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
    
    showStatus(`チャンネル "${channelName}" を削除しました`, 'success');
  }
}

// すべてクリア
async function clearAll() {
  if (blockedChannels.length === 0) {
    showStatus('ブロック中のチャンネルはありません', 'error');
    return;
  }
  
  if (confirm(`${blockedChannels.length}個のブロック中チャンネルをすべて削除しますか？`)) {
    blockedChannels = [];
    channelNames = {};
    
    await saveData();
    updateUI();
    
    showStatus('すべてのチャンネルを削除しました', 'success');
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
  showStatus('データをエクスポートしました', 'success');
}

// データをインポート
function importData(file) {
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.blockedChannels || !Array.isArray(data.blockedChannels)) {
        throw new Error('無効なデータ形式です');
      }
      
      const confirmMessage = `${data.blockedChannels.length}個のチャンネルをインポートしますか？\n\n現在のデータは上書きされます。`;
      
      if (confirm(confirmMessage)) {
        blockedChannels = data.blockedChannels;
        channelNames = data.channelNames || {};
        
        await saveData();
        updateUI();
        
        showStatus(`${blockedChannels.length}個のチャンネルをインポートしました`, 'success');
      }
    } catch (error) {
      console.error('Import error:', error);
      showStatus('インポートに失敗しました: ' + error.message, 'error');
    }
  };
  
  reader.readAsText(file);
}

// UIを更新
function updateUI() {
  // チャンネル数を更新
  channelCount.textContent = `${blockedChannels.length} チャンネル`;
  
  // チャンネルリストを更新
  if (blockedChannels.length === 0) {
    channelList.innerHTML = `
      <div class="empty-state">
        <p>📝 ブロック中のチャンネルはありません</p>
        <p class="hint">YouTube で動画の「🚫 ブロック」ボタンをクリックして追加してください</p>
      </div>
    `;
  } else {
    const channelItems = blockedChannels.map(channelId => {
      const channelName = channelNames[channelId] || channelId;
      
      return `
        <div class="channel-item">
          <div class="channel-info">
            <div class="channel-name">${escapeHtml(channelName)}</div>
            <div class="channel-id">${escapeHtml(channelId)}</div>
          </div>
          <button class="remove-btn" data-channel-id="${escapeHtml(channelId)}">
            削除
          </button>
        </div>
      `;
    }).join('');
    
    channelList.innerHTML = channelItems;
    
    // 削除ボタンのイベントリスナーを追加
    channelList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const channelId = btn.getAttribute('data-channel-id');
        removeChannel(channelId);
      });
    });
  }
}

// HTMLエスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

// 初期化
loadData();