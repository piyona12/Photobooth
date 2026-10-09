downloadBtn.addEventListener('click', () => {
  if (capturedPhotos.length < totalPhotos) return;

  const stripWidth = 600;  
  const stripHeight = 1600; 
  const padding = 30;
  const photoWidth = stripWidth - (padding * 2);
  const photoHeight = photoWidth * (3 / 4); // Rasio target 4:3

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

      // Hitung Crop Agar Foto Tidak Gepeng (Aspect Ratio Cover)
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
      // Mirroring foto
      ctx.translate(padding + photoWidth, yPos);
      ctx.scale(-1, 1);

      // Gambar foto dengan hasil potongan tengah yang pas
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, photoWidth, photoHeight);
      ctx.restore();

      loadedImages++;

      if (loadedImages === totalPhotos) {
        // Tulis Footer Teks
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`PHOTOBOOTH • ${currentDateSpan.textContent}`, stripWidth / 2, stripHeight - 50);

        const selectedFrame = frameSelect ? frameSelect.value : '';

        if (selectedFrame) {
          const frameImg = new Image();
          frameImg.src = selectedFrame;
          frameImg.onload = () => {
            ctx.drawImage(frameImg, 0, 0, stripWidth, stripHeight);
            triggerDownload();
          };
        } else {
          triggerDownload();
        }
      }
    };
  });

  function triggerDownload() {
    const link = document.createElement('a');
    link.download = `photostrip-${Date.now()}.png`;
    link.href = hiddenCanvas.toDataURL('image/png');
    link.click();
  }
});
