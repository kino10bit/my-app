// 空のモジュール - Node.js専用モジュールの代替
// すべての可能な呼び出し方法に対応
const empty = {};

// CommonJS
module.exports = empty;
module.exports.default = empty;

// ES6 exports
export default empty;

// Function として呼び出される場合
module.exports = function() { return empty; };
module.exports.default = function() { return empty; };