// BranchMap.js
import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Фикс для иконок
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});
const branches = [
  { name: "Филиал в Минске", lat: 53.848043, lng: 27.509163 }, // Координаты центра Минска
];

const BranchMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current && branches.length > 0) {
      const map = mapRef.current;
      // Приближаемся к первому маркеру с отступами
      map.flyTo([branches[0].lat, branches[0].lng], 12, {
        duration: 1, // Плавное приближение за 1 секунду
      });
    }
  }, []);

  return (
    <div style={{ 
      height: "400px", 
      width: "95%",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      margin: "auto",
      padding: "10px", // Отступы вокруг карты
      backgroundColor: "#f5f5f5" // Фон для контейнера
    }}>
      <MapContainer 
        ref={mapRef}
        center={branches[0]} // Начальный центр - первый маркер
        zoom={12} // Стартовый зум
        style={{ 
          height: "100%", 
          width: "100%",
          margin: "10px" // Внутренние отступы карты
        }}
        scrollWheelZoom={true}
        zoomControl={true}
        dragging={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {branches.map((branch, index) => (
          <Marker key={index} position={[branch.lat, branch.lng]}>
            <Popup style={{
              fontWeight: "500",
              fontSize: "14px",
              padding: "8px 12px",
              borderRadius: "6px"
            }}>
              {branch.name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default BranchMap;