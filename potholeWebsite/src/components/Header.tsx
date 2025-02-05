import { useEffect, useRef, useState, useCallback } from "react";
import Annotator from "./Annotator";
import { YOLOBox } from "./YOLOBox";

interface HeaderProps {
	getPosition: () => void;
}

const Header = ({ getPosition }: HeaderProps) => {
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [image, setImage] = useState<File | null>(null);
	const [resizedImage, setResizedImage] = useState<string | null>(null);
	const [isAnnotating, setIsAnnotating] = useState(false);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		canvasRef.current = document.createElement("canvas");
	}, []);

	useEffect(() => {
		const handleResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setResizedImage(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleImageUpload = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			if (event.target.files && event.target.files[0]) {
				setImage(event.target.files[0]);
				event.target.value = "";
			}
		},
		[]
	);

	const resizeImageAsync = useCallback((file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onerror = reject;
			reader.onload = (e) => {
				const img = new Image();
				img.onerror = reject;
				img.onload = () => {
					if (!canvasRef.current) {
						return reject(new Error("Canvas not available"));
					}
					const ctx = canvasRef.current.getContext("2d");
					if (!ctx)
						return reject(new Error("2D context not available"));

					const targetWidth = 640;
					const targetHeight = 480;
					canvasRef.current.width = targetWidth;
					canvasRef.current.height = targetHeight;
					ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
					resolve(canvasRef.current.toDataURL("image/jpeg"));
				};
				img.src = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		});
	}, []);

	const getCanvasBlob = useCallback(
		(
			canvas: HTMLCanvasElement,
			type: string,
			quality?: number
		): Promise<Blob | null> => {
			return new Promise((resolve) => {
				canvas.toBlob(resolve, type, quality);
			});
		},
		[]
	);
	
	useEffect(() => {
		if (image) {
			resizeImageAsync(image)
				.then((dataUrl) => {
					setResizedImage(dataUrl);
					setIsAnnotating(true);
				})
				.catch((error) =>
					console.error("Error resizing image:", error)
				);
		}
	}, [image, resizeImageAsync]);


	const handleOnAnnotationComplete = useCallback(
		async (yoloBoxes: YOLOBox[]) => {
			yoloBoxes.forEach((box) => console.log("BOX", box));
			if (!canvasRef.current || !image) return;

			try {
				const blob = await getCanvasBlob(
					canvasRef.current,
					"image/jpeg"
				);
				if (!blob) return;

				const formData = new FormData();
				formData.append("image", blob, image.name);
				formData.append("boxes", JSON.stringify(yoloBoxes));

				const response = await fetch(
					"http://127.0.0.1:5000/upload_image",
					{
						method: "POST",
						body: formData,
						mode: "cors",
					}
				);

				const data = await response.json();
				console.log("Response:", data);
			} catch (error) {
				console.error("Error uploading image:", error);
			}

			setResizedImage(null);
			setImage(null);
			setIsAnnotating(false);
		},
		[getCanvasBlob, image]
	);

	return (
		<>
			<header className="flex justify-between w-full font-semibold text-[#344050] px-4 sm:px-12 pt-5">
				<div className="flex flex-wrap gap-2 items-center justify-center">
					<img src="Logo.svg" alt="Logo" className="w-11" />
					<h1 className="text-2xl sm:text-3xl">AsphaltAlert</h1>
				</div>

				<div className="flex flex-col sm:flex-row gap-5">
					<button
						className="text-white text-[15px] bg-[#344050] rounded-xl p-3"
						onClick={getPosition}>
						{windowWidth < 640
							? "Nearby Holes"
							: "Show Nearby Holes"}
					</button>

					<label className="flex items-center text-[15px] bg-[#D9D9D9] rounded-xl p-3 cursor-pointer">
						{windowWidth < 640 ? "New Hole" : "Add New Hole"}
						<span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 ml-2">
							<span className="text-2xl sm:text-3xl leading-none">
								+
							</span>
						</span>
						<input
							type="file"
							accept="image/png,image/jpg,image/jpeg"
							onChange={handleImageUpload}
							className="hidden"
						/>
					</label>
				</div>
			</header>

			{isAnnotating && resizedImage && (
				<Annotator
					imageUrl={resizedImage}
					onComplete={handleOnAnnotationComplete}
					cancelAnnotation={() => {
						setResizedImage(null);
						setImage(null);
						setIsAnnotating(false);
					}}
				/>
			)}
		</>
	);
};

export default Header;
