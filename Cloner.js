function retrieveDocument(targetId) {
    logProgress(`Retrieving target (${targetId}) document...`)
    try {
        let document = DocumentApp.openById(targetId);
        logProgress(`retrieved document ${document.getName()}`)
        return document;
    }catch (e){
        logProgress(`retrieved document failed: ` + e.toString())
        throw null;
    }
}

function cloneContent(sourceBody, targetDoc) {
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

        logProgress(`  -> child ${i + 1} of ${numChildren} is a ${type} with an estimated size of ${estimatedBytes} bytes`);

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
}