let penSize;
// 0~30の整数
let color;
// 0~FFFFFFのカラーコードを10進数にした整数
let strokeXY = [];
// 描画するXYの配列

let i = io.connect(Object.keys(io.sockets).slice(0,24));
// 描画を送信するwss

i.emit('stroke send', penSize, color, 1, strokeXY);
// 描画の送信
