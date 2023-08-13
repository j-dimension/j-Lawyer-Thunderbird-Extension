document.getElementById("saveButton").addEventListener("click", function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const serverAddress = document.getElementById("serverAddress").value;
    
    browser.storage.local.set({
        username: username,
        password: password,
        serverAddress: serverAddress
    });
});


document.getElementById("loadCasesButton").addEventListener("click", function() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const serverAddress = document.getElementById("serverAddress").value;
    
    getCase(username, password, serverAddress).then(data => {
        const casesRaw = data;
        browser.storage.local.set({
            cases: casesRaw
        });
        console.log("Cases heruntergeladen: " + casesRaw);
    });
});


// Beim Laden der Optionen-Seite, setzen Sie die gespeicherten Werte in die Eingabefelder
document.addEventListener("DOMContentLoaded", function() {
    browser.storage.local.get(["username", "password", "serverAddress"]).then(result => {
        document.getElementById("username").value = result.username || "";
        document.getElementById("password").value = result.password || "";
        document.getElementById("serverAddress").value = result.serverAddress || "";
    });
});




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
