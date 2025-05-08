import { formattedDate } from "./constants"

function generateKey(name) {
    return `${name}-${formattedDate}`;
}

export {
    generateKey
}