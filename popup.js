let currentItem = null;  // Speichert das aktuelle Item


document.addEventListener("DOMContentLoaded", function() {
    const submitButton = document.getElementById("submitButton");
    const recommendCaseButton = document.getElementById("recommendCaseButton"); 
    const userInput = document.getElementById("userInput");
    const feedback = document.getElementById("feedback");
    const customizableLabel = document.getElementById("customizableLabel"); 
    const updateDataButton = document.getElementById("updateDataButton");
    

    
    findFileNumberInRawMessage()
        
    // Code für den Senden Button
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
                feedback.textContent = "Senden...";
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
    
                // Setzen Sie das Feedback zurück, während auf eine Antwort gewartet wird
                feedback.textContent = "Senden...";
                feedback.style.color = "blue";
            });
            feedback.textContent = "An empfohlene Akte gesendet!";
            feedback.style.color = "green";
        });
    }

    // Event Listener für den "Daten aktualisieren" Button
    if (updateDataButton) {
        updateDataButton.addEventListener("click", function() {
            browser.storage.local.get(["username", "password", "serverAddress"]).then(result => {
                getCase(result.username, result.password, result.serverAddress).then(data => {
                    const casesRaw = data;
                    browser.storage.local.set({
                        cases: casesRaw
                    });
                    console.log("Cases heruntergeladen: " + casesRaw);
                });
            });
        });
    }

});

// Hören Sie auf Antworten vom Hintergrund-Skript
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
    // Nachrichteninhalt mithilfe der Thunderbird API abrufen
    let currentTabId = await messenger.mailTabs.getCurrent();
    console.log("Tab Id: " + currentTabId.id);
      
    let messageData = await messenger.messageDisplay.getDisplayedMessage(currentTabId.id);
    console.log("Message Header: " + messageData);
    console.log("Message Id: " + messageData.id);
  
    let rawMessage = await messenger.messages.getRaw(messageData.id);
    
    // Jetzt sollten wir die gespeicherten Daten aus browser.storage.local abrufen
    let storedData = await browser.storage.local.get("cases");
    
    // Es wird davon ausgegangen, dass die gespeicherten Daten in einem Array namens 'cases' liegen.
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

