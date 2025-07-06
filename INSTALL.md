# インストールガイド

## 前提条件

- Google Chrome ブラウザ（バージョン 88 以降推奨）
- Git がインストールされている（オプション）

## インストール手順

### 方法1: Git を使用する場合

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/ShunsukeTamura06/youtube-channel-blocker-extension.git
   cd youtube-channel-blocker-extension
   ```

2. **Chrome の拡張機能ページを開く**
   - Chrome で `chrome://extensions/` にアクセス
   - または「Chrome メニュー」→「その他のツール」→「拡張機能」

3. **デベロッパーモードを有効化**
   - ページ右上の「デベロッパー モード」をONにする

4. **拡張機能を読み込む**
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - クローンしたフォルダ `youtube-channel-blocker-extension` を選択

### 方法2: ZIP ダウンロードを使用する場合

1. **ZIP ファイルをダウンロード**
   - GitHub ページの「Code」→「Download ZIP」をクリック
   - ダウンロードしたファイルを解凍

2. **Chrome の拡張機能ページを開く**
   - Chrome で `chrome://extensions/` にアクセス

3. **デベロッパーモードを有効化**
   - ページ右上の「デベロッパー モード」をONにする

4. **拡張機能を読み込む**
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - 解凍したフォルダを選択

## インストール確認

### 成功した場合
- 拡張機能一覧に「YouTube Channel Blocker」が表示される
- 拡張機能のアイコンがツールバーに表示される
- YouTube にアクセスすると動画にブロックボタンが表示される

### エラーが発生した場合
「[トラブルシューティング](#トラブルシューティング)」セクションを参照してください。

## 更新方法

### 自動更新（Git 使用時）
```bash
cd youtube-channel-blocker-extension
git pull origin main
```

### 手動更新
1. 新しいバージョンをダウンロード
2. Chrome の拡張機能ページで「更新」ボタンをクリック
3. または拡張機能を削除して再インストール

## アンインストール方法

1. `chrome://extensions/` を開く
2. 「YouTube Channel Blocker」を見つける
3. 「削除」をクリック
4. 確認ダイアログで「削除」をクリック

## トラブルシューティング

### よくあるエラーと解決方法

#### エラー: "manifest.json が見つかりません"
**原因**: 正しいフォルダを選択していない
**解決法**: 
- manifest.json ファイルが含まれるフォルダを選択する
- ZIPを解凍した場合、二重フォルダになっていないか確認

#### エラー: "Manifest version 2 is deprecated"
**原因**: 古いバージョンのChrome を使用している
**解決法**: Chrome を最新バージョンに更新

#### エラー: "Service worker registration failed"
**原因**: background.js ファイルの問題
**解決法**: 
- 拡張機能を一度削除して再インストール
- Chrome を再起動

#### YouTube でブロックボタンが表示されない
**原因**: 
- 拡張機能が正しく読み込まれていない
- YouTube の仕様変更

**解決法**:
1. `chrome://extensions/` で拡張機能が有効になっているか確認
2. YouTube ページを再読み込み（Ctrl+F5）
3. Chrome を再起動
4. 拡張機能を再インストール

#### ブロックが効かない
**原因**: 
- ストレージの権限問題
- YouTube の動的読み込み

**解決法**:
1. ポップアップからブロックリストを確認
2. ページを再読み込み
3. Chrome の再起動

#### ポップアップが開かない
**原因**: popup.html の読み込みエラー
**解決法**:
1. 拡張機能の詳細ページで「エラー」タブを確認
2. 拡張機能を再インストール

### デバッグ方法

#### コンソールログの確認
1. YouTube ページで F12 を押す
2. 「Console」タブを選択
3. "YouTube Channel Blocker" で検索

#### 拡張機能のエラー確認
1. `chrome://extensions/` を開く
2. 「YouTube Channel Blocker」の「詳細」をクリック
3. 「エラー」タブでエラーログを確認

#### ストレージの確認
1. F12 を押してデベロッパーツールを開く
2. 「Application」タブ→「Storage」→「Extension」
3. 拡張機能のIDをクリックしてデータを確認

## 開発者向け

### デバッグモードでの実行
1. manifest.json で "run_at": "document_idle" に変更
2. content.js にログを追加
3. Chrome DevTools でリアルタイム確認

### ファイル修正後の反映
1. `chrome://extensions/` を開く
2. 拡張機能の「更新」ボタンをクリック
3. またはページ全体を更新（Ctrl+R）

## サポート

問題が解決しない場合は、以下の情報を含めて Issues でご報告ください：

- Chrome バージョン
- OS（Windows/Mac/Linux）
- エラーメッセージの全文
- 問題が発生した手順
- コンソールログ（可能であれば）