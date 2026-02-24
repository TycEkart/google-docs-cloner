function mirrorWithOpenById() {
  const ui = DocumentApp.getUi();

  try {
    // Initialize Logs
    CacheService.getUserCache().remove('CLONER_LOGS');
    const htmlOutput = HtmlService.createHtmlOutputFromFile('Logger').setWidth(400).setHeight(300);
    ui.showModelessDialog(htmlOutput, 'Cloner Progress');

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
    const propKey = 'TARGET_DOC_ID';
    logProgress(`Looking for property: ${propKey}`);

    // 1. Direct Access to Tab Content
    // Since the document has tabs, we can access the body directly from the active tab
    // without needing to export/convert via Drive.
    logProgress(`Accessing content from tab: ${tabName}`);
    const sourceBody = activeTab.asDocumentTab().getBody();
    const bytesCopied = sourceBody.getText().length;
    logProgress(`Approximately ${bytesCopied} bytes to copy.`);

    // Target Handling:
    const props = PropertiesService.getScriptProperties();
    let targetId = props.getProperty(propKey);
    let targetDoc;

    if (targetId) {
        let fileName = targetId; // Default to ID if name retrieval fails
        try {
            fileName = DriveApp.getFileById(targetId).getName();
        } catch (e) {
            logProgress(`Could not retrieve file name for ID ${targetId}. It may be invalid or you may lack permission.`);
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
    }

    if (!targetId) {
      logProgress('Prompting for new Target ID.');
      const promptResponse = ui.prompt('Enter Target Document ID', `Please enter the Google Doc ID to be used as the target.\n\n(This will be saved as the property '${propKey}')`, ui.ButtonSet.OK_CANCEL);
      
      if (promptResponse.getSelectedButton() == ui.Button.OK && promptResponse.getResponseText()) {
        targetId = promptResponse.getResponseText();
        props.setProperty(propKey, targetId);
        logProgress(`Saved new target ID: ${targetId}`);
      } else {
        throw new Error(`No target document ID configured or sync cancelled. Please set the property '${propKey}'.`);
      }
    }

    if (targetId) {
      logProgress(`Found target ID: ${targetId}`);
      try {
        // First, try to access the file with DriveApp to see if it's an access issue
        const file = DriveApp.getFileById(targetId);
        logProgress(`DriveApp successfully accessed file: ${file.getName()}`);

        targetDoc = DocumentApp.openById(targetId);
      } catch (e) {
        logProgress(`Target doc with ID '${targetId}' is invalid or you don't have access.`);
        logProgress(e);
      }
    }

    if (!targetDoc) {
      throw new Error(`No valid target document found for property '${propKey}' with value '${targetId}'.`);
    }

    const targetBody = targetDoc.getBody();

    logProgress("Clearing target document...");
    // Remove all children until only one is left.
    while (targetBody.getNumChildren() > 1) {
      targetBody.removeChild(targetBody.getChild(0));
    }

    // Now handle the single remaining element.
    if (targetBody.getNumChildren() === 1) {
      const lastChild = targetBody.getChild(0);
      const type = lastChild.getType();

      if (type === DocumentApp.ElementType.PARAGRAPH) {
        // If it's a paragraph, just clear its content.
        lastChild.asParagraph().clear();
        // It might be an empty paragraph that is a list item placeholder.
        // This is a workaround for a case where a list item is the last element.
        if (lastChild.asParagraph().getHeading() !== DocumentApp.ParagraphHeading.NORMAL) {
            lastChild.asParagraph().setHeading(DocumentApp.ParagraphHeading.NORMAL);
        }
      } else if (type === DocumentApp.ElementType.LIST_ITEM) {
        lastChild.asListItem().clear();
      } else {
        // If it's not a paragraph (e.g., a table), remove it and replace with a fresh paragraph.
        targetBody.removeChild(lastChild);
        targetBody.appendParagraph("");
      }
    } else if (targetBody.getNumChildren() === 0) {
        // If the document was already empty, ensure there's a paragraph.
        targetBody.appendParagraph("");
    }

    logProgress("Copying elements...");
    const numChildren = sourceBody.getNumChildren();
    logProgress(`Found ${numChildren} elements to copy.`);
    for (let i = 0; i < numChildren; i++) {
      let sourceChild = sourceBody.getChild(i);
      let type = sourceChild.getType();
      let estimatedBytes = 0;

      if (type === DocumentApp.ElementType.PARAGRAPH) {
        const p = sourceChild.asParagraph();
        estimatedBytes = p.getText().length;
        for (let j = 0; j < p.getNumChildren(); j++) {
          if (p.getChild(j).getType() === DocumentApp.ElementType.INLINE_IMAGE) {
            estimatedBytes += p.getChild(j).asInlineImage().getBlob().getBytes().length;
          }
        }
      } else if (type === DocumentApp.ElementType.TABLE) {
        estimatedBytes = sourceChild.asTable().getText().length; // Note: This doesn't account for images in tables.
      } else if (type === DocumentApp.ElementType.LIST_ITEM) {
        const li = sourceChild.asListItem();
        estimatedBytes = li.getText().length;
        for (let j = 0; j < li.getNumChildren(); j++) {
          if (li.getChild(j).getType() === DocumentApp.ElementType.INLINE_IMAGE) {
            estimatedBytes += li.getChild(j).asInlineImage().getBlob().getBytes().length;
          }
        }
      }

      logProgress(`  -> child ${i+1} of ${numChildren} is a ${type} with an estimated size of ${estimatedBytes} bytes`);

      let child = sourceChild.copy();

      if (type == DocumentApp.ElementType.PARAGRAPH) targetBody.appendParagraph(child);
      else if (type == DocumentApp.ElementType.TABLE) targetBody.appendTable(child);
      else if (type == DocumentApp.ElementType.LIST_ITEM) targetBody.appendListItem(child);
      else if (type == DocumentApp.ElementType.PAGE_BREAK) targetBody.appendPageBreak(child);
    }

    logProgress("Deleting first paragraph from target document.");
    if (targetBody.getNumChildren() > 0) {
        const firstChild = targetBody.getChild(0);
        if (firstChild.getType() === DocumentApp.ElementType.PARAGRAPH) {
            firstChild.removeFromParent();
            logProgress("First paragraph deleted.");
        }
    }

    logProgress("--- Sync Complete ---");
    logProgress("✅ Done!");

    // Optional: Keep dialog open or show alert
    // ui.alert('✅ Success', 'Mirrored with extra info.', ui.ButtonSet.OK);

  } catch (e) {
    console.error(`[CRITICAL] ${e.toString()}`);
    logProgress(`❌ Error: ${e.toString()}`);
  }
}