function onOpen() {
    DocumentApp.getUi()
        .createMenu('Cloner Tools')
        .addItem('Clone Document', 'cloneDocument')
        .addItem('Find Document', 'findDocument')
        .addItem('Show Logs', 'showLogsSidebar')
        .addItem('Clear Logs', 'clearLogs')
        .addToUi();
}

function onInstall(e) {
    onOpen(e);
}