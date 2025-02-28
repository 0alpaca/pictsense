const penSize;
// ペンの太さ 1~30
const color;
// 色 0~FFFFFF を10進数にした数
const transparency;
// 透明度 0~1 小数点第十六
const strokeXY = [];
// 描画のXとY

let i = io.connect(Object.keys(io.sockets).slice(0,24));
i.emit('stroke send', penSize, color, transparency, strokeXY)
