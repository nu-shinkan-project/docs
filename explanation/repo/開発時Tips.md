# 開発時の Tips

この文書では、開発時に便利な Git やリポジトリの使い方を紹介する。

いずれも必須の運用ではない。必要に応じて利用するとよい。

## 複数のブランチを同時に扱う

並行作業を行う方法としては，(`git worktree`ではなく) ワークスペースごとにcloneを行う方法をすすめる．
devcontainer内で作業する都合上，ホストで`git worktree`によって並行作業用のワークスペースを切っても，devcontainer内では見えないためである．

devcontainer内で`git worktree`を用いてdevcontainer内にワークスペースを作成し，
File > New Window(Ctrl + Shift + N)で新しいウィンドウを立ち上げて，
devcontainer内で作成したワークスペースを選択するという方法もある．
nu-shinkanリポジトリを単体で配置している場合はこちらのほうが手軽だが，不意にdevcontainerをリビルドするとワークスペースがまるごと消失する危険性もある．

## PoC リポジトリを参照しながら開発する

別の PoC リポジトリの実装を参照しながら開発したい場合は、そのリポジトリを本リポジトリの配下へ clone して、nested Git repository として配置できる。

```text
nu-shinkan/
├── ...
└── poc-example/
    └── .git/
```

nested repository は本体とは独立した Git リポジトリとして扱われる。

そのため、PoC の履歴や変更を本体の Git 履歴へ混ぜることなく、同じワークスペースからコードを参照できる。

PoC の内容を本体へ取り込む場合は、PoC リポジトリそのものを組み込むのではなく、必要な設計や実装を本体側へ移植するとよい。
