import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const QrCode = ({ value, size = 160 }: { value: string; size?: number }) => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then(setSrc)
      .catch(() => setSrc(''));
  }, [value, size]);

  if (!src) return <div style={{ width: size, height: size }} className="bg-light rounded" />;
  return <img src={src} alt="QR code" width={size} height={size} className="rounded border bg-white" />;
};

export default QrCode;
