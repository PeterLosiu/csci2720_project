import { useEffect, useRef, useState } from "react";
import * as atlas from "azure-maps-control";
import "azure-maps-control/dist/atlas.min.css";

const AZURE_MAP_KEY = "9R4Zofs0CoJZXjwifmIOQ4wKIzAWggNDH8qpv0eqFAYzivvACdh4JQQJ99BLACYeBjFLXhVXAAAgAZMP2LEh";

export default function Map() {
  const mapRef = useRef(null);
  const dataSourceRef = useRef(null);
  const [locations, setLocations] = useState([]);

  /* 1️⃣ Fetch locations from backend */
  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("http://localhost:3000/api/locations");
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    }
    fetchLocations();
  }, []);

  /* 2️⃣ Initialize map once */
  useEffect(() => {
    if (mapRef.current) return;

    mapRef.current = new atlas.Map("mapContainer", {
      center: [114.1694, 22.3193], // Hong Kong
      zoom: 11,
      authOptions: {
        authType: "subscriptionKey",
        subscriptionKey: AZURE_MAP_KEY,
      },
    });

    mapRef.current.events.add("ready", () => {
      dataSourceRef.current = new atlas.source.DataSource();
      mapRef.current.sources.add(dataSourceRef.current);

      const symbolLayer = new atlas.layer.SymbolLayer(
        dataSourceRef.current,
        null,
        {
          iconOptions: {
            image: "pin-round-darkblue",
            allowOverlap: true,
          },
          textOptions: {
            textField: ["get", "name"],
            offset: [0, 1.2],
          },
        }
      );

      mapRef.current.layers.add(symbolLayer);

      /* click pin → location detail page */
      mapRef.current.events.add("click", symbolLayer, (e) => {
        const feature = e.shapes[0];
        const locationId = feature.getProperties().locationId;
        window.location.href = `/locations/${locationId}`;
      });
    });
  }, []);

  /* 3️⃣ Update pins when locations change */
  useEffect(() => {
    if (!dataSourceRef.current || locations.length === 0) return;

    dataSourceRef.current.clear();

    locations.forEach((loc) => {
      if (!loc.longitude || !loc.latitude) return;

      const point = new atlas.data.Point([
        Number(loc.longitude),
        Number(loc.latitude),
      ]);

      const feature = new atlas.data.Feature(point, {
        locationId: loc._id,
        name: loc.name,
      });

      dataSourceRef.current.add(feature);
    });
  }, [locations]);

  return (
    <div
      id="mapContainer"
      style={{
        width: "100%",
        height: "calc(100vh - 64px)", // leave space for navbar
      }}
    />
  );
}