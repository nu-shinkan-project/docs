# `deployment.yaml` の使い方

`deployment.yaml` は、パッケージをデプロイするときの**環境ごとの差分**と**他パッケージとの接続関係**を書くファイルです。

基本的には、local で動く設定を `.env.development` や `wrangler.jsonc` に書き、staging / release で変えたい部分だけを `deployment.yaml` に書きます。

```yaml
envs:
  staging:
    ENV: STAGING
  release:
    ENV: RELEASE

connections:
  urls:
    VITE_API_URL: "@repo/example-api"

reviewEntry: true
```

すべての項目は省略できます。

## 環境ごとに値を変える

local ではネイティブの設定ファイルに値を書きます。

```text
ENV=LOCAL
```

staging / release で値を変えたい場合だけ、`envs` に書きます。

```yaml
envs:
  staging:
    ENV: STAGING
  release:
    ENV: RELEASE
```

`deployment.yaml` に書かなかった設定は、元の設定値がそのまま使われます。

## 他のパッケージへ接続する

他のWorkerへ接続している場合、その関係を `connections` に書きます。

URLで接続する場合:

```yaml
connections:
  urls:
    VITE_API_URL: "@repo/example-api"
```

Service Bindingで接続する場合:

```yaml
connections:
  bindings:
    USER_SERVICE: "@repo/user-service"
```

これを書いておくと、previewデプロイ時に必要に応じて接続先をpreview Workerへ差し替えられます。

## `reviewEntry`

人間がpreview環境を開いて変更を確認する入口になるパッケージには、

```yaml
reviewEntry: true
```

を指定します。

典型的にはfrontendで `true`、backendでは省略します。

## 迷ったら

次のように考えればだいたい十分です。

- local の設定 → `.env.development` / `wrangler.jsonc`
- staging / release だけ変える値 → `envs`
- 他パッケージへの接続 → `connections`
- previewで人間が見る入口 → `reviewEntry: true`

Credentialは `deployment.yaml` に書かず、GitHub Secretsなどで管理してください。