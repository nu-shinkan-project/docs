# docsリポジトリ

docsリポジトリは，[メインリポジトリ](https://github.com/nu-shinkan-project/nu-shinkan)にまつわる文書を保管するためのドキュメントリポジトリです．

主に，メインリポジトリとは異なるライフサイクルを持つ文書が保管されます． 逆に，メインリポジトリのライフサイクルと密接に関わる文書（ローカル文書）は保管されません．

例えば，大方針や，システム全体に関わる設計などは，ドキュメントリポジトリ（本リポジトリ）で運用されます．詳しくは文書運用規則をご覧ください．

## 文書の共同・リアルタイム編集がしたい場合

いくつかのオプションがあります．

- 全員がVSCode(もしくはVSCode系エディタ)を開ける環境であれば，[Live Share](https://marketplace.visualstudio.com/items?itemName=MS-vsliveshare.vsliveshare) が一番の選択肢です．
- もし，Webで完結させたいのであれば，[HackMD](https://hackmd.io/)でNoteを作成し，Githubと連携して編集したいファイルをPull．Noteをshareすると，同時編集ができます．編集が終わったらPushします．
- [Dhub](https://app.dhub.dev)もトライアル中です．こちらでは，ファイルごと同期操作なしにリポジトリ全体を同時編集することができます．
