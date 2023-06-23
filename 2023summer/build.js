import url from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import canvas from '@napi-rs/canvas';
import * as core from '@actions/core';

const POSTER_URL = 'https://esperecyan.github.io/vcas-calendar-poster/v4.png';
const POSTER_OUTPUT_HEIGHT = 630;

const dirname = path.dirname(url.fileURLToPath(import.meta.url));
const rootPath = path.join(dirname, '../');
const pagesFolderPath = path.join(rootPath, '_site/2023summer/');
const cacheDataFolderPath = path.join(rootPath, 'cache/2023summer/');
const cachePosterHashPath = path.join(cacheDataFolderPath, 'posterHash.txt');

let cachePosterHash;
try {
	cachePosterHash = await fs.readFile(cachePosterHashPath, { encoding: 'utf-8' });
} catch (exception) {
	// ファイルが存在しない場合
}

const poster = await (await fetch(POSTER_URL)).arrayBuffer();

const hash = crypto.createHash('md5');
hash.update(Buffer.from(poster));
const posterHash = hash.digest('hex');

const updated = !cachePosterHash || cachePosterHash !== posterHash;
if (updated) {
	const videoImage = await canvas.loadImage(path.join(dirname, './VirtualCast-72f-x8f-17.000000s.png'));

	const c = canvas.createCanvas(videoImage.naturalWidth, videoImage.naturalHeight);
	const context = c.getContext('2d');

	context.save();
	context.rotate(- Math.PI * 0.5);
	context.translate(- c.width, 0);
	context.drawImage(await canvas.loadImage(poster), 0, 0, POSTER_OUTPUT_HEIGHT, c.height);
	context.restore();

	context.drawImage(videoImage, 0, 0);

	try {
		await fs.mkdir(pagesFolderPath, { recursive: true });
	} catch (exception) {
		// ローカルデバッグで、すでにフォルダが存在する場合
	}
	await fs.writeFile(path.join(pagesFolderPath, 'video-and-poster.png'), c.toBuffer('image/png'));

	try {
		await fs.mkdir(cacheDataFolderPath, { recursive: true });
	} catch (exception) {
		// すでにフォルダが存在する場合
	}
	await fs.writeFile(cachePosterHashPath, posterHash);
}

core.setOutput('updated', updated);
