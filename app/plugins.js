import LinkViewer from '../plugins/link.viewer.js'
import RawViewer from '../plugins/raw.viewer.js'

var viewers = [LinkViewer, RawViewer],
		viewersDict = viewers.reduce((o, v) => { o[v.key] = v; return o; }, {});

export function sniffViewers (records) {
	return viewers.length ? 
						viewers.map(v => ({v, r: v.sniff ? v.sniff(records) : 0})).reduce((a, b) => a.r > b.r ? a : b).v :
						emptyViewer;
}

export function getViewer(key) {
	return viewersDict[key];
}

function emptyViewer() {};
