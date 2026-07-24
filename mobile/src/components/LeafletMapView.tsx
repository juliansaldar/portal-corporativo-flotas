import { useCallback, useEffect, useRef } from 'react'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

/**
 * Mapa real via WebView + Leaflet/OpenStreetMap (mismo motor y proveedor de
 * tiles que frontend/src/components/MapView.tsx en el portal web). Se eligio
 * sobre react-native-maps/expo-maps porque funciona en Expo Go "vanilla" sin
 * dev client ni API key de Google Maps — ver design.md de mobile-tracking-map.
 */
interface LeafletMapViewProps {
  lat: number | null
  lon: number | null
  speedKmh?: number
}

const DEFAULT_CENTER = { lat: 4.6097, lon: -74.0817 } // Bogota, mismo default que el portal web

const MAP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0b1015; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${DEFAULT_CENTER.lat}, ${DEFAULT_CENTER.lon}], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    let marker = null;
    window.setVehiclePosition = function (lat, lon, speedKmh) {
      const latlng = [lat, lon];
      if (marker) {
        marker.setLatLng(latlng);
      } else {
        marker = L.circleMarker(latlng, {
          radius: 8,
          color: '#ffffff',
          weight: 2,
          fillColor: '#00ffc2',
          fillOpacity: 1,
        }).addTo(map);
      }
      if (typeof speedKmh === 'number') {
        marker.bindPopup(speedKmh.toFixed(1) + ' km/h');
      }
      map.setView(latlng);
    };
  </script>
</body>
</html>
`

export function LeafletMapView({ lat, lon, speedKmh }: LeafletMapViewProps) {
  const webviewRef = useRef<WebView>(null)
  const isReadyRef = useRef(false)

  const pushPosition = useCallback(() => {
    if (!isReadyRef.current || lat == null || lon == null) return
    const speedArg = typeof speedKmh === 'number' ? speedKmh : 'undefined'
    webviewRef.current?.injectJavaScript(`window.setVehiclePosition(${lat}, ${lon}, ${speedArg}); true;`)
  }, [lat, lon, speedKmh])

  useEffect(() => {
    pushPosition()
  }, [pushPosition])

  return (
    <WebView
      ref={webviewRef}
      originWhitelist={['*']}
      source={{ html: MAP_HTML }}
      style={styles.webview}
      onLoadEnd={() => {
        isReadyRef.current = true
        pushPosition()
      }}
    />
  )
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: '#0b1015',
  },
})
