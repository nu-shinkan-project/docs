# Wikiの運用目的

本Wikiは，

- リポジトリに強く結びついた運用規則（レビュー規則やブランチ戦略）
- コーディング/レビューエージェントへの指示書

など，productionコードとは別のライフサイクルを持つべき文書リソースを管理するために運用されます．

## 文書の参照先

分類・配置・編集条件は[文書運用規則](policy/documentation.md)に従います。

| 配置先 | 役割 |
| --- | --- |
| [ADR/](ADR/) | 判断と理由の履歴。日付付きファイル名と不変 ID・状態を持つ |
| [explanation/](explanation/) | 現在の仕組みの説明と作例 |
| [design/](design/) | 現在有効な合意済み設計 |
| [policy/](policy/) | 開発・運用の規約 |
| [instructions/](instructions/) | 適用範囲を持つエージェント向け指示 |
| [lessons/](lessons/) | 再利用可能な知見と再利用実績 |
| [templates/](templates/) | 文書作成用の雛形 |

Skill 文書はメインリポジトリの `.agents/skills/` に配置します。
