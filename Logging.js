// --- Logging Helpers ---
function logProgress(msg) {
  console.log(msg); // Keep logging to server console
  const cache = CacheService.getUserCache();
  let currentLogs = cache.get('CLONER_LOGS') || '';
  const time = new Date().toLocaleTimeString();
  currentLogs += `<div class="status-line">[${time}] ${msg}</div>`;
  cache.put('CLONER_LOGS', currentLogs, 21600);
}

function getLogs() {
  return CacheService.getUserCache().get('CLONER_LOGS') || '';
}

function showLogs() {
  const htmlOutput = HtmlService.createHtmlOutputFromFile('Logger').setWidth(400).setHeight(300);
  DocumentApp.getUi().showModelessDialog(htmlOutput, 'Cloner Progress');
}