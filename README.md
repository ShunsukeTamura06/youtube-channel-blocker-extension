# YouTube Channel Blocker Extension

YouTube の特定チャンネルの動画をブロックする Chrome 拡張機能です。

## 機能

- ✅ YouTube の特定チャンネルの動画をブロック
- ✅ ブロックチャンネル一覧に追加されたチャンネルのすべての動画を非表示
- ✅ 動画一覧の各動画にブロックボタンを追加
- ✅ ブロックボタンでそのチャンネルをブロックリストに追加（ワンクリック）
- ✅ ブロックチャンネル一覧の管理（追加・削除）
- ✅ 手動でのチャンネル追加機能
- ✅ データのエクスポート・インポート機能
- ✅ 漢字チャンネル名の適切な表示
- 🌐 **日本語・英語の言語切り替え対応**
- 🎯 **関連動画・おすすめ動画のブロック対応**
- 🎨 **コンパクトで認識しやすいボタンデザイン**
- 🌗 **ライト・ダークモード自動対応**

## 対応範囲

### 📺 ブロック対象の動画
- **メイン動画一覧**: ホーム、検索結果、チャンネルページ
- **関連動画**: 動画再生ページのサイドバー
- **おすすめ動画**: YouTube の推奨コンテンツ
- **その他**: プレイリスト、トレンドページなど

### 🎛️ 技術対応
- **従来の要素**: `ytd-video-renderer`, `ytd-rich-item-renderer`, `ytd-grid-video-renderer`
- **新しい要素**: `ytd-compact-video-renderer` (関連動画用)
- **自動検出**: YouTube の UI 変更に自動対応
- **最適位置**: 「ライブ」「新着」バッジと同じ位置にブロックボタンを配置

## 言語サポート

### サポート言語
- 🇯🇵 **日本語** (デフォルト)
- 🇺🇸 **English** 

### 言語の切り替え方法
1. 拡張機能のポップアップを開く
2. 右上の言語セレクターで希望の言語を選択
3. 設定は自動保存され、全デバイスで同期されます

### 自動言語検出
- 初回インストール時にブラウザの言語設定を自動検出
- 日本語環境では日本語、その他では英語に設定

## インストール方法

### 開発版のインストール

1. このリポジトリをクローンまたはダウンロード
2. Chrome ブラウザで `chrome://extensions/` を開く
3. 右上の「デベロッパーモード」を有効にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. ダウンロードしたフォルダを選択

## 使用方法

### 動画から直接ブロック

1. YouTube で動画を閲覧
2. ブロックしたい動画の「Block」ボタンをクリック
3. 即座にそのチャンネルがブロックされ、すべての動画が非表示になります

**関連動画のブロック**:
- 動画再生中に右側の関連動画のサムネイル **左下角** に小さな「Block」ボタンが表示
- ライト・ダークモードに自動対応した見やすいデザイン
- クリックで即座にブロック、関連動画も非表示

### 拡張機能のポップアップから管理

1. ブラウザの拡張機能アイコンをクリック
2. 「チャンネルを手動で追加」セクションでチャンネル URL や @ChannelName を入力
3. 「追加」ボタンをクリック
4. ブロック中のチャンネル一覧で管理・削除が可能

### 対応する YouTube ページ

- ✅ **ホームページ** (推奨動画)
- ✅ **検索結果**
- ✅ **チャンネルページ**
- ✅ **動画再生ページ** (関連動画・おすすめ動画)
- ✅ **プレイリストページ**
- ✅ **トレンドページ**
- ✅ **サブスクリプションページ**

### 対応するチャンネル形式

- `@channelname` (新しいハンドル形式)
- `https://www.youtube.com/@channelname`
- `https://www.youtube.com/channel/CHANNEL_ID`
- `https://www.youtube.com/c/channelname`
- `https://www.youtube.com/user/username`
- **チャンネル名** (直接文字列マッチング)

## ファイル構成

```
youtube-channel-blocker-extension/
├── manifest.json          # 拡張機能の設定ファイル
├── content.js             # YouTube ページに注入されるスクリプト
├── content.css            # コンテンツスクリプト用スタイル
├── popup.html             # ポップアップの HTML
├── popup.js               # ポップアップの JavaScript
├── popup.css              # ポップアップのスタイル
├── i18n.js                # 多言語対応辞書
├── background.js          # バックグラウンドスクリプト
├── README.md              # このファイル
├── INSTALL.md             # 詳細インストールガイド
├── FEATURES.md            # 機能詳細
└── LICENSE                # MITライセンス
```

## 技術仕様

- **Manifest Version**: 3
- **対象サイト**: YouTube (youtube.com)
- **ストレージ**: Chrome Storage Sync API
- **権限**: storage, activeTab
- **言語**: 日本語・英語対応
- **対応要素**: 従来型 + 新型 YouTube UI + チャンネル名ベース
- **ボタンデザイン**: ライト・ダークモード自動対応

## データ管理

- ブロックリストは Chrome の同期ストレージに保存
- 複数のデバイス間で同期される
- エクスポート・インポート機能でバックアップ可能
- 言語設定も同期される
- チャンネル名ベースの高速検索対応

## 注意事項

- この拡張機能は YouTube の公式機能ではありません
- YouTube の仕様変更により動作しなくなる可能性があります
- ブロックされた動画は完全に削除されるわけではなく、非表示になるだけです

## 貢献

バグ報告や機能提案は Issues でお気軽にお知らせください。

## ライセンス

MIT License

## 更新履歴

### v1.3.3 (2025-07-06)
- ✍️ **ブロックボタンテキスト改善** - 「❌」→「Block」で機能が明確に
- 📏 **ボタン横幅最適化** - よりコンパクトで邪魔にならないサイズに調整
- 🌗 **ライト・ダークモード完全対応** - YouTubeのテーマに自動追従
- 🎨 **視認性向上** - ライトモードでは白背景、ダークモードでは黒背景で見やすく
- ⚡ **レスポンシブデザイン** - ユーザーのテーマ設定を自動検出

### v1.3.2 (2025-07-06)
- 🎨 **ブロックボタンデザイン大幅改善** - サイズ縮小でより目立たない配置
- ✨ **「ライブ」バッジとの差別化** - 半透明効果とブラーエフェクトで区別しやすく
- 🔤 **ボタンテキスト変更** - 「🚫 ブロック」→「❌」でよりコンパクトに
- 🎯 **ユーザビリティ向上** - モダンUIでYouTube視聴を邪魔しないデザイン
- ⚡ **ホバー効果強化** - 視覚的フィードバックの改善

### v1.3.1 (2025-07-06)
- 🎨 **ブロックボタン位置最適化** - サムネイル左下角に移動
- 📍 **YouTubeネイティブUI統一** - 「ライブ」「新着」バッジと同じ位置
- 🎯 **視覚的一貫性向上** - よりナチュラルな配置でユーザビリティ向上
- 🔧 **配置ロジック改善** - サムネイル要素への直接配置で確実性向上

### v1.3.0 (2025-07-06)
- 🔥 **関連動画ブロック機能の完全修正** - サイドバーの関連動画でブロック機能が正常動作
- ⚡ **Set-based高速検索** - O(1)時間計算量で劇的な高速化
- 🎨 **関連動画専用UI** - 小型でユーザビリティを損なわないデザイン
- 🔍 **チャンネル名ベースブロック** - チャンネルIDがなくても名前でブロック可能
- 🛡️ **後方互換性** - 既存機能は全て継続サポート

### v1.2.0 (2025-07-06)
- 🎯 **関連動画・おすすめ動画対応** - 動画再生時のサイドバー動画もブロック対象に
- 🔍 新しい YouTube UI (`yt-lockup-view-model`) に対応
- 🤖 チャンネル名の自動抽出機能を改良
- 🎨 関連動画用の専用ブロックボタンデザイン
- ⚡ パフォーマンスの最適化

### v1.1.0 (2025-07-06)
- 🌐 **多言語対応** - 日本語・英語の切り替え機能を追加
- 🔄 言語設定の自動同期
- 🎯 ブラウザ言語の自動検出
- 📱 ポップアップUIの改良（言語セレクター追加）
- 🔤 ブロックボタンと通知メッセージの多言語化

### v1.0.2 (2025-07-06)
- 🚀 ブロック時の確認ダイアログを削除（ワンクリックブロック）
- 🔧 漢字チャンネル名の文字化け問題を修正
- 💡 チャンネル一覧の表示を最適化（約2倍の表示数）

### v1.0.1 (2025-07-06)
- 🔧 MutationObserver エラーを修正
- 🛡️ DOM準備待機機能を追加
- ⚡ 安定性の向上

### v1.0.0 (2025-07-06)
- 🎉 初回リリース
- ✅ 基本的なチャンネルブロック機能
- 📱 ポップアップでの管理機能
- 💾 エクスポート・インポート機能

---

**Language Support**: 🇯🇵 日本語 | 🇺🇸 English  
**Coverage**: 📺 すべてのYouTube動画（メイン + 関連動画）  
**ブロック方式**: 🎯 チャンネルID + チャンネル名ダブル対応  
**UI Design**: 🎨 コンパクト + ライト・ダークモード自動対応