// Elemen HTML
const webcamElement = document.getElementById('webcam');
const filterSelect = document.getElementById('filter-select');
const startBtn = document.getElementById('start-btn');
const downloadBtn = document.getElementById('download-btn');
const countdownOverlay = document.getElementById('countdown-overlay');
const currentDateSpan = document.getElementById('current-date');
const hiddenCanvas = document.getElementById('hidden-canvas');

// Data variabel
const capturedPhotos = [];
const totalPhotos = 3;

// 1. Tampilkan Tanggal Hari Ini di Strip Footer
const today = new Date();
currentDateSpan.textContent = today.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });

// 2. Akses Kamera Webcam
async function initWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: "user" },
      audio: false
    });
    webcamElement.srcObject = stream;
  } catch (err) {
    alert("Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan!");
    console.error("Camera access error:", err);
  }
}

// 3. Terapkan Filter CSS pada Live Camera Video
filterSelect.addEventListener('change', (e) => {
  webcamElement.style.filter = e.target.value;
});

// 4. Jalankan Sesi Foto
startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  downloadBtn.disabled = true;
  capturedPhotos.length = 0; // Reset array foto

  // Clear slot foto
  for (let i = 1; i <= totalPhotos; i++) {
    const slot = document.getElementById(`slot-${i}`);
    slot.innerHTML = `<span>Foto ${i}</span>`;
  }

  // Ambil foto berturut-turut
  for (let i = 1; i <= totalPhotos; i++) {
    await runCountdown(3);
    captureToSlot(i);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  startBtn.disabled = false;
  downloadBtn.disabled = false;
});

// Helper Countdown
function runCountdown(seconds) {
  return new Promise((resolve) => {
    countdownOverlay.classList.remove('hidden');
    let count = seconds;
    countdownOverlay.textContent = count;

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownOverlay.textContent = count;
      } else {
        clearInterval(interval);
        countdownOverlay.classList.add('hidden');
        resolve();
      }
    }, 1000);
  });
}

// Helper Capture Frame dari Video ke Slot Preview
function captureToSlot(slotIndex) {
  const canvas = document.createElement('canvas');
  canvas.width = webcamElement.videoWidth || 640;
  canvas.height = webcamElement.videoHeight || 480;
  const ctx = canvas.getContext('2d');

  // Menggambar persis tampilan mirror video
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.filter = webcamElement.style.filter || 'none';
  ctx.drawImage(webcamElement, 0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL('image/png');
  capturedPhotos.push(dataUrl);

  // Render ke slot HTML
  const slot = document.getElementById(`slot-${slotIndex}`);
  slot.innerHTML = `<img src="${dataUrl}" />`;
}

// 5. Render Seluruh Strip ke Canvas & Download (Bebas Gepeng!)
downloadBtn.addEventListener('click', () => {
  if (capturedPhotos.length < totalPhotos) return;

  const stripWidth = 600;  
  const stripHeight = 1600; 
  const padding = 35;
  const photoWidth = stripWidth - (padding * 2);
  const photoHeight = photoWidth * (3 / 4); // Rasio 4:3

  hiddenCanvas.width = stripWidth;
  hiddenCanvas.height = stripHeight;
  const ctx = hiddenCanvas.getContext('2d');

  // Background Strip Putih
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, stripWidth, stripHeight);

  let loadedImages = 0;

  capturedPhotos.forEach((photoSrc, index) => {
    const img = new Image();
    img.src = photoSrc;
    img.onload = () => {
      const yPos = padding + index * (photoHeight + padding);

      // Hitung Crop Center (Aspect Ratio Cover) agar foto tidak gepeng
      const imgAspect = img.width / img.height;
      const targetAspect = photoWidth / photoHeight;
      let sx, sy, sWidth, sHeight;

      if (imgAspect > targetAspect) {
        sHeight = img.height;
        sWidth = img.height * targetAspect;
        sx = (img.width - sWidth) / 2;
        sy = 0;
      } else {
        sWidth = img.width;
        sHeight = img.width / targetAspect;
        sx = 0;
        sy = (img.height - sHeight) / 2;
      }

      ctx.save();
      // Gambar foto dengan potong tengah yang pas
      ctx.drawImage(img, sx, sy, sWidth, sHeight, padding, yPos, photoWidth, photoHeight);
      ctx.restore();

      loadedImages++;

      if (loadedImages === totalPhotos) {
        // Tulis Teks Footer Maroon
        ctx.fillStyle = '#800020';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`PHOTOBOOTH • ${currentDateSpan.textContent}`, stripWidth / 2, stripHeight - 60);

        // Langsung Download
        const link = document.createElement('a');
        link.download = `photostrip-${Date.now()}.png`;
        link.href = hiddenCanvas.toDataURL('image/png');
        link.click();
      }
    };
  });
});

// Jalankan webcam saat pertama kali dimuat
initWebcam();
