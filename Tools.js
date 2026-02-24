function setTargetDocId() {
  const ui = DocumentApp.getUi();
  const result = ui.prompt(
    'Set Target Document ID',
    'Paste the Google Doc ID here (found in the URL between /d/ and /edit):',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() == ui.Button.OK) {
    const doc = DocumentApp.getActiveDocument();
    const activeTab = doc.getActiveTab();
    if (!activeTab) {
      DocumentApp.getUi().alert('Please click inside the tab first.');
      return;
    }

    const id = result.getResponseText().trim();
    PropertiesService.getScriptProperties().setProperty('TARGET_DOC_ID', id);

    ui.alert('Target ID saved: ' + id);
  }
}