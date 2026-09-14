> **For agents:** This document is the authoritative design; align the 
> implementation with it. Design changes require explicit user instruction.

# CLIツールの作成

この文書は，コマンドラインから起動するスクリプトプログラム（CLIツール）の構成を定める．

## エントリーポイント

CLIツールのエントリーポイント（ツール起動時に指定されるファイル）は，次を含む．

- 引数・環境変数などの取得
- 内部ロジックの呼び出し
- エラー表示
- 終了処理

エントリーポイントはこれ以外を含まず，内部ロジック（別ファイル）に移譲する．

エントリーポイントは，次を含んではならない．

- 起動分岐（直接起動の検査によるTEST/import時の発火の回避）

テストが必要な複雑さを持つロジックは，内部ロジックに移譲せよ．また，それに伴って，test export（テストのためのexport statement）も禁ずる．
