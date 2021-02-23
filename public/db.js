// Create variable vbased on the browser being used
const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

// create variable named db 
let db;

// create variable named requsest that opens a table named 'budget' in the indexDB
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("loading", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log("Error " + event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["loading"], "readwrite");
  const store = transaction.objectStore("loading");

  store.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(["loading"], "readwrite");
  const store = transaction.objectStore("loading");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {        
        return response.json();
      })
      .then(() => {
        // delete records if successful
        const transaction = db.transaction(["loading"], "readwrite");
        const store = transaction.objectStore("loading");
        store.clear();
      });
    }
  };
}

// listen for app coming back online
window.addEventListener("loading", checkDatabase);