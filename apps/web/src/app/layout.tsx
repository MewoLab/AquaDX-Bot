import { Footer } from '@clansty/maibot-components';
import type { Metadata } from 'next';
import { Quicksand, Noto_Sans_SC, Reddit_Mono, Kosugi_Maru } from 'next/font/google';
import React from 'react';
import './global.css';

const quicksand = Quicksand({ subsets: ['latin'] });
const notoSansSC = Noto_Sans_SC({ subsets: ['latin'] });
const redditMono = Reddit_Mono({
	subsets: ['latin'],
	variable: '--font-reddit-mono',
	display: 'swap'
});

export const metadata: Metadata = {
	title: 'Maibot Web',
	description: 'qwq'
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
		<body className={redditMono.variable}
			style={{
				padding: 0, margin: 0,
				background: '#51bcf3',
				fontFamily: `${quicksand.style.fontFamily}, ${notoSansSC.style.fontFamily}`
			}}>
		<div style={{ minHeight: 'calc(100vh - 154px)' }}>
			{children}
		</div>
		<Footer />
		</body>
		</html>
	);
}
