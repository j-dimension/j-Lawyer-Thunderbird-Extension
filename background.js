let documentUploadedId = null;

async function sendEmailToServer(caseId, username, password, serverAddress, documentTag) {
    console.log("Case ID: " + caseId);
    const url = serverAddress + '/j-lawyer-io/rest/v1/cases/document/create';

    // Nachrichteninhalt mithilfe der Thunderbird API abrufen
    let currentTabId = await messenger.mailTabs.getCurrent();
    console.log("Tab Id: " + currentTabId.id);
    
    let messageData = await messenger.messageDisplay.getDisplayedMessage(currentTabId.id);
    console.log("Message Header: " + messageData);
    console.log("Message Id: " + messageData.id);

    let rawMessage = await messenger.messages.getRaw(messageData.id);

    // Der Inhalt der Message wird zu Base64 codiert
    const emailContentBase64 = await messageToBase64(rawMessage);

    // Das Datum ermitteln, um es dem Dateinamen voranzustellen
    const today = getCurrentDateFormatted();

    // Dateinamen erstellen
    fileName = today + "_" + messageData.subject + ".eml";
    fileName = fileName.replace("/", "_");

    // den Payload erstellen
    const payload = {
        base64content: emailContentBase64,
        caseId: caseId,
        fileName: fileName,
        folderId: "",
        id: "",
        version: 0
    };

    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + btoa('' + username + ':' + password + ''));
    headers.append('Content-Type', 'application/json');

    fetch(url, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        documentUploadedId = data.id;
        console.log("Dokument ID: " + data.id);
        browser.runtime.sendMessage({ type: "success" });
        setDocumentTag(username, password, serverAddress, documentTag);
    }).catch(error => {
        console.log('Error:', error);
        browser.runtime.sendMessage({ type: "error", content: error.message });
    });
    
}

async function sendAttachmentsToServer(caseId, username, password, serverAddress, documentTag) {
    console.log("Case ID: " + caseId);
    const url = serverAddress + '/j-lawyer-io/rest/v1/cases/document/create';

    // Nachrichteninhalt abrufen
    let currentTabId = await messenger.mailTabs.getCurrent();
    console.log("Tab Id: " + currentTabId.id);
    
    let messageData = await messenger.messageDisplay.getDisplayedMessage(currentTabId.id);
    console.log("Message Header: " + messageData);
    console.log("Message Id: " + messageData.id);

    // Attachments holen
    let attachments = await browser.messages.listAttachments(messageData.id);
    console.log("Attachments: " + attachments)
    for (let att of attachments) {
        let file = await browser.messages.getAttachmentFile(
            messageData.id,
            att.partName
        );
        let content = await file.text();
        console.log("ContentType: " + att.contentType);
        
        // Der Inhalt der Message wird zu Base64 codiert
        let buffer = await file.arrayBuffer();
        let uint8Array = new Uint8Array(buffer);
        const emailContentBase64 = uint8ArrayToBase64(uint8Array);
        
        // Das Datum ermitteln, um es dem Dateinamen voranzustellen
        const today = getCurrentDateFormatted();

        // Dateinamen erstellen
        fileName = today + "_" + att.name;
        fileName = fileName.replace("/", "_");

        // den Payload erstellen
        const payload = {
            base64content: emailContentBase64,
            caseId: caseId,
            fileName: fileName,
            folderId: "",
            id: "",
            version: 0
        };

        const headers = new Headers();
        headers.append('Authorization', 'Basic ' + btoa('' + username + ':' + password + ''));
        headers.append('Content-Type', 'application/json');

        fetch(url, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(payload)
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }).then(data => {
            documentUploadedId = data.id;
            console.log("Dokument ID: " + data.id);
            browser.runtime.sendMessage({ type: "success" });
            setDocumentTag(username, password, serverAddress, documentTag);
        }).catch(error => {
            console.log('Error:', error);
            browser.runtime.sendMessage({ type: "error", content: error.message });
        });
    }  
}




function getCases(username, password, serverAddress) {
  const url = serverAddress +'/j-lawyer-io/rest/v1/cases/list';

  const headers = new Headers();
  headers.append('Authorization', 'Basic ' + btoa(''+username+':'+ password+''));
  headers.append('Content-Type', 'application/json');

  return fetch(url, {
    method: 'GET',
    headers: headers
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  });
}


function findIdByFileNumber(data, fileNumber) {
    for (let item of data) {
        if (item.fileNumber === fileNumber) {
            return item.id;
        }
    }
    return null;  
}



function findCaseBySubject(data, subject) {
    for (let item of data) {
        if (item.fileNumber === subject) {
            return item.name;
        }
    }
    return null;  
}

// https://stackoverflow.com/questions/246801/how-can-you-encode-a-string-to-base64-in-javascript
async function messageToBase64(rawMessage) {
    try {
        // Den Nachrichteninhalt in Base64 codieren
        let base64Message = btoa(unescape(encodeURIComponent(rawMessage)));
        console.log(base64Message);
        return base64Message;
    } catch (error) {
        console.error("Fehler beim Umwandeln der Nachricht in Base64:", error);
        throw error;
    }
}

// https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd
function getCurrentDateFormatted() {
    const currentDate = new Date();
    
    const year = currentDate.getFullYear();
    
    // Die getMonth() Methode gibt einen Wert zwischen 0 (für Januar) und 11 (für Dezember) zurück. 
    // Daher ist 1 hinzufügen, um den korrekten Monat zu erhalten.
    let month = currentDate.getMonth() + 1;
    month = month < 10 ? '0' + month : month;  // Fügt eine führende Null hinzu, wenn der Monat kleiner als 10 ist

    let day = currentDate.getDate();
    day = day < 10 ? '0' + day : day;  // Fügt eine führende Null hinzu, wenn der Tag kleiner als 10 ist
    
    return `${year}-${month}-${day}`;
}



function setDocumentTag(username, password, serverAddress, documentTag) {
  
  const headers = new Headers();
  headers.append('Authorization', 'Basic ' + btoa(''+username+':'+ password+''));
  headers.append('Content-Type', 'application/json');
  
  const id = documentUploadedId;

  const url = serverAddress + "/j-lawyer-io/rest/v5/cases/documents/" + id + "/tags";

  // den Payload erstellen
  const payload = {
    name: documentTag
  };


  fetch(url, {
    method: 'PUT',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      return response.json();
  });
}

// comment: https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
function uint8ArrayToBase64(uint8Array) {
    let binaryString = '';
    uint8Array.forEach(byte => {
        binaryString += String.fromCharCode(byte);
    });
    return btoa(binaryString);
}



// Empfangen der Nachrichten vom Popup
browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "fileNumber" || message.type === "case") {
    console.log("Das eingegeben Aktenzeichen: " + message.content);

    browser.storage.local.get(["username", "password", "serverAddress", "documentTag"]).then(result => {
      const fileNumber = String(message.content); 

      getCases(result.username, result.password, result.serverAddress).then(data => {
        const caseId = findIdByFileNumber(data, fileNumber);
        console.log("DocumentTag : " + result.documentTag);

        if (caseId) {
          sendEmailToServer(caseId, result.username, result.password, result.serverAddress, result.documentTag);
        } else {
          console.log('Keine übereinstimmende ID gefunden');
        }
      });
    });
  }

  if (message.type === "saveAttachments") {
    console.log("Das eingegebene Aktenzeichen: " + message.content);

    browser.storage.local.get(["username", "password", "serverAddress", "documentTag"]).then(result => {
        const fileNumber = String(message.content); 

        getCases(result.username, result.password, result.serverAddress).then(data => {
            const caseId = findIdByFileNumber(data, fileNumber);
            console.log("DocumentTag : " + result.documentTag);

            if (caseId) {
                sendAttachmentsToServer(caseId, result.username, result.password, result.serverAddress, result.documentTag);
            } else {
                console.log('Keine übereinstimmende ID gefunden');
            }
        });
    });
  }
});