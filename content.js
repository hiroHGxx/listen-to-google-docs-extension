// content.js
console.log("★★★ Content Script: Attempting to extract text... ★★★");

const textElements = document.querySelectorAll('div[class*="replaceable-content"]');
let extractedData = null; // 送信するデータを格納する変数

if (textElements.length > 0) {
  const allText = Array.from(textElements)
                    .map(el => el.innerText.trim())
                    .filter(text => text.length > 0)
                    .join('\n\n'); // 各ブロックを2つの改行で区切る

  console.log('=== 全テキスト（結合版）for sending ===');
  console.log(allText);
  extractedData = { text: allText, error: null };
} else {
  console.log("No text elements found on this page.");
  extractedData = { text: null, error: "文字起こしテキストが見つかりませんでした。" };
}

// 抽出結果（またはエラー情報）をポップアップやバックグラウンドに送信
if (extractedData) {
  chrome.runtime.sendMessage({
    action: "listenTextExtracted", // アクション名を明確に
    data: extractedData
  });
}
