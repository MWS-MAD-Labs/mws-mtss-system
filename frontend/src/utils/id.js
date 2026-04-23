export const normalizeId = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number' || typeof value === 'bigint') {
        return String(value);
    }

    if (typeof value === 'object') {
        if (value._id) {
            return normalizeId(value._id);
        }
        if (value.id) {
            return normalizeId(value.id);
        }
        if (value.$oid) {
            return String(value.$oid);
        }
        if (typeof value.toHexString === 'function') {
            return value.toHexString();
        }
        if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
            return value.toString();
        }
    }

    return '';
};
