---
name: context-discovery
description: "リポジトリ作業に適用する規約・指示・設計を探索し、必要なら文書のフロントマターを収集する。"
---

# 文脈の探索

まず[文書運用規則](../../../policy/documentation.md)を読み、文書種別・効力を確認する。

1. docsルートの `instructions/`・`policy/`・`lessons/` のツリーを確認し、名称と配置から関連候補を探す。`relevant-to` は候補の絞り込みだけに使い、残った候補の全文から適用条件を判断する。metadataの欠落だけで候補を捨てない。
2. `design/` と作業対象に関係するローカル設計・AGENTS.md・*.INSTR.mdを調べる。設計上の合意と実装の現状を区別する。
3. 必要に応じて `explanation/`・`ADR/`・`snippets/` と作業スキルを確認する。docsのスキルはdocsルートの `.agents/skills/`、メイン作業のスキルはメインルートの `.agents/skills/` から、名前・descriptionで発見する。該当するSKILL.mdを読む。
4. 適用する文書と不足情報を整理する。対象や前提が広がった場合は探索を追加する。

文書候補が多い場合は[metadata収集コマンド](references/metadata-collection.md)を使える。本文を読む代わりにはしない。

収集コマンドを使わず、docsルートで `rg --files instructions policy lessons design` などを実行し、候補文書の本文から探索することもできる。隠しディレクトリのスキル・ローカル指示を探す場合は `rg --files --hidden` を使う。
