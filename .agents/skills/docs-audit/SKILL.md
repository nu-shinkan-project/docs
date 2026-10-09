---
name: docs-audit
description: "指定した文書の現状を文書運用規則・品質要件・参照先と照合して監査する。基本metadata検証コマンドを提供する。"
---

# 文書の現状監査

[文脈探索](../context-discovery/SKILL.md)で確認した規約と対象範囲を使う。実体はdocsリポジトリ内にあり、メインの公開symlinkが使えない場合は `docs/.agents/skills/docs-audit/SKILL.md` を直接読む。docs単独でも実施できる。

1. 依頼された文書・範囲と監査観点を確認する。[文書運用規則](../../../policy/documentation.md)・[執筆要件](../../../instructions/documentation/writing-documents.md)を根拠に、文書種別・metadata・本文の品質・他文書との整合・参照先を確認する。
2. metadata検査にはcontext-discoveryの収集JSONを[検証コマンド](references/metadata-validation.md)に渡す。本文・リンク・設計との整合は別に読む。分類不明や補助警告だけで規約違反と断定しない。
3. 現状の適合、不整合、評価できなかった範囲を、対象パスと根拠とともに報告する。差分レビューを依頼された場合、メインではdocumentation-reviewを利用し、監査結果をレビューの根拠として渡す。

ADR固有の状態・置換関係・本文競合を調べる場合は[adr-audit](../adr-audit/SKILL.md)を利用する。通常の文書監査の実施にはADR監査を必須としない。監査を依頼されたことだけで、保護された文書の編集やADRの採否変更まで許可されたと扱わない。
