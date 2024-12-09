document.addEventListener("DOMContentLoaded", async () => {
  let db; // Base de datos IndexedDB
  const formulario = document.getElementById("formulario");
  const fraseInput = document.getElementById("Frase");
  const tablaBody = document.querySelector("table tbody");
  const recordButton = document.getElementById("recordButton");
  const stopButton = document.getElementById("stopButton");
  const audioPlayback = document.getElementById("audioPlayback");

  let mediaRecorder;
  let audioChunks = [];
  let audioData = null; // Almacenar el audio grabado

  // Validar si IndexedDB está disponible
  if (!window.indexedDB) {
    alert("Tu navegador no soporta IndexedDB. Algunas funcionalidades pueden no estar disponibles.");
    return;
  }

  // Inicializar IndexedDB
  function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FrasesDB", 2);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("frases")) {
          db.createObjectStore("frases", { keyPath: "id", autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        console.error("Error al inicializar IndexedDB:", event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Guardar frase y audio en IndexedDB
  function guardarEnIndexedDB(frase, audio) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("frases", "readwrite");
      const store = transaction.objectStore("frases");

      const data = { frase, audio };
      const request = store.add(data);

      request.onsuccess = () => {
        resolve(data);
      };

      request.onerror = (event) => reject(event.target.error);
    });
  }

  // Manejar el evento de envío del formulario
  formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const frase = fraseInput.value.trim();
    if (!frase) {
      alert("Por favor, introduce una frase.");
      return;
    }

    if (!audioData) {
      alert("Por favor, graba un audio.");
      return;
    }

    // Guardar en IndexedDB y sincronizar
    try {
      const data = await guardarEnIndexedDB(frase, audioData);
      actualizarTabla();
      fraseInput.value = "";
      audioPlayback.src = ""; // Limpiar el reproductor de audio
    } catch (error) {
      console.error("Error al guardar la frase:", error);
    }
  });

  // Actualizar la tabla con las frases y audios
  function actualizarTabla() {
    tablaBody.innerHTML = "";
    const transaction = db.transaction("frases", "readonly");
    const store = transaction.objectStore("frases");
    const request = store.getAll();

    request.onsuccess = (event) => {
      const frases = event.target.result;
      frases.forEach((item, index) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <th scope="row">${index + 1}</th>
          <td>${item.frase}</td>
          <td>
            <audio controls>
              <source src="${item.audio}" type="audio/webm">
              Tu navegador no soporta audio.
            </audio>
          </td>
        `;
        tablaBody.appendChild(fila);
      });
    };

    request.onerror = (event) => {
      console.error("Error al obtener las frases de IndexedDB:", event.target.error);
    };
  }

  // Función para manejar la grabación de audio
  recordButton.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        audioData = URL.createObjectURL(audioBlob);
        audioPlayback.src = audioData; // Configurar la reproducción del audio
        audioChunks = []; // Limpiar los datos de la grabación
      };

      mediaRecorder.start();
      recordButton.disabled = true;
      stopButton.disabled = false;
    } catch (error) {
      alert("Error al acceder al micrófono: " + error.message);
      console.error(error);
    }
  });

  stopButton.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
      recordButton.disabled = false;
      stopButton.disabled = true;
    }
  });

  // Inicializar la aplicación
  await initIndexedDB();
});
