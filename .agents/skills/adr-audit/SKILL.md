---
name: adr-audit
description: "ADRのmetadata・置換関係・判断内容を監査する。通常の監査報告と規約に基づくNightly状態遷移を区別し、競合する判断の採否は別途扱う。"
---

# ADR監査

[文脈探索](../context-discovery/SKILL.md)を済ませ、[文書運用規則のADR節](../../../policy/documentation.md#adr)を読む。docs単独の場合はdocsルートを、メインの場合は `docs/` を対象にする。ここにあるコマンドは読取・検証専用で、状態を自動更新しない。

1. 通常の現状監査かNightlyの状態遷移を含む処理かを確認する。通常の監査は依頼範囲を対象にする。ADR全体の監査では収集側に `--path docs:ADR` を指定して全体を収集する。Nightlyでは規約が定めるmain上のdraftを対象とし、比較する関連ADRも読む。
2. context-discoveryの収集JSONについて[docs-auditの基本metadata検証](../docs-audit/references/metadata-validation.md)と固有検証を実行する。docsルートからの例：

   ```sh
   node .agents/skills/adr-audit/scripts/check-adr-metadata.mjs --input /tmp/adr-collection.json
   ```

   `--input -` はstdin。JSON出力と終了コードはdocs-auditの検証契約に従う。固有検証は入力中の状態値、ID重複、supersedesの型と参照関係を確認する。入力にない参照先、状態の未指定、自己参照・循環は確認用の警告であり、入力外のADRの不在や追加の禁止規則を意味しない。未指定のIDや収集失敗で必要な検査ができない場合は未評価となる。警告・未評価と実際の規約違反を区別する。
3. 対象ADRと関連ADRの全文を読み、適用範囲・判断・理由を比較する。意図された置換か、意図しない競合かを判断し、metadata検査の通過だけで本文監査を通過扱いにしない。未解決の参照は文書を調べる。
4. 通常の監査では指摘と未評価を報告する。Nightly処理では規約の遷移条件を満たしてからdraftのstatus・auditと置換対象の状態を更新する。競合する判断のどれを採用するかを監査だけで決めない。既存ADR本文の編集権限は規約に従う。

自動実行基盤の構築・外部投稿は、その作業が依頼されている場合に別途行う。
