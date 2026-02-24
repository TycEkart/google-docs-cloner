/**
 * Starts a popup to select the targetId to be processed
 * @param ui
 * @returns {string} targetId
 */
function selectTargetDocId(ui) {
    const propKey = 'TARGET_DOC_ID';
    logProgress(`Looking for property: ${propKey}`);

    const props = PropertiesService.getScriptProperties();
    let targetId = props.getProperty(propKey);
    if (targetId) {
        targetId = createPopupResultsInTargetId(targetId, ui);
    }
    if (!targetId) {
        targetId = createPopupForNewTargetId(ui, propKey, targetId, props);
    }

    return targetId;
}

/**
 *
 * @param targetId
 * @param ui
 * @returns targetId or null
 */
function createPopupResultsInTargetId(targetId, ui) {
    let preRetrievedDocument;
    try {
        preRetrievedDocument = retrieveDocument(targetId);
    } catch (e) {
        // retrieveDocument throws null on failure, so we catch it here.
        preRetrievedDocument = null;
    }

    let fileName;
    if (preRetrievedDocument) {
        fileName = preRetrievedDocument.getName();
    } else {
        fileName = "could not be retrieved";
    }
    const docUrl = `https://docs.google.com/document/d/${targetId}/`;
    const message = `Use this target document?\n\nName: ${fileName}\n\n${docUrl}`;
    const alertResponse = ui.alert('Use existing Target ID?', message, ui.ButtonSet.YES_NO_CANCEL);

    if (alertResponse === ui.Button.NO) {
        // User wants to enter a new ID
        targetId = null; // Clear it so we prompt for a new one.
    } else if (alertResponse !== ui.Button.YES) {
        // User cancelled or closed the dialog
        throw new Error('Sync cancelled by user.');
    }
    return targetId;
}

/**
 *
 * @param ui
 * @param propKey
 * @param targetId
 * @param props
 * @returns {string} targetId
 */
function createPopupForNewTargetId(ui, propKey, targetId, props) {
    logProgress('Prompting for new Target ID.');
    const promptResponse = ui.prompt('Enter Target Document ID', `Please enter the Google Doc ID to be used as the target.\n\n(This will be saved as the property '${propKey}')`, ui.ButtonSet.OK_CANCEL);

    if (promptResponse.getSelectedButton() == ui.Button.OK && promptResponse.getResponseText()) {
        targetId = promptResponse.getResponseText();
        props.setProperty(propKey, targetId);
        logProgress(`Saved new target ID: ${targetId}`);
    } else {
        throw new Error(`No target document ID configured or sync cancelled. Please set the property '${propKey}'.`);
    }
    return targetId;
}

