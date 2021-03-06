# 描画ツリー

Glisp のスケッチは、評価されることで「描画ツリー」とここで呼ぶデータを返します。例えば:

```cljs
(style (fill "darkblue")
 (rect [10 10 80 80]))
```

というスケッチは、このように展開されます。

```clojure
[:g :_
 [:style {:fill true :fill-color "darkblue"}
  [:path :M [10 10] :L [90 10] :L [90 90] :L [10 90] :Z]]]
```

この描画ツリーはスケッチと違い、関数呼び出しなど含まない、最終的に出力されるグラフィックを記述した静的なデータです。SVG の構造に似ています。ビューポート上に表示したり、PNG や SVG などの様々なフォーマットで書き出すするときには、実際にはこの描画ツリーがレンダラーに渡されることになります。

`rect` や `style` をはじめ、グラフィックに関わる多くの関数はこの描画ツリーを返します。もちろん、描画ツリーをスケッチ上に直接描くすることも出来ますが、そこからは「ここにこの大きさの丸がある」などといった意味論的な編集情報は抜け落ちてしまいます。これはスケッチと描画ツリーとの関係は、Illustrator の編集用ファイルと、アウトライン化したファイルの関係性にも似ています。

## メリット

Glisp の描画ツリーは動的なデータを含まず、その構造もとてもシンプルなので、レンダラーに評価器を実装する必要はなく、コンパクトに実装することができます。（[Canvas API での実装例](https://github.com/baku89/glisp/blob/master/src/renderer/render-to-context.ts)）また、プロジェクトファイルにスケッチに加えて評価後の描画ツリーのデータも同時に保存することできるはずです。そうすることでファイルを分けずともプロジェクトファイル自体をアウトライン後の入稿データとしても扱えたり、アプリ本体はなくともビュアーアプリでプレビュー出来る仕組みを作ることも容易です。

## 描画ツリーを確認する

現在のスケッチの描画ツリーは、コンソールから `*view*` と打ち込むことで確認できます。また、エディタでカーソルによって黄色くハイライトされている括弧部分を、`Ctrl+E` から評価後の値に展開することも可能です。次々と関数が描画ツリーに置き換わっていくのが確認できます。

## シンタックス

描画ツリーはベクタから構成され、子要素を持つエレメントとそうでない空要素に大別できます。

- **子要素を持つ**: `:g` `:clip` `:transform` `:style`
- **空要素**: `:path` `:text` など

子要素を持つエレメントはかならずこのような構造をとっています。

```
[:<タグ名><#ID名(オプション)> <属性値> <子要素1> <子要素2> ...]
```

また、`:path` は SVG の[パスコマンド](https://developer.mozilla.org/ja/docs/Web/SVG/Attribute/d#Path_commands)と同じ構造です。しかし、使えるコマンドは絶対位置指定の `M` `L` `C` `Z` のみです。これもレンダラーの実装をシンプルにするためです。

```clojure
[:path :M [0 0]                    ;; moveTo
       :L [100 100]                ;; lineTo
       :C [50 100] [50 50] [20 20] ;; cubicCurveTo
       :Z]
```
