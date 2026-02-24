function onOpen() {
  DocumentApp.getUi()
    .createMenu('Cloner Tools')
    .addItem('Clone Document', 'mirrorWithOpenById')
    .addItem('Show Logs', 'showLogs')
    .addItem('Set Target Doc ID', 'setTargetDocId')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}