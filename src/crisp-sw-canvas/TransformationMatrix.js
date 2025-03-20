class TransformationMatrix {
    constructor() {
        this.elements = new Float64Array([
            1, 0, 0, // first column
            0, 1, 0, // second column
            0, 0, 1 // third column
        ]);
    }

    clone() {
        const clonedMatrix = new TransformationMatrix();
        clonedMatrix.elements.set(this.elements);
        return clonedMatrix;
    }
    
    /**
     * Resets the transformation matrix to the identity matrix
     * @returns {TransformationMatrix} The identity matrix
     */
    reset() {
        this.elements.set([
            1, 0, 0, // first column
            0, 1, 0, // second column
            0, 0, 1 // third column
        ]);
        return this;
    }

    get(row, col) {
        return this.elements[col * 3 + row];
    }

    set(row, col, value) {
        this.elements[col * 3 + row] = value;
    }

    multiply(other) {
        const result = new TransformationMatrix();
        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                let sum = 0;
                for (let i = 0; i < 3; i++) {
                    sum += this.get(row, i) * other.get(i, col);
                }
                result.set(row, col, sum);
            }
        }
        return result;
    }

    translate(x, y) {
        const translationMatrix = new TransformationMatrix();
        translationMatrix.elements.set([
            1, 0, 0,
            0, 1, 0,
            x, y, 1
        ]);
        return this.multiply(translationMatrix);
    }

    scale(sx, sy) {
        const scaleMatrix = new TransformationMatrix();
        scaleMatrix.elements.set([
            sx, 0, 0,
            0, sy, 0,
            0, 0, 1
        ]);
        return this.multiply(scaleMatrix);
    }

    rotate(angleInRadians) {
        const rotationMatrix = new TransformationMatrix();
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);
        rotationMatrix.elements.set([
            cos, sin, 0,
            -sin, cos, 0,
            0, 0, 1
        ]);
        return this.multiply(rotationMatrix);
    }
}
