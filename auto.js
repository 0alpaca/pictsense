// ==UserScript==
// @name         Pictsense Image Drawer
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Draw images on Pictsense using user script
// @author       You
// @match        https://pictsense.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const transparency;
    // 透明度 小数点第16までの0~1

    // Create file input for image upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.position = 'fixed';
    fileInput.style.top = '10px';
    fileInput.style.left = '10px';
    fileInput.style.zIndex = '1000';
    document.body.appendChild(fileInput);

    // Image loading and canvas setup
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let imageData;

    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const scale = Math.min(320 / img.width, 320 / img.height);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                processImageData(imageData);
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });

    function processImageData(imageData) {
        const penSize = 3; // Set pen size
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

        function sendNextStroke() {
            if (index >= strokeXY.length) return;
            const [start, end] = strokeXY[index];
            const color = getColorAt(start[0], start[1]);
            socket.emit('stroke send', penSize, color, transparency, [start, end]);
            index++;
            setTimeout(sendNextStroke, 190);
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
