import React, { useEffect, useRef, useState } from "react";
import * as atlas from "azure-maps-control";
import "azure-maps-control/dist/atlas.min.css";
import { useNavigate } from "react-router-dom";

const baseUrl = "http://localhost:3000";
const mapCenter = [114.2045, 22.4148];
const mapZoom = 13;
const azureMapsApiKey = "9R4Zofs0CoJZXjwifmIOQ4wKIzAWggNDH8qpv0eqFAYzivvACdh4JQQJ99BLACYeBjFLXhVXAAAgAZMP2LEh";

export default function Map() {
  const navigate = useNavigate();

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const dataSource = useRef(null);
  const activePopup = useRef(null);

  const [locationsData, setLocationsData] = useState([]);
  const [mapStyle, setMapStyle] = useState("road");

  const token = localStorage.getItem("userToken");

  /* =========================
     INIT MAP
  ========================= */
  useEffect(() => {
    mapInstance.current = new atlas.Map(mapRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      view: "Auto",
      authOptions: {
        authType: "subscriptionKey",
        subscriptionKey: azureMapsApiKey,
      },
    });

    mapInstance.current.events.add("ready", () => {
      dataSource.current = new atlas.source.DataSource();
      mapInstance.current.sources.add(dataSource.current);

      const symbolLayer = new atlas.layer.SymbolLayer(
        dataSource.current,
        null,
        {
          iconOptions: {
            image: "pin-round-blue",
            size: 0.8,
            anchor: "bottom",
          },
          textOptions: {
            textField: ["get", "nameE"],
            offset: [0, 1.2],
          },
        }
      );

      mapInstance.current.layers.add(symbolLayer);

      mapInstance.current.events.add(
        "mouseenter",
        symbolLayer,
        handleMarkerHover
      );
      mapInstance.current.events.add(
        "mouseleave",
        symbolLayer,
        () => activePopup.current?.close()
      );
      mapInstance.current.events.add(
        "click",
        symbolLayer,
        handleMarkerClick
      );
    });

    loadLocations();
  }, []);

  /* =========================
     LOAD LOCATIONS
  ========================= */
  async function loadLocations(filters = {}) {
    const params = new URLSearchParams({
      sortBy: "distance",
      order: "asc",
    });

    if (filters.keyword) params.append("keyword", filters.keyword);
    if (filters.area) params.append("area", filters.area);
    if (filters.maxDistance) params.append("maxDistance", filters.maxDistance);

    const res = await fetch(`${baseUrl}/api/locations?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    setLocationsData(data);
    updateMapMarkers(data);
  }

  /* =========================
     UPDATE MARKERS
  ========================= */
  function updateMapMarkers(data) {
    if (!dataSource.current) return;

    dataSource.current.clear();

    const features = data.map((location) => {
      if (!location.latitude || !location.longitude) return null;
      return new atlas.data.Feature(
        new atlas.data.Point([
          location.longitude,
          location.latitude,
        ]),
        {
          id: location._id,
          nameE: location.nameE,
          nameC: location.nameC,
          distanceKm: location.distanceKm,
          eventCount: location.eventCount,
        }
      );
    }).filter(Boolean);

    dataSource.current.add(features);

    if (features.length > 0) {
      mapInstance.current.setCamera({
        bounds: dataSource.current.getBounds(),
        padding: 50,
      });
    }
  }

  /* =========================
     MARKER EVENTS
  ========================= */
  function handleMarkerHover(e) {
    activePopup.current?.close();

    const props = e.shapes[0].getProperties();
    const coord = e.shapes[0].getCoordinates();

    const popup = new atlas.Popup({
      position: coord,
      content: `
        <div>
          <h3>${props.nameE}</h3>
          <p>Distance: ${props.distanceKm.toFixed(2)} km</p>
          <p>Events: ${props.eventCount}</p>
        </div>
      `,
    });

    popup.open(mapInstance.current);
    activePopup.current = popup;
  }

  function handleMarkerClick(e) {
    const { id } = e.shapes[0].getProperties();
    navigate(`/location/${id}`);
  }

  /* =========================
     UI CONTROLS
  ========================= */
  function zoomIn() {
    mapInstance.current.setZoom(mapInstance.current.getZoom() + 1);
  }

  function zoomOut() {
    mapInstance.current.setZoom(mapInstance.current.getZoom() - 1);
  }

  function changeMapStyle(style) {
    setMapStyle(style);
    mapInstance.current.setStyle(
      style === "dark" ? "grayscale_dark" : style
    );
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      {/* NAV BAR */}
      <nav className="nav-bar">
        <button onClick={() => navigate("/")}>Locations</button>
        <button onClick={() => navigate("/events")}>Events</button>
        <button onClick={() => navigate("/favorites")}>Favorites</button>
        <button onClick={() => navigate("/map")}>Map</button>
      </nav>

      {/* MAP CONTROLS */}
      <div className="map-controls">
        <button onClick={zoomIn}>＋</button>
        <button onClick={zoomOut}>－</button>
        <select onChange={(e) => changeMapStyle(e.target.value)}>
          <option value="road">Road</option>
          <option value="satellite">Satellite</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* MAP */}
      <div ref={mapRef} style={{ height: "600px", width: "100%" }} />
    </>
  );
}