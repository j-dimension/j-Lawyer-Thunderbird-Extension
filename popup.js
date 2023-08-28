let currentItem = null;  // Speichert das aktuelle Item


document.addEventListener("DOMContentLoaded", function() {
    const submitButton = document.getElementById("submitButton");
    const recommendCaseButton = document.getElementById("recommendCaseButton"); 
    const userInput = document.getElementById("userInput");
    const feedback = document.getElementById("feedback");
    const customizableLabel = document.getElementById("customizableLabel"); 
    const updateDataButton = document.getElementById("updateDataButton");
    const saveAttachmentsButton1 = document.getElementById("saveAttachmentsButton1");
    const saveAttachmentsButton2 = document.getElementById("saveAttachmentsButton2");

    
    findFileNumberInRawMessage()
        
    // Code für den "in Akte speichern" Button
    if (submitButton && userInput && feedback) {
        submitButton.addEventListener("click", function() {
            let input = userInput.value.trim();  // Entferne Leerzeichen

            if (!input) {
                feedback.textContent = "Bitte geben Sie ein gültiges Aktenzeichen ein.";
                feedback.style.color = "red";
                return; // Beendet die Funktion hier, wenn der Eingabewert ungültig ist
            }

            browser.storage.local.get(["username", "password", "serverAddress"]).then(result => {
                browser.runtime.sendMessage({
                    type: "fileNumber",
                    content: input,
                    username: result.username,
                    password: result.password,
                    serverAddress: result.serverAddress
                });

                // Setzen Sie das Feedback zurück, während auf eine Antwort gewartet wird
                feedback.textContent = "Speichern...";
                feedback.style.color = "blue";
            });
        });
    }

    // Code für den recommendCaseButton
    if (recommendCaseButton && customizableLabel) {
        recommendCaseButton.addEventListener("click", function() {
            
            if (!currentItem) {
                feedback.textContent = "Kein passendes Aktenzeichen gefunden!";
                feedback.style.color = "red";
                return;
            }
    
            browser.storage.local.get(["username", "password", "serverAddress"]).then(result => {
                browser.runtime.sendMessage({
                    type: "case",
                    content: currentItem.fileNumber, 
                    username: result.username,
                    password: result.password,
                    serverAddress: result.serverAddress
                    
                });
    
                // Setzt Feedback zurück, während auf eine Antwort gewartet wird
                feedback.textContent = "Speichern...";
                feedback.style.color = "blue";
            });
            feedback.textContent = "An empfohlene Akte gesendet!";
            feedback.style.color = "green";
        });
    }

    
    
    // Event Listener für den 1. "Nur Anhänge speichern" Button
    if (saveAttachmentsButton1) {
        saveAttachmentsButton1.addEventListener("click", function() {
            let input = userInput.value.trim();  // Entferne Leerzeichen
            
            const feedback = document.getElementById("feedback");
    
            if (!input) {
                feedback.textContent = "Bitte geben Sie ein gültiges Aktenzeichen ein.";
                feedback.style.color = "red";
                return; // Beendet die Funktion, wenn der Eingabewert ungültig ist
            }
    
            browser.storage.local.get(["username", "password", "serverAddress", "documentTag"]).then(result => {
                browser.runtime.sendMessage({
                    type: "saveAttachments",
                    content: input,
                    username: result.username,
                    password: result.password,
                    serverAddress: result.serverAddress,
                    documentTag: result.documentTag
                });
    
                // Setzen Sie das Feedback zurück, während auf eine Antwort gewartet wird
                feedback.textContent = "Senden...";
                feedback.style.color = "blue";
            });
        });
    }

    // Event Listener für den 2. "Nur Anhänge speichern" Button
    if (saveAttachmentsButton2 && customizableLabel) {
        saveAttachmentsButton2.addEventListener("click", function() {
            
            const feedback = document.getElementById("feedback");

            browser.storage.local.get(["username", "password", "serverAddress", "documentTag"]).then(result => {
                browser.runtime.sendMessage({
                    type: "saveAttachments",
                    content: currentItem.fileNumber, 
                    username: result.username,
                    password: result.password,
                    serverAddress: result.serverAddress,
                    documentTag: result.documentTag
                });

                // Setzen Sie das Feedback zurück, während auf eine Antwort gewartet wird
                feedback.textContent = "Speichern...";
                feedback.style.color = "blue";
            });
        });
    }


    // Event Listener für den "Daten aktualisieren" Button
    if (updateDataButton) {
        updateDataButton.addEventListener("click", function() {
            browser.storage.local.get(["username", "password", "serverAddress"]).then(result => {
                feedback.textContent = "Daten werden aktualisiert...";
                feedback.style.color = "blue";
                getCases(result.username, result.password, result.serverAddress).then(data => {
                    const casesRaw = data;
                    browser.storage.local.set({
                        cases: casesRaw
                    });
                    console.log("Cases heruntergeladen: " + casesRaw);
                    feedback.textContent = "Daten aktualisiert!";
                    feedback.style.color = "green";
                });
            });
        });
    }


});

// Hört auf Antworten vom Hintergrund-Skript background.js
browser.runtime.onMessage.addListener((message) => {
    const feedback = document.getElementById("feedback");
    if (message.type === "success") {
        feedback.textContent = "Erfolgreich gesendet!";
        feedback.style.color = "green";
    } else if (message.type === "error") {
        feedback.textContent = "Fehler: " + message.content;
        feedback.style.color = "red";
    }
});


async function findFileNumberInRawMessage() {
    // Nachrichteninhalt abrufen
    let currentTabId = await messenger.mailTabs.getCurrent();
    console.log("Tab Id: " + currentTabId.id);
      
    let messageData = await messenger.messageDisplay.getDisplayedMessage(currentTabId.id);
    console.log("Message Header: " + messageData);
    console.log("Message Id: " + messageData.id);
  
    let rawMessage = await messenger.messages.getRaw(messageData.id);
    
    // die gespeicherte Daten aus browser.storage.local abrufen
    let storedData = await browser.storage.local.get("cases");
    
    // die gespeicherten Daten in einem Array namens 'cases' 
    let casesArray = storedData.cases;
  
    for (let item of casesArray) {
      if (rawMessage.includes(item.fileNumber)) {
        
        currentItem = {
            id: item.id,
            name: item.name,
            fileNumber: item.fileNumber
          };


        console.log("Matching ID: " + item.id);
        console.log("Matching Name: " + item.name);

        // aktualisieren des Label "Recommended Case" mit dem gefundenen Aktenzeichen
        const customizableLabel = document.getElementById("customizableLabel");
        customizableLabel.textContent = item.name + ": " + item.fileNumber;

        return {
          id: item.id,
          name: item.name
        };
      }
    }
    console.log("Keine Übereinstimmung gefunden");
    return null;
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


// Event-Listener für die Suche
document.getElementById("searchInput").addEventListener("input", function() {
    const query = this.value.trim();
    if (query) {
        searchCases(query);
    } else {
        document.getElementById("resultsList").innerHTML = "";
    }
});


// Funktion zum Suchen von Fällen
async function searchCases(query) {
    let storedData = await browser.storage.local.get("cases");
    let casesArray = storedData.cases;

    query = query.toUpperCase();
    let results = casesArray.filter(item => item.name.toUpperCase().includes(query));

    // Ergebnisse basierend auf der längsten aufeinanderfolgenden Übereinstimmungslänge bewerten und sortieren
    results = results.map(item => {
        return {
            ...item,
            matchLength: getConsecutiveMatchCount(item.name, query)
        };
    }).filter(item => item.matchLength > 0) // (Optional) Nur Ergebnisse mit einer Mindestübereinstimmungslänge anzeigen
    .sort((a, b) => b.matchLength - a.matchLength);

    let resultsHTML = "";
    results.forEach(item => {
        resultsHTML += `<div class="resultItem" data-id="${item.id}">${item.name} (${item.fileNumber})</div>`;
    });

    document.getElementById("resultsList").innerHTML = resultsHTML;

    // Event-Listener für das Klicken auf ein Ergebniselement
    document.querySelectorAll(".resultItem").forEach(item => {
        item.addEventListener("click", function() {
            currentItem = {
                id: this.getAttribute("data-id"),
                name: this.textContent.split(" (")[0],
                fileNumber: this.textContent.split("(")[1].split(")")[0]
            };
            console.log("Ausgewählter Fall:", currentItem);
            
            // aktualisieren des Label "Recommended Case" mit der gefundenen Akte
            const customizableLabel = document.getElementById("customizableLabel");
            customizableLabel.textContent = currentItem.fileNumber + ": " + currentItem.name;
        });
    });
}

function getConsecutiveMatchCount(str, query) {
    let count = 0;
    let maxCount = 0;
    for (let i = 0, j = 0; i < str.length; i++) {
        if (str[i] === query[j]) {
            count++;
            j++;
            if (count > maxCount) {
                maxCount = count;
            }
        } else {
            count = 0;
            j = 0;
        }
    }
    return maxCount;
}



