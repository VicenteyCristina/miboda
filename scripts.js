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
    previewPopup.innerHTML = `
        <video controls src="${url}"></video>
        <div class="button-bar">
            <button id="acceptButton">Subir</button>
            <button id="deleteButton">Eliminar</button>
        </div>
    `;
    document.body.appendChild(previewPopup);

    document.getElementById('acceptButton').addEventListener('click', () => {
        uploadToDrive(blob); // ✅ Ahora usa la función corregida
        closePreview(previewPopup, overlay);
    });

    document.getElementById('deleteButton').addEventListener('click', () => {
        URL.revokeObjectURL(url);
        closePreview(previewPopup, overlay);
    });
}


function closePreview(popup, overlay) {
    popup.remove();
    overlay.remove();
}




let accessToken = ""; // Se actualizará automáticamente
let refreshToken = "1//0484NjT_EPIEUCgYIARAAGAQSNwF-L9IrauX--VeAuLHL2sEc8S9tLQ1mYlM0sR07aElPXfuurPBYXxG7-NoewM-u_3DhVpJsM-c"; // Reemplaza con tu refresh token
let clientId = "845853277449-hce0u2l3i8pb62650m2b66qd9ur7r8ai.apps.googleusercontent.com"; // Reemplaza con tu Client ID
let clientSecret = "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"; // Reemplaza con tu Client Secret

async function refreshAccessToken() {
    try {
        let response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token"
            })
        });

        let data = await response.json();
        if (data.access_token) {
            accessToken = data.access_token;
            console.log("🔄 Token actualizado correctamente:", accessToken);
        } else {
            console.error("❌ Error al refrescar el token:", data);
        }
    } catch (error) {
        console.error("❌ Error de red al refrescar el token:", error);
    }
}




async function uploadToDrive(blob) {
    let timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    let fileName = `video_${timestamp}.webm`;

    let formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify({
        name: fileName,
        mimeType: "video/webm"
    })], { type: "application/json" }));
    formData.append("file", blob);

    // 🔹 Asegurar que el token esté actualizado antes de la subida
    await refreshAccessToken();

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
            alert("✅ Video subido correctamente a Google Drive.");
        } else {
            alert(`❌ Error al subir: ${result.error.message}`);
        }
    } catch (error) {
        alert("❌ Error al conectar con Google Drive.");
        console.error(error);
    }
}

