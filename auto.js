let penSize;
// 0~30の整数
let color;
// 0~FFFFFFのカラーコードを10進数にした整数
let xX;
// 0~320のX座標
let yY;
// 0~320のY座標

let i = io.connect(Object.keys(io.sockets).slice(0,24));
// 描画を送信するwss

i.emit('stroke send', penSize, color, 1, [[xX,yY],[xX,yY]]);
// 描画の送信
