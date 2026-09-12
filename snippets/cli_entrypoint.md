---
relevant-to: CLI
---

# CLIエントリーポイントと内部ロジックの分離

[CLIの作成方針](../../policy/make-cli.md)に基づき、CLIの入出力と内部ロジックを別ファイルに置く作例。

## CLI

この作例では文字列オプションを取得して内部ロジックへ渡し、結果とエラーを表示している。

```ts
import { parseArgs } from "node:util";
import { applySettings } from "./settings.js";

function main() {
  const { values } = parseArgs({
    options: {
      endpoint: { type: "string" },
      "remove-legacy": { type: "boolean" },
    },
  });
  const updates: Record<string, string | null> = {};
  if (values.endpoint !== undefined) updates.ENDPOINT = values.endpoint;
  if (values["remove-legacy"]) updates.LEGACY = null;
  const result = applySettings(updates);
  console.log(JSON.stringify(result));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
```

非同期処理の場合は、同じエラー処理の範囲で `await main()` するなどして失敗を扱う。
テストが不要なごく簡単なパーシングや，エラーメッセージの表示だけを取り扱い，テストが必要な複雑なロジックは別ファイルに隔離する．
CLIエントリーポイントは他のファイルから`import`されないので，`main()`の実行までに条件分岐はない．
