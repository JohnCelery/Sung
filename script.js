        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const gameContainer = document.getElementById('gameContainer');
        const loadingMessageElement = document.getElementById('loadingMessage');
        const healthDisplay = document.getElementById('healthDisplay');
        const evictionDisplay = document.getElementById('evictionTally');

        const GAME_WIDTH = 800;
        const GAME_HEIGHT = 400;
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        gameContainer.style.width = `${GAME_WIDTH}px`;
        gameContainer.style.height = `${GAME_HEIGHT}px`;

        let WORLD_WIDTH = 3000;
        const SEGMENT_WIDTH = 1800;
        let nextSegmentStart = WORLD_WIDTH;
        let bgNextX = 0;
        const GRAVITY = 0.5;
        const GROUND_LEVEL = GAME_HEIGHT - 50;

        let assets = {
            playerImage: null, tenantImage: null,
            judgeGavelUpImage: null, judgeGavelDownImage: null,
            apartment1: null, apartment2: null, apartment3: null, apartment4: null, apartment5: null,
            courthouse: null,
            platformTexture1: null,
            platformTexture2: null,
            skyline: null
        };
        let assetsToLoad = 0;
        let assetsLoaded = 0;

        let player = {
            x: 50, y: GROUND_LEVEL - 40,
            width: 30, height: 40,
            baseWidth: 30, baseHeight: 40,
            scale: 1,
            health: 1, maxHealth: 4,
            dx: 0, dy: 0, speed: 4, jumpPower: 12,
            isJumping: false, isOnGround: true,
            img: null, isAlive: true
        };

        const TENANT_WIDTH = 30, TENANT_HEIGHT = 30; 
        const JUDGE_WIDTH = 40, JUDGE_HEIGHT = 50;   
        const GAVEL_WIDTH = 20, GAVEL_HEIGHT = 8; 

        let enemies = [];
        let platforms = [];
        let backgroundElements = []; 
        let cameraX = 0;
        let gameOver = false;
        let gameOverReason = "";
        let wisdomFetched = false;
        let gameWon = false;
        let evictionCount = 0;
        const EVICTION_TARGET = 25;

        const keys = { left: false, right: false, up: false };

        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') keys.left = true;
            if (e.key === 'ArrowRight') keys.right = true;
            if (e.key === 'ArrowUp') keys.up = true;
            if ((gameOver || gameWon) && e.key.toLowerCase() === 'r') {
                restartGame();
            }
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') keys.left = false;
            if (e.key === 'ArrowRight') keys.right = false;
            if (e.key === 'ArrowUp') keys.up = false;
        });

        function createFallbackPlatformPattern1() {
            const pCanvas = document.createElement('canvas');
            pCanvas.width = 40;
            pCanvas.height = 20;
            const pCtx = pCanvas.getContext('2d');
            pCtx.fillStyle = '#b0b0b0';
            pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);
            pCtx.strokeStyle = '#333';
            pCtx.lineWidth = 2;
            pCtx.beginPath();
            pCtx.moveTo(0, 4); pCtx.lineTo(pCanvas.width, 4);
            pCtx.moveTo(0, 10); pCtx.lineTo(pCanvas.width, 10);
            pCtx.moveTo(0, 16); pCtx.lineTo(pCanvas.width, 16);
            pCtx.moveTo(4, 0); pCtx.lineTo(4, pCanvas.height);
            pCtx.moveTo(pCanvas.width - 4, 0); pCtx.lineTo(pCanvas.width - 4, pCanvas.height);
            pCtx.stroke();
            return pCanvas;
        }

        function createFallbackPlatformPattern2() {
            const pCanvas = document.createElement('canvas');
            pCanvas.width = 40;
            pCanvas.height = 20;
            const pCtx = pCanvas.getContext('2d');
            pCtx.fillStyle = '#909090';
            pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);
            pCtx.strokeStyle = '#222';
            pCtx.lineWidth = 2;
            pCtx.beginPath();
            pCtx.moveTo(0, 6); pCtx.lineTo(pCanvas.width, 6);
            pCtx.moveTo(0, 12); pCtx.lineTo(pCanvas.width, 12);
            pCtx.moveTo(5, 0); pCtx.lineTo(5, pCanvas.height);
            pCtx.moveTo(pCanvas.width - 5, 0); pCtx.lineTo(pCanvas.width - 5, pCanvas.height);
            pCtx.stroke();
            return pCanvas;
        }

        function loadImage(src, assetName, placeholderUrl) {
            assetsToLoad++;
            const attemptLoad = (currentSrc, isOriginal) => {
                const tempImg = new Image();
                tempImg.crossOrigin = "Anonymous"; 
                tempImg.src = currentSrc; 
                tempImg.onload = () => {
                    tempImg.originalWidth = tempImg.naturalWidth;
                    tempImg.originalHeight = tempImg.naturalHeight;
                    assets[assetName] = tempImg;
                    assetsLoaded++;
                    console.log(`Successfully loaded ${isOriginal ? 'asset' : 'placeholder'}: ${currentSrc} for ${assetName}`);
                    if (assetsLoaded === assetsToLoad) allAssetsProcessed();
                };
                tempImg.onerror = () => {
                    if (isOriginal) {
                        console.error(`Failed to load image: ${src}. Attempting placeholder: ${placeholderUrl}`);
                        if (placeholderUrl) attemptLoad(placeholderUrl, false); 
                        else {
                             console.error(`No placeholder for ${src}. Using fallback drawing for ${assetName}.`);
                             assets[assetName] = null; assetsLoaded++; 
                             if (assetsLoaded === assetsToLoad) allAssetsProcessed();
                        }
                    } else { 
                        console.error(`Failed to load placeholder: ${currentSrc} for ${assetName}. Using fallback drawing.`);
                        assets[assetName] = null; assetsLoaded++; 
                        if (assetsLoaded === assetsToLoad) allAssetsProcessed();
                    }
                };
            };
            attemptLoad(src, true); 
        }
        
        function allAssetsProcessed() {
            console.log("All assets processed.");
            loadingMessageElement.style.display = 'none';
            initGame(); 
            requestAnimationFrame(gameLoop); 
        }

        function loadAllAssets() {
            loadingMessageElement.style.display = 'block'; 
            assetsToLoad = 0; assetsLoaded = 0;

            // --- PASTE YOUR FULL IMAGE URLs HERE ---
            const sungImageUrl = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/sung.png?v=1747832341324"; 
            const tenantImageUrl = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/tenant.png?v=1747832331684"; 
            const judgeGavelUpImageUrl = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/judge_gavel_up.png?v=1747832367574";   
            const judgeGavelDownImageUrl = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/judge_gavel_down.png?v=1747832359174";   
            const skylineImageUrl = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/skyline.png?v=1747834687120";
            const apartment1Url = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/apartment5.png?v=1747834222439";
            const apartment2Url = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/apartment4.png?v=1747834188867";
            const apartment3Url = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/apartment3.png?v=1747834182727";
            const apartment4Url = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/apartment2.png?v=1747834176029";
            const apartment5Url = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/apartment1.png?v=1747834170065";
            const courthouseUrl = "https://cdn.glitch.global/011db0f0-56c6-48a7-a8b0-27f2425e6bf7/courthouse.png?v=1747834164056";
            const platformTexture1Url = "https://cdn.glitch.global/a5785753-17af-4b26-97de-a03aca9da4c7/ambulance.png?v=1747842095209"; // Metal balcony texture
            const platformTexture2Url = "https://cdn.glitch.global/a5785753-17af-4b26-97de-a03aca9da4c7/police.png?v=1747842118310"; // Scaffolding texture
            // --- END OF URLS TO PASTE ---

            const sungPlaceholder = `https://placehold.co/${player.width}x${player.height}/FFD700/000000?text=Sung`;
            const tenantPlaceholder = `https://placehold.co/${TENANT_WIDTH}x${TENANT_HEIGHT}/4169E1/FFFFFF?text=T`;
            const judgeGavelUpPlaceholder = `https://placehold.co/${JUDGE_WIDTH}x${JUDGE_HEIGHT}/8A2BE2/FFFFFF?text=J_Up`;   
            const judgeGavelDownPlaceholder = `https://placehold.co/${JUDGE_WIDTH}x${JUDGE_HEIGHT}/6A0DAD/FFFFFF?text=J_Down`;   
            const skylinePlaceholder = `https://placehold.co/${GAME_WIDTH}x${GAME_HEIGHT-GROUND_LEVEL}/4A4E69/FFFFFF?text=Skyline`;
            const apartment1Placeholder = `https://placehold.co/150x250/8C7853/FFFFFF?text=Apt1`;
            const apartment2Placeholder = `https://placehold.co/180x220/757575/FFFFFF?text=Apt2`;
            const apartment3Placeholder = `https://placehold.co/160x280/A0522D/FFFFFF?text=Apt3`;
            const apartment4Placeholder = `https://placehold.co/170x240/8C7853/FFFFFF?text=Apt4`;
            const apartment5Placeholder = `https://placehold.co/140x260/757575/FFFFFF?text=Apt5`;
            const courthousePlaceholder = `https://placehold.co/250x300/C0C0C0/000000?text=Courthouse`;
            const platformTexture1Placeholder = `https://placehold.co/120x40/696969/FFFFFF?text=P1`;
            const platformTexture2Placeholder = `https://placehold.co/120x40/909090/FFFFFF?text=P2`;

            loadImage(sungImageUrl, 'playerImage', sungPlaceholder); 
            loadImage(tenantImageUrl, 'tenantImage', tenantPlaceholder); 
            loadImage(judgeGavelUpImageUrl, 'judgeGavelUpImage', judgeGavelUpPlaceholder);   
            loadImage(judgeGavelDownImageUrl, 'judgeGavelDownImage', judgeGavelDownPlaceholder);   
            loadImage(skylineImageUrl, 'skyline', skylinePlaceholder);
            loadImage(apartment1Url, 'apartment1', apartment1Placeholder);
            loadImage(apartment2Url, 'apartment2', apartment2Placeholder);
            loadImage(apartment3Url, 'apartment3', apartment3Placeholder);
            loadImage(apartment4Url, 'apartment4', apartment4Placeholder);
            loadImage(apartment5Url, 'apartment5', apartment5Placeholder);
            loadImage(courthouseUrl, 'courthouse', courthousePlaceholder);
            loadImage(platformTexture1Url, 'platformTexture1', platformTexture1Placeholder);
            loadImage(platformTexture2Url, 'platformTexture2', platformTexture2Placeholder);
        }

        function createTenant(x, y, patrolDistance) { return { type: 'tenant', x, y: y - TENANT_HEIGHT, width: TENANT_WIDTH, height: TENANT_HEIGHT, img: null, dx: 1, speed: 1, patrolStart: x, patrolEnd: x + patrolDistance, isAlive: true, colorBody: '#3498db', colorPants: '#2980b9', colorFace: '#F5DEB3' }; }
        function createJudge(x, y) { return { type: 'judge', x, y: y - JUDGE_HEIGHT, width: JUDGE_WIDTH, height: JUDGE_HEIGHT, imgUp: null, imgDown: null, gavelUp: false, gavelTimer: 0, gavelCycle: 120, isAlive: true, robeColor: '#6a0dad', faceColor: '#E0B0FF' }; } 
        
        function createPlatform(x, y, width, height, imgKey = 'platformTexture1') {
            return { x, y, width, height, img: assets[imgKey], imgKey: imgKey, color: null };
        }
        
        function createBackgroundElement(imgKey, x, y, parallaxFactor = 0.5, displayWidth = null, displayHeight = null) {
            const imageAsset = assets[imgKey];
            const natWidth = (imageAsset && imageAsset.complete && imageAsset.naturalWidth && imageAsset.naturalWidth !== 0) ? imageAsset.naturalWidth : 150;
            const natHeight = (imageAsset && imageAsset.complete && imageAsset.naturalHeight && imageAsset.naturalHeight !== 0) ? imageAsset.naturalHeight : 200;

            const dWidth = displayWidth !== null ? displayWidth : natWidth;
            const dHeight = displayHeight !== null ? displayHeight : natHeight;
            
            return {
                img: imageAsset,
                x,
                y: y === 'auto' ? GROUND_LEVEL - dHeight : y,
                parallaxFactor,
                imgKey: imgKey,
                displayWidth: dWidth,
                displayHeight: dHeight
            };
        }

        function adjustVehiclePlatform(p) {
            const img = assets[p.imgKey];
            const natW = (img && img.complete && img.naturalWidth) ? img.naturalWidth : p.width;
            const natH = (img && img.complete && img.naturalHeight) ? img.naturalHeight : p.height;

            let scale = 1;
            if (p.imgKey === 'platformTexture1') scale = 2; // Ambulance
            else if (p.imgKey === 'platformTexture2') scale = 1.5; // Police car

            const dispW = natW * scale;
            const dispH = natH * scale;

            p.displayWidth = dispW;
            p.displayHeight = dispH;
            p.width = dispW;   // collision area matches sprite size
            p.height = dispH;
            p.anchorX = 0;     // draw from top-left to align with collision box
            p.anchorY = 0;
            p.y = GROUND_LEVEL - dispH; // bottom flush with ground
        }

        const buildingSpacing = 2;
        function addBuilding(imgKey, dWidth, dHeight) {
            const element = createBackgroundElement(imgKey, bgNextX, 'auto', 0.5, dWidth, dHeight);
            backgroundElements.push(element);
            bgNextX += element.displayWidth + buildingSpacing;
        }

        function addDefaultBuildingSet() {
            addBuilding('apartment1', 160, 270);
            addBuilding('apartment2', 140, 250);
            addBuilding('courthouse', 220, 310);
            addBuilding('apartment3', 150, 260);
            addBuilding('apartment4', 170, 280);
            addBuilding('apartment5', 130, 240);
            addBuilding('apartment1', 165, 275);
            addBuilding('courthouse', 210, 300);
            addBuilding('apartment3', 155, 265);
            addBuilding('apartment2', 145, 255);
            addBuilding('apartment5', 135, 245);
            addBuilding('apartment4', 175, 285);
        }

        function generateSegment(startX) {
            const segPlatforms = [
                createPlatform(startX + 300, GROUND_LEVEL - 80, 128, 20, 'platformTexture1'),
                createPlatform(startX + 600, GROUND_LEVEL - 120, 128, 20, 'platformTexture2'),
                createPlatform(startX + 900, GROUND_LEVEL - 60, 128, 20, 'platformTexture1'),
                createPlatform(startX + 1300, GROUND_LEVEL - 100, 128, 20, 'platformTexture2'),
                createPlatform(startX + 1600, GROUND_LEVEL - 130, 128, 20, 'platformTexture1')
            ];
            segPlatforms.forEach(p => {
                if (p.imgKey === 'platformTexture1' || p.imgKey === 'platformTexture2') {
                    adjustVehiclePlatform(p);
                }
                platforms.push(p);
            });

            const segEnemies = [
                createTenant(startX + 200, GROUND_LEVEL, 100),
                createTenant(startX + 500, GROUND_LEVEL, 150),
                createJudge(startX + 750, GROUND_LEVEL),
                createTenant(startX + 1000, segPlatforms[3].y, 120),
                createJudge(startX + 1400, segPlatforms[4].y),
                createTenant(startX + 1600, GROUND_LEVEL, 100),
                createJudge(startX + 1800, GROUND_LEVEL)
            ];
            segEnemies.forEach(enemy => {
                if (enemy.type === 'tenant') enemy.img = assets.tenantImage;
                else if (enemy.type === 'judge') {
                    enemy.imgUp = assets.judgeGavelUpImage;
                    enemy.imgDown = assets.judgeGavelDownImage;
                }
                enemies.push(enemy);
            });

            addDefaultBuildingSet();

            nextSegmentStart += SEGMENT_WIDTH;
            WORLD_WIDTH += SEGMENT_WIDTH;
            if (platforms[0]) platforms[0].width = WORLD_WIDTH;
        }

        function initGame() {
            player.img = assets.playerImage;
            player.baseWidth = 30;
            player.baseHeight = 40;
            player.scale = 1;
            player.health = 1;
            player.width = player.baseWidth;
            player.height = player.baseHeight;
            player.x = 50; player.y = GROUND_LEVEL - player.height;
            player.dx = 0; player.dy = 0;
            player.isJumping = false; player.isOnGround = true;
            player.isAlive = true;
            updateHealthDisplay();
            if (!assets.platformTexture1) {
                assets.platformTexture1 = createFallbackPlatformPattern1();
            }
            if (!assets.platformTexture2) {
                assets.platformTexture2 = createFallbackPlatformPattern2();
            }
            gameOver = false; gameWon = false; gameOverReason = ""; wisdomFetched = false; cameraX = 0;
            evictionCount = 0;
            updateEvictionDisplay();
            WORLD_WIDTH = 3000;
            nextSegmentStart = WORLD_WIDTH;
            
            const existingMessages = gameContainer.querySelectorAll('.game-message, .game_over_message_container, .game_win_message_container');
            existingMessages.forEach(msg => msg.remove());

            platforms = [
                createPlatform(0, GROUND_LEVEL, WORLD_WIDTH, 50, null)
            ];
            platforms[0].img = null;
            platforms[0].color = '#6B6B6B';
            platforms[0].width = WORLD_WIDTH;

            platforms.push(createPlatform(300, GROUND_LEVEL - 80, 128, 20, 'platformTexture1'));
            platforms.push(createPlatform(600, GROUND_LEVEL - 120, 128, 20, 'platformTexture2'));
            platforms.push(createPlatform(900, GROUND_LEVEL - 60, 128, 20, 'platformTexture1'));
            platforms.push(createPlatform(1300, GROUND_LEVEL - 100, 128, 20, 'platformTexture2'));
            platforms.push(createPlatform(1600, GROUND_LEVEL - 130, 128, 20, 'platformTexture1'));

            // Adjust ambulance and police car sprites to be walkable
            platforms.forEach(p => {
                if (p.imgKey === 'platformTexture1' || p.imgKey === 'platformTexture2') {
                    adjustVehiclePlatform(p);
                }
            });

            enemies = [
                createTenant(200, GROUND_LEVEL, 100), createTenant(500, GROUND_LEVEL, 150),
                createJudge(750, GROUND_LEVEL), createTenant(1000, platforms[3].y, 120), 
                createJudge(1400, platforms[4].y), createTenant(1600, GROUND_LEVEL, 100),
                createJudge(1800, GROUND_LEVEL),
            ];
            enemies.forEach(enemy => {
                if (enemy.type === 'tenant') enemy.img = assets.tenantImage;
                else if (enemy.type === 'judge') {
                    enemy.imgUp = assets.judgeGavelUpImage;
                    enemy.imgDown = assets.judgeGavelDownImage;
                }
            });
            
            backgroundElements = [];
            bgNextX = 20;
            addDefaultBuildingSet();
        }

        function restartGame() { initGame(); if (!gameOver || player.isAlive) { lastTime = performance.now(); requestAnimationFrame(gameLoop); } }
        function setGameOver(reason) { player.isAlive = false; gameOver = true; gameOverReason = reason; wisdomFetched = false; let mtc = 'hardship'; if (reason.toLowerCase().includes('evicted') || reason.toLowerCase().includes('jop granted')) mtc = 'evicted'; addGameMessage(reason, player.x, player.y - 30, mtc); }

        function setGameWin() { player.isAlive = false; gameWon = true; }

        function updateHealthDisplay() {
            if (healthDisplay) healthDisplay.textContent = `Health: ${player.health}`;
        }

        function updateEvictionDisplay() {
            if (evictionDisplay) evictionDisplay.textContent = `Evictions: ${evictionCount}`;
        }

        function updatePlayerSize() {
            const prevHeight = player.height;
            player.scale = 1 + 0.1 * (player.health - 1);
            player.width = player.baseWidth * player.scale;
            player.height = player.baseHeight * player.scale;
            player.y -= player.height - prevHeight;
        }

        function gainHealth() {
            if (player.health < player.maxHealth) {
                player.health++;
                updatePlayerSize();
                updateHealthDisplay();
            }
        }

        function loseHealth(reason) {
            if (player.health > 1) {
                player.health--;
                updatePlayerSize();
                updateHealthDisplay();
                addGameMessage("OUCH!", player.x, player.y - 20, 'hardship');
            } else {
                setGameOver(reason);
            }
        }
        function updatePlayer() { if (!player.isAlive) return; if (keys.left) player.dx = -player.speed; else if (keys.right) player.dx = player.speed; else player.dx = 0; player.x += player.dx; if (player.x < 0) player.x = 0; if (player.x + player.width > WORLD_WIDTH) player.x = WORLD_WIDTH - player.width; if (keys.up && player.isOnGround && !player.isJumping) { player.dy = -player.jumpPower; player.isJumping = true; player.isOnGround = false; } player.dy += GRAVITY; player.y += player.dy; player.isOnGround = false; platforms.forEach(platform => { if (player.x < platform.x + platform.width && player.x + player.width > platform.x && player.y < platform.y + platform.height && player.y + player.height > platform.y) { const prevPlayerBottom = player.y + player.height - player.dy; if (player.dy > 0 && prevPlayerBottom <= platform.y) { player.y = platform.y - player.height; player.dy = 0; player.isJumping = false; player.isOnGround = true; } else if (player.dy < 0 && (player.y - player.dy) >= (platform.y + platform.height)) { player.y = platform.y + platform.height; player.dy = 0; } else if (player.dx > 0 && (player.x + player.width - player.dx) <= platform.x) { player.x = platform.x - player.width; } else if (player.dx < 0 && (player.x - player.dx) >= (platform.x + platform.width)) { player.x = platform.x + platform.width; } } }); if (player.y + player.height > GAME_HEIGHT + 100) setGameOver("FELL INTO OBLIVION!"); }
        function updateEnemies() { enemies.forEach(enemy => { if (!enemy.isAlive) return; if (enemy.type === 'tenant') { enemy.x += enemy.dx * enemy.speed; if (enemy.x <= enemy.patrolStart || enemy.x + enemy.width >= enemy.patrolEnd) enemy.dx *= -1; let onPlatform = false; for (let platform of platforms) { if (enemy.x + enemy.width > platform.x && enemy.x < platform.x + platform.width && enemy.y + enemy.height >= platform.y && enemy.y + enemy.height <= platform.y + 10) { enemy.y = platform.y - enemy.height; onPlatform = true; break; } } } else if (enemy.type === 'judge') { enemy.gavelTimer++; if (enemy.gavelTimer >= enemy.gavelCycle) { enemy.gavelTimer = 0; enemy.gavelUp = !enemy.gavelUp; } } }); }
        function checkCollisions() {
            if (!player.isAlive) return;
            enemies.forEach((enemy) => {
                if (!enemy.isAlive) return;
                if (player.x < enemy.x + enemy.width &&
                    player.x + player.width > enemy.x &&
                    player.y < enemy.y + enemy.height &&
                    player.y + player.height > enemy.y) {
                    const prevPlayerBottom = player.y + player.height - player.dy;
                    if (player.dy > 0 && prevPlayerBottom <= enemy.y + 5) {
                        if (enemy.type === 'tenant') {
                            enemy.isAlive = false;
                            addGameMessage("EVICTED!", enemy.x, enemy.y - 20, 'evicted');
                            player.dy = -player.jumpPower / 1.5;
                            gainHealth();
                            evictionCount++;
                            updateEvictionDisplay();
                            if (evictionCount >= EVICTION_TARGET) {
                                setGameWin();
                            }
                        } else if (enemy.type === 'judge') {
                            if (!enemy.gavelUp) {
                                enemy.isAlive = false;
                                addGameMessage("JOP GRANTED!", enemy.x, enemy.y - 20, 'jop_granted');
                                player.dy = -player.jumpPower / 1.5;
                            } else {
                                loseHealth("OTSC GRANTED!");
                            }
                        }
                    } else {
                        if (enemy.type === 'tenant') {
                            loseHealth("HARDSHIP STAY GRANTED!");
                            if (player.x + player.width / 2 < enemy.x + enemy.width / 2) {
                                player.x = enemy.x - player.width;
                            } else {
                                player.x = enemy.x + enemy.width;
                            }
                        } else if (enemy.type === 'judge') {
                            loseHealth("OTSC GRANTED!");
                            if (player.x + player.width / 2 < enemy.x + enemy.width / 2) {
                                player.x = enemy.x - player.width;
                            } else {
                                player.x = enemy.x + enemy.width;
                            }
                        }
                    }
                }
            });
        }
        function addGameMessage(text, x, y, typeClass) { const messageElement = document.createElement('div'); messageElement.textContent = text; messageElement.className = `game-message ${typeClass}`; messageElement.style.left = `${x - cameraX}px`; messageElement.style.top = `${y}px`; gameContainer.appendChild(messageElement); setTimeout(() => { if (gameContainer.contains(messageElement)) gameContainer.removeChild(messageElement); }, 2000); }
        function updateCamera() { cameraX = player.x - GAME_WIDTH / 2 + player.width / 2; if (cameraX < 0) cameraX = 0; if (cameraX > WORLD_WIDTH - GAME_WIDTH) cameraX = WORLD_WIDTH - GAME_WIDTH; }

        function drawPlayer() { 
            if (!player.isAlive) return; 
            const pX = player.x - cameraX; 
            const pY = player.y; 
            if (player.img && player.img.complete && player.img.naturalHeight !== 0) { 
                ctx.drawImage(player.img, pX, pY, player.width, player.height); 
            } else { 
                const vW = player.width; const vH = player.height; const headRadius = vW / 2.5; ctx.fillStyle = '#2c3e50'; ctx.fillRect(pX + vW * 0.15, pY + vH * 0.6, vW * 0.3, vH * 0.4); ctx.fillRect(pX + vW * 0.55, pY + vH * 0.6, vW * 0.3, vH * 0.4); ctx.fillRect(pX, pY + vH * 0.2, vW, vH * 0.5); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(pX + vW / 2, pY + vH * 0.22); ctx.lineTo(pX + vW * 0.4, pY + vH * 0.45); ctx.lineTo(pX + vW * 0.6, pY + vH * 0.45); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFDBAC'; ctx.beginPath(); ctx.arc(pX + vW / 2, pY + headRadius + vH*0.02, headRadius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#333333'; ctx.beginPath(); ctx.arc(pX + vW / 2, pY + headRadius - headRadius*0.1 + vH*0.02, headRadius * 0.9, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText("S", pX + vW / 2, pY + vH * 0.45); 
            } 
        }

        function drawEnemies() { 
            enemies.forEach(enemy => { 
                if (!enemy.isAlive) return; 
                const eX = enemy.x - cameraX; 
                const eY = enemy.y; 
                
                let currentEnemyImage = null;
                if (enemy.type === 'judge') {
                    currentEnemyImage = enemy.gavelUp ? enemy.imgUp : enemy.imgDown;
                } else { 
                    currentEnemyImage = enemy.img;
                }

                if (currentEnemyImage && currentEnemyImage.complete && currentEnemyImage.naturalHeight !== 0) {
                    ctx.drawImage(currentEnemyImage, eX, eY, enemy.width, enemy.height);
                } else { 
                    const vW = enemy.width; const vH = enemy.height; 
                    if (enemy.type === 'tenant') { 
                        const headRadius = vW / 3; ctx.fillStyle = enemy.colorPants; ctx.fillRect(eX + vW * 0.1, eY + vH * 0.55, vW * 0.35, vH * 0.45); ctx.fillRect(eX + vW * 0.55, eY + vH * 0.55, vW * 0.35, vH * 0.45); ctx.fillStyle = enemy.colorBody; ctx.fillRect(eX, eY + vH * 0.2, vW, vH * 0.4); ctx.fillStyle = enemy.colorFace; ctx.beginPath(); ctx.arc(eX + vW / 2, eY + headRadius, headRadius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText("T", eX + vW / 2, eY + vH * 0.45); 
                    } else if (enemy.type === 'judge') { 
                        ctx.fillStyle = enemy.robeColor; ctx.beginPath(); ctx.moveTo(eX, eY + vH); ctx.lineTo(eX, eY + vH * 0.15); ctx.quadraticCurveTo(eX + vW / 2, eY, eX + vW, eY + vH * 0.15); ctx.lineTo(eX + vW, eY + vH); ctx.closePath(); ctx.fill(); const headRadius = vW / 3.5; ctx.fillStyle = enemy.faceColor; ctx.beginPath(); ctx.arc(eX + vW / 2, eY + headRadius + vH * 0.05, headRadius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#A0522D'; const gavelHandleX = eX + vW / 2 - GAVEL_WIDTH / 8; const gavelHandleY = enemy.gavelUp ? eY - GAVEL_HEIGHT * 1.2 : eY + vH * 0.1; ctx.fillRect(gavelHandleX, gavelHandleY, GAVEL_WIDTH / 4, GAVEL_HEIGHT * 1.5); ctx.fillStyle = '#8B4513'; const gavelHeadX = eX + vW / 2 - GAVEL_WIDTH / 2; const gavelHeadY = enemy.gavelUp ? eY - GAVEL_HEIGHT * 1.8 : eY + vH * 0.1 - GAVEL_HEIGHT * 0.6; ctx.fillRect(gavelHeadX, gavelHeadY, GAVEL_WIDTH, GAVEL_HEIGHT); ctx.fillStyle = '#FFF'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText("J", eX + vW / 2, eY + vH * 0.5); 
                    } 
                } 
            }); 
        }
        
        function drawPlatforms() {
            platforms.forEach(platform => {
                const platformScreenX = platform.x - cameraX;
                if (platformScreenX + platform.width > 0 && platformScreenX < GAME_WIDTH) {
                    const useSprite = platform.imgKey === 'platformTexture1' || platform.imgKey === 'platformTexture2';
                    let drewImage = false;
                    if (platform.img && platform.img.complete && platform.img.naturalHeight !== 0) {
                        if (useSprite) {
                            const dW = platform.displayWidth || platform.width;
                            const dH = platform.displayHeight || platform.height;
                            const anchorX = platform.anchorX || 0;
                            const anchorY = platform.anchorY || 0;
                            const drawX = platformScreenX - anchorX * dW;
                            const drawY = platform.y - anchorY * dH;
                            ctx.drawImage(platform.img, drawX, drawY, dW, dH);
                            drewImage = true;
                        } else {
                            try {
                                const pattern = ctx.createPattern(platform.img, 'repeat');
                                if (pattern) {
                                    ctx.fillStyle = pattern;
                                    ctx.save();
                                    ctx.translate(platformScreenX, platform.y);
                                    ctx.fillRect(0, 0, platform.width, platform.height);
                                    ctx.restore();
                                    drewImage = true;
                                }
                            } catch (e) {
                                console.error("Error creating pattern for platform:", platform.imgKey, e);
                            }
                        }
                    }

                    if (!drewImage) {
                        if (platform.color) {
                            ctx.fillStyle = platform.color;
                            ctx.fillRect(platformScreenX, platform.y, platform.width, platform.height);
                        } else {
                            ctx.fillStyle = '#696969';
                            ctx.fillRect(platformScreenX, platform.y, platform.width, platform.height);
                        }
                    }

                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    const sDW = useSprite ? (platform.displayWidth || platform.width) : platform.width;
                    const sDH = useSprite ? (platform.displayHeight || platform.height) : platform.height;
                    const sX = useSprite ? platformScreenX - (platform.anchorX || 0) * sDW : platformScreenX;
                    const sY = useSprite ? platform.y - (platform.anchorY || 0) * sDH : platform.y;
                    ctx.strokeRect(sX, sY, sDW, sDH);
                }
            });
        }

        function drawBackground() {
            if (assets.skyline && assets.skyline.complete && assets.skyline.naturalHeight !== 0) {
                const skylineParallaxFactor = 0.1; 
                const skylineImgWidth = assets.skyline.naturalWidth;
                const skylineImgHeight = GAME_HEIGHT - GROUND_LEVEL + 50; 

                let startX = (-cameraX * skylineParallaxFactor) % skylineImgWidth;
                // Ensure startX is negative or zero to correctly tile from left
                if (startX > 0) {
                    startX -= skylineImgWidth;
                }
                
                for (let i = 0; (startX + i * skylineImgWidth) < GAME_WIDTH; i++) {
                    ctx.drawImage(assets.skyline, startX + i * skylineImgWidth, 0, skylineImgWidth, skylineImgHeight);
                }
            } else { 
                ctx.fillStyle = '#4a4e69';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT - GROUND_LEVEL + 50); 
            }

            backgroundElements.forEach(element => {
                if (element.img && element.img.complete && element.img.naturalHeight !== 0) {
                    const screenX = element.x - cameraX * element.parallaxFactor;
                    if (screenX + element.displayWidth > 0 && screenX < GAME_WIDTH) { 
                         ctx.drawImage(element.img, screenX, element.y, element.displayWidth, element.displayHeight);
                    }
                } else { 
                    ctx.fillStyle = '#555'; 
                    const screenX = element.x - cameraX * element.parallaxFactor;
                    const fallbackWidth = element.displayWidth; 
                    const fallbackHeight = element.displayHeight; 
                    if (screenX + fallbackWidth > 0 && screenX < GAME_WIDTH) {
                        ctx.fillRect(screenX, element.y, fallbackWidth, fallbackHeight);
                    }
                }
            });
        }

        async function fetchLegalWisdom(reason) {
            let promptText = "";
            if (reason === "HARDSHIP STAY GRANTED!") promptText = "In a humorous, witty, and very short (around 15-20 words) legal-themed quip, what might an eviction lawyer like Sung think or say after losing an eviction case because a 'hardship stay was granted' for the tenant in a video game setting? Make it sound like a resigned but funny observation from an experienced lawyer.";
            else if (reason === "OTSC GRANTED!") promptText = "In a humorous, witty, and very short (around 15-20 words) legal-themed quip, what might an eviction lawyer like Sung think or say after effectively losing in court because an 'Order to Show Cause was granted' against his client's interests in a video game setting? Make it sound like a wry comment on procedural justice.";
            else if (reason === "FELL INTO OBLIVION!") promptText = "In a humorous, witty, and very short (around 15-20 words) legal-themed quip, what might an eviction lawyer like Sung think after metaphorically 'falling into oblivion' in a video game, perhaps due to a critical misstep in a case or a procedural pitfall? Keep it lighthearted and related to lawyering.";
            else return "Well, that was unexpected. Back to the drawing board!";

            const wisdomElement = document.getElementById('legalWisdomText');
            if (wisdomElement) wisdomElement.textContent = "Consulting Legal Precedents...";

            try {
                const apiKey = "YOUR_GEMINI_API_KEY_GOES_HERE"; 
                if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_GOES_HERE" || apiKey === "") {
                    console.warn("Gemini API Key is missing. Legal wisdom feature will not work.");
                    if (wisdomElement) wisdomElement.textContent = "API Key missing. No wisdom today!";
                    return;
                }

                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`; 
                const payload = { contents: [{ role: "user", parts: [{ text: promptText }] }] };
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    console.error('Gemini API response not OK:', response.status, errorBody);
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                const result = await response.json();

                if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
                    if (wisdomElement) wisdomElement.textContent = result.candidates[0].content.parts[0].text.trim();
                } else {
                    console.error('Unexpected Gemini API response structure:', result);
                    if (wisdomElement) wisdomElement.textContent = "The legal archives are currently puzzling. Try again later.";
                }
        } catch (error) {
            console.error('Error fetching legal wisdom:', error);
            if (wisdomElement) wisdomElement.textContent = "Couldn't reach legal counsel. Check console.";
        }
    }

        function drawWinMessage() {
            if (gameWon) {
                let msgContainer = gameContainer.querySelector('.game_win_message_container');
                if (!msgContainer) {
                    msgContainer = document.createElement('div');
                    msgContainer.className = 'game_over_message_container game_win_message_container';
                    msgContainer.innerHTML = `
                        <div class="title">CONGRATULATIONS!</div>
                        <div style="font-size: 0.7em; color: #4CAF50; margin-bottom: 10px;">All Tenants in Newark Have Been Evicted!</div>
                        <div class="restart-text">Press 'R' to Restart</div>
                    `;
                    gameContainer.appendChild(msgContainer);
                }
            } else {
                const existingMsg = gameContainer.querySelector('.game_win_message_container');
                if (existingMsg) existingMsg.remove();
            }
        }

        function drawGameOverMessage() {
            if (gameOver && !player.isAlive) {
                let msgContainer = gameContainer.querySelector('.game_over_message_container');
                if (!msgContainer) { 
                    msgContainer = document.createElement('div');
                    msgContainer.className = 'game_over_message_container';
                    msgContainer.innerHTML = `
                        <div class="title">GAME OVER!</div>
                        <div class="game-over-reason" style="font-size: 0.7em; color: #FF6347; margin-bottom: 10px;">${gameOverReason}</div>
                        <div class="restart-text">Press 'R' to Restart</div>
                        <div class="legal-wisdom"><strong>Legal Wisdom ✨:</strong> <span id="legalWisdomText">Loading...</span></div>
                    `;
                    gameContainer.appendChild(msgContainer);
                } else { 
                    const reasonDiv = msgContainer.querySelector('.game-over-reason');
                    if (reasonDiv) reasonDiv.textContent = gameOverReason;
                }

                if (!wisdomFetched) {
                    fetchLegalWisdom(gameOverReason);
                    wisdomFetched = true;
                }
            } else {
                 const existingMsg = gameContainer.querySelector('.game_over_message_container');
                 if (existingMsg) existingMsg.remove(); 
            }
        }

        let lastTime = 0;
        function gameLoop(timestamp) {
            if (!lastTime && timestamp) lastTime = timestamp;
            else if (!timestamp) { lastTime = performance.now(); requestAnimationFrame(gameLoop); return; }
            lastTime = timestamp;
            if (gameWon) { drawWinMessage(); return; }
            if (gameOver && !player.isAlive) { drawGameOverMessage(); return; }
            ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            
            drawBackground(); 
            drawPlatforms();  
            
            updatePlayer(); 
            updateEnemies();
            checkCollisions();
            if (player.x > nextSegmentStart - GAME_WIDTH * 1.5) {
                generateSegment(nextSegmentStart);
            }
            updateCamera();
            
            drawPlayer(); 
            drawEnemies();
            
            drawWinMessage();
            drawGameOverMessage();
            requestAnimationFrame(gameLoop);
        }

        loadAllAssets();
