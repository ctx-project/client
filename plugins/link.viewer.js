export default function Viewer() {
};

Viewer.key = 'link';
Viewer.type = 'contain';
Viewer.empty = true;

Viewer.prototype.desired = function() {
	return [0, 0];
}
