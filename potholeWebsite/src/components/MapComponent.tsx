"use client";

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import AllMarkers from "./AllMarkers"
import { Hole } from "./Hole";

const center = { lat: 42.699855, lng: 23.311125 };

const defaultLocations: Hole[] = [
	{
		key: "2024-10-23T13:53:11.604Z",
		location: { lat: 42.699855, lng: 23.311125 },
		severity: "Low",
		description: "Small pothole on the road",
	},
	{
		key: "2024-10-23T13:54:11.604Z",
		location: { lat: 42.701855, lng: 23.313125 },
		severity: "Low",
		description: "Large pothole causing traffic issues",
	},
	{
		key: "2024-10-23T13:55:11.604Z",
		location: { lat: 42.697855, lng: 23.309125 },
		severity: "Low",
		description: "Minor cracks and holes",
	},
	{
		key: "2024-10-23T13:56:11.604Z",
		location: { lat: 42.699355, lng: 23.314125 },
		severity: "Low",
		description: "Small pothole near the sidewalk",
	},
	{
		key: "2024-10-23T13:57:11.604Z",
		location: { lat: 42.702355, lng: 23.312625 },
		severity: "Low",
		description: "Minor pothole on the main road",
	},
];

const MapComponent = () => {
	return (
		<APIProvider apiKey={import.meta.env.VITE_MAP_API_KEY}>
			<div
				className={`flex border-2 border-black ${
					// modeAddHole
					//   ? "fixed top-0 left-0 z-20 h-dvh w-dvw"
					//   :
					"h-[80%] w-[90%] mt-8 sm:mt-12"
				}`}>
				<Map
					defaultCenter={center}
					defaultZoom={10}
					gestureHandling={"greedy"}
					disableDefaultUI={false}
					mapId={import.meta.env.VITE_MAP_ID}>
					<AllMarkers points={defaultLocations} />
				</Map>
			</div>
		</APIProvider>
	);
};



export default MapComponent;
