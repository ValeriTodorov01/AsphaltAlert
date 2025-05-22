"use client";

import { useState, useEffect, useRef } from "react";
import { MapEvent } from "@vis.gl/react-google-maps";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import AllMarkers from "./AllMarkers";
import { Hole } from "./Hole";

interface MapComponentProps {
	centerCoords: GeolocationCoordinates | undefined;
}

//Sofia center coordinates
const defaultCoords = { lat: 42.684928, lng: 23.316489 };

const MapComponent = ({ centerCoords }: MapComponentProps) => {
	const [locations, setLocations] = useState<Hole[]>([]);
	const [boundaries, setBoundaries] =
		useState<google.maps.LatLngBoundsLiteral>();
	const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

	const handleIdle = (event: MapEvent) => {
		const bounds = event.map.getBounds();
		if (bounds) {
			if (debounceTimeout.current) {
				clearTimeout(debounceTimeout.current);
			}

			debounceTimeout.current = setTimeout(() => {
				setBoundaries(bounds.toJSON());
			}, 500);
		}
	};

	useEffect(() => {
		const fetchHoles = async () => {
			if (!boundaries) {
				return;
			}
			try {
				const queryParams = new URLSearchParams({
					north: boundaries.north.toString(),
					south: boundaries.south.toString(),
					east: boundaries.east.toString(),
					west: boundaries.west.toString(),
				}).toString();

				const response = await fetch(
					`${
						import.meta.env.VITE_BACKEND_URL
					}/dangers?${queryParams}`,
					{
						method: "GET",
						mode: "cors",
					}
				);
				if (!response.ok) {
					throw new Error(`Failed to fetch: ${response.statusText}`);
				}
				const data = await response.json();
				if (!Array.isArray(data)) {
					throw new Error("Unexpected response format");
				}

				const transformedData: Hole[] = data.map(
					(
						hole: {
							latitude: number;
							longitude: number;
							severity: number;
						},
						index: number
					) => ({
						key: index.toString(),
						location: { lat: hole.latitude, lng: hole.longitude },
						severity: hole.severity.toString(),
					})
				);

				setLocations(transformedData);
			} catch (error) {
				throw new Error(`Failed to fetch: ${error}`);
			}
		};

		fetchHoles();
	}, [boundaries]);

	return (
		<APIProvider apiKey={import.meta.env.VITE_MAP_API_KEY}>
			<div
				className={`flex border-2 border-black h-[80%] w-[90%] mt-8 sm:mt-12 mb-2`}>
				<Map
					defaultCenter={
						centerCoords
							? {
									lat: centerCoords.latitude,
									lng: centerCoords.longitude,
							  }
							: defaultCoords
					}
					defaultZoom={17}
					gestureHandling={"cooperative"}
					disableDefaultUI={false}
					mapId={import.meta.env.VITE_MAP_ID}
					onIdle={handleIdle}>
					<AllMarkers
						points={locations}
						centerCoords={centerCoords}
					/>
				</Map>
			</div>
		</APIProvider>
	);
};

export default MapComponent;
