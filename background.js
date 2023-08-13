async function sendEmailToServer(caseId, username, password, serverAddress, fileNumber) {
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
        console.log(data);
        browser.runtime.sendMessage({ type: "success" });
    }).catch(error => {
        console.log('Error:', error);
        browser.runtime.sendMessage({ type: "error", content: error.message });
    });
}



function getCase(username, password, serverAddress) {
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


function getCurrentDateFormatted() {
    const currentDate = new Date();
    
    const year = currentDate.getFullYear();
    
    // Die getMonth() Methode gibt einen Wert zwischen 0 (für Januar) und 11 (für Dezember) zurück. 
    // Daher müssen wir 1 hinzufügen, um den korrekten Monat zu erhalten.
    let month = currentDate.getMonth() + 1;
    month = month < 10 ? '0' + month : month;  // Fügt eine führende Null hinzu, wenn der Monat kleiner als 10 ist

    let day = currentDate.getDate();
    day = day < 10 ? '0' + day : day;  // Fügt eine führende Null hinzu, wenn der Tag kleiner als 10 ist
    
    return `${year}-${month}-${day}`;
}


browser.runtime.onMessage.addListener(async (message) => {
  if (message.type === "fileNumber" || message.type === "case") {
    console.log("Die Eingabe war: " + message.content);

    browser.storage.local.get(["username", "password", "serverAddress"]).then(result => {
      const fileNumber = String(message.content); 

      getCase(result.username, result.password, result.serverAddress).then(data => {
        const caseId = findIdByFileNumber(data, fileNumber);

        if (caseId) {
          sendEmailToServer(caseId, result.username, result.password, result.serverAddress, fileNumber);
        } else {
          console.log('Keine übereinstimmende ID gefunden');
        }
      });
    });
  }
});