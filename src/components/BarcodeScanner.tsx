import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BarcodeScannerProps {
    onScan: (decodedText: string, decodedResult: any) => void;
    onClose: () => void;
    isOpen: boolean;
}

export const BarcodeScanner = ({ onScan, onClose, isOpen }: BarcodeScannerProps) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Clean up scanner when modal closes
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
            setIsScanning(false);
            return;
        }

        // Initialize scanner when modal opens
        const config: any = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
            supportedScanTypes: [
                // Support multiple barcode formats
                0, // QR_CODE
                1, // AZTEC
                2, // CODABAR
                3, // CODE_39
                4, // CODE_93
                5, // CODE_128
                6, // DATA_MATRIX
                7, // MAXICODE
                8, // ITF
                9, // EAN_13
                10, // EAN_8
                11, // PDF_417
                12, // RSS_14
                13, // RSS_EXPANDED
                14, // UPC_A
                15, // UPC_E
                16, // UPC_EAN_EXTENSION
            ],
        };

        const scanner = new Html5QrcodeScanner(
            'barcode-reader',
            config,
            false // verbose mode off
        );

        scanner.render(
            (decodedText, decodedResult) => {
                // Success callback
                setIsScanning(true);
                onScan(decodedText, decodedResult);

                // Auto-close after successful scan
                setTimeout(() => {
                    scanner.clear().catch(console.error);
                    onClose();
                }, 500);
            },
            (errorMessage) => {
                // Error callback - silently handle (scanner continuously tries)
                console.debug('Scan error:', errorMessage);
            }
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [isOpen, onScan, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-0 shadow-2xl bg-white">
                <CardHeader className="border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Scan Barcode</CardTitle>
                                <p className="text-sm text-slate-500 mt-1">
                                    Position the barcode within the frame
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="hover:bg-slate-100"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                    {/* Scanner Container */}
                    <div
                        id="barcode-reader"
                        className="rounded-lg overflow-hidden border-2 border-purple-200"
                    />

                    {/* Instructions */}
                    <div className="space-y-2">
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                            <Zap className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>Hold your device steady and ensure good lighting</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                            <Zap className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>Position the barcode within the highlighted square</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                            <Zap className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>The scan will complete automatically</span>
                        </div>
                    </div>

                    {/* Supported Formats */}
                    <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 text-center">
                            Supports: EAN-13, UPC, Code-128, Code-39, QR Code, and more
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};