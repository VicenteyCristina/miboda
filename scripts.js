console.log("✅ Script cargado correctamente");

let isRecording = false;
let mediaRecorder;
let videoChunks = [];
let recordingTimer;
let timeLeft = 120; // 2 minutos

// 🔹 Iniciar pantalla completa al cargar la app
document.addEventListener("DOMContentLoaded", () => {
    activarPantallaCompleta();
    iniciarCamara();
    document.getElementById('recordButton').addEventListener('click', toggleRecording);
});

document.addEventListener("click", activarPantallaCompleta);

document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) activarPantallaCompleta();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !document.fullscreenElement) activarPantallaCompleta();
});

function activarPantallaCompleta() {
    let elem = document.documentElement;
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }
}

async function iniciarCamara() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoElement = document.getElementById('video');
        videoElement.srcObject = stream;
        videoElement.play();
    } catch (error) {
        console.error("❌ No se pudo acceder a la cámara", error);
    }
}

function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    mediaRecorder = new MediaRecorder(stream);
    videoChunks = [];
    mediaRecorder.start();

    mediaRecorder.ondataavailable = (e) => videoChunks.push(e.data);
    mediaRecorder.onstop = () => {
        clearInterval(recordingTimer);
        timeLeft = 120;
        updateTimerDisplay();
        const videoBlob = new Blob(videoChunks, { type: 'video/webm' });
        videoChunks = [];
        showPreview(videoBlob);
    };

    document.getElementById('recordButton').classList.add('stop');
    isRecording = true;
    updateTimerDisplay();

    recordingTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            stopRecording();
        }
    }, 1000);
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('recordButton').classList.remove('stop');
    isRecording = false;
    clearInterval(recordingTimer);
    timeLeft = 120;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const recordButton = document.getElementById("recordButton");
    if (isRecording) {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        recordButton.innerHTML = `<span>${minutes}:${seconds < 10 ? "0" : ""}${seconds}</span>`;
    } else {
        recordButton.innerHTML = "<span>Grabar</span>";
    }
}


function showPreview(blob) {
    const url = URL.createObjectURL(blob);
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    document.body.appendChild(overlay);

    const previewPopup = document.createElement('div');
    previewPopup.id = 'previewPopup';

    // Crear el elemento de video para la previsualización
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.controls = true;

    // Intentar capturar un frame del video
    video.addEventListener('loadeddata', () => {
        setTimeout(() => {
            captureThumbnail(video, previewPopup);
        }, 500); // Esperar un poco para asegurar que el primer frame esté disponible
    });

    const buttonBar = document.createElement('div');
    buttonBar.classList.add('button-bar');

    const acceptButton = document.createElement('button');
    acceptButton.id = 'acceptButton';
    acceptButton.textContent = 'Subir';
    acceptButton.addEventListener('click', () => {
        uploadToDrive(blob);
        closePreview(previewPopup, overlay);
    });

    const deleteButton = document.createElement('button');
    deleteButton.id = 'deleteButton';
    deleteButton.textContent = 'Eliminar';
    deleteButton.addEventListener('click', () => {
        URL.revokeObjectURL(url);
        closePreview(previewPopup, overlay);
    });

    buttonBar.appendChild(acceptButton);
    buttonBar.appendChild(deleteButton);

    previewPopup.appendChild(video);
    previewPopup.appendChild(buttonBar);
    document.body.appendChild(previewPopup);
}

// Función para capturar un frame y usarlo como miniatura
function captureThumbnail(video, previewPopup) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Dibujar el primer frame del video en el canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir el canvas en una imagen y colocarla como miniatura
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.width = "100%";
    img.style.borderRadius = "10px";

    // Reemplazar el video con la imagen antes de que el usuario presione play
    previewPopup.insertBefore(img, previewPopup.firstChild);
}





function closePreview(popup, overlay) {
    popup.remove();
    overlay.remove();
}

let accessToken = ""; // Se actualizará automáticamente
let refreshToken = "1//04WEszCdAKh4VCgYIARAAGAQSNwF-L9IrgR4dOdinePjH22c3vF4_kofo8BRc9DoUpgrrQiiQ3BTkf1j-gZKXrYwqdXkAulrgjA4"; // Reemplaza con tu refresh token
let clientId = "73869033113-95k69il9h59q5s9jmf3p25ve56ajs6dd.apps.googleusercontent.com"; // Reemplaza con tu Client ID
let clientSecret = "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"; // Reemplaza con tu Client Secret

async function refreshAccessToken() {
    try {
        let response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken, // Usamos el nuevo refresh_token
                grant_type: "refresh_token"
            })
        });

        let data = await response.json();
        if (data.access_token) {
            accessToken = data.access_token;
            console.log("🔄 Nuevo Access Token obtenido:", accessToken);
        } else {
            console.error("❌ Error al refrescar el token:", data);
            mostrarMensaje("❌ No se pudo refrescar el token de acceso.");
        }
    } catch (error) {
        console.error("❌ Error de red al refrescar el token:", error);
        mostrarMensaje("❌ Error de red al obtener el token.");
    }
}




async function uploadToDrive(blob) {
    await refreshAccessToken(); // 🔹 Asegurar que el token esté actualizado antes de la subida

    console.log("🔍 Verificando Access Token:", accessToken); // ✅ Debug

    if (!accessToken) {
        mostrarMensaje("❌ Error: No se pudo obtener el token de autenticación.");
        return;
    }

    let timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    let fileName = `video_${timestamp}.webm`;
    let folderId = "1dKIS8Yi_hUGclI7BBE7iKWo-5IVTZc78"; // 🔹 ID de la carpeta

    let formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify({
        name: fileName,
        mimeType: "video/webm",
        parents: [folderId] // 🔹 Guarda el video en la carpeta específica
    })], { type: "application/json" }));
    formData.append("file", blob);

    try {
        let response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
            body: formData
        });

        let result = await response.json();
        if (response.ok) {
            mostrarMensaje("📩 ¡Mensaje recibido! No garantizamos que no lloraremos de emoción al verlo. 😭💖");
        } else {
            mostrarMensaje(`❌ Error al subir: ${result.error.message}`);
        }
    } catch (error) {
        mostrarMensaje("❌ Error al conectar con Google Drive.");
        console.error(error);
    }
}


function mostrarMensaje(texto) {
    // Si el mensaje ya está en pantalla, no lo volvemos a crear
    if (document.getElementById("mensajeExito")) return;

    const mensaje = document.createElement("div");
    mensaje.id = "mensajeExito";
    mensaje.innerHTML = `<p>${texto}</p>`;
    document.body.appendChild(mensaje);

    // 🔹 Iniciar la animación de fadeOut tras 8.5 segundos (para desaparecer suavemente a los 10s)
    setTimeout(() => {
        mensaje.style.animation = "fadeOut 1.5s ease-in-out forwards";
    }, 8500);

    // 🔹 Eliminar completamente el mensaje después de 10 segundos
    setTimeout(() => {
        mensaje.remove();
    }, 10000);
}

