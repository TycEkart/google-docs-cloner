function onOpen() {
  DocumentApp.getUi()
    .createMenu('Cloner Tools')
    .addItem('Clone Document', 'mirrorWithOpenById')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function mirrorWithOpenById() {
  const ui = DocumentApp.getUi();
  const targetId = '1_v_wBz2dWygP3hU8TP63Wfif4G3LLSBFXVp5aEqYmGc';
  
  try {
    console.log("--- Sync Started (openById Method) ---");
    const doc = DocumentApp.getActiveDocument();
    const activeTab = doc.getActiveTab();
    
    if (!activeTab) {
      ui.alert('Please click inside the tab first.');
      return;
    }

    const sourceId = doc.getId();
    const tabId = activeTab.getId();
    const tabName = activeTab.getTitle();
    
    // 1. Fetch the tab content
    const exportUrl = `https://docs.google.com/document/d/${sourceId}/export?format=docx&tab=${tabId}`;
    console.log(`[LOG] Export URL: ${exportUrl}`);

    const response = UrlFetchApp.fetch(exportUrl, {
      method: "get",
      headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
      muteHttpExceptions: true
    });

    if (response.getResponseCode() !== 200) {
      throw new Error("Failed to fetch tab data. Status: " + response.getResponseCode());
    }
    
    const blob = response.getBlob();
    const bytes = blob.getBytes().length;
    console.log(`[LOG] Blob size: ${bytes} bytes (${(bytes / 1048576).toFixed(2)} MB)`);

    // 2. The openById Step
    console.log("[LOG] Attempting to open target doc...");
    
    const targetDoc = DocumentApp.openById(targetId);
    console.log("[LOG] Successfully opened target doc.");

    // 3. Overwrite Content
    // Note: To truly 'mirror' using a blob, we must use Drive API to replace bytes.
    // DocumentApp cannot 'paste' a blob directly, so we use Drive to update the file
    // and THEN open it to add our extra info header.
    
    console.log("[LOG] Updating file bytes via Drive API...");
    Drive.Files.update({ mimeType: "application/vnd.google-apps.document" }, targetId, blob);
    
    // 4. Adding Extra Information via DocumentApp
    // We flush the changes to ensure the Drive update is visible to DocumentApp
    Utilities.sleep(1000); 
    const refreshedTarget = DocumentApp.openById(targetId);
    const body = refreshedTarget.getBody();
    const timestamp = new Date().toLocaleString();
    
    const header = body.insertParagraph(0, `✨ Last Mirrored: ${timestamp}\n🔗 Source Tab: ${tabName}`);
    header.setItalic(true).setFontSize(9).setForegroundColor('#555555');
    
    refreshedTarget.saveAndClose();
    console.log("--- Sync Complete ---");
    
    ui.alert('✅ Success', 'Mirrored with extra info.', ui.ButtonSet.OK);

  } catch (e) {
    console.error(`[CRITICAL] ${e.toString()}`);
    ui.alert('❌ Error: ' + e.toString());
  }
}