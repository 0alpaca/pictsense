// ==UserScript==
// @name         ピクトセンス 自動描画　ツール
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  try to take over the world!
// @author       あるぱか
// @match        https://pictsense.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pictsense.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // コンソールログ復活

    var consoleLogRevival = document.body.appendChild(document.createElement('iframe'));
    consoleLogRevival.style.display = 'none';
    window.console = consoleLogRevival.contentWindow.console;


    // 設定メニューのベース

	const toolSettingMenu = document.createElement("div");
    toolSettingMenu.id = "SettingMenus";
	toolSettingMenu.style.background = "#e0e0e080";
	toolSettingMenu.style.height = "660px";
	toolSettingMenu.style.width = "0";
	toolSettingMenu.style.position = "fixed";
	toolSettingMenu.style.top = "0";
	toolSettingMenu.style.left = "0";
    toolSettingMenu.style.userSelect = "none";
	toolSettingMenu.style.paddingTop = "50px";
	toolSettingMenu.style.transition = ".05s";
	toolSettingMenu.style.filter = "drop-shadow(2px 0px 3px #ccc)";
	document.getElementById("base").appendChild(toolSettingMenu);



    // 設定メニューの要素

    toolSettingMenu.innerHTML =
        '<span><button id="toolSettingMenuButton" style="width: 0; border-radius: 0 10px 10px 0; transition: .05s">▶︎</button></span>'+
        '<div style="display: none";>'+
        '<div>'+
        '<label for="imageInput"><div><input id="imageInput" type="text"></div></label>'+
        '<label for="autoInput"><div><input id="autoInput" type="button" value="描画"></div></label>'+
        '</div>'+
        '</div>'+


        // スタイルを作成 (CSS)

        '<style>'+


        // 設定メニューのdiv

        '#SettingMenus div div:has(label) {'+
        'margin: 0 auto;'+
        'text-align: left;'+
        'width: 250px;'+
        'font-size: 17px;'+
        'padding: 20px 20px 0;'+
        'margin-top: 20px;'+
        'border-radius: 10px;'+
        'background-color: #eee;'+
        '}'+


        // input

        '#SettingMenus div div label div {'+
        'cursor: pointer;'+
        'line-height: 0;'+
        'padding: 10px;'+
        'display: flex;'+
        '}'+

        '</style>';



    // メニューの出し入れ

    const tSMB = document.getElementById("toolSettingMenuButton");
    const tSMD = document.querySelector("#SettingMenus div");
    tSMB.addEventListener('click', function (){
        menuOn = !menuOn;
		if(menuOn) {
			toolSettingMenu.style.width = "300px";
            tSMB.style.width = "300px";
            tSMB.innerText = "◀︎";
            tSMD.style.display = null;
		} else {
			toolSettingMenu.style.width = "0";
            tSMB.style.width = "0";
            tSMB.innerText = "▶︎";
            tSMD.style.display = "none";
		}
	});
    let menuOn = false;



 /* 自動描画 ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- */



    // ボタン
    const imgs = document.querySelector("#imageInput");
    imgs.addEventListener("change", imgURL);
    const button = document.querySelector("#autoInput");
    button.addEventListener("click", autoInput);
    let imgSrcUrl = "https://pictsense.com/img/app/1.jpg"


    // 画像
    function imgURL() {
        console.log(imgs.value);
        imgSrcUrl = imgs.value;
    };


    // 自動描画
    function autoInput() {

            // Image loading and canvas setup
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // To avoid CORS issues

            img.onload = function() {
                const scale = Math.min(320 / img.width, 320 / img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                processImageData(imageData);
            };

            img.src = imgSrcUrl; // 画像セレクタ

            function processImageData(imageData) {
                const penSize = 1; // Set pen size
                const strokeXY = [];
                const width = imageData.width;
                const height = imageData.height;
                const data = imageData.data;

                let prevColor = null;
                let startX = null;
                let startY = null;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const index = (y * width + x) * 4;
                        const r = data[index];
                        const g = data[index + 1];
                        const b = data[index + 2];
                        const a = data[index + 3];

                        if (a === 0) continue; // Skip transparent pixels

                        const color = (r << 16) + (g << 8) + b;

                        if (color !== prevColor) {
                            if (prevColor !== null) {
                                strokeXY.push([startX, startY, x - 1, y]);
                            }
                            startX = x;
                            startY = y;
                            prevColor = color;
                        }
                    }
                    if (prevColor !== null) {
                        strokeXY.push([startX, startY, width - 1, y]);
                        prevColor = null;
                    }
                }

                sendStrokes(penSize, strokeXY);
            }

            function sendStrokes(penSize, strokeXY) {
                const socket = io.connect(Object.keys(io.sockets).slice(0, 24));
                let index = 0;

                function sendNextStroke() {
                    if (index >= strokeXY.length) return;
                    const [startX, startY, endX, endY] = strokeXY[index];
                    const color = getColorAt(startX, startY);
                    socket.emit('stroke send', penSize, color, 1, [[startX, startY], [endX, endY]]);
                    index++;
                    setTimeout(sendNextStroke, 190);
                }

                sendNextStroke();
            }

            function getColorAt(x, y) {
                const index = (y * canvas.width + x) * 4;
                const r = ctx.getImageData(0, 0, canvas.width, canvas.height).data[index];
                const g = ctx.getImageData(0, 0, canvas.width, canvas.height).data[index + 1];
                const b = ctx.getImageData(0, 0, canvas.width, canvas.height).data[index + 2];
                return (r << 16) + (g << 8) + b;
            }


    }



})();
