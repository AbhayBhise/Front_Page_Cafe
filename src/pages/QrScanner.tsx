import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import { cafeService } from '../services/cafeService';
import type { Cafe } from '../types';

const SAMPLE_TABLES = [
  { cafeSlug: 'front-page-cafe', cafeName: 'Front Page Cafe', table: '4', label: 'Table 04 · Espresso Bar' },
  { cafeSlug: 'front-page-cafe', cafeName: 'Front Page Cafe', table: '1', label: 'Table 01 · Indoor Window' },
  { cafeSlug: 'the-brew-house', cafeName: 'The Brew House', table: '2', label: 'Table 02 · Wood-Fired Patio' },
  { cafeSlug: 'corner-chai-co', cafeName: 'Corner Chai Co.', table: '1', label: 'Table 01 · Counter Seat' },
];

const QrScanner = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [selectedCafe, setSelectedCafe] = useState('front-page-cafe');
  const [tableCode, setTableCode] = useState('4');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    cafeService
      .discover({ pageSize: 20 })
      .then((res) => {
        setCafes(res.data);
        if (res.data.length > 0 && !selectedCafe) {
          setSelectedCafe(res.data[0].slug);
        }
      })
      .catch(() => undefined);
  }, [selectedCafe]);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera is not supported on this browser or device.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera permission was denied or camera is in use. You can enter or select your table below.');
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCafe) {
      toast.error('Please select a cafe');
      return;
    }
    if (!tableCode.trim()) {
      toast.error('Please enter a table number');
      return;
    }
    stopCamera();
    navigate(`/t/${selectedCafe}/${encodeURIComponent(tableCode.trim())}`);
  };

  const handleQuickSelect = (cafeSlug: string, code: string) => {
    stopCamera();
    navigate(`/t/${cafeSlug}/${code}`);
  };

  return (
    <div className="container py-4" style={{ minHeight: '80vh' }}>
      <BackButton fallbackPath="/" />

      <div className="text-center mb-4">
        <span
          className="badge rounded-pill mb-2 px-3 py-1 fw-semibold"
          style={{ backgroundColor: 'rgba(217, 119, 6, 0.12)', color: '#b45309' }}
        >
          <i className="bi bi-qr-code-scan me-1" /> Contactless Dine-In
        </span>
        <h2 className="fw-bold mb-1" style={{ color: '#2c1810' }}>
          Scan Table QR Code
        </h2>
        <p className="text-muted small mx-auto" style={{ maxWidth: 520 }}>
          Point your camera at the QR code sticker on your cafe table to view the live menu and order directly to your seat.
        </p>
      </div>

      <div className="row justify-content-center g-4">
        {/* Left Column: Interactive Camera Viewfinder */}
        <div className="col-lg-6 col-md-8">
          <div className="card border-0 rounded-4 shadow-sm overflow-hidden text-center bg-dark text-white p-3 p-md-4">
            <div
              className="position-relative mx-auto rounded-4 overflow-hidden d-flex align-items-center justify-content-center"
              style={{
                width: '100%',
                maxWidth: '380px',
                height: '320px',
                backgroundColor: '#16110e',
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-100 h-100 object-fit-cover"
                style={{ display: cameraActive ? 'block' : 'none' }}
              />

              {cameraActive ? (
                <div className="qr-viewfinder position-absolute">
                  <div className="qr-scan-line" />
                </div>
              ) : (
                <div className="p-4 text-center">
                  <i className="bi bi-camera-video-off fs-1 text-warning mb-2 d-block" />
                  <p className="small text-light opacity-75 mb-3">
                    {cameraError || 'Camera inactive'}
                  </p>
                  <button
                    type="button"
                    className="btn btn-warning btn-sm rounded-pill px-3 fw-bold"
                    onClick={startCamera}
                  >
                    <i className="bi bi-camera me-1" /> Try Enabling Camera
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 d-flex justify-content-center gap-2">
              {cameraActive ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light rounded-pill px-3"
                  onClick={stopCamera}
                >
                  <i className="bi bi-pause-fill me-1" /> Pause Camera
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-warning text-dark rounded-pill px-3 fw-bold"
                  onClick={startCamera}
                >
                  <i className="bi bi-play-fill me-1" /> Resume Camera
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Manual Code Entry & Quick Test Table Shortcuts */}
        <div className="col-lg-6 col-md-8">
          <div
            className="card border-0 rounded-4 shadow-sm p-4 h-100"
            style={{ backgroundColor: '#fff9f2', border: '1px solid rgba(139, 69, 19, 0.15)' }}
          >
            <h5 className="fw-bold mb-3" style={{ color: '#2c1810' }}>
              <i className="bi bi-keyboard me-2 text-warning" />
              Manual Table Selection
            </h5>
            <p className="text-muted small mb-4">
              Can't scan right now? Select your cafe and table number to jump directly to your table menu.
            </p>

            <form onSubmit={handleManualSubmit} className="mb-4">
              <div className="mb-3">
                <label className="form-label small fw-semibold" style={{ color: '#2c1810' }}>
                  Select Cafe
                </label>
                <select
                  className="form-select rounded-3 py-2"
                  value={selectedCafe}
                  onChange={(e) => setSelectedCafe(e.target.value)}
                >
                  {cafes.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name} ({c.city || 'Neighborhood'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold" style={{ color: '#2c1810' }}>
                  Table Number / Code
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-pin-map text-muted" />
                  </span>
                  <input
                    type="text"
                    required
                    className="form-control rounded-end-3 py-2"
                    placeholder="e.g. 4, 12, Patio-1"
                    value={tableCode}
                    onChange={(e) => setTableCode(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-warning text-dark fw-bold w-100 py-2 rounded-pill shadow-sm"
              >
                <i className="bi bi-box-arrow-in-right me-2" />
                Open Table Menu & Order
              </button>
            </form>

            <div className="pt-3 border-top">
              <small className="fw-bold d-block text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem' }}>
                Quick Test Dine-In Tables:
              </small>
              <div className="d-flex flex-wrap gap-2">
                {SAMPLE_TABLES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickSelect(sample.cafeSlug, sample.table)}
                    className="btn btn-sm btn-white bg-white border text-dark rounded-pill px-3 py-1 shadow-2xs"
                  >
                    <i className="bi bi-cup-hot me-1 text-warning" />
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dine-In Perks Strip */}
      <div className="row g-3 mt-4 pt-2">
        <div className="col-md-4">
          <div className="p-3 bg-white rounded-4 border text-center h-100 shadow-2xs">
            <i className="bi bi-qr-code text-warning fs-3 mb-2 d-block" />
            <h6 className="fw-bold mb-1" style={{ color: '#2c1810' }}>Instant Ordering</h6>
            <p className="text-muted small mb-0">Browse photos, customize sweetness or milk options, and place order directly to the kitchen.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 bg-white rounded-4 border text-center h-100 shadow-2xs">
            <i className="bi bi-stopwatch text-warning fs-3 mb-2 d-block" />
            <h6 className="fw-bold mb-1" style={{ color: '#2c1810' }}>Live Kitchen Queue</h6>
            <p className="text-muted small mb-0">Watch your brew status move from accepted to preparing to ready with dynamic wait times.</p>
          </div>
        </div>
        <div className="col-md-4">
          <div className="p-3 bg-white rounded-4 border text-center h-100 shadow-2xs">
            <i className="bi bi-credit-card text-warning fs-3 mb-2 d-block" />
            <h6 className="fw-bold mb-1" style={{ color: '#2c1810' }}>Pay at Table or Counter</h6>
            <p className="text-muted small mb-0">Pay instantly via UPI / Card or select 'Pay at Counter' when picking up.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
