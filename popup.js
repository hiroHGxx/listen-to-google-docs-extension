document.addEventListener('DOMContentLoaded', function() {
  const extractButton = document.getElementById('extractButton');
  const transcriptionDisplay = document.getElementById('transcriptionDisplay');
  const statusMessage = document.getElementById('statusMessage');
  let isProcessing = false;

  // ボタンの状態を設定する関数
  function setButtonState(text, disabled) {
    if (!extractButton) return;
    extractButton.textContent = text;
    extractButton.disabled = disabled;
    isProcessing = disabled;
  }

  // ボタンの状態をリセットする関数
  function resetButtonState() {
    setButtonState('テキストを抽出する', false);
  }

  // ステータスメッセージを表示する関数
  function showStatus(message, type = 'info') {
    if (!statusMessage) return;
    
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
  }

  // ステータスメッセージを非表示にする関数
  function hideStatus() {
    if (statusMessage) {
      statusMessage.style.display = 'none';
    }
  }

  // テキストをクリップボードにコピーする関数
  function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
  }

  // 抽出データを処理する関数
  function handleExtractedData(result) {
    if (!result) {
      console.error('無効なレスポンスが返されました');
      showStatus('エラー: 無効なレスポンスが返されました', 'error');
      resetButtonState();
      return;
    }

    const { status, data, error } = result;
    
    if (status === 'success' && data) {
      if (transcriptionDisplay) {
        transcriptionDisplay.value = data;
      }
      
      // テキストをクリップボードにコピー
      copyToClipboard(data)
        .then(() => {
          showStatus('テキストを抽出し、クリップボードにコピーしました', 'success');
        })
        .catch(err => {
          console.error('クリップボードへのコピーに失敗しました:', err);
          showStatus('テキストを抽出しましたが、クリップボードへのコピーに失敗しました', 'warning');
        });
    } else if (status === 'error') {
      console.error('エラーが発生しました:', error);
      showStatus(`エラー: ${error || '不明なエラーが発生しました'}`, 'error');
      if (transcriptionDisplay) {
        transcriptionDisplay.value = '';
      }
    } else if (status === 'already_processing') {
      showStatus('既に処理を実行中です。しばらくお待ちください。', 'info');
    } else {
      console.error('不明なステータスが返されました:', status);
      showStatus('エラー: 不明なレスポンスが返されました', 'error');
    }
    
    // ボタンの状態をリセット
    resetButtonState();
  }

  // メッセージリスナーを設定
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message && message.action === 'extractionResult') {
      handleExtractedData(message.data);
    }
    return true; // 非同期応答を許可
  });

  // content.jsを実行する関数
  async function executeContentScript(tabId) {
    return new Promise((resolve, reject) => {
      try {
        // content.jsを注入
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        })
        .then(() => {
          // テキスト抽出メッセージを送信
          chrome.tabs.sendMessage(
            tabId,
            { action: 'extractText' },
            (response) => {
              if (chrome.runtime.lastError) {
                throw new Error(chrome.runtime.lastError.message || 'コンテンツスクリプトとの通信に失敗しました');
              }
              
              if (response && response.status === 'error') {
                throw new Error(response.error || 'テキストの抽出中にエラーが発生しました');
              }
              
              showStatus('テキストを抽出しています...', 'info');
              resolve();
            }
          );
        })
        .catch(error => {
          console.error('スクリプトの注入に失敗しました:', error);
          throw error;
        });
      } catch (error) {
        console.error('スクリプト実行エラー:', error);
        throw error;
      }
    });
  }

  // 抽出ボタンのクリックイベント
  if (extractButton) {
    extractButton.addEventListener('click', async function() {
      if (isProcessing) return;
      
      try {
        isProcessing = true;
        setButtonState('処理中...', true);
        hideStatus();
        
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.url || !tab.url.startsWith('http')) {
          throw new Error('有効なウェブページを開いてください');
        }
        
        // content.jsを注入して実行
        await executeContentScript(tab.id);
        
      } catch (error) {
        console.error('エラーが発生しました:', error);
        showStatus(`エラー: ${error.message || 'テキストの抽出に失敗しました'}`, 'error');
        resetButtonState();
      }
    });
  } else {
    console.error('抽出ボタンが見つかりませんでした');
  }

  // 初期化
  resetButtonState();
  hideStatus();
});
