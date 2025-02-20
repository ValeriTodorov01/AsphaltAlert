import { useEffect, useRef, useState } from "react";
import { YOLOBox } from "./YOLOBox";

interface AnnotatorProps {
	imageUrl: string;
	onComplete: (yoloBoxes: YOLOBox[]) => void;
	cancelAnnotation: () => void;
}

const Annotator = ({
	imageUrl,
	onComplete,
	cancelAnnotation,
}: AnnotatorProps) => {
	const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
		null
	);
	const [endPos, setEndPos] = useState<{ x: number; y: number } | null>(null);
	const [isDrawing, setIsDrawing] = useState<boolean>(false);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
	const yoloBoxes = useRef<YOLOBox[]>([]);
	const [imgSize, setImgSize] = useState<{ width: number; height: number }>({
		width: 640,
		height: 480,
	});

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			ctxRef.current = canvas.getContext("2d");
			if (ctxRef.current) {
				ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
			}

			const touchMoveHandler = (e: TouchEvent) => {
				e.preventDefault();
			};
			canvas.addEventListener("touchmove", touchMoveHandler, {
				passive: false,
			});
			return () => {
				canvas.removeEventListener("touchmove", touchMoveHandler);
			};
		}
	}, []);

	useEffect(() => {
		document.body.style.overflow = "hidden";
		document.documentElement.style.overflow = "hidden";

		const preventScroll = (event: Event) => event.preventDefault();
		window.addEventListener("wheel", preventScroll, { passive: false });
		window.addEventListener("touchmove", preventScroll, { passive: false });

		return () => {
			document.body.style.overflow = "";
			document.documentElement.style.overflow = "";
			window.removeEventListener("wheel", preventScroll);
			window.removeEventListener("touchmove", preventScroll);
		};
	}, []);

	const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
		if (!canvasRef.current) return { x: 0, y: 0 };

		const rect = canvasRef.current.getBoundingClientRect();
		let x = 0;
		let y = 0;

		if ("touches" in event) {
			x = event.touches[0].clientX - rect.left;
			y = event.touches[0].clientY - rect.top;
		} else {
			x = event.clientX - rect.left;
			y = event.clientY - rect.top;
		}

		x = Math.max(0, Math.min(x, rect.width));
		y = Math.max(0, Math.min(y, rect.height));

		return { x, y };
	};

	const handleStart = (event: React.MouseEvent | React.TouchEvent) => {
		if (!canvasRef.current) return;

		setIsDrawing(true);
		const { x, y } = getCoordinates(event);
		setStartPos({ x, y });
	};

	const handleMove = (event: React.MouseEvent | React.TouchEvent) => {
		if (!isDrawing || !canvasRef.current || !startPos) return;

		const { x, y } = getCoordinates(event);
		setEndPos({ x, y });

		const ctx = ctxRef.current;
		if (ctx) {
			ctx.clearRect(
				0,
				0,
				canvasRef.current.width,
				canvasRef.current.height
			);
			ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
			ctx.fillRect(
				startPos.x,
				startPos.y,
				x - startPos.x,
				y - startPos.y
			);
		}
	};

	const handleEnd = () => {
		setIsDrawing(false);
		if (startPos && endPos) {
			const x = Math.min(startPos.x, endPos.x);
			const y = Math.min(startPos.y, endPos.y);
			const width = Math.abs(startPos.x - endPos.x);
			const height = Math.abs(startPos.y - endPos.y);

			if (canvasRef.current) {
				const scaleX = 640 / canvasRef.current.width;
				const scaleY = 480 / canvasRef.current.height;

				const yoloBox: YOLOBox = {
					class: 0,
					x_center: (x + width / 2) * scaleX,
					y_center: (y + height / 2) * scaleY,
					w: width * scaleX,
					h: height * scaleY,
				};

				yoloBoxes.current[0] = yoloBox;
			}
		}
	};

	const handleResetBoxes = () => {
		const ctx = ctxRef.current;
		if (ctx && canvasRef.current) {
			ctx.clearRect(
				0,
				0,
				canvasRef.current.width,
				canvasRef.current.height
			);
		}
		setStartPos({ x: 0, y: 0 });
		setEndPos({ x: 0, y: 0 });
	};

	return (
		<div className="flex flex-col justify-center items-center  absolute w-full h-full bg-gray-700 bg-opacity-80 gap-5 z-10">
			<div className="flex gap-4 top-0 mt-2 xl:mt-1">
				<button
					className="border border-black py-3 px-5 rounded-md bg-white text-lg lg:hover:bg-stone-600 lg:hover:text-white transition duration-200"
					onClick={() => onComplete(yoloBoxes.current)}>
					Submit
				</button>
				<button
					className="border border-black py-3 px-5 rounded-md bg-white text-lg lg:hover:bg-stone-600 lg:hover:text-white transition duration-200 focus:outline-none"
					onClick={handleResetBoxes}
					onTouchEnd={(e) => e.currentTarget.blur()}>
					Reset
				</button>
				<button
					className="border border-black py-3 px-5 rounded-md bg-white text-lg lg:hover:bg-red-600 lg:hover:text-white transition duration-200"
					onClick={cancelAnnotation}>
					Cancel
				</button>
			</div>

			<div className="">
				<canvas
					ref={canvasRef}
					width={imgSize.width}
					height={imgSize.height}
					className="absolute z-20"
					onMouseDown={handleStart}
					onMouseMove={handleMove}
					onMouseUp={handleEnd}
					onTouchStart={handleStart}
					onTouchMove={handleMove}
					onTouchEnd={handleEnd}
					style={{ userSelect: "none" }}></canvas>
				<img
					src={imageUrl}
					alt="Annotatable"
					draggable={false}
					className="z-10"
					onLoad={(event) => {
						const img = event.target as HTMLImageElement;
						setImgSize({
							width: img.width,
							height: img.height,
						});
					}}
				/>
			</div>
		</div>
	);
};

export default Annotator;
