console.log("✅ Script cargado correctamente");

let isRecording = false, mediaRecorder, recordingTimer;
let videoChunks = [], timeLeft = 120; // 2 minutos

// —————————————————————
// ► CONFIGURACIÓN SERVICE ACCOUNT
// —————————————————————
const SERVICE_ACCOUNT = {
  type: "service_account",
  project_id: "miboda-450811",
  private_key_id: "3d63e94e89b4e18be28725234a1620617bb0c7a0",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC/FSEUlAYTd+wD\nz2xkl/i9NeGtfRcUrrNGOjFLVW1nD1ik85VzISWk9oFvc3f0pkJA1Qi0RJC7X72y\nFZPC9axPdb+xdeWbTS5NnhwUjTOQy6p8TVfIakuvKZWa66qBY8p359iU+2mZTrks\nK0YcuPs/aXGV+FSBMAD4VScsxRavkJ34X56n2EPlZICRvGFo01zZI459kBHMUPw9\nByfWUc7ZIXvLJy5R7391oOg1vNqxr0sdmTPN+LlH+9d9UR59Yz2VjiTgD6o05I07\n35/fqznsJXZlmBd6yA9EcFy+N6rFj1b1oYnpbVn0AsLpF+vqlN7YVxIh0qlldiLs\nQ1bgF+QJAgMBAAECggEACJXJ8TM/XKOQMpGgtJpRXirsE0/h+BdrTZXyvgg+DJnX\naT3acpxEJTfAFAJTmuXXZzNLG1JTUF/aVYR7qZBBKCbJsI7z/HjIwkr+xvubG//S\njpgpAAOql9md86Jv/DVAFQgRJoxvL6imUDI3ibXT8ALsTAkmvtEp0f59bpkCTmv0\nhi28fGXv/+lEiOdQMYpqR4EcAF+K2USav+5q63MmlX/9EzC3Kyi0TIZGkquexOWi\nv7gYsk/qzggm2DPHL1asQyXlrgVAki3hZPG9IcSAtH6UOwCS3aqNSJxs4+LxJ8M8\n/OYlx6fN/AFlcL5c4Nj0izQK0oPjtdVkb+aJ6RNmSwKBgQDu0z9vJIkYo10mEjKb\npu8Ad0Z3O2geK4JMAW1te//FcL9Z8W5/YLrvtM38gt+9LxftQUagfEzPgxlIf/B1\nF1ZwjCCC9AdpGxCx2JobLsPjpwwCSRigJLRfRO8b7r+JLI0MVwBicdnocB7esX57\nYqO06jVV5lcqwR7vsMEHyqfv7wKBgQDM0vFwqgFHLewD2IlJLrvRdNOdG1UvgQjD\nkwGBgSJCYo1K0/VAJVaEFUgF1FHL3s0gn27tAeSAh8/rmG1zs7OL47mic2gOYFdv\n2ycVA4e0FI+svy7W0iZiY20gRGCF3gGpPmqraxerb1a/CZSwzmEcWn9ISl/e/1wW\nu8suu0BzhwKBgQDXhV+rZucpitNWtflhqeXpH7pBgyTUhSMSf/9GXC5W+QZVnqC+\n5oYMJ7fz9g7+5O7MtqmLzmBqq743RO20XRkue+YjByFg4oHQXM3FVhCE8ozNyzUj\n37u+dbDqHixPGBs5VZINRP0G25egE8E2i698Zhc3q6Rh+uF2IKYx59phlQKBgAF9\no447XokDF42rnMwwj+NlY0jocwVGfibWQhOMOhCboQWjZ0yROQD7GqwYMIQ4Wevb\n3TXSZrRcyLGhSWKnMy5YePhquJ4qK1jAEpe/j9RKtgT+2ztrCiZ7LMcoWD+BLyfp\nMWOQAvsXc10ul6t1xRUsv3JqQCpiV2w+76qmaECvAoGATzljBr45mZSZPP2ywsQe\nkcd8z4FAIqoQR1FjLzaR2eHEfd5rB5o08oyihR9pzLz//ys6lV56QDWmhPADWdRO\nIg3u++RDnqeOzsvFDG/P2citaq1+okWrNNsQFW1K7UQ1Yd1oZJvpSZmC3gru6ycB\nA2PS/AR5e0wCYrcx5OWwglc=\n-----END PRIVATE KEY-----\n",
  client_email: "bodaservicio@miboda-450811.iam.gserviceaccount.com",
  token_uri: "https://oauth2.googleapis.com/token"
};

const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
const FOLDER_ID = "1dKIS8Yi_hUGclI7BBE7iKWo-5IVTZc78";

// —————————————————————
// ► FULLSCREEN + CÁMARA
// —————————————————————
document.addEventListener("DOMContentLoaded", () => {
  activarPantallaCompleta();
  iniciarCamara();
  document.getElementById("recordButton").addEventListener("click", toggleRecording);
});
document.addEventListener("click",            activarPantallaCompleta);
document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) activarPantallaCompleta();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState==="visible" && !document.fullscreenElement)
    activarPantallaCompleta();
});

function activarPantallaCompleta() {
  const e = document.documentElement;
  if (!document.fullscreenElement) {
    (e.requestFullscreen   ||
     e.mozRequestFullScreen||
     e.webkitRequestFullscreen||
     e.msRequestFullscreen).call(e);
  }
}

async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    document.getElementById("video").srcObject = stream;
  } catch(e) {
    console.error("❌ No se pudo acceder a la cámara", e);
  }
}

// —————————————————————
// ► GRABACIÓN Y CUENTA ATRÁS
// —————————————————————
function toggleRecording() {
  isRecording ? stopRecording() : startCountdown();
}

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
  mediaRecorder = new MediaRecorder(stream);
  videoChunks = [];
  mediaRecorder.start();
  mediaRecorder.ondataavailable = e => videoChunks.push(e.data);
  mediaRecorder.onstop = () => {
    clearInterval(recordingTimer);
    timeLeft = 120;
    updateTimerDisplay();
    showPreview(new Blob(videoChunks,{type:"video/webm"}));
  };
  document.getElementById("recordButton").classList.add("stop");
  isRecording = true;
  updateTimerDisplay();
  recordingTimer = setInterval(() => {
    timeLeft--; updateTimerDisplay();
    if (timeLeft<=0) stopRecording();
  },1000);
}

function stopRecording(){
  mediaRecorder.stop();
  document.getElementById("recordButton").classList.remove("stop");
  isRecording = false;
  clearInterval(recordingTimer);
  timeLeft=120; updateTimerDisplay();
}

function updateTimerDisplay(){
  const btn = document.getElementById("recordButton");
  if(isRecording){
    const m=Math.floor(timeLeft/60), s=timeLeft%60;
    btn.innerHTML=`<span>${m}:${s<10?"0":""}${s}</span>`;
  } else {
    btn.innerHTML=`<span>Grabar</span>`;
  }
}

// —————————————————————
// ► VISTA PREVIA + SUBIDA
// —————————————————————
function showPreview(blob){
  const url    = URL.createObjectURL(blob),
        overlay= document.createElement("div"),
        popup  = document.createElement("div");
  overlay.id="overlay"; document.body.append(overlay);
  popup.id="previewPopup";
  popup.innerHTML=`
    <video controls src="${url}"></video>
    <div class="button-bar">
      <button id="acceptButton">Subir</button>
      <button id="deleteButton">Eliminar</button>
    </div>`;
  document.body.append(popup);
  document.getElementById("acceptButton").onclick = () => {
    uploadToDrive(blob); closePreview(popup,overlay);
  };
  document.getElementById("deleteButton").onclick = () => {
    URL.revokeObjectURL(url); closePreview(popup,overlay);
  };
}
function closePreview(p,pop){ pop.remove(); p.remove(); }

// —————————————————————
// ► JWT & SUBIDA A DRIVE
// —————————————————————
async function getServiceAccountToken(){
  const now = KJUR.jws.IntDate.get("now"),
        payload = {
          iss: SERVICE_ACCOUNT.client_email,
          scope: "https://www.googleapis.com/auth/drive.file",
          aud: SERVICE_ACCOUNT.token_uri,
          exp: now+3600,
          iat: now
        },
        header = { alg:"RS256",typ:"JWT" },
        jwt    = KJUR.jws.JWS.sign("RS256",JSON.stringify(header),JSON.stringify(payload),SERVICE_ACCOUNT.private_key),
        params = new URLSearchParams({
          grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion:jwt
        }),
        res    = await fetch(SERVICE_ACCOUNT.token_uri,{
                   method:"POST",
                   headers:{"Content-Type":"application/x-www-form-urlencoded"},
                   body:params
                 }),
        data   = await res.json();
  if(!data.access_token) throw new Error("No access_token");
  return data.access_token;
}

async function uploadToDrive(blob){
  mostrarMensaje("📩 ¡Mensaje recibido! Subiendo…");
  let token;
  try {
    token = await getServiceAccountToken();
  } catch(e){
    console.error("❌ Auth error:",e);
    mostrarMensaje("⚠️ No se pudo autenticar con Drive.");
    return;
  }
  const filename   = `video_${new Date().toISOString().replace(/[-:.]/g,"")}.webm`,
        form        = new FormData();
  form.append("metadata",new Blob([JSON.stringify({name:filename,parents:[FOLDER_ID]})],{type:"application/json"}));
  form.append("file",blob);
  try {
    const res = await fetch(DRIVE_UPLOAD_URL,{
                  method:"POST",
                  headers:{Authorization:`Bearer ${token}`},
                  body:form
                }),
          json = await res.json();
    if(!json.id){
      console.error("❌ Upload error:",json);
      mostrarMensaje("⚠️ Problema al subir el vídeo.");
    }
  } catch(err){
    console.error("❌ Fetch error:",err);
    mostrarMensaje("⚠️ No se pudo conectar con el servidor.");
  }
}

// —————————————————————
// ► AUXILIARES (alerta, confeti, cuenta atrás…)
// —————————————————————
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