function onOpen() {
    DocumentApp.getUi()
        .createMenu('Cloner Tools')
        .addItem('Clone Document', 'cloneDocument')
        .addItem('Find Document', 'findDocument')
        .addItem('Show Logs', 'showLogsSidebar')
        .addItem('Clear Logs', 'clearLogs')
        .addToUi();
}

// noinspection JSUnusedGlobalSymbols used by Google Apps Framework
function onInstall(e) {
    onOpen(e);
}