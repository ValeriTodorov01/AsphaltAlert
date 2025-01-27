import type { Marker } from "@googlemaps/markerclusterer";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { Hole } from "./Hole";
import { useEffect, useRef, useState } from "react";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

type AllMarkersProps = { points: Hole[] };

const AllMarkers = ({ points }: AllMarkersProps) => {
	const map = useMap();
	const [markers, setMarkers] = useState<{ [key: string]: Marker }>({});
	const clusterer = useRef<MarkerClusterer | null>(null);

	useEffect(() => {
		if (!map) return;
		if (!clusterer.current) {
			clusterer.current = new MarkerClusterer({ map });
		}
	}, [map]);

	useEffect(() => {
		if (!clusterer.current) return;
		clusterer.current.clearMarkers();
		clusterer.current.addMarkers(Object.values(markers));
	}, [markers]);

	const setMarkerRef = (marker: Marker | null, key: string) => {
		if (marker && markers[key]) return;
		if (!marker && !markers[key]) return;

		setMarkers((prev) => {
			if (marker) {
				return { ...prev, [key]: marker };
			} else {
				const newMarkers = { ...prev };
				delete newMarkers[key];
				return newMarkers;
			}
		});
	};
	return (
		<>
			{points.map((point) => (
				<AdvancedMarker
					position={point.location}
					key={point.key}
					ref={(marker) =>
						setMarkerRef(marker, point.key)
					}></AdvancedMarker>
			))}
		</>
	);
};

export default AllMarkers;
