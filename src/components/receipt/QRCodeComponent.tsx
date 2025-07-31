// src/components/receipt/QRCodeComponent.tsx
"use client";

import { QRCodeSVG } from 'qrcode.react';

const QRCodeComponent = ({ url, size = 80 }: { url: string, size?: number }) => {
  return (
    <QRCodeSVG 
      value={url} 
      size={size}
      bgColor={"#ffffff"}
      fgColor={"#1F2937"} // Warna pmi-dark
      level={"L"}
      includeMargin={false}
    />
  );
};

export default QRCodeComponent;