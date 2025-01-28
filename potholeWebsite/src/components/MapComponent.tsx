"use client";

import { useState, useEffect, useRef } from "react";
import { MapEvent } from "@vis.gl/react-google-maps";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import AllMarkers from "./AllMarkers";
import { Hole } from "./Hole";

const center = { lat: 42.699855, lng: 23.311125 };

const MapComponent = () => {
	const [locations, setLocations] = useState<Hole[]>([]);
	const [boundaries, setBoundaries] = useState<google.maps.LatLngBoundsLiteral>();
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

				const response = await fetch(`http://127.0.0.1:5000/potholes?${queryParams}`, {
					method: "GET",
					mode: "cors"
				});
				if (!response.ok) {
					throw new Error(`Failed to fetch: ${response.statusText}`);
				}
				const data = await response.json();
				if (!Array.isArray(data)) {
					throw new Error("Unexpected response format");
				}
		
				const transformedData: Hole[] = data.map(
					(hole: any, index: number) => ({
						key: index.toString(),
						location: { lat: hole.latitude, lng: hole.longitude },
						severity: hole.severity,
						description: hole.severity + " severity pothole",
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
				className={`flex border-2 border-black h-[80%] w-[90%] mt-8 sm:mt-12`}>
				<Map
					defaultCenter={center}
					defaultZoom={17}
					gestureHandling={"greedy"}
					disableDefaultUI={false}
					mapId={import.meta.env.VITE_MAP_ID}
					onIdle={handleIdle}
					>
					<AllMarkers points={locations}/>
				</Map>
			</div>
		</APIProvider>
	);
};

export default MapComponent;
