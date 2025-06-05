// Listenの記事ページからテキストを抽出するスクリプト

// ページの読み込みが完了したら実行
document.addEventListener('DOMContentLoaded', function() {
  // クラス名に 'replaceable-content' を含む全てのdiv要素を取得
  const contentDivs = Array.from(document.querySelectorAll('div[class*="replaceable-content"]'));
  
  if (contentDivs.length === 0) {
    console.log('Listen抽出テキスト： 対象の要素が見つかりませんでした');
    return;
  }
  
  // 各div要素のテキストを取得して改行で結合
  const extractedText = contentDivs
    .map(div => div.innerText.trim())
    .filter(text => text.length > 0) // 空のテキストを除外
    .join('\n\n'); // 2つの改行で区切る
  
  // コンソールに出力
  console.log('Listen抽出テキスト：', extractedText);
  
  // 後で拡張機能のポップアップからも見られるように、メッセージとして送信
  chrome.runtime.sendMessage({
    action: 'extractedText',
    text: extractedText
  });
});
