import * as THREE from '../node_modules/three/build/three.module.js';

export class Pipe {

    constructor() {

        // Constants
        this.zStart = 5;
        this.segmentCount = 30;

        // Z-Scroll
        this.zOffset = 0;
        this.scrollSpeed = 5;
        this.curveFactor = new THREE.Vector2(2, 0);

        // Polygon Sides
        this.sides = 0;
        this.segmentGeometrySample = null;
        this.geometryBuffer = [];
        this.SetSides(6);

        // Angle
        this.angle = 0;
        this.angleSpeed = 0;
        this.segmentAngleOffset = 5;

        // Tunnel Material
        this.hue = 0;
        this.hueShift = 120;
        this.material = new THREE.LineBasicMaterial();
        let c = new THREE.Color();
        c.setHSL(this.hue / 360.0, 1, 0.5);
        this.material.color = c;

        this.starMaterial = new THREE.LineBasicMaterial(0xffffff);

        // Entity Geometries
        this.playerGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -0.5),
            new THREE.Vector3(0.5, 0, 0.5),
            new THREE.Vector3(0, 0, 0.25),
            new THREE.Vector3(-0.5, 0, 0.5),
            new THREE.Vector3(0, 0, -0.5)
        ]);
        this.playerGeometry.scale(0.25, 0.25, 0.25);

        this.starGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0.5, 0),
            new THREE.Vector3(0.1, 0.1, 0),
            new THREE.Vector3(0.5, 0, 0),
            new THREE.Vector3(0.1, -0.1, 0),
            new THREE.Vector3(0, -0.5, 0),
            new THREE.Vector3(-0.1, -0.1),
            new THREE.Vector3(-0.5, 0, 0),
            new THREE.Vector3(-0.1, 0.1, 0),
            new THREE.Vector3(0, 0.5, 0)
        ]);
        this.starGeometry.scale(0.5, 0.5, 0.5);

        this.coinGeometries = [3];
        for (let i = 0; i < 3; i++) {
            let points = [];
            let sides = 8 - i;
            for (let j = 0; j <= sides; j++) {
                let a = j * (360.0 / sides) * Math.PI / 180;
                points.push(new THREE.Vector3(Math.sin(a), Math.cos(a), 0));
            }
            this.coinGeometries[i] = new THREE.BufferGeometry().setFromPoints(points);
            this.coinGeometries[i].scale(0.15, 0.15, 0.15);
        }

    }

    SetSides(_sides) {
        if (this.segmentGeometrySample != null) { this.segmentGeometrySample.dispose(); }
        this.sides = _sides;
        const points = [];
        for (let i = 0; i <= this.sides; i++) {
            let a = i * (360.0 / this.sides) * Math.PI / 180;
            let p = new THREE.Vector3(Math.sin(a), Math.cos(a), 0);
            points.push(p);
        }
        this.segmentGeometrySample = new THREE.BufferGeometry().setFromPoints(points);
        for (let i = 0; i < this.geometryBuffer.length; i++) { this.geometryBuffer[i].dispose(); }
        this.geometryBuffer.length = this.segmentCount + this.sides;
        for (let i = 0; i < this.geometryBuffer.length; i++) { this.geometryBuffer[i] = new THREE.BufferGeometry(); }
    }

    GetScrollSpeed() { return this.scrollSpeed; }

    GetCenterPivot(_z) { return new THREE.Vector3(Math.pow(-(this.zStart - _z), 2) * 0.01 * this.curveFactor.x, Math.pow(-(this.zStart - _z), 2) * 0.01 * this.curveFactor.y, _z); }

    GetSurfacePos(_angle, _radius, _z) {
        let a = _angle * Math.PI / 180;
        let p = new THREE.Vector3(_radius * Math.sin(a), _radius * -Math.cos(a), 0);
        p.add(this.GetCenterPivot(_z));
        return p;
    }

    GetAngleOffset(_z) { return this.angle + this.segmentAngleOffset * (5 - _z); }

    UpdatePipe(_dt) {
        // Update Scroll
        this.zOffset += this.scrollSpeed * _dt;
        while (this.zOffset >= 1) { this.zOffset -= 1; }

        // Update Angle
        this.angle += this.angleSpeed * _dt;
        while (this.angle >= 360) { this.angle -= 360; }

        // Update Color Hue
        this.hue += this.hueShift * _dt;
        while (this.hue >= 360) { this.hue -= 360; }
        let c = new THREE.Color();
        c.setHSL(this.hue / 360.0, 1, 0.5);
        this.material.color = c;
    }

    DrawPipe(_DrawLineFunc) {
        const pivots = [];
        const angleOffsets = [];
        const points = [];
        for (let i = 0; i < this.segmentCount; i++) {
            const zCoord = this.zStart - (i - this.zOffset);
            const pivot = this.GetCenterPivot(zCoord);
            pivots.push(pivot);
            const angleOffset = this.segmentAngleOffset * (i - this.zOffset) + this.angle;
            angleOffsets.push(angleOffset);
            const segmentPoints = [];
            for (let j = 0; j < this.sides; j++) {
                const a = (j * (360.0 / this.sides) - angleOffset) * Math.PI / 180;
                const p = new THREE.Vector3(Math.sin(a), Math.cos(a), 0);
                p.add(pivot);
                segmentPoints.push(p);
            }
            points.push(segmentPoints);
        }
        // Reset Geometry Buffer
        this.geometryBuffer.length = this.segmentCount + this.sides;
        // Draw Segments
        for (let i = 0; i < this.segmentCount; i++) {
            // Create Line
            _DrawLineFunc(pivots[i], angleOffsets[i], new THREE.Vector3(1, 1, 1), this.segmentGeometrySample, this.material);
        }
        // Draw Edges
        for (let i = 0; i < this.sides; i++) {
            const edgePoints = [];
            for (let j = 0; j < this.segmentCount; j++) { edgePoints.push(points[j][i]); }
            this.geometryBuffer[this.segmentCount + i].dispose();
            this.geometryBuffer[this.segmentCount + i].setFromPoints(edgePoints);
            _DrawLineFunc(new THREE.Vector3(0, 0, 0), 0, new THREE.Vector3(1, 1, 1), this.geometryBuffer[this.segmentCount + i], this.material);
        }
    }

    DrawStar(_angle, _z, _DrawLineFunc) {
        let a = _angle + this.GetAngleOffset(_z);
        for (let i = 0; i < 2; i++) {
            let p = this.GetSurfacePos(a, 0.75, _z);
            let scale = 1 - 0.5 * i;
            _DrawLineFunc(p, a, new THREE.Vector3(scale, scale, scale), this.starGeometry, this.starMaterial);
        }
    }

    DrawCoin(_angle, _z, _DrawLineFunc) {
        let a = _angle + this.GetAngleOffset(_z);
        for (let i = 0; i < 3; i++) {
            let p = this.GetSurfacePos(a, 0.75, _z);
            let scale = 1 - 0.25 * i;
            _DrawLineFunc(p, a, new THREE.Vector3(scale, scale, scale), this.coinGeometries[i], this.starMaterial);
        }
    }

    DrawPlayer(_angle, _z, _DrawLineFunc) {
        let a = _angle + this.GetAngleOffset(_z);
        let scale = 1;
        for (let i = 0; i < 3; i++) {
            let p = this.GetSurfacePos(a, 0.75, _z);
            _DrawLineFunc(p, a, new THREE.Vector3(scale, scale, scale), this.playerGeometry, this.starMaterial);
            scale *= 0.75;
        }
    }

}