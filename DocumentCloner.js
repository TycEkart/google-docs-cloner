/**
 * Clones the current tab of a document and sends it to a target document.
 * Due to bug with Google only the first tab can now be cloned. https://issuetracker.google.com/issues/465180332
 */
function cloneWithOpenById() {
    const ui = DocumentApp.getUi();

    try {
        initializeLogs(ui);
        logProgress("--- Cloning Started ---");
        let sourceBody = retrieveSourceBody(ui);

        // Use Selector to get Target ID
        const selector = new TargetDocumentSelectorPopup(ui);
        const targetDoc = selector.popupSelectDocument();

        // Use Cloner to clone content
        const cloner = new ContentCloner();
        cloner.clone(sourceBody, targetDoc);

        logProgress("--- Cloning Complete ---");
        logProgress("✅ Done!");

    } catch (e) {
        console.error(`[CRITICAL] ${e.toString()}`);
        logProgress(`❌ Error: ${e.toString()}`);
    }
}

function retrieveSourceBody(ui) {
    const doc = DocumentApp.getActiveDocument();
    const allTabs = doc.getTabs();
    const activeTab = doc.getActiveTab();

    if (allTabs && allTabs.length > 0 && activeTab && activeTab.getId() !== allTabs[0].getId()) {
        ui.alert('Functionality Limited due to 🐛',
            `🐛 Due to a bug in Google Docs API, 
                this function only works correctly on the first tab. 
            
            Please run this from the first tab.
            
            You can follow the bug report here:
            https://issuetracker.google.com/issues/465180332`,
            ui.ButtonSet.OK);
        logProgress("--- Sync Halted: Not on the first tab ---");
        throw new Error('Not on the first tab.');
    }

    if (!activeTab) {
        ui.alert('Please click inside the tab first.');
        throw new Error('No active tab found.');
    }

    logProgress(`Accessing content from tab: ${(activeTab.getTitle())}`);
    const sourceBody = activeTab.asDocumentTab().getBody();
    const bytesCopied = sourceBody.getText().length;
    logProgress(`Approximately ${bytesCopied} bytes of text to copy. Images unknown`);
    return sourceBody
}


/**
 *
 * @param targetId needs to be present
 * @returns {GoogleAppsScript.Document.Document}
 */
function retrieveTargetDocument(targetId) {
    try {
        return retrieveTarget(targetId);
    } catch (e) {
        logProgress(`Target doc with ID '${targetId}' is invalid or you don't have access.`);
        logProgress(e);
        throw new Error(`No valid target document found for property 'TARGET_DOC_ID' with value '${targetId}'.`);
    }
}

function retrieveTarget(targetId) {
    logProgress(`Retrieving target (${targetId}) document...`)
    try {
        let document = DocumentApp.openById(targetId);
        logProgress(`retrieved document ${document.getName()}`)
        return document;
    } catch (e) {
        logProgress(`retrieved document failed: ` + e.toString())
        throw null;
    }
}