/*
 * @author Mattatz - Masatatsu Nakamura http://mattatz.org
 * */

(function(global, three) {

    three.BufferGeometry.prototype.toGeometry = function() {
        if(this.getAttribute('position') === undefined) {
            throw new Error('a given BufferGeometry object must have a position attribute.');
        }

        var positions = this.getAttribute('position').array;

        var vertices = [];

        for(var i = 0, n = positions.length; i < n; i += 3) {
            var x = positions[i];
            var y = positions[i + 1];
            var z = positions[i + 2];
            vertices.push(new THREE.Vector3(x, y, z));
        }

        var faces = [];

        for(var i = 0, n = vertices.length; i < n; i += 3) {
            faces.push(new THREE.Face3(i, i + 1, i + 2));
        }

        var uvs = [];
        if(this.getAttribute('uv') !== undefined) {
            var uvAttr = this.getAttribute('uv').array;
            for(var i = 0, n = uvAttr.length; i < n; i += 6) {
                uvs.push([
                    new THREE.Vector2(uvAttr[i + 0], uvAttr[i + 1]),
                    new THREE.Vector2(uvAttr[i + 2], uvAttr[i + 3]),
                    new THREE.Vector2(uvAttr[i + 4], uvAttr[i + 5]),
                ]);
            }
        }

        var geometry = new THREE.Geometry();
        geometry.vertices = vertices;
        geometry.faces = faces;
        geometry.faceVertexUvs[0] = uvs;
        geometry.computeFaceNormals();
        return geometry;
    };

})(window, THREE)

