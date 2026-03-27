import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  User, 
  Calendar, 
  MapPin, 
  Ticket, 
  RefreshCw,
  Camera,
  ShieldCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Ticket as TicketType, Event, UserProfile } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { api } from '../services/api';

interface ScanResultData {
  eventId: string;
  ticketNumber: string;
  ticketType: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  status?: string;
}

export default function Scanner() {
  const [scanResult, setScanResult] = useState<ScanResultData | null>(null);
  const [eventInfo, setEventInfo] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await api.getMe();
        setUserProfile(profile);
      } catch (err) {
        console.error('Profil yüklenemedi:', err);
        toast.error('Kullanıcı profili yüklenemedi');
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error('Scanner cleanup error:', err));
      }
      // Cleanup camera stream
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoTrackRef.current) {
      videoTrackRef.current.stop();
      videoTrackRef.current = null;
    }
    setTorchOn(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isLoading) return; // Prevent multiple scans
    
    setIsLoading(true);
    
    try {
      // QR kodunu parse et
      const ticketData = JSON.parse(decodedText);
      
      // Bilet bilgilerini kontrol et
      if (!ticketData.eventId || !ticketData.ticketNumber) {
        throw new Error('Geçersiz bilet formatı');
      }

      // Biletin geçerliliğini kontrol et
      const event = await api.getEvent(ticketData.eventId);
      
      if (!event) {
        throw new Error('Etkinlik bulunamadı');
      }

      setEventInfo(event);
      
      // Bilet doğrulama verisi hazırla
      const scanData = {
        ticketId: ticketData.ticketNumber,
        ticketType: ticketData.ticketType || 'standard',
        eventId: event.id,
        userId: userProfile?.id || '',
        scannedAt: new Date().toISOString(),
        status: 'valid'
      };

      // Bilet doğrulamasını API'ye gönder
      await api.validateTicket(scanData);
      
      // Sonucu kaydet
      setScanResult({
        ...ticketData,
        eventName: event.title,
        eventDate: event.date,
        eventLocation: event.location,
        status: 'valid'
      });
      
      toast.success('Bilet başarıyla doğrulandı!');
      setError(null);
      
      // Scanner'ı durdur
      stopScanning();
      
    } catch (error: any) {
      console.error('Bilet doğrulama hatası:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Bilet doğrulanamadı';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanFailure = (errorMessage: string) => {
    // QR kod bulunamadığında sürekli hata vermemesi için sadece console'a yazıyoruz
    console.log('Scan attempt:', errorMessage);
  };

  const toggleTorch = async () => {
    if (!videoTrackRef.current) {
      toast.error('Kamera aktif değil');
      return;
    }

    try {
      const capabilities = videoTrackRef.current.getCapabilities();
      
      if ('torch' in capabilities && (capabilities as any).torch) {
        await videoTrackRef.current.applyConstraints({
          // @ts-ignore - torch özelliği TypeScript'te tanımlı değil
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
        toast.success(torchOn ? 'El feneri kapatıldı' : 'El feneri açıldı');
      } else {
        toast.error('Bu cihaz el feneri özelliğini desteklemiyor');
      }
    } catch (error) {
      console.error('El feneri ayarlanamadı:', error);
      toast.error('El feneri ayarlanamadı');
    }
  };

  const startScanning = async () => {
    if (!userProfile?.permissions?.canScan) {
      toast.error('QR kod tarama yetkiniz yok');
      return;
    }

    setError(null);
    setScanResult(null);
    setEventInfo(null);
    setIsScanning(true);
    
    try {
      // Kamera erişimi iste
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      videoTrackRef.current = videoTrack;

      // Html5QrcodeScanner'ı başlat
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        false
      );
      
      scanner.render(handleScanSuccess, handleScanFailure);
      scannerRef.current = scanner;
      
      toast.success('QR kod tarayıcı başlatıldı');
      
    } catch (error: any) {
      console.error('Kamera açılamadı:', error);
      setError('Kamera erişimi reddedildi veya mevcut değil');
      toast.error('Kamera açılamadı');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error('Scanner clear error:', err));
      scannerRef.current = null;
    }
    
    stopCameraStream();
    toast.info('Tarama durduruldu');
  };

  const resetScanner = () => {
    setError(null);
    setScanResult(null);
    setEventInfo(null);
  };

  // Permission kontrolü
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-neutral-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!userProfile.permissions?.canScan) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Erişim Engellendi</h2>
          <p className="text-neutral-600">QR kod tarama yetkiniz bulunmamaktadır.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <QrCode className="w-6 h-6 text-neutral-900" />
              <div>
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Bilet Tarayıcı</h1>
                <p className="text-sm text-neutral-500">Bilet doğrulama ve etkinlik yönetimi</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {!isScanning && !scanResult && (
                <button
                  onClick={startScanning}
                  disabled={isLoading}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Camera className="w-4 h-4" />
                  QR Kodu Tara
                </button>
              )}
              
              {isScanning && (
                <>
                  <button
                    onClick={stopScanning}
                    className="bg-rose-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-rose-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Durdur
                  </button>
                  
                  <button
                    onClick={toggleTorch}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      torchOn 
                        ? 'bg-amber-600 text-white hover:bg-amber-700' 
                        : 'bg-neutral-600 text-white hover:bg-neutral-700'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    {torchOn ? 'Fener Kapat' : 'Fener Aç'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Error State */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 font-semibold text-lg mb-4">{error}</p>
              <button 
                onClick={resetScanner}
                className="bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-700 transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          )}

          {/* Scanner Active State */}
          {isScanning && !error && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">QR Kodu Taranıyor</h2>
                <p className="text-neutral-600">Lütfen QR kodu kamera önüne getirin</p>
              </div>
              
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
              
              {isLoading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-semibold">Bilet doğrulanıyor...</span>
                </div>
              )}
            </div>
          )}

          {/* Initial State */}
          {!isScanning && !scanResult && !error && (
            <div className="text-center">
              <div className="bg-white rounded-2xl p-12 shadow-lg">
                <QrCode className="w-24 h-24 text-neutral-300 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">Bilet Taramaya Hazır</h2>
                <p className="text-neutral-600 mb-6">QR kod taramaya başlamak için butona tıklayın</p>
                <button
                  onClick={startScanning}
                  disabled={isLoading}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-3"
                >
                  <Camera className="w-6 h-6" />
                  QR Kodu Tara
                </button>
              </div>
            </div>
          )}

          {/* Success State - Ticket Info */}
          {scanResult && eventInfo && !error && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Success Header */}
              <div className="bg-emerald-600 text-white p-6 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-3" />
                <h2 className="text-2xl font-bold">Bilet Geçerli</h2>
                <p className="text-emerald-100">Bilet başarıyla doğrulandı</p>
              </div>

              {/* Ticket Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg">
                  <Ticket className="w-5 h-5 text-neutral-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-600 font-medium">Etkinlik</p>
                    <p className="text-lg font-bold text-neutral-900">{eventInfo.title}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-neutral-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-600 font-medium">Tarih</p>
                    <p className="text-lg font-bold text-neutral-900">
                      {format(new Date(eventInfo.date), 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-neutral-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-600 font-medium">Konum</p>
                    <p className="text-lg font-bold text-neutral-900">{eventInfo.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg">
                  <QrCode className="w-5 h-5 text-neutral-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-neutral-600 font-medium">Bilet Numarası</p>
                    <p className="text-lg font-bold text-neutral-900">{scanResult.ticketNumber}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-emerald-700 font-medium">Durum</p>
                    <p className="text-lg font-bold text-emerald-900">Geçerli</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-neutral-50 border-t border-neutral-200 flex gap-3">
                <button
                  onClick={resetScanner}
                  className="flex-1 bg-neutral-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-neutral-700 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    resetScanner();
                    startScanning();
                  }}
                  className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg active:scale-95 inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Yeni Tarama
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}