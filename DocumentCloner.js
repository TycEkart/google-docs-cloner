

function cloneWithOpenById() {
    const ui = DocumentApp.getUi();

    try {
        initializeLogs(ui);

        logProgress("--- Sync Started ---");
        const doc = DocumentApp.getActiveDocument();
        const allTabs = doc.getTabs();
        const activeTab = doc.getActiveTab();

        if (allTabs && allTabs.length > 0 && activeTab && activeTab.getId() !== allTabs[0].getId()) {
            const url = 'https://issuetracker.google.com/issues/465180332';
            const message = `Due to a bug in Google Docs, this function only works correctly on the first tab. Please run this from the first tab. You can follow the bug report here: ${url}`;
            ui.alert('Functionality Limited', message, ui.ButtonSet.OK);
            logProgress("--- Sync Halted: Not on the first tab ---");
            return;
        }

        if (!activeTab) {
            ui.alert('Please click inside the tab first.');
            return;
        }

        const tabName = activeTab.getTitle();
        logProgress(`Accessing content from tab: ${tabName}`);
        const sourceBody = activeTab.asDocumentTab().getBody();
        const bytesCopied = sourceBody.getText().length;
        logProgress(`Approximately ${bytesCopied} bytes to copy.`);

        // Use Selector to get Target ID
        const targetId = selectTargetDocId(ui);

        let targetDoc;
        if (targetId) {
            logProgress(`Found target ID: ${targetId}`);
            try {
                // First, try to access the file with DriveApp to see if it's an access issue
                const file = DriveApp.getFileById(targetId);
                logProgress(`DriveApp successfully accessed file: ${file.getName()}`);

                targetDoc = retrieveDocument(targetId);
            } catch (e) {
                logProgress(`Target doc with ID '${targetId}' is invalid or you don't have access.`);
                logProgress(e);
            }
        }

        if (!targetDoc) {
            throw new Error(`No valid target document found for property 'TARGET_DOC_ID' with value '${targetId}'.`);
        }

        // Use Cloner to clone content
        cloneContent(sourceBody, targetDoc);

        logProgress("--- Sync Complete ---");
        logProgress("✅ Done!");

    } catch (e) {
        console.error(`[CRITICAL] ${e.toString()}`);
        logProgress(`❌ Error: ${e.toString()}`);
    }
}