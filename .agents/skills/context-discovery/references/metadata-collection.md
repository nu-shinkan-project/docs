# 文書metadataの収集

`collect-frontmatter.mjs` は指定範囲のMarkdownから先頭のYAMLフロントマターを収集する。規約適合や文書とタスクの関連性は判定しない。候補の全文を読んで判断する。

## 準備と実行

Node.js 24以上とpnpmを使う。スキル自身のpackage.json・lockfileが依存を管理し、メインのnode_modulesには依存しない。pnpm 11.23.0を指定している。親workspaceを探索しないよう `--ignore-workspace` を指定する。

```sh
# メインルートから
pnpm --dir docs/.agents/skills/context-discovery install --ignore-workspace --frozen-lockfile
node docs/.agents/skills/context-discovery/scripts/collect-frontmatter.mjs --docs-root docs > /tmp/documents.json

# docsルートから。docs単独のcheckoutでも使える。
pnpm --dir .agents/skills/context-discovery install --ignore-workspace --frozen-lockfile
node .agents/skills/context-discovery/scripts/collect-frontmatter.mjs --docs-root . > /tmp/documents.json
```

内部ロジックのテストはdocsルートから `pnpm --dir .agents/skills/context-discovery --ignore-workspace test` を実行する。メインルートから実行する場合はdirに `docs/` を付ける。依存導入前に[package-manager指示](../../../../instructions/tooling/package-manager.md)を確認する。Node・依存が未準備ならSKILL.mdの手動探索を使う。

## 対象

- `--docs-root <dir>` は必須。`--main-root <dir>` はメインのローカル文書・スキルを収集するときに指定する。ルートはcwdから解決する。
- `--path docs:<relative-path>` または `--path main:<relative-path>` を複数指定できる。指定がある場合はその集合だけを収集する。ルート未定義・不明なパス・ルート外の指定は開始条件のエラー。
- 標準対象はdocsのinstructions・policy・lessons・design・explanation・ADR・snippets。main-rootだけではメイン全体を走査しない。
- .git・node_modules・handoff・ビルド生成物を除外する。templatesは標準対象外だが明示指定できる。その場合はtemplateとして扱う。
- 自動探索ではディレクトリのsymlinkを辿らない。公開スキルを収集する場合はそのリンクを明示指定する。実体が指定したルート内にあることを確認し、同じ実体を重複収集しない。出力は実体のルート・相対パスで表す。

```sh
# メインルートからの限定収集
node docs/.agents/skills/context-discovery/scripts/collect-frontmatter.mjs \
  --docs-root docs --main-root . \
  --path docs:instructions --path main:.agents/skills/docs-audit
```

## JSONと診断

stdoutは次のschemaVersion=1のJSON、stderrは実行開始条件のエラー表示に使う。収集はファイルを書き換えない。

```json
{
  "schemaVersion": 1,
  "documents": [
    {
      "rootId": "docs",
      "path": "instructions/example.md",
      "kind": "global-instruction",
      "metadata": { "relevant-to": "Editing documentation" },
      "diagnostics": []
    }
  ],
  "diagnostics": []
}
```

kindは配置・命名からadr・global-instruction・snippet・lesson・policy・design・explanation・skill・local-instruction・local-design・local-explanation・local-manual・template・unknownとして分類する。templatesを優先し、SKILL.mdとAGENTS.md等の専用名を区別する。rootIdとpathで安定順に並べる。

空と欠落はどちらもmetadata={}。先頭以外の区切りやコード例はmetadataとしない。BOM・LF・CRLFを扱う。文字列・リストなど元のmetadataの型を保持する。本文・ハッシュ・実行時刻・対象範囲・完了フラグは出力しない。

読取・解析に失敗した文書はmetadata={}とし、documents[].diagnosticsにcode・messageを残す。コードはfrontmatter-invalid・document-unreadable。列挙失敗はトップレベルにdirectory-unreadableと対象パスを記録する。指定範囲に列挙・読取・解析失敗があれば、トップレベルにscanning-incompleteを出す。対象外の文書や未収集のADR全体については通知しない。

終了コードは0＝指定範囲の収集完了、1＝収集失敗を含む結果、2＝引数・ルート指定等の開始条件エラー。開始条件エラーも可能な限り空の文書一覧とscanning-incompleteをJSON出力する。空・欠落metadataは収集失敗ではない。後続検証は診断を読み、解析・読取失敗を必須項目の欠落と混同しない。
