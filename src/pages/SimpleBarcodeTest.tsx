import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, CheckCircle, XCircle } from 'lucide-react';

/**
 * SIMPLE BARCODE TEST COMPONENT
 * Use this to test if camera and barcode scanning works
 * Once this works, integrate into Items.tsx
 */
export default function SimpleBarcodeTest() {
    const [status, setStatus] = useState<string>('Ready to test');
    const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);
    const [showScanner, setShowScanner] = useState(false);

    // Test 1: Check if camera API is available
    const testCameraAPI = async () => {
        setStatus('Testing camera API...');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setStatus('❌ Camera API not supported in this browser');
            setCameraSupported(false);
            return;
        }

        setStatus('✅ Camera API is supported');
        setCameraSupported(true);
    };

    // Test 2: Request camera permission
    const testCameraPermission = async () => {
        setStatus('Requesting camera permission...');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStatus('✅ Camera permission granted!');

            // Stop the stream
            stream.getTracks().forEach(track => track.stop());

            return true;
        } catch (error: any) {
            setStatus(`❌ Camera permission denied: ${error.message}`);
            return false;
        }
    };

    // Test 3: Load html5-qrcode library
    const testLibraryLoaded = async () => {
        setStatus('Testing if html5-qrcode library is loaded...');

        try {
            // Try to import the library
            const { Html5QrcodeScanner } = await import('html5-qrcode');
            setStatus('✅ html5-qrcode library loaded successfully!');
            return true;
        } catch (error: any) {
            setStatus(`❌ Library not found. Run: npm install html5-qrcode`);
            return false;
        }
    };

    // Test 4: Initialize scanner
    const testScanner = async () => {
        setStatus('Initializing scanner...');

        try {
            const { Html5QrcodeScanner } = await import('html5-qrcode');

            const scanner = new Html5QrcodeScanner(
                'test-scanner-region',
                { fps: 10, qrbox: 250 },
                false
            );

            scanner.render(
                (decodedText) => {
                    setStatus(`✅ Scanned: ${decodedText}`);
                    scanner.clear();
                },
                (error) => {
                    // Errors are normal during scanning
                    console.debug('Scan error:', error);
                }
            );

            setStatus('✅ Scanner initialized! Try scanning a barcode.');
            setShowScanner(true);
        } catch (error: any) {
            setStatus(`❌ Scanner error: ${error.message}`);
        }
    };

    // Run all tests
    const runAllTests = async () => {
        await testCameraAPI();
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (cameraSupported !== false) {
            const hasPermission = await testCameraPermission();
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (hasPermission) {
                const libraryLoaded = await testLibraryLoaded();
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (libraryLoaded) {
                    await testScanner();
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Camera className="h-6 w-6" />
                            Barcode Scanner Test Suite
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-slate-100 rounded-lg font-mono text-sm">
                            Status: {status}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button onClick={testCameraAPI}>
                                1. Test Camera API
                            </Button>

                            <Button onClick={testCameraPermission}>
                                2. Test Permission
                            </Button>

                            <Button onClick={testLibraryLoaded}>
                                3. Test Library
                            </Button>

                            <Button onClick={testScanner}>
                                4. Initialize Scanner
                            </Button>
                        </div>

                        <Button
                            onClick={runAllTests}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-500"
                            size="lg"
                        >
                            Run All Tests
                        </Button>

                        {/* Scanner Region */}
                        {showScanner && (
                            <div className="mt-6">
                                <div id="test-scanner-region" className="rounded-lg overflow-hidden border-2 border-purple-300" />
                                <Button
                                    onClick={() => {
                                        setShowScanner(false);
                                        window.location.reload();
                                    }}
                                    variant="outline"
                                    className="w-full mt-4"
                                >
                                    Reset Test
                                </Button>
                            </div>
                        )}

                        {/* Environment Info */}
                        <Card className="bg-slate-50">
                            <CardContent className="pt-6 space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Browser:</span>
                                    <span className="font-mono">{navigator.userAgent.split(' ').slice(0, 2).join(' ')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Protocol:</span>
                                    <span className="font-mono">{window.location.protocol}</span>
                                    {window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-500" />
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600">Camera API:</span>
                                    <span className="font-mono">
                                        {cameraSupported === null ? 'Not tested' : cameraSupported ? '✅ Available' : '❌ Not available'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
                            <p className="font-semibold text-blue-900">📋 Troubleshooting Tips:</p>
                            <ul className="list-disc list-inside text-blue-800 space-y-1">
                                <li>Must use HTTPS or localhost (not HTTP)</li>
                                <li>Click "Allow" when browser asks for camera permission</li>
                                <li>Make sure html5-qrcode is installed: <code className="bg-blue-100 px-1">npm install html5-qrcode</code></li>
                                <li>Check browser console (F12) for errors</li>
                                <li>Try Chrome or Safari (best support)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Test Barcodes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Test Barcodes (for testing)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <p className="text-slate-600">Display these barcodes on another screen and scan them:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div className="p-3 bg-white border rounded text-center">
                                <p className="font-semibold">Coca-Cola</p>
                                <p className="font-mono text-xs mt-1">5449000000996</p>
                            </div>
                            <div className="p-3 bg-white border rounded text-center">
                                <p className="font-semibold">Nutella</p>
                                <p className="font-mono text-xs mt-1">3017620422003</p>
                            </div>
                            <div className="p-3 bg-white border rounded text-center">
                                <p className="font-semibold">Snickers</p>
                                <p className="font-mono text-xs mt-1">5000159461122</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-4">
                            💡 Or generate test barcodes at: <a href="https://barcode.tec-it.com/" target="_blank" className="text-blue-600 underline">barcode.tec-it.com</a>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}