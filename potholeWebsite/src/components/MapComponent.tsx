"use client";

import { useState, useEffect } from "react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import AllMarkers from "./AllMarkers";
import { Hole } from "./Hole";

const center = { lat: 42.699855, lng: 23.311125 };

const MapComponent = () => {
	const [locations, setLocations] = useState<Hole[]>([]);

	useEffect(() => {
		const fetchHoles = async () => {
			console.log("Fetching potholes...");
			try {
				const response = await fetch("http://127.0.0.1:5000/potholes");
				if (!response.ok) {
					throw new Error("Failed to fetch potholes data");
				}
				const data = await response.json();
				console.log("Fetched potholes data:", data);

				const transformedData: Hole[] = data.map(
					(hole: any, index: number) => ({
						key: `${hole.latitude}-${hole.longitude}-${index}`,
						location: { lat: hole.latitude, lng: hole.longitude },
						severity: hole.severity,
						description: hole.severity + " severity pothole",
					})
				);

				setLocations(transformedData);
				console.log("Fetched potholes:", transformedData);
			} catch (error) {
				console.error("Error fetching potholes:", error);
			}
		};

		fetchHoles();
	}, []);

	return (
		<APIProvider apiKey={import.meta.env.VITE_MAP_API_KEY}>
			<div
				className={`flex border-2 border-black h-[80%] w-[90%] mt-8 sm:mt-12`}>
				<Map
					defaultCenter={center}
					defaultZoom={10}
					gestureHandling={"greedy"}
					disableDefaultUI={false}
					mapId={import.meta.env.VITE_MAP_ID}>
					<AllMarkers points={locations} />
				</Map>
			</div>
		</APIProvider>
	);
};

export default MapComponent;
