export function CreateEnum(_arr) {
    let obj = {};
    for (let val of _arr) {
        obj[val] = Symbol(val);
    }
    return Object.freeze(obj);
}