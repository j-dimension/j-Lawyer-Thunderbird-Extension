document.getElementById("saveButton").addEventListener("click", function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const serverAddress = document.getElementById("serverAddress").value;
    const documentTag = document.getElementById("documentTag").value;
    
    browser.storage.local.set({
        username: username,
        password: password,
        serverAddress: serverAddress,
        documentTag: documentTag
    });
});


// Beim Laden der Optionen-Seite, werden die gespeicherten Werte in die Eingabefelder gesetzt
document.addEventListener("DOMContentLoaded", function() {
      browser.storage.local.get(["username", "password", "serverAddress", "documentTag"]).then(result => {
        document.getElementById("username").value = result.username || "";
        document.getElementById("password").value = result.password || "";
        document.getElementById("serverAddress").value = result.serverAddress || "";
        document.getElementById("documentTag").value = result.documentTag || "";
      });
});


