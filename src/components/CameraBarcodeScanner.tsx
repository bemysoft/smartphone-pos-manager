import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, RefreshCw, Zap, Volume2, VolumeX, CheckCircle2, AlertCircle, Barcode, ShieldAlert } from "lucide-react";

interface CameraBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
}

export default function CameraBarcodeScanner({ isOpen, onClose, onScanSuccess }: CameraBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [lastScannedText, setLastScannedText] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "pos-camera-barcode-reader";

  // Play audio beep when barcode is successfully scanned
  const playBeepSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context beep failed:", e);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    // Get list of available video cameras
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices.map((d) => ({ id: d.id, label: d.label || `Kamera ${d.id}` })));
          // Prefer back camera if available
          const backCam = devices.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("belakang") || d.label.toLowerCase().includes("environment"));
          const chosenId = backCam ? backCam.id : devices[0].id;
          setSelectedCameraId(chosenId);
          startScanner(chosenId);
        } else {
          setErrorMessage("Tidak ada kamera yang terdeteksi di perangkat ini.");
        }
      })
      .catch((err) => {
        console.error("Camera access error:", err);
        setErrorMessage("Akses kamera ditolak atau tidak didukung browser. Pastikan izin kamera sudah diberikan.");
      });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = (cameraId: string) => {
    setErrorMessage(null);
    stopScanner();

    setTimeout(() => {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.777778
      };

      html5QrCode
        .start(
          cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" },
          config,
          (decodedText) => {
            const cleanText = decodedText.trim();
            if (cleanText) {
              playBeepSound();
              setLastScannedText(cleanText);
              setScanHistory((prev) => (prev.includes(cleanText) ? prev : [cleanText, ...prev.slice(0, 4)]));
              onScanSuccess(cleanText);
            }
          },
          () => {
            // Silence frame parsing noise
          }
        )
        .then(() => {
          setIsScanning(true);
        })
        .catch((err) => {
          console.error("Failed to start html5Qrcode:", err);
          setIsScanning(false);
          setErrorMessage("Gagal membuka stream kamera. Periksa izin kamera pada browser Anda.");
        });
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
            setIsScanning(false);
          })
          .catch((err) => {
            console.error("Failed to stop scanner:", err);
            scannerRef.current = null;
            setIsScanning(false);
          });
      } else {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    playBeepSound();
    const clean = manualCode.trim();
    setLastScannedText(clean);
    setScanHistory((prev) => [clean, ...prev.slice(0, 4)]);
    onScanSuccess(clean);
    setManualCode("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                Pemindai Barcode Kamera POS
              </h3>
              <p className="text-[10px] text-slate-400">Pindai barcode/IMEI produk langsung melalui lensa kamera</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                soundEnabled
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
              title={soundEnabled ? "Suara Beep Aktif" : "Suara Beep Mute"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Camera Selector Dropdown */}
        {cameras.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-slate-700">
            <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-300 shrink-0">Pilih Lensa:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startScanner(e.target.value);
              }}
              className="w-full bg-slate-900 text-slate-200 text-xs rounded-lg p-1.5 font-semibold outline-none cursor-pointer border border-slate-700"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Camera Scanner Box */}
        <div className="relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 min-h-[220px] flex items-center justify-center">
          <div id={scannerContainerId} className="w-full h-full max-h-[260px] overflow-hidden rounded-2xl" />

          {/* Scanner Aim Overlay */}
          {isScanning && !errorMessage && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-dashed border-indigo-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse shadow-[0_0_10px_#f43f5e]" />
                <span className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-bold text-indigo-300 uppercase tracking-wider bg-slate-900/80 py-0.5 px-2 rounded-full mx-auto w-max border border-indigo-500/30">
                  Arahkan Barcode / SKU / IMEI ke Dalam Kotak
                </span>
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-5 text-center space-y-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-full w-max mx-auto border border-rose-500/30">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <p className="text-xs font-bold text-rose-300 max-w-xs mx-auto leading-relaxed">{errorMessage}</p>
              <button
                type="button"
                onClick={() => startScanner(selectedCameraId)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Coba Hubungkan Ulang</span>
              </button>
            </div>
          )}
        </div>

        {/* Last Scanned Barcode Banner */}
        {lastScannedText && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-2xl flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-[9px] font-bold uppercase text-emerald-300 block">Terdeteksi Terbaru:</span>
                <span className="text-xs font-mono font-extrabold text-white truncate">{lastScannedText}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onScanSuccess(lastScannedText)}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider shrink-0 cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-500/20"
            >
              + Masukkan
            </button>
          </div>
        )}

        {/* Manual Barcode Input Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Atau Input Manual Kode / IMEI:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ketik SKU / ID / IMEI Produk..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold rounded-xl text-xs cursor-pointer shrink-0 border border-slate-700"
            >
              Kirim
            </button>
          </div>
        </form>

        {/* Recent Scan History */}
        {scanHistory.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Riwayat Pindaian Sesi Ini:</span>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {scanHistory.map((code, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onScanSuccess(code)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-950 hover:border-indigo-500 border border-slate-700 text-slate-200 text-[10px] font-mono rounded-lg transition-colors cursor-pointer"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
