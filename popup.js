document.addEventListener('DOMContentLoaded', function() {
  const getTitleButton = document.getElementById('getTitleButton');
  const titleDisplay = document.getElementById('titleDisplay');

  getTitleButton.addEventListener('click', function() {
    // 現在アクティブなタブを取得
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) {
        titleDisplay.textContent = 'タブを取得できませんでした。';
        return;
      }
      
      const activeTab = tabs[0];
      if (activeTab.title) {
        titleDisplay.textContent = activeTab.title;
      } else {
        titleDisplay.textContent = 'タイトルを取得できませんでした。';
      }
    });
  });
});
