import React, { useState } from "react";
import { Severity } from "./PoiMarkers";

interface AddHolePopupProps {
	acceptNewHoleFunc: (
		latitude: number,
		longitude: number,
		severity: Severity,
		description: string
	) => void;
	latlng: { lat: number; lng: number };
	onClose: () => void;
}

const NewHolePopup: React.FC<AddHolePopupProps> = ({
	acceptNewHoleFunc,
	latlng,
	onClose,
}) => {
	const [severity, setSeverity] = useState<Severity>(Severity.Low);
	const [description, setDescription] = useState("");

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="fixed inset-0 bg-black opacity-50"></div>
			<div className="relative p-4 bg-white border border-black rounded-lg shadow-md z-10">
				<h3 className="text-base sm:text-lg font-semibold mb-2">
					Add New Hole
				</h3>

				<label className="block mb-2">
					<span className="font-medium">Severity:</span>
					<select
						value={severity}
						onChange={(e) =>
							setSeverity(Number(e.target.value) as Severity)
						}
						className="block w-full mt-1 border rounded p-2">
						<option value={Severity.Low}>Low</option>
						<option value={Severity.Medium}>Medium</option>
						<option value={Severity.High}>High</option>
					</select>
				</label>

				<label className="block mb-2">
					<span className="font-medium">Description:</span>
					<input
						type="text"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						className="w-full mt-1 border rounded p-2"
					/>
				</label>

				<div className="flex justify-between mt-4">
					<button
						onClick={() => {
							acceptNewHoleFunc(
								latlng.lat,
								latlng.lng,
								severity,
								description
							);
							onClose();
						}}
						className="px-4 py-2 bg-[#344050] text-white rounded hover:bg-[#3a4859]">
						Add
					</button>
					<button
						onClick={onClose}
						className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
						Cancel
					</button>
				</div>
			</div>
		</div>
	);
};

export default NewHolePopup;
