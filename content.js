console.log("★★★ My Content Script for Listen page has started! (Simple Debug Mode) ★★★");

// クラス名に 'replaceable-content' を含む全てのdiv要素を取得
const textElements = document.querySelectorAll('div[class*="replaceable-content"]');

// 見つかった要素の数を出力
console.log("Found elements with selector 'div[class*=\"replaceable-content\"]': ", textElements.length);

// もし要素が1つ以上見つかれば、最初のいくつかの中身を表示してみる
if (textElements.length > 0) {
  console.log("--- First element (Simple Debug) ---");
  console.log("innerText: [", textElements[0].innerText, "]");
  // textContent も見ておくと良いかもしれません
  // console.log("textContent: [", textElements[0].textContent, "]");

  if (textElements.length > 1) {
    console.log("--- Second element (Simple Debug) ---");
    console.log("innerText: [", textElements[1].innerText, "]");
  }
} else {
  // 要素が見つからなかった場合のメッセージ
  console.log("No elements found with the specified selector (Simple Debug). Please re-check the selector or the page's HTML structure and loading timing.");
}
