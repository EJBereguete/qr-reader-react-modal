import React, { useEffect, useState, useRef } from 'react';
import * as SDCCore from 'scandit-web-datacapture-core';
import * as SDCBarcode from 'scandit-web-datacapture-barcode';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
} from '@mui/material';
import './Scanner.css';

const Scanner = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const cameraRef = useRef(null); // Referencia para almacenar la cámara

  useEffect(() => {
    async function runScanner() {
      try {
        // Configurar la licencia y los módulos
        await SDCCore.configure({
          licenseKey: 'AuNFU2SLQZ7rGTtUQRS+VSIXcjRVLvW9Zw73aCw0XIvtXtfmFA3rUfxVBf+hN5+Nn35kv50xkUIWUyJjBVSJkENyTlvveYnUalnd7nVv162PQZ/+hiQ2MO9Fzxo+DUy/bTbaDVulWPHHbUNqITIbH3nD1J1O8IaSJ+Xe7RrwDJFiVgAhLJsBaV9buqjX7hAfwQGLwIxRh0mY6ufX3Emn5SP4XkavqtiPrQfrJ57trtO7lOYnTl7k+/0reu9mLRbsq1c3i+CTZBpIzRrMiModpQKhnMHWaf6btAjGL/fmNvI5DUEQL/x4NubURYpCse9wVK2KE+Yr1NklLEb1JdQykeMH9fYz+cUq7+cGoS1MUzZR8EXrR6sKEPKozz1lnS/4SIl0CzkSfA49o4oN5Pf8vHoUgiM5crk/6XqQKhi9QZg5/EVfHWGH7lYh9a4z1Fo59bYDLVNEYGDWWqNVPAKrniVeOzo9RrPEaHEKhctvh1N1p7BeGvg+ZxItcHDLpZtv7RhCeHe/4wpwDXYdAADbmdSXh5LGH3DMU1b7gFsmh02fxomKzolHKl+u2mSVHWya87p3YScuHBuZ4RtJc9AOBcJE5gk65GMxRWWHXsXu54CThE+AMcmhkMeLVLqnVEmkCMig1DP7Ah2w9Gf5DI1w7Ep1rglYtctcxKsNbxSDqignlt+JC/nvwccBKkpPZSucxFmMktXuDdpgfEGxMAIGQ74WB18nrh+YGQkfd05ey+7iGcXwUn32Vx4BIrp9JNNzDoRfOJcwuDcsJePJxqfweh1KA3inYT/NAawy7RuF',  // Reemplaza con tu clave de licencia
          libraryLocation: 'https://cdn.jsdelivr.net/npm/scandit-web-datacapture-barcode@6.27.1/build/engine/',  // Ubicación correcta
          moduleLoaders: [SDCBarcode.barcodeCaptureLoader()],
        });

        const context = await SDCCore.DataCaptureContext.create();

        const devices = await SDCCore.CameraAccess.getCameras();
        const camera = devices.length > 0
          ? SDCCore.Camera.fromDeviceCamera(devices[0]) // Usar la cámara seleccionada
          : SDCCore.Camera.default;
        
        await context.setFrameSource(camera);
        cameraRef.current = camera; // Guardar la cámara en la referencia

        const settings = new SDCBarcode.BarcodeCaptureSettings();
        settings.enableSymbologies([
          SDCBarcode.Symbology.QR,
        ]);

        const barcodeCapture = await SDCBarcode.BarcodeCapture.forContext(context, settings);
        barcodeCapture.addListener({
          didScan: async (barcodeCapture, session) => {
            const barcode = session.newlyRecognizedBarcode;
            showResult(barcode.data);
            setIsDialogOpen(false);  // Cierra el dialog automáticamente
          },
        });

        const view = await SDCCore.DataCaptureView.forContext(context);
        view.connectToElement(document.getElementById('data-capture-view'));

        // Añadir control para cambiar de cámara
        view.addControl(new SDCCore.CameraSwitchControl());

        const barcodeCaptureOverlay = 
          await SDCBarcode.BarcodeCaptureOverlay.withBarcodeCaptureForViewWithStyle(
          barcodeCapture,
          view,
          SDCBarcode.BarcodeCaptureOverlayStyle.Frame
        );

        const viewfinder = new SDCCore.RectangularViewfinder(
          SDCCore.RectangularViewfinderStyle.Rounded,
          SDCCore.RectangularViewfinderLineStyle.Light
        );

        await barcodeCaptureOverlay.setViewfinder(viewfinder);
        await camera.switchToDesiredState(SDCCore.FrameSourceState.On); // Activar la cámara
      } catch (error) {
        console.error(error);
        alert(`Error al configurar el escáner: ${error.message}`);
      }
    }

    function showResult(data) {
      setScanResult({ data });
    }

    if (isDialogOpen) {
      runScanner(); // Iniciar el escáner solo si el modal está abierto
    } else {
      // Apagar la cámara si el modal se cierra
      if (cameraRef.current) {
        cameraRef.current.switchToDesiredState(SDCCore.FrameSourceState.Off); // Desactivar la cámara
      }
    }

  }, [isDialogOpen]);

  const openDialog = () => {
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="App">
      <Typography variant="h4" gutterBottom>
        Lector de Códigos QR
      </Typography>

      <Button variant="contained" color="primary" onClick={openDialog}>
        Activar Cámara
      </Button>

      {scanResult && (
        <Box mt={4} className="resultado">
          <Typography variant="h6">Resultado Escaneado:</Typography>
          <Box className="scan-card" p={2} mt={2} border={1} borderColor="grey.300" borderRadius={2}>
            <Typography><strong>Datos:</strong> {scanResult.data}</Typography>
          </Box>
        </Box>
      )}

      {/* Dialog para la cámara */}
      <Dialog
        open={isDialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Escanear QR</DialogTitle>
        <DialogContent>
          <div id="data-capture-view" style={{ width: '100%', height: '400px' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="secondary" variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Scanner;
