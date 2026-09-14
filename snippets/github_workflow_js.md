---
relevant-to: Github Actions
---

# GitHub Actions のスクリプト作例

## GitHub Actions: github-script による GitHub API / コメント操作

GitHub REST API / PR・Issue コメント / Actions 出力操作 / 簡単なJSONオブジェクトの解析等を行う場合は `actions/github-script@v9` を使用します。

```yaml
- name: Post PR Comment
  uses: actions/github-script@v9
  env:
    ACTION_PATH: ${{ github.action_path }}
    PR_NUMBER: ${{ inputs.pr_number }}
  with:
    script: |
      const path = require('node:path');
      const scriptPath = path.join(process.env.ACTION_PATH, 'comment.mjs');
      const { upsertComment } = await import(`file://${scriptPath}`);
      await upsertComment({
        github,
        context,
        core,
        prNumber: process.env.PR_NUMBER
      });
```

## GitHub Actions: Composite Action から同階層の .mjs 補助スクリプト呼び出し

ローカルロジック（複雑なGit操作、ファイル解析等）は Action 直下に同封した `.mjs` 補助スクリプトとして実行します。

```yaml
# .github/actions/my-action/action.yml
runs:
  using: "composite"
  steps:
    - name: Run Local Logic
      shell: bash
      env:
        PROFILE: ${{ inputs.profile }}
      run: node "${{ github.action_path }}/helper.mjs"
```

```javascript
// .github/actions/my-action/helper.mjs
import { execSync } from "node:child_process";

export function runHelper({ profile }) {
  console.log(`Executing helper script for profile: ${profile}`);
  // ローカルロジック
}

// エントリーポイント呼び出し
runHelper({
  profile: process.env.PROFILE,
});
```
