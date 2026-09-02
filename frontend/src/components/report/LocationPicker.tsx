import { useCallback, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#2563EB;border:3px solid white;box-shadow:0 2px 6px rgba(15,23,42,0.35);transform:rotate(-45deg)"></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 26],
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Recenters the map when latitude/longitude change from outside the map
// itself (e.g. a "Use my location" button or the Dwarka quick-select).
function RecenterOnChange({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMapEvents({})

  useEffect(() => {
    const current = map.getCenter()
    const distance = current.distanceTo([latitude, longitude])
    if (distance > 5) {
      map.setView([latitude, longitude], map.getZoom())
    }
  }, [latitude, longitude, map])

  return null
}

export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number
  longitude: number
  onChange: (lat: number, lng: number) => void
}) {
  const handlePick = useCallback((lat: number, lng: number) => onChange(lat, lng), [onChange])

  return (
    <div className="h-56 w-full overflow-hidden rounded-lg border border-border">
      <MapContainer center={[latitude, longitude]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[latitude, longitude]}
          icon={markerIcon}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target as L.Marker
              const pos = marker.getLatLng()
              onChange(pos.lat, pos.lng)
            },
          }}
        />
        <ClickHandler onPick={handlePick} />
        <RecenterOnChange latitude={latitude} longitude={longitude} />
      </MapContainer>
    </div>
  )
}
