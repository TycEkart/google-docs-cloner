class TargetDocumentSelectorPopup {
    constructor(ui) {
        this.ui = ui;
        this.propKey = 'TARGET_DOC_ID';
    }

    /**
     * Starts a popup to select the targetId to be processed
     * @returns {string} targetId
     */
    popupSelectDocument() {
        logProgress(`Looking for property: ${this.propKey}`);

        const props = PropertiesService.getScriptProperties();
        let targetId = props.getProperty(this.propKey);

        if (targetId) {
            let document = this.popupSelectPreviousDocument(targetId);
            if (document) {
                return document
            }
        }
        return this.popupSelectNewDocument(props);
    }

    /**
     *
     * @param targetId
     * @returns targetId or null
     */
    popupSelectPreviousDocument(targetId) {
        let preRetrievedDocument;
        try {
            preRetrievedDocument = retrieveTarget(targetId);
        } catch (e) {
            // retrieveDocument throws null on failure, so we catch it here.
            logProgress(`Target doc with ID '${targetId}' is invalid or you don't have access.`);
            return null;
        }

        let fileName;
        if (preRetrievedDocument) {
            fileName = preRetrievedDocument.getName();
        } else {
            fileName = "could not be retrieved";
        }
        const docUrl = `https://docs.google.com/document/d/${targetId}/`;
        const message = `Use this target document?\n\nName: ${fileName}\n\n${docUrl}`;
        const alertResponse = this.ui.alert('Use existing Target ID?', message, this.ui.ButtonSet.YES_NO_CANCEL);

        if (alertResponse === this.ui.Button.NO) {
            logProgress("User wants to enter a new id")
            return null
        } else if (alertResponse !== this.ui.Button.YES) {
            // User canceled or closed the dialog
            throw new Error('Sync cancelled by user.');
        }
        return preRetrievedDocument;
    }

    /**
     *
     * @param props
     * @returns {string} targetId
     */
    popupSelectNewDocument(props) {
        logProgress('Prompting for new Target ID.');
        const promptResponse = this.ui.prompt('Enter Target Document ID', `Please enter the Google Doc ID to be used as the target.\n\n(This will be saved as the property '${this.propKey}')`, this.ui.ButtonSet.OK_CANCEL);

        if (promptResponse.getSelectedButton() === this.ui.Button.OK && promptResponse.getResponseText()) {
            let targetId = promptResponse.getResponseText();
            props.setProperty(this.propKey, targetId);
            logProgress(`Saved new target ID: ${targetId}`);
            return retrieveTargetDocument(targetId);
        } else {
            throw new Error(`No target document ID configured or sync cancelled. Please set the property '${this.propKey}'.`);
        }
    }
}