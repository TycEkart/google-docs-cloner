function setTargetDocId() {
    const ui = DocumentApp.getUi();
    const result = ui.prompt(
        'Set Target Document ID',
        'Paste the Google Doc ID here (found in the URL between /d/ and /edit):',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const doc = DocumentApp.getActiveDocument();
        const activeTab = doc.getActiveTab();
        if (!activeTab) {
            DocumentApp.getUi().alert('Please click inside the tab first.');
            return;
        }

        const targetDocId = result.getResponseText().trim();
        let documentName = retrieveTargetDocument(targetDocId).getName();

        const acceptDocumentResult = ui.prompt(
            `Document Found: ${documentName}` ,
            'Would you like to save the target id?' +
            '\n\n' + targetDocId,
            ui.ButtonSet.OK_CANCEL
        );

        if (acceptDocumentResult.getSelectedButton() === ui.Button.OK) {
            PropertiesService.getScriptProperties().setProperty('TARGET_DOC_ID', targetDocId);
            logProgress(`User set target document id to ${targetDocId} pointing to ${documentName}`)
        }else{
            logProgress("User cancelled setting target document id.")
        }
    }
}