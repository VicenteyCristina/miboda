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
        startCountdown(); // 🔹 Inicia la cuenta regresiva antes de grabar
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
    let mensajeExistente = document.getElementById("mensajeExito");
    if (mensajeExistente) mensajeExistente.remove();

    const mensaje = document.createElement("div");
    mensaje.id = "mensajeExito";
    mensaje.innerHTML = `<p>${texto}</p>`;
    document.body.appendChild(mensaje);

    setTimeout(() => {
        if (window.confetti) {
            window.confetti.start(); // 🎉 Activa el confeti
            playConfettiExplosion(); // 🔊 Reproduce explosión de confeti
        } else {
            console.error("❌ Confeti no está definido");
        }
    }, 500); // ⏳ Espera 500ms antes de activar todo para que se vea natural

    setTimeout(() => {
        mensaje.style.opacity = "0";
        mensaje.style.transition = "opacity 2s ease-in-out";
    }, 8000);

    setTimeout(() => {
        mensaje.remove();
    }, 10000);
}



class ConfettiParticle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.colors = ["#ff4081", "#4caf50", "#03a9f4", "#ffeb3b", "#ff9800", "#9c27b0"];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];

        this.x = Math.random() * canvas.width;
        this.y = Math.random() * -canvas.height;
        this.size = Math.random() * 10 + 5;
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 4 - 2;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.opacity = 1;
        this.fadeOut = false; // 🔹 Nuevo: define si la partícula debe desvanecerse
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;

        if (this.fadeOut) {
            this.opacity -= 0.02; // 🔹 Se desvanece poco a poco
        }

        if (this.opacity <= 0) {
            this.opacity = 0; // 🔹 Evita valores negativos
        }
    }

    draw() {
        const { ctx } = this;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}


class Confetti {
    constructor() {
        this.canvas = document.getElementById("confettiCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.particles = [];
        this.running = false;
        this.resizeCanvas();

        window.addEventListener("resize", () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    start() {
        this.particles = Array.from({ length: 300 }, () => new ConfettiParticle(this.canvas));
        this.running = true;
        this.animate();
        setTimeout(() => this.beginFadeOut(), 5000); // 🔹 Después de 5s, inicia desvanecimiento
    }

    beginFadeOut() {
        this.particles.forEach(particle => particle.fadeOut = true); // 🔹 Todas las partículas comienzan a desvanecerse

        setTimeout(() => this.stop(), 3000); // 🔹 Espera 3s para borrar el canvas
    }

    stop() {
        this.running = false;
        setTimeout(() => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }, 500);
    }

    animate() {
        if (!this.running) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach((particle) => {
            particle.update();
            particle.draw();
        });

        requestAnimationFrame(() => this.animate());
    }
}

// 🔹 Asegurar que el confeti está listo al cargar
document.addEventListener("DOMContentLoaded", () => {
    window.confetti = new Confetti();
});

function startCountdown() {
    let countdownElement = document.getElementById("countdown");
    let recordButton = document.getElementById("recordButton");

    countdownElement.style.display = "flex";
    countdownElement.style.opacity = "1";
    recordButton.disabled = true;

    let countdownNumbers = [5, 4, 3, 2, 1, "🎬"];
    let index = 0;

    playTick(); // 🎶 Inicia el sonido de la cuenta regresiva solo una vez

    function showNumber() {
        if (index < countdownNumbers.length) {
            countdownElement.innerText = countdownNumbers[index];
            countdownElement.classList.add("countdown-active");

            setTimeout(() => {
                countdownElement.classList.remove("countdown-active");
                index++;

                if (index < countdownNumbers.length) {
                    setTimeout(showNumber, 250); // 🔥 Aún más rápido
                } else {
                    setTimeout(() => {
                        stopTick(); // ⏹️ Detiene el sonido de la cuenta atrás
                        countdownElement.style.opacity = "0";
                        setTimeout(() => {
                            countdownElement.style.display = "none"; // 🔥 Ahora sí lo oculta completamente
                            countdownElement.style.opacity = "1";
                            recordButton.disabled = false;
                            startRecording();
                        }, 100); // 🕒 Se oculta más rápido
                    }, 100);
                }
            }, 750); // 🔥 Se acelera la duración de cada número
        }
    }

    showNumber();
}

let tickAudio = new Audio('tic1.mp3'); // Carga el audio globalmente

function playTick() {
    tickAudio.loop = true; // 🔄 Se reproduce en bucle mientras dura la cuenta atrás
    tickAudio.volume = 0.5;
    tickAudio.play();
}

function stopTick() {
    tickAudio.pause(); // ⏸ Detiene el sonido
    tickAudio.currentTime = 0; // 🔄 Lo reinicia para la próxima vez
}

// 🔊 Función para reproducir el sonido de confeti
function playConfettiExplosion() {
    let confettiSound = new Audio('confeti.mp3');
    confettiSound.volume = 0.6;
    confettiSound.play();
}


