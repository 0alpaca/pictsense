// ==UserScript==
// @name         自動描画
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  自動で描画する
// @author       あるぱか
// @match        https://pictsense.com/*
// @icon         https://img.icons8.com/?size=100&id=NP2HKyKwWrzn&format=png&color=000000
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    // 設定メニューのベース

	const outoDrawMenu = document.createElement("div");
    outoDrawMenu.id = "SettingMenus";
	outoDrawMenu.style.background = "#e0e0e080";
	outoDrawMenu.style.height = "660px";
	outoDrawMenu.style.width = "0";
	outoDrawMenu.style.position = "fixed";
	outoDrawMenu.style.top = "0";
	outoDrawMenu.style.left = "0";
    outoDrawMenu.style.userSelect = "none";
	outoDrawMenu.style.paddingTop = "50px";
	outoDrawMenu.style.transition = ".05s";
	outoDrawMenu.style.filter = "drop-shadow(2px 0px 3px #ccc)";
	document.getElementById("base").appendChild(outoDrawMenu);



    // 設定メニューの要素

    outoDrawMenu.innerHTML =
        '<span><button id="outoDrawMenuButton" style="width: 0; border-radius: 0 10px 10px 0; transition: .05s">▶︎</button></span>'+
        '<div style="display: none";>'+
        '<div id ="menuE">'+
        '</div>'+
        '</div>'+


        // スタイルを作成 (CSS)

        '<style>'+



        // 設定メニューのdiv

        '#outoDrawMenuButton div {'+
        'margin: 0 auto;'+
        'text-align: left;'+
        'width: 250px;'+
        'font-size: 17px;'+
        'padding: 20px 20px 0;'+
        'margin-top: 20px;'+
        'border-radius: 10px;'+
        'background-color: #eee;'+
        '}'+


        '#menuE {'+
        'margin-top: 20px;'+
        '}'+

        '#menuE > input,#menuE > button{'+
        'margin-top: 20px;'+
        'padding: 0;'+
        '}'+

        '#menuE > input[type="file"]{'+
        'color: #fff;'+
        'width: 300px;'+
        'height: auto;'+
        'margin-bottom: 10px;'+
        'background-color: #009CFF;'+
        'border-radius: 1em;'+
        'padding: 5px;'+
        '}'+

        '::file-selector-button {'+
        'display: block;'+
        '}'+


        '</style>';



    // メニューの出し入れ

    const tSMB = document.getElementById("outoDrawMenuButton");
    const tSMD = document.querySelector("#SettingMenus div");
    tSMB.addEventListener('click', function (){
        menuOn = !menuOn;
		if(menuOn) {
			outoDrawMenu.style.width = "300px";
            tSMB.style.width = "300px";
            tSMB.innerText = "◀︎";
            tSMD.style.display = null;
		} else {
			outoDrawMenu.style.width = "0";
            tSMB.style.width = "0";
            tSMB.innerText = "▶︎";
            tSMD.style.display = "none";
		}
	});
    let menuOn = false;


    // メニューのエレメント
    const menuElement = document.querySelector("#menuE");

    // Create file input for image upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.zIndex = '1000';
    menuElement.appendChild(fileInput);

    // Create display for current scale value
    const scaleValueDisplay = document.createElement('div');

    scaleValueDisplay.style.zIndex = '1000';
    scaleValueDisplay.style.color = 'white';
    scaleValueDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    menuElement.appendChild(scaleValueDisplay);

    // Create range input for scaling
    const scaleInput = document.createElement('input');
    scaleInput.type = 'range';
    scaleInput.min = '1';
    scaleInput.max = '100';
    scaleInput.value = '100';

    scaleInput.style.zIndex = '1000';
    scaleInput.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    menuElement.appendChild(scaleInput);

    // Update scale value display
    scaleInput.addEventListener('input', function() {
        scaleValueDisplay.textContent = `現在のスケール: ${scaleInput.value}%`;
    });
    scaleValueDisplay.textContent = `現在のスケール: ${scaleInput.value}%`;

    // Create display for current pen size value
    const penSizeValueDisplay = document.createElement('div');
    penSizeValueDisplay.style.zIndex = '1000';
    penSizeValueDisplay.style.color = 'white';
    penSizeValueDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

    menuElement.appendChild(penSizeValueDisplay);

    // Create range input for pen size
    const penSizeInput = document.createElement('input');
    penSizeInput.type = 'range';
    penSizeInput.min = '1';
    penSizeInput.max = '30';
    penSizeInput.value = '3';
    penSizeInput.style.zIndex = '1000';
    penSizeInput.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    menuElement.appendChild(penSizeInput);

    // Update pen size value display
    penSizeInput.addEventListener('input', function() {
        penSizeValueDisplay.textContent = `現在のペンサイズ: ${penSizeInput.value}`;
    });
    penSizeValueDisplay.textContent = `現在のペンサイズ: ${penSizeInput.value}`;

    // Create status display
    const statusDisplay = document.createElement('div');
    statusDisplay.style.zIndex = '1000';
    statusDisplay.style.color = 'white';
    statusDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    statusDisplay.textContent = 'ステータス: 待機中';
    menuElement.appendChild(statusDisplay);

    // Create a button to start drawing
    const drawButton = document.createElement('button');
    drawButton.textContent = '実行';
    drawButton.disabled = true;
    drawButton.style.zIndex = '1000';
    drawButton.style.padding = '5px 10px';
    menuElement.appendChild(drawButton);

    let drawing = false;
    let strokeTimeout;

    // Enable draw button when a file is selected
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            drawButton.disabled = false;
        } else {
            drawButton.disabled = true;
        }
    });

    // Image loading and canvas setup
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let imageData;

    drawButton.addEventListener('click', function() {
        if (drawing) {
            // Stop drawing
            clearTimeout(strokeTimeout);
            statusDisplay.textContent = 'ステータス: 中止';
            drawButton.textContent = '実行';
            drawing = false;
        } else {
            // Start drawing
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const scale = Math.min(320 / img.width, 320 / img.height) * (scaleInput.value / 100);
                    canvas.width = img.width * scale;
                    canvas.height = img.height * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    processImageData(imageData);
                };
                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        }
    });

    function processImageData(imageData) {
        const penSize = parseInt(penSizeInput.value, 10); // Set pen size from input
        const strokeXY = [];
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        const step = penSize / 2; // Set step to half of pen size

        let prevColor = null;
        let startX = null;
        let startY = null;

        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const index = (Math.floor(y) * width + Math.floor(x)) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];

                if (a === 0) {
                    prevColor = null;
                    continue; // Skip transparent pixels
                }

                const color = (r << 16) + (g << 8) + b;

                if (color !== prevColor) {
                    if (prevColor !== null) {
                        strokeXY.push([[startX, startY], [x - step, y]]);
                    }
                    startX = x;
                    startY = y;
                    prevColor = color;
                }
            }
            if (prevColor !== null) {
                strokeXY.push([[startX, startY], [width - step, y]]);
                prevColor = null;
            }
        }

        sendStrokes(penSize, strokeXY);
    }

    function sendStrokes(penSize, strokeXY) {
        const socket = io.connect(Object.keys(io.sockets)[0]);
        let index = 0;

        statusDisplay.textContent = 'ステータス: 描画中';
        drawButton.textContent = '中止';
        drawing = true;

        function sendNextStroke() {
            if (index >= strokeXY.length) {
                statusDisplay.textContent = 'ステータス: 完了';
                drawButton.textContent = '実行';
                drawing = false;
                return;
            }
            const [start, end] = strokeXY[index];
            const color = getColorAt(start[0], start[1]);
            socket.emit('stroke send', penSize, color, 1, [start, end]);
            index++;
            strokeTimeout = setTimeout(sendNextStroke, 190);
        }

        sendNextStroke();
    }

    function getColorAt(x, y) {
        const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];
        return (r << 16) + (g << 8) + b;
    }


})();
