/**
 * Creates a Logger UI and cleans the user cache
 * @param ui
 */
function initializeLogs(ui) {
    // Initialize Logs
    CacheService.getUserCache().remove('CLONER_LOGS');
    const htmlOutput = HtmlService
        .createHtmlOutputFromFile('Logger')
        .setWidth(500)
        .setHeight(400);
    ui.showModelessDialog(htmlOutput, 'Cloner Progress');
}