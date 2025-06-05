document.addEventListener('DOMContentLoaded', function() {
  const extractButton = document.getElementById('extractButton');
  const transcriptionDisplay = document.getElementById('transcriptionDisplay');
  const statusMessage = document.getElementById('statusMessage');

  // メッセージリスナーを設定
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Message received in popup:', message);
    
    if (message.action === 'listenTextExtracted') {
      const { text, error } = message.data;
      
      if (error) {
        showStatus(error, 'error');
        transcriptionDisplay.value = '';
      } else if (text) {
        showStatus('テキストを抽出しました！', 'success');
        transcriptionDisplay.value = text;
        
        // テキストをクリップボードにコピー
        copyToClipboard(text);
      }
      
      // ボタンを再度有効化
      extractButton.disabled = false;
      extractButton.textContent = 'テキストを抽出する';
    }
    
    // 非同期応答が必要な場合は true を返す
    return true;
  });

  // 抽出ボタンのクリックイベント
  extractButton.addEventListener('click', async function() {
    try {
      // ボタンを無効化し、処理中表示に
      extractButton.disabled = true;
      extractButton.textContent = '抽出中...';
      
      // ステータスメッセージをリセット
      hideStatus();
      
      // 現在のアクティブなタブを取得
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('アクティブなタブが見つかりません');
      }
      
      // 現在のタブで content.js を実行
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      
      showStatus('テキストを抽出しています...', 'info');
      
    } catch (error) {
      console.error('Error executing content script:', error);
      showStatus(`エラーが発生しました: ${error.message}`, 'error');
      extractButton.disabled = false;
      extractButton.textContent = 'テキストを抽出する';
    }
  });
  
  // ステータスメッセージを表示する関数
  function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
  }
  
  // ステータスメッセージを非表示にする関数
  function hideStatus() {
    statusMessage.style.display = 'none';
  }
  
  // テキストをクリップボードにコピーする関数
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
});
