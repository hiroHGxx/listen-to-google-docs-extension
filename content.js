// Listenの記事ページからテキストを抽出するスクリプト

console.log("★★★ My Content Script for Listen page has started! ★★★");

// ページの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', function() {
  // クラス名に 'replaceable-content' を含む全てのdiv要素を取得
  const contentDivs = Array.from(document.querySelectorAll('div[class*="replaceable-content"]'));
  
  console.log("Found 'replaceable-content' elements count: ", contentDivs.length); // 念のため要素数も確認

  if (contentDivs.length === 0) {
    console.log('Listen抽出テキスト： 対象の要素が見つかりませんでした');
    // ポップアップにも通知できるように、空のテキストまたはエラー情報を送ることも検討できます
    chrome.runtime.sendMessage({
      action: 'extractedText',
      text: "対象の要素が見つかりませんでした。" 
    });
    return;
  }
  
  // 各div要素のテキストを取得して改行で結合
  const extractedText = contentDivs
    .map(div => div.innerText.trim()) // 各要素のテキストを取得し、前後の空白をトリム
    .filter(text => text.length > 0)  // 空のテキストを除外
    .join('\n\n');                    // 2つの改行で各ブロックを区切って連結

  // コンソールに抽出したテキスト全体を出力して確認
  console.log('--- Listen抽出テキスト 全文 ---');
  console.log(extractedText);
  console.log('--- 全文ここまで ---');
  
  // 拡張機能のポップアップやバックグラウンドスクリプトに抽出したテキストを送信
  // このメッセージを受け取る側の準備も今後必要になります。
  chrome.runtime.sendMessage({
    action: 'extractedTextFromListenPage', // action名を少し具体的にしました
    data: extractedText // 送信するデータ
  });
});
