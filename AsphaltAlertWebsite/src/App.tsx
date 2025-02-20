import Header from "./components/Header";
import Footer from "./components/Footer";
import MapComponent from "./components/MapComponent";
import { useGeolocated } from "react-geolocated";

function App() {
	const { coords, getPosition } = useGeolocated({
		positionOptions: {
			enableHighAccuracy: false,
		},
		userDecisionTimeout: 8000,
	});

	return (
		<div className="bg-[#f9f9f9]">
			<div className="flex items-center flex-col h-svh">
				<Header getPosition={getPosition} />
				<MapComponent centerCoords={coords} />
			</div>
			<Footer />
		</div>
	);
}

export default App;
