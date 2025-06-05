// content.js

let isExtracting = false;

// デバッグ用のログを出力する関数
function debugLog(...args) {
  // デバッグ時は以下のコメントを外す
  // console.log('[Listen Text Extractor]', ...args);
}

// メッセージ受信のハンドラ
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('メッセージを受信しました:', message);
  
  if (message.action !== 'extractText') {
    return false;
  }

  // 既に抽出中の場合は処理しない
  if (isExtracting) {
    debugLog('既に抽出処理を実行中です');
    chrome.runtime.sendMessage({
      action: 'extractionResult',
      data: {
        status: 'already_processing',
        message: '既に抽出処理を実行中です'
      }
    });
    return true;
  }

  isExtracting = true;
  debugLog('テキスト抽出を開始します');
  
  // 非同期で処理を実行
  (async () => {
    try {
      const result = await extractAndSendText();
      debugLog('テキストの抽出に成功しました');
      chrome.runtime.sendMessage({
        action: 'extractionResult',
        data: {
          status: 'success',
          data: result
        }
      });
    } catch (error) {
      console.error('テキスト抽出エラー:', error);
      debugLog('エラーが発生しました:', error);
      chrome.runtime.sendMessage({
        action: 'extractionResult',
        data: {
          status: 'error',
          error: error.message || 'テキストの抽出中にエラーが発生しました',
          stack: error.stack // スタックトレースを追加
        }
      });
    } finally {
      isExtracting = false;
      debugLog('テキスト抽出処理を終了します');
    }
  })();
  
  // 非同期で応答するために true を返す
  return true;
});

// テキストを抽出する関数
async function extractAndSendText() {
  // debugLog('extractAndSendText: 開始');
  
  // 要素の表示状態を保存する配列を関数の先頭で宣言
  let elementsToHide = [];
  
  try {
    // ページが完全に読み込まれるまで待機
    if (document.readyState !== 'complete') {
      // debugLog('ドキュメントの読み込みを待機中...');
      await new Promise((resolve, reject) => {
        if (document.readyState === 'complete') {
          // debugLog('ドキュメントは既に読み込み完了しています');
          resolve();
        } else {
          const timer = setTimeout(() => {
            window.removeEventListener('load', onLoad);
            // debugLog('ドキュメントの読み込み待ちがタイムアウトしました');
            resolve(); // タイムアウトしても処理を続行
          }, 3000); // 3秒でタイムアウト
          
          const onLoad = () => {
            clearTimeout(timer);
            // debugLog('ドキュメントの読み込みが完了しました');
            resolve();
          };
          
          window.addEventListener('load', onLoad, { once: true });
        }
      });
    }

    // debugLog('ドキュメントの状態:', {
    //   readyState: document.readyState,
    //   title: document.title,
    //   url: window.location.href
    // });

    // メインコンテンツを特定するためのセレクター
    const mainContentSelectors = [
      'article', 
      'main', 
      '[role="main"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      '.content',
      '.text',
      'div[class*="content"]',
      'div[class*="article"]',
      'div[class*="post"]',
      'div[class*="text"]',
      'div[class*="replaceable-content"]'
    ];

    // 除外する要素のセレクター
    const excludeSelectors = [
      'script', 
      'style', 
      'noscript', 
      'iframe', 
      'object', 
      'embed',
      'header',
      'footer',
      'nav',
      'aside',
      'button',
      'a',
      'input',
      'select',
      'textarea',
      'svg',
      '.ad',
      '.advertisement',
      '.header',
      '.footer',
      '.navigation',
      '.sidebar',
      '[role="navigation"]',
      '[class*="menu"]',
      '[class*="btn"]'
    ];

    // debugLog('要素を非表示にします');
    // 除外要素を非表示にする
    elementsToHide = []; // 既に宣言されている変数を使用
    excludeSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && el.style) {
            elementsToHide.push({
              el,
              originalDisplay: el.style.display
            });
            el.style.display = 'none';
          }
        });
      } catch (e) {
        console.error(`セレクタ ${selector} の処理中にエラーが発生しました:`, e);
      }
    });

    try {
      // debugLog('メインコンテンツを検索中...');
      // メインコンテンツを探す
      let mainContent = null;
      let foundWithSelector = '';
      
      for (const selector of mainContentSelectors) {
        try {
          const elements = document.querySelectorAll(selector);
          // debugLog(`セレクタ "${selector}" で ${elements.length} 個の要素が見つかりました`);
          
          if (elements.length > 0) {
            const content = Array.from(elements).find(el => {
              const text = el.innerText || '';
              const isValid = text.length > 100; // ある程度の長さがあることを確認
              // debugLog(`要素チェック: 長さ=${text.length}, 有効=${isValid}`, {
                // selector,
                // text: text.substring(0, 50) + (text.length > 50 ? '...' : '')
              // });
              return isValid;
            });
            
            if (content) {
              mainContent = content;
              foundWithSelector = selector;
              // debugLog(`メインコンテンツをセレクタ "${selector}" で見つけました`);
              break;
            }
          }
        } catch (e) {
          console.error(`セレクタ ${selector} の処理中にエラーが発生しました:`, e);
        }
      }

      // メインコンテンツが見つからない場合はbody全体を使用
      const content = mainContent || document.body;
      // debugLog(`使用するコンテンツ: ${mainContent ? foundWithSelector : 'document.body'}`);
      
      let text = '';
      try {
        text = content.innerText || content.textContent || '';
        // debugLog(`抽出したテキストの長さ: ${text.length} 文字`);
      } catch (e) {
        console.error('テキストの抽出中にエラーが発生しました:', e);
        throw new Error(`テキストの抽出に失敗しました: ${e.message}`);
      }

      // テキストのクリーンアップ
      text = text
        .replace(/[\r\n\t]+/g, '\n') // 改行とタブを正規化
        .replace(/[\s\u3000]+/g, ' ') // 全角・半角スペースを1つに
        .replace(/\n\s*\n/g, '\n\n') // 連続する改行を2つに
        .trim();

      // テキストが空の場合はエラーをスロー
      if (!text) {
        throw new Error('テキストが見つかりませんでした');
      }

      // debugLog('テキストの抽出が完了しました');
      return text;
      
    } catch (error) {
      console.error('テキスト抽出中にエラーが発生しました:', error);
      throw error; // エラーを再スローして上位のcatchブロックで処理
    }
    
  } catch (error) {
    console.error('extractAndSendText でエラーが発生しました:', error);
    throw error; // エラーを再スロー
  } finally {
    // debugLog('クリーンアップを実行します');
    // 非表示にした要素を元に戻す
    if (elementsToHide && elementsToHide.length > 0) {
      elementsToHide.forEach(({ el, originalDisplay }) => {
        try {
          if (el && el.style) {
            el.style.display = originalDisplay;
          }
        } catch (e) {
          console.error('要素の表示状態を元に戻す際にエラーが発生しました:', e);
        }
      });
    }
    // // debugLog('extractAndSendText: 終了');
  }
}

// 初期ログ（デバッグ時はコメントを外す）
// console.log('Content Script: ページの読み込み状態:', document.readyState);
// console.log('Content Script: ユーザーエージェント:', navigator.userAgent);

// デバッグ用に要素を確認（デバッグ時はコメントを外す）
// setTimeout(() => {
//   console.log('Content Script: デバッグ情報 - ドキュメントの状態:');
//   console.log('- readyState:', document.readyState);
//   console.log('- title:', document.title);
//   console.log('- URL:', window.location.href);
  
//   // ページ内の要素数をカウント
//   const elements = document.querySelectorAll('*');
//   console.log(`- 要素の総数: ${elements.length}`);
  
//   // よく使われる要素の数をカウント
//   const commonTags = ['div', 'p', 'span', 'article', 'section', 'main', 'header', 'footer'];
//   commonTags.forEach(tag => {
//     const count = document.getElementsByTagName(tag).length;
//     if (count > 0) {
//       console.log(`- <${tag}> 要素の数: ${count}`);
//     }
//   });
  
//   // クラス名に特定の文字列が含まれる要素を探す
//   const classKeywords = ['content', 'post', 'article', 'text', 'body', 'main'];
//   classKeywords.forEach(keyword => {
//     const elements = document.querySelectorAll(`[class*="${keyword}"]`);
//     if (elements.length > 0) {
//       console.log(`- クラス名に "${keyword}" を含む要素: ${elements.length} 個`);
//       if (elements.length < 5) {
//         elements.forEach((el, i) => {
//           console.log(`  ${i + 1}. クラス: ${el.className}, タグ: <${el.tagName.toLowerCase()}>`);
//           console.log(`     テキスト: "${el.textContent.substring(0, 50)}${el.textContent.length > 50 ? '...' : ''}"`);
//         });
//       }
//     }
//   });
  
//   console.log('Content Script: デバッグ情報の出力を完了');
// }, 2000);
