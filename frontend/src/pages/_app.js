import { WagmiConfig, createConfig, mainnet, sepolia } from "wagmi";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import Navbar from "../../components/instructionsComponent/navigation/navbar";
import Footer from "../../components/instructionsComponent/navigation/footer";
import '../styles/page.module.css';
import '..//styles/globals.css';


const config = createConfig(
	getDefaultConfig({
		// Required API Keys
		alchemyId: process.env.ALCHEMY_API_KEY, // or infuraId
		walletConnectProjectId: "e73f3ea9eefe3c9014dca96679a204c8",

		// Required
		appName: "You Create Web3 Dapp",

		// Optional
		appDescription: "Your App Description",
		chains: [sepolia],
		appUrl: "https://family.co", // your app's url
		appIcon: "https://family.co/logo.png", // your app's logo,no bigger than 1024x1024px (max. 1MB)
	})
);

export default function App({ Component, pageProps }) {
	return (
		<WagmiConfig config={config}>
			<ConnectKitProvider mode="dark">
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						minHeight: "105vh",
					}}
				>
					<Navbar />
					<Component {...pageProps} />
					<Footer />
				</div>
			</ConnectKitProvider>
		</WagmiConfig>
	);
}
