import type { Marker } from "@googlemaps/markerclusterer";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Hole } from "./Hole";
import { useEffect, useRef } from "react";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

type AllMarkersProps = {
  points: Hole[];
  centerCoords: GeolocationCoordinates | undefined;
};

const AllMarkers = ({ points, centerCoords }: AllMarkersProps) => {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<{ [key: string]: Marker }>({});

  useEffect(() => {
    if (!map || clustererRef.current) return;
    clustererRef.current = new MarkerClusterer({ map });
  }, [map]);

  useEffect(() => {
    if (!clustererRef.current) return;
    clustererRef.current.clearMarkers();
    clustererRef.current.addMarkers(Object.values(markersRef.current));
  }, [points]);

  const setMarkerRef = (marker: Marker | null, key: string) => {
    if (marker) {
      markersRef.current[key] = marker;
    } else {
      delete markersRef.current[key];
    }
  };

  useEffect(() => {
    if (!centerCoords || !map) return;
    map.panTo({ lat: centerCoords.latitude, lng: centerCoords.longitude });
  }, [centerCoords]);

  return (
    <>
      {points.map((point) => (
        <AdvancedMarker
          key={point.key}
          position={point.location}
          ref={(marker) => point.key && setMarkerRef(marker, point.key)}
        />
      ))}
    </>
  );
};

export default AllMarkers;
