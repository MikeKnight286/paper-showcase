"use client";

import { useEffect, useRef } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  url: string;
  size?: number;
}

export default function QRCode({ url, size = 170 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCodeLib.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: { dark: "#111111", light: "#ffffff" },
    }).catch(() => {});
  }, [url, size]);

  return <canvas ref={canvasRef} width={size} height={size} />;
}
