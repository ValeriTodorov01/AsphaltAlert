const Footer = () => {
	return (
		<footer className="font-semibold text-[#344050] mt-12 mb-20 px-14">
			<div className="flex gap-2 items-center mb-4">
				<img src="Logo.svg" alt="Logo" className="w-11" />
				<h1 className="text-3xl">AsphaltAlert</h1>
			</div>

			<div className="flex flex-wrap md:flex-nowrap justify-between">
				<p className="flex text-[20px]">
					Discover and report potholes in your area with our
					interactive map.
				</p>
				<div className="flex flex-wrap md:flex-nowrap mt-12 md:mt-0 gap-16 lg:gap-20">
					<div className="flex-col min-w-[185px]">
						<div className="flex items-center gap-2 mb-2">
							<div className="bg-[#344050] w-1 h-12"></div>
							<h2 className="text-xl">Контакти</h2>
						</div>
						<p>Тел: 0884795211</p>
						<p>Email: valerytodorov5@gmail.com</p>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
