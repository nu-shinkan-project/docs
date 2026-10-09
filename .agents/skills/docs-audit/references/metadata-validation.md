# 文書metadataの検証

context-discoveryの[収集JSON](../../context-discovery/references/metadata-collection.md)を入力に、[文書運用規則](../../../../policy/documentation.md)が定めるmetadataを検証する。本文品質・リンク・ADR本文の競合は別に確認する。

Node.js 24以上を使う。外部実行依存はない。package.jsonとlockfileはpnpm 11.23.0で親workspaceと分離し、内部テストに `pnpm --dir .agents/skills/docs-audit --ignore-workspace test` を使える。メインから実行する場合はdirに `docs/` を付ける。

```sh
# docsルートから
node .agents/skills/docs-audit/scripts/check-document-metadata.mjs --input /tmp/documents.json

# メインルートから
node docs/.agents/skills/docs-audit/scripts/check-document-metadata.mjs --input /tmp/documents.json
```

`--input -` はstdinを読む。check-document-metadata.mjsはschemaVersion=1と入力構造を確認する。未対応版・不正JSONは入力エラーとなる。ファイルの補完・状態更新は行わない。

## 適用する検査

- ADRはid・created-at・relevant-to。idは空でない文字列であることを確認し、命名形式は検査しない。created-atはタイムゾーン付きのカレンダー上有効なISO 8601日時。status・audit・supersedesの検査はadr-auditが管理する。
- グローバル指示・Snippet・知見はrelevant-to。文字列または文字列リストを認める。空文字列・空リストは補助警告であり規約違反としない。
- Skillは標準metadataのname・description。独自のrelevant-to必須条件を追加しない。
- policy・design・explanation・ローカル文書にはrelevant-toを一律に要求しない。
- template・unknownは一律の必須項目検査から除外し、理由を警告する。分類不明だけで検査全体を未完了としない。必要ならエージェントが分類を確認する。

解析・読取に失敗した文書の必須項目検査は未評価とし、単なる欠落の違反を重ねて出さない。入力外の文書の網羅性は検査しない。

## 結果

stdoutにschemaVersion・outcome・issues・unassessedを持つJSONを出力する。

- issuesはcode・severity（error／warning）・messageと、該当するrootId・path・field・sourceを持つ。sourceは規約のパスまたは標準Skill metadataの形式を示す。複数文書が関係する場合はrelatedPathsを付ける。
- unassessedは収集失敗等で適用検査を実施できなかった項目を示す。入力外の文書は列挙しない。
- outcomeはpassed＝適用検査が完了しerrorなし、failed＝規約不適合あり、incomplete＝入力不正または適用検査に未評価あり。errorと未評価が混在する場合はincompleteとして両方を報告する。警告だけではincompleteにしない。

終了コードはpassed＝0、failed＝1、incomplete＝2。入力エラーはstderrにも理由を表示する。passedは適用したmetadata検査だけの結果で、検査除外、本文監査、ADRのaccepted/passedへの遷移まで保証しない。
