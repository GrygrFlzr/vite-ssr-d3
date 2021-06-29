import express from 'express';
import vite from 'vite';
import { resolve } from 'path';
import { cwd } from 'process';
import { readFile } from 'fs/promises';
import fetch from 'node-fetch';

async function server() {
	const app = express();

	/** @type {vite.ViteDevServer} */
	const viteInstance = await vite.createServer({
		plugins: [],
		server: { middlewareMode: true }
	});

	app.use(viteInstance.middlewares);

	app.use('*', async (req, res) => {
		const url = req.originalUrl;

		try {
			let template = await readFile(resolve(cwd(), 'index.html'), 'utf-8');
			template = await viteInstance.transformIndexHtml(url, template);
			const { default: app } = await viteInstance.ssrLoadModule('/src/app.js');
			const html = template.replace('<!--ssr-outlet-->', await app());
			res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
		} catch (e) {
			viteInstance.ssrFixStacktrace(e);
			console.error(e);
			res.status(500).end(e.message);
		}

		process.exit();
	});

	app.listen(3000);
}

server().then(() => {
	fetch('http://localhost:3000/')
});


