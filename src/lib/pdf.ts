/**
 * Helpers para jsPDF: dibujo de radar chart en canvas y utilidades
 * de layout con identidad Cañeros (verde/blanco/dorado).
 */

export const PDF_GREEN: [number, number, number] = [15, 74, 43];
export const PDF_GREEN_MID: [number, number, number] = [23, 117, 65];
export const PDF_GOLD: [number, number, number] = [245, 168, 1];
export const PDF_GRAY: [number, number, number] = [100, 116, 139];

export function drawRadar(
  labels: string[],
  datasets: { name: string; values: number[]; color: string }[],
  size = 320,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2 + 8;
  const radius = size / 2 - 56;
  const n = labels.length;

  const point = (i: number, r: number): [number, number] => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };

  // Grid
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const [x, y] = point(i % n, (radius * ring) / 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // Axis + labels
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#374151';
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const [x, y] = point(i, radius);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#e5e7eb';
    ctx.stroke();
    const [lx, ly] = point(i, radius + 22);
    ctx.fillText(labels[i], lx, ly + 4);
  }

  // Datasets
  for (const ds of datasets) {
    ctx.beginPath();
    ds.values.forEach((v, i) => {
      const [x, y] = point(i, (radius * Math.min(100, Math.max(0, v))) / 100);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = `${ds.color}33`;
    ctx.strokeStyle = ds.color;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    // puntos
    ds.values.forEach((v, i) => {
      const [x, y] = point(i, (radius * Math.min(100, Math.max(0, v))) / 100);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = ds.color;
      ctx.fill();
    });
  }
  return canvas.toDataURL('image/png');
}

/** Carga una imagen y devuelve dataURL PNG (para el logo). */
export function imageToDataUrl(src: string, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = src;
  });
}
