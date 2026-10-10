// Elemen HTML
const webcamElement = document.getElementById('webcam');
const filterSelect = document.getElementById('filter-select');
const layoutSelect = document.getElementById('layout-select');
const startBtn = document.getElementById('start-btn');
const downloadBtn = document.getElementById('download-btn');
const countdownOverlay = document.getElementById('countdown-overlay');
const currentDateSpan = document.getElementById('current-date');
const hiddenCanvas = document.getElementById('hidden-canvas');
const slotsContainer = document.getElementById('slots-container');
const photostripFrame = document.getElementById('photostrip');

// Data variabel
let capturedPhotos = [];
let currentLayout = '3-vert';

// Konfigurasi Layout
const LAYOUT_CONFIGS = {
  '1-single': { totalPhotos: 1, cols: 1 },
  '2-vert':   { totalPhotos: 2, cols: 1 },
  '3-vert':   { totalPhotos: 3, cols: 1 },
  '4-vert':   { totalPhotos: 4, cols: 1 },
  '2x2':      { totalPhotos: 4, cols: 2 }
};

// 1. Tampilkan Tanggal Hari Ini di Strip Footer
const today = new Date();
currentDateSpan.textContent = today.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });

// Render Slot Foto di UI berdasarkan Layout yang dipilih
function renderSlots() {
  currentLayout = layoutSelect.value;
  const config = LAYOUT_CONFIGS[currentLayout];
  
  photostripFrame.className = `photostrip-frame layout-${currentLayout}`;
  slotsContainer.innerHTML = '';
  capturedPhotos = [];
  downloadBtn.disabled = true;

  for (let i = 1; i <= config.totalPhotos; i++) {
    const slot = document.createElement('div');
    slot.className = 'photo-slot';
    slot.id = `slot-${i}`;
    slot.innerHTML = `<span>Foto ${i}</span>`;
    slotsContainer.appendChild(slot);
  }
}

// Inisialisasi awal
renderSlots();
layoutSelect.addEventListener('change', renderSlots);

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
  const config = LAYOUT_CONFIGS[currentLayout];
  startBtn.disabled = true;
  downloadBtn.disabled = true;
  layoutSelect.disabled = true;
  capturedPhotos.length = 0; // Reset array foto

  // Clear slot foto
  for (let i = 1; i <= config.totalPhotos; i++) {
    const slot = document.getElementById(`slot-${i}`);
    slot.innerHTML = `<span>Foto ${i}</span>`;
  }

  // Ambil foto berturut-turut
  for (let i = 1; i <= config.totalPhotos; i++) {
    await runCountdown(3);
    captureToSlot(i);
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  startBtn.disabled = false;
  downloadBtn.disabled = false;
  layoutSelect.disabled = false;
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

// 5. Render Seluruh Strip ke Canvas & Download (Dinamis sesuai layout)
downloadBtn.addEventListener('click', () => {
  const config = LAYOUT_CONFIGS[currentLayout];
  if (capturedPhotos.length < config.totalPhotos) return;

  const cols = config.cols;
  const rows = Math.ceil(config.totalPhotos / cols);

  const stripWidth = 600;  
  const padding = 35;
  const gap = 20;
  const photoWidth = (stripWidth - (padding * 2) - (gap * (cols - 1))) / cols;
  const photoHeight = photoWidth * (3 / 4); // Rasio 4:3

  const footerHeight = 80;
  const stripHeight = (padding * 2) + (rows * photoHeight) + ((rows - 1) * gap) + footerHeight;

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
      const col = index % cols;
      const row = Math.floor(index / cols);

      const xPos = padding + col * (photoWidth + gap);
      const yPos = padding + row * (photoHeight + gap);

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
      ctx.drawImage(img, sx, sy, sWidth, sHeight, xPos, yPos, photoWidth, photoHeight);
      ctx.restore();

      loadedImages++;

      if (loadedImages === config.totalPhotos) {
        // Tulis Teks Footer Maroon
        ctx.fillStyle = '#800020';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`PHOTOBOOTH • ${currentDateSpan.textContent}`, stripWidth / 2, stripHeight - 35);

        // Langsung Download
        const link = document.createElement('a');
        link.download = `photostrip-${currentLayout}-${Date.now()}.png`;
        link.href = hiddenCanvas.toDataURL('image/png');
        link.click();
      }
    };
  });
});

// Jalankan webcam saat pertama kali dimuat
initWebcam();
