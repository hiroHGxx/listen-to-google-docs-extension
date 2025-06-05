console.log("★★★ My Content Script for Listen page has started! (Full Text Output Mode) ★★★");

// クラス名に 'replaceable-content' を含む全てのdiv要素を取得
const textElements = document.querySelectorAll('div[class*="replaceable-content"]');

// 見つかった要素の数を出力
console.log("Found elements with selector 'div[class*=\"replaceable-content\"]': ", textElements.length);

// 全ての要素のテキストを表示
if (textElements.length > 0) {
  textElements.forEach((element, index) => {
    console.log(`--- Element ${index + 1}/${textElements.length} ---`);
    console.log(element.innerText);
    console.log('\n'); // 要素の区切りに空行を追加
  });
  
  // 全テキストを結合して出力（オプション）
  const allText = Array.from(textElements).map(el => el.innerText).join('\n\n');
  console.log('=== 全テキスト（結合版）===');
  console.log(allText);
} else {
  // 要素が見つからなかった場合のメッセージ
  console.log("No elements found with the specified selector. Please re-check the selector or the page's HTML structure and loading timing.");
}
