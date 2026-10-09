---
name: adr-audit
description: "Nightly監査で呼び出し、docsのmain上のdraft ADRの整合性を確認する。規約に従ってstatus・auditと置換対象の状態を更新する。"
---

# NightlyのADR監査

[文脈探索](../context-discovery/SKILL.md)で確認した規約を使い、[Nightly監査](../../../policy/documentation.md#nightly-監査)と[ADRの置換](../../../policy/documentation.md#adr-の置換)の規定に従う。以下のコマンドは、監査対象のmainの文書があるdocsルートから実行する。収集・検証コマンド自体は文書を更新しない。

1. docsリポジトリのmain上のADRを確認し、statusがdraftのADRを監査対象とする。比較するADRと置換対象も含めて、[収集コマンド](../context-discovery/references/metadata-collection.md)でADR全体を収集する。

   ```sh
   node .agents/skills/context-discovery/scripts/collect-frontmatter.mjs --docs-root . --path docs:ADR > /tmp/adr-collection.json
   ```

2. 収集時の診断を確認し、[基本metadata検証](../docs-audit/references/metadata-validation.md)とADR固有の検証を実行する。

   ```sh
   node .agents/skills/docs-audit/scripts/check-document-metadata.mjs --input /tmp/adr-collection.json
   node .agents/skills/adr-audit/scripts/check-adr-metadata.mjs --input /tmp/adr-collection.json
   ```

   固有検証は状態値、ID重複、supersedesの型と参照関係を確認する。入力にない参照先、状態の未指定、自己参照・循環は確認用の警告であり、それだけで規約違反と断定しない。未指定のIDや収集失敗で必要な検査ができない場合は未評価となる。JSON出力と終了コードは基本metadata検証と同じ契約に従う。

3. 対象ADRと関連ADRの全文を読み、適用範囲・判断・理由を比較する。supersedesによる意図された置換と、意図しない競合を区別する。未解決の参照は文書を調べ、metadata検査の通過だけで本文監査を通過扱いにしない。
4. 監査を通過したdraft ADRはstatusをaccepted、auditをpassedに更新する。競合が確認された場合はstatusをdraftに維持し、auditをconflictに更新する。新しいADRの採用時には、supersedesが示すaccepted ADRをsupersededに更新する。評価できなかった対象は通過扱いにしない。競合する判断のどれを採用するかは別途判断する。
5. 対象ADR、監査結果、metadataの更新内容、評価できなかった範囲を報告する。
