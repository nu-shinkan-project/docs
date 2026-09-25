# `deployment.yaml` の使い方

`deployment.yaml` は、パッケージを **staging / release / preview 環境へデプロイするときの設定**を記述するファイルです。

基本的な考え方は単純です。

- local で使う設定は `.env.development` や `wrangler.jsonc` に書く
- staging / release で local と異なる値だけを `deployment.yaml` に書く
- 他のパッケージとの接続関係も `deployment.yaml` に書く

つまり、`deployment.yaml` は環境変数を一から定義するファイルではなく、主に **デプロイ時の差分と接続関係を記述するファイル**です。

## 基本形

```yaml
envs:
  release:
    [環境変数名]: [値]
  staging:
    [環境変数名]: [値]

connections:
  bindings:
    [Binding名]: [接続先パッケージ名]
  urls:
    [環境変数名]: [接続先パッケージ名]

reviewEntry: false
```

すべての項目は省略できます。

必要な設定だけを書けば構いません。

---

# 環境ごとの設定を書く

たとえば、アプリケーションが次の環境変数を利用しているとします。

```text
ENV
```

local では `LOCAL`、staging では `STAGING`、release では `RELEASE` にしたい場合、まず local 用の値をネイティブの設定ファイルに書きます。

Vite なら:

```dotenv
VITE_ENV=LOCAL
```

Worker なら:

```jsonc
{
  "vars": {
    "ENV": "LOCAL"
  }
}
```

そして `deployment.yaml` には、local から変更する値だけを書きます。

```yaml
envs:
  staging:
    ENV: STAGING
  release:
    ENV: RELEASE
```

デプロイ時には、この設定によってネイティブファイルの値が上書きされます。

したがって、

```yaml
envs:
  staging:
    ENV: STAGING
```

しか書かなかった場合、release ではネイティブファイルの値がそのまま使われます。

## `envs` に書くべきもの

`envs` に書くのは、**環境によって値が変わる設定**です。

たとえば次のようなものです。

```yaml
envs:
  staging:
    ENV: STAGING
    LOG_LEVEL: debug

  release:
    ENV: RELEASE
    LOG_LEVEL: info
```

逆に、すべての環境で同じ値を使う設定を、わざわざ `deployment.yaml` に繰り返して書く必要はありません。

---

# 他のWorkerへの接続を書く

あるパッケージが別のパッケージへ接続する場合、その関係を `connections` に記述します。

この情報は特に preview デプロイで使われます。

preview では、通常は staging の接続先を利用します。しかし、接続先のパッケージも同じ変更に含まれている場合、その接続先を preview 用Workerへ自動的に差し替えることがあります。

`connections` は、その差し替えを可能にするための情報です。

## Service Binding の場合

たとえば `organization-web-app` が、`USER_SERVICE` というService Bindingを通して `@repo/organization-user-service` を利用している場合:

```yaml
connections:
  bindings:
    USER_SERVICE: "@repo/organization-user-service"
```

左側には `wrangler.jsonc` で使用しているBinding名を書きます。

右側には、そのBindingの接続先となるパッケージ名を書きます。

通常の staging / release デプロイでは通常のWorkerへ接続しますが、preview デプロイでは必要に応じて同じPRのpreview Workerへ接続先が差し替えられます。

---

# URL経由で接続する場合

Service Bindingではなく、環境変数にAPIのURLを設定して接続する場合は `connections.urls` を使います。

たとえば:

```yaml
connections:
  urls:
    API_URL: "@repo/organization-user-service"
```

これは、

> `API_URL` は `@repo/organization-user-service` が提供するAPIへのURLである

という意味です。

preview デプロイ時には、必要に応じて `API_URL` が preview 用WorkerのURLへ差し替えられます。

URLには個別のエンドポイントではなく、APIの**ベースURL**を設定します。

たとえば:

```text
https://example.com/api/
```

のような形式です。

---

# `reviewEntry`

`reviewEntry` は、そのパッケージ自身を **人間が変更内容を確認するための入口としてpreviewデプロイする必要があるか**を指定します。

典型的には、ブラウザから直接確認するfrontendで `true` にします。

```yaml
reviewEntry: true
```

たとえばfrontendがbackendに接続している場合、

```text
frontend
   ↓
backend
```

frontendを `reviewEntry: true` としておけば、backendだけが変更された場合でも、その変更を人間が確認するためにfrontendをpreview環境へデプロイできます。

backend自身を直接ブラウザで確認する必要がなければ、backend側は通常:

```yaml
reviewEntry: false
```

または単に省略できます。

---

# よくある例

## 単独のfrontend

他のパッケージへの接続がなく、previewで画面を確認したいfrontendなら:

```yaml
reviewEntry: true
```

これだけでも構いません。

---

## frontendからbackendへURLで接続する

```yaml
connections:
  urls:
    VITE_API_URL: "@repo/example-api"

reviewEntry: true
```

local の `VITE_API_URL` は `.env.development` に書きます。

```dotenv
VITE_API_URL=http://localhost:8787/
```

staging / release の通常デプロイでは、それぞれの環境向けAPI URLが使われます。

previewでは必要に応じて、同じ変更に含まれる `@repo/example-api` のpreview Workerへ接続先が差し替えられます。

---

## WorkerからWorkerへService Bindingで接続する

```yaml
connections:
  bindings:
    USER_SERVICE: "@repo/user-service"
```

この場合、`USER_SERVICE` がどのパッケージを指しているかをdeployment toolingが理解できます。

---

## 環境ごとに設定を変更するbackend

```yaml
envs:
  staging:
    ENV: STAGING
    LOG_LEVEL: debug

  release:
    ENV: RELEASE
    LOG_LEVEL: info
```

local の値は `wrangler.jsonc` に書きます。

```jsonc
{
  "vars": {
    "ENV": "LOCAL",
    "LOG_LEVEL": "debug"
  }
}
```

---

## 一通りの設定を持つfrontend

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

この設定からは、

- localではネイティブファイルの設定を使う
- staging / releaseでは `ENV` を上書きする
- `VITE_API_URL` は `@repo/example-api` への接続である
- previewで必要ならその接続先をpreview Workerへ差し替える
- このfrontendは人間によるpreview確認の入口になる

ということが分かります。

---

# `deployment.yaml` に書かなくてよいもの

## local専用の値

local環境でしか使わない値は、ネイティブファイルに書きます。

Vite:

```text
.env.development
```

Worker:

```text
wrangler.jsonc
```

`deployment.yaml` に `local` セクションを作る必要はありません。

## すべての環境で同じ値

環境によって変化しない値も、基本的にはネイティブファイルに書けば十分です。

## Credential

`deployment.yaml` はGit管理されます。

APIキー、token、passwordなどのcredentialは書かないでください。

CredentialはGitHub Secretsなど、専用の仕組みで管理します。

---

# 共通設定との関係

全パッケージで共通して使用する環境変数は、`packages/app-config/globalRuntimeEnvs.yaml` から配布されることがあります。

そのため、最終的な設定値は大まかに次の優先順位で決まります。

```text
preview用の接続先差し替え
        ↓
deployment.yaml
        ↓
globalRuntimeEnvs.yaml
        ↓
.env.development / wrangler.jsonc
```

通常、各パッケージの `deployment.yaml` を書くときには、

1. localで動く基本設定をネイティブファイルに置く
2. staging / releaseで変更する値だけ `envs` に書く
3. 他パッケージとの接続を `connections` に書く
4. preview確認の入口なら `reviewEntry: true` にする

と考えれば十分です。

---

# 迷ったときの判断基準

その設定が **「このパッケージ単体のlocal環境で必要な値」**なら、まずネイティブファイルに書きます。

そのうえで、

- staging / release だけ値を変えたい → `envs`
- 他のパッケージへのService Bindingである → `connections.bindings`
- 他のパッケージへのURLである → `connections.urls`
- このパッケージをpreview画面として人間に見せたい → `reviewEntry: true`

と考えると、どこに書くべきか判断できます。