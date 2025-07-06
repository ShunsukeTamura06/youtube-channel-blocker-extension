# アイコンファイルについて

manifest.json でアイコンファイルが参照されていますが、このリポジトリにはアイコンファイルは含まれていません。

## アイコンファイルの準備方法

### 方法1: 簡単なアイコンを自作する

以下のサイズでアイコンを作成してください：
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)  
- `icons/icon128.png` (128x128 pixels)

### 方法2: アイコンなしで動作させる

manifest.json からアイコンの設定を削除することで、デフォルトアイコンで動作します：

```json
{
  "manifest_version": 3,
  "name": "YouTube Channel Blocker",
  "version": "1.0.0",
  "description": "YouTube の特定チャンネルの動画をブロックする拡張機能",
  
  "permissions": [
    "storage",
    "activeTab"
  ],
  
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/*"],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_start"
    }
  ],
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "YouTube Channel Blocker"
  },
  
  "background": {
    "service_worker": "background.js"
  }
}
```

### 方法3: SVGアイコンを作成する（推奨）

この後、SVGアイコンファイルを作成します。