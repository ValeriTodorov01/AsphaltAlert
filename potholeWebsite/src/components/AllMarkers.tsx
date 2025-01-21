import { Hole } from "./Hole";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import type { Marker } from "@googlemaps/markerclusterer";

type AllMarkersProps = { points: Hole[], setMarkerRef: (marker: Marker | null, key: string) => void; };

const AllMarkers = ({ points, setMarkerRef }: AllMarkersProps) => {
	return (
		<>
			{points.map((point) => (
				<AdvancedMarker position={point.location} ref={marker => setMarkerRef(marker, point.key)}></AdvancedMarker>
			))}
		</>
	);
};

// export default AllMarkers;
