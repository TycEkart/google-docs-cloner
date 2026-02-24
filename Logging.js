// --- Logging Helpers ---
function logProgress(msg) {
  console.log(msg); // Keep logging to server console
  const cache = CacheService.getUserCache();
  let currentLogs = cache.get('CLONER_LOGS') || '';
  const time = new Date().toLocaleTimeString();
  currentLogs += `<div class="status-line">[${time}] ${msg}</div>`;
  cache.put('CLONER_LOGS', currentLogs, 21600);
}

function clearLogs() {
  CacheService.getUserCache().remove('CLONER_LOGS');
}

function showLogsSidebar() {
  const htmlOutput = HtmlService
      .createHtmlOutputFromFile('Logger')
      .setTitle('Cloner Logs');
  DocumentApp.getUi().showSidebar(htmlOutput);
}