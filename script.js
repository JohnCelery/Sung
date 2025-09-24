const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('gameContainer');
const loadingMessageElement = document.getElementById('loadingMessage');
const healthDisplay = document.getElementById('healthDisplay');
const evictionDisplay = document.getElementById('evictionTally');
const characterSelect = document.getElementById('characterSelect');
// Elements for dynamic mobile controls will be queried later
let touchControls, btnLeft, btnRight, btnJump;
// Basic feature detection for touch devices
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
let selectedCharacter = 'sung';

const GAME_WIDTH = 1600;
const GAME_HEIGHT = 800;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
gameContainer.style.width = `${GAME_WIDTH}px`;
gameContainer.style.height = `${GAME_HEIGHT}px`;

// New responsive canvas setup
function setupResponsiveCanvas() {
    const rotatePrompt = document.getElementById('rotatePrompt');
    function onResize() {
        const ww = window.innerWidth;
        const wh = window.innerHeight;
        const scale = Math.min(ww / GAME_WIDTH, wh / GAME_HEIGHT);
        gameContainer.style.transform = `scale(${scale})`;
        gameContainer.style.transformOrigin = 'top left';
        gameContainer.style.left = ((ww - GAME_WIDTH * scale) / 2) + 'px';
        gameContainer.style.top = ((wh - GAME_HEIGHT * scale) / 2) + 'px';

        if (isTouchDevice && rotatePrompt) {
            rotatePrompt.style.display = wh > ww ? 'flex' : 'none';
        }
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    onResize();
}

        let WORLD_WIDTH = 3000;
        const SEGMENT_WIDTH = 1800;
        let nextSegmentStart = WORLD_WIDTH;
        let bgNextX = 0;
        const GRAVITY = 0.5;
        const GROUND_LEVEL = GAME_HEIGHT - 50;

        const TILE = 32;
        const SPRITE_SCALE = 1;
        const PLAYER_TARGET_HEIGHT = 2 * TILE * SPRITE_SCALE;
        // Slightly larger tenants for added challenge
        const TENANT_TARGET_HEIGHT = 2.5 * TILE * SPRITE_SCALE;
        const JUDGE_TARGET_HEIGHT = 2.5 * TILE * SPRITE_SCALE;

const PROMOTION_THRESHOLDS = [5, 10, 15, 25];
const PROMOTION_MESSAGES = {
    5: "PROMOTED: SENIOR ASSOCIATE!",
    10: "PROMOTED: PARTNER!",
    15: "PROMOTED: NAME PARTNER!",
    25: "PROMOTED: LEGENDARY PARTNER!"
};

        // Placeholder URLs for power up/down graphics. Replace with real URLs.
        const POWER_GRAPHICS = {
            up5: 'power_to_senior_associate.png',
            up10: 'power_to_partner.png',
            up15: 'power_to_name_partner.png',
            up25: 'managing_partner_powerup.png',
            down15: 'demo_to_partner.png',
            down10: 'demo_to_senior_associate.png',
            down5: 'demo_to_associate.png',
            down25: 'demo_to_partner.png'
        };

        // Placeholder URL for the image shown when the player dies
        const GAME_OVER_GRAPHIC_URL = 'gameover_screen1.png';

        // Placeholder URL for the image shown when the player wins
        const GAME_WIN_GRAPHIC_URL = 'win_screen.png';

        let assets = {
            playerImage: null,
            playerImage5: null,
            playerImage10: null,
            playerImage15: null,
            playerImage25: null,
            tenant1: null,
            tenant2: null,
            tenant3: null,
            tenant4: null,
            tenant5: null,
            tenant6: null,
            tenant7: null,
            tenant8: null,
            tenant9: null,
            tenant10: null,
            tenant11: null,
            tenantImages: [],
            judgeGavelUpImage: null, judgeGavelDownImage: null,
            apartment1: null, apartment2: null, apartment3: null, apartment4: null, apartment5: null,
            apartment6: null, apartment7: null, apartment8: null, apartment9: null, apartment10: null,
            apartment11: null,
            courthouse: null,
            platformTexture1: null,
            platformTexture2: null,
            background: null
        };
        let assetsToLoad = 0;
        let assetsLoaded = 0;

        let gamePaused = false;

        let player = {
            x: 50, y: GROUND_LEVEL - 40,
            width: 30, height: 40,
            baseWidth: 30, baseHeight: 40,
            scale: 1,
            health: 1, maxHealth: 25,
            invincible: false,
            dx: 0, dy: 0, speed: 4, jumpPower: 12,
            isJumping: false, isOnGround: true,
            img: null, isAlive: true
        };

        const TENANT_WIDTH = TILE * SPRITE_SCALE;
        const TENANT_HEIGHT = TENANT_TARGET_HEIGHT;
        const JUDGE_WIDTH = TILE * SPRITE_SCALE; // width adjusted after loading
        const JUDGE_HEIGHT = JUDGE_TARGET_HEIGHT;
const GAVEL_WIDTH = 20 * SPRITE_SCALE;
const GAVEL_HEIGHT = 8 * SPRITE_SCALE;

        function setScaledSpriteDimensions(obj, img, targetHeight) {
            let ratio = 1;
            if (img && img.originalHeight) {
                ratio = img.originalWidth / img.originalHeight;
            } else if (obj.baseHeight) {
                ratio = obj.baseWidth / obj.baseHeight;
            }
            obj.baseHeight = targetHeight;
            obj.baseWidth = targetHeight * ratio;
            obj.width = obj.baseWidth * (obj.scale || 1);
            obj.height = obj.baseHeight * (obj.scale || 1);
            obj.anchorX = 0;
            obj.anchorY = 0;
        }

        let enemies = [];
        let platforms = [];
        let backgroundElements = []; 
        let cameraX = 0;
        let gameOver = false;
        let gameOverReason = "";
        let gameWon = false;
        let evictionCount = 0;
        const EVICTION_TARGET = 50;

        const tenantElimMessages = [
            "EVICTED!",
            "WARRANT EXECUTED!",
            "RENT INCREASE UPHELD!!",
            "DEFAULT JUDGMENT ENTERED!",
            "SECURITY DEPOSIT WITHHELD!",
            "EMOTIONAL SUPPORT ANIMAL BANNED!",
            "ADJOURNMENT REQUEST DENIED!",
            "LEASE TERMINATED!",
            "UNAUTHORIZED OCCUPANTS REMOVED!",
            "MARINI DENIED!"
        ];

        const tenantElimMessagesMax = [
            "Pack it up, cocksucker—rent’s due",
            "No greens? No mercy COCKSUCKER!",
            "You look like Section 8 in human form.",
            "I cam here to collect greensheets and evict cocksuckers!",
            "Where's Legal Aid now, cocksucker!",
            "Smell that? That's the smell of gentrification, cocksucker!",
            "Section 8 doesn’t cover broken jaws - cocksucker",
            "You call that a hardship? Try homelessness.",
            "Didn’t I evict your cousin last week?",
            "You people always got excuses and no damn greens.",
            "Cocksucking cocksucker!",
            "Show me the greensheet or show me the door—your door.",
            "This whole building smells like broken promises."
        ];

        const judgeElimMessages = [
            "OTSC DENIED!",
            "MOTION TO RECONSIDER REJECTED!",
            "HARDSHIP STAY DENIED!",
            "RENT CONTROL OVERRULED!",
            "JOP GRANTED!",
            "RECUSED!",
            "BENCHSLAPPED!",
            "CHAMBERS CLOSED!",
            "SUA SPONTE SHUTDOWN!",
            "HEARSAY OVERRULED!"
        ];

        const judgeElimMessagesMax = [
            "Another gavel bites the dust. And you're a cocksucker.",
            "You're not on the bench anymore, you're under it...cocksucker",
            "Judicial discretion my ass, cocksucker",
            "The court is adjourned—indefinitely.",
            "Ever seen a name partner kill a judge? Now you have.",
            "Call the Appellate Division. Tell 'em you're dead.",
            "From superior court to superior corpse.",
            "They should’ve recused you... from breathing.",
            "Your motion for mercy is denied.",
            "You got tenure—I got greens.",
            "Your pension won’t save you now.",
            "YOU. ARE. A. COCKSUCKER!",
            "The only robe I respect is silk with cufflinks.",
            "Another cocksucker between me and my next BMW—removed.",
            "Justice is blind—and now it's dead.",
            "Retirement came early, courtesy of my greensheet."
        ];

        const judgeHitMessages = [
            "STAY OF EVICTION GRANTED!",
            "SHAM LEASE ACCEPTED!",
            "RENT ROLLBACK ORDERED!",
            "CASE REOPENED!",
            "TENANT'S AFFIDAVIT CREDIBLE!",
            "MOTION TO TRANSFER AND CONSOLIDATE GRANTED!",
            "OTSC ISSUED!",
            "THIRD OOR GRANTED!",
            "STACK AMENDMENT APPLIED!",
            "CARES ACT APPLICABLE!"
        ];

const tenantHitMessages = [
            "LEGAL SERVICES RETAINED!",
            "MOTION TO TRANSFER FILED!",
            "COUNTERCLAIM SERVED!",
            "FEE WAIVER GRANTED!",
            "REPAIRS NOT MADE!",
            "RENT STRIKE BEGINS!",
            "ABATEMENT ORDERED!",
            "ADJOURNMENT REQUEST GRANTED!",
            "HOUSING ADVOCATE ENGAGED!",
            "MONEY PAID INTO COURT!"
];

const keys = { left: false, right: false, up: false };

// Create and wire up on-screen controls for touch devices
function setupMobileControls() {
    if (!isTouchDevice) return;
    touchControls = document.getElementById('touchControls');
    btnLeft = document.getElementById('touchLeft');
    btnRight = document.getElementById('touchRight');
    btnJump = document.getElementById('touchJump');
    if (!touchControls || !btnLeft || !btnRight || !btnJump) return;
    touchControls.style.display = 'flex';
    const prevent = e => e.preventDefault();
    btnLeft.addEventListener('touchstart', e => { prevent(e); keys.left = true; });
    btnLeft.addEventListener('touchend', e => { prevent(e); keys.left = false; });
    btnLeft.addEventListener('touchcancel', e => { prevent(e); keys.left = false; });
    btnRight.addEventListener('touchstart', e => { prevent(e); keys.right = true; });
    btnRight.addEventListener('touchend', e => { prevent(e); keys.right = false; });
    btnRight.addEventListener('touchcancel', e => { prevent(e); keys.right = false; });
    btnJump.addEventListener('touchstart', e => { prevent(e); keys.up = true; });
    btnJump.addEventListener('touchend', e => { prevent(e); keys.up = false; });
    btnJump.addEventListener('touchcancel', e => { prevent(e); keys.up = false; });
}

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

            // --- IMAGE FILES LOADED FROM THE REPOSITORY ---
            const sungImageUrl = "sung_senior_associate.png";
            const mattImageUrl = "matt_associate.png";
            const sungLevel5Url = "sung_partner.png";
            const sungLevel10Url = "sung_name_partner.png";
            const sungLevel15Url = "sung_name_partner.png";
            const mattLevel5Url = "matt_senior_associate.png";
            const mattLevel10Url = "matt_partner.png";
            const mattLevel15Url = "matt_name_partner.png";
            const level25Url = 'managing_partner_sprite.png';
            const tenantUrls = [
                "tenant1.png",
                "tenant2.png",
                "tenant3.png",
                "tenant4.png",
                "tenant5.png",
                "tenant6.png",
                "tenant7.png",
                "tenant8.png",
                "tenant9.png",
                "tenant10.png",
                "tenant11.png",
                "tenant12.png",
                "tenant13.png",
                "tenant14.png",
                "tenant15.png"
            ];
            const judgeGavelUpImageUrl = "judge_up.png";
            const judgeGavelDownImageUrl = "judge_down.png";
            const backgroundUrl = "background2.png";
            const apartment1Url = "building1.png";
            const apartment2Url = "building2.png";
            const apartment3Url = "building3.png";
            const apartment4Url = "building4.png";
            const apartment5Url = "building5.png";
            const apartment6Url = "building6.png";
            const apartment7Url = "building7.png";
            const apartment8Url = "building8.png";
            const apartment9Url = "building4.png";
            const apartment10Url = "building5.png";
            const apartment11Url = "building6.png";
            const courthouseUrl = "building8.png";
            const platformTexture1Url = "ambulance.png"; // Metal balcony texture
            const platformTexture2Url = "cop_car.png"; // Scaffolding texture
            // --- END OF IMAGE LIST ---

            const sungPlaceholder = `https://placehold.co/${player.width}x${player.height}/FFD700/000000?text=Sung`;
            const mattPlaceholder = `https://placehold.co/${player.width}x${player.height}/00BFFF/000000?text=Matt`;
            const sungPromotePlaceholder = sungPlaceholder;
            const mattPromotePlaceholder = mattPlaceholder;
            const tenantPlaceholder = `https://placehold.co/${TENANT_WIDTH}x${TENANT_HEIGHT}/4169E1/FFFFFF?text=T`;
            const judgeGavelUpPlaceholder = `https://placehold.co/${JUDGE_WIDTH}x${JUDGE_HEIGHT}/8A2BE2/FFFFFF?text=J_Up`;   
            const judgeGavelDownPlaceholder = `https://placehold.co/${JUDGE_WIDTH}x${JUDGE_HEIGHT}/6A0DAD/FFFFFF?text=J_Down`;   
            const backgroundPlaceholder = `https://placehold.co/${GAME_WIDTH}x${GAME_HEIGHT}/000000/FFFFFF?text=BG`;
            const apartment1Placeholder = `https://placehold.co/150x250/8C7853/FFFFFF?text=Apt1`;
            const apartment2Placeholder = `https://placehold.co/180x220/757575/FFFFFF?text=Apt2`;
            const apartment3Placeholder = `https://placehold.co/160x280/A0522D/FFFFFF?text=Apt3`;
            const apartment4Placeholder = `https://placehold.co/170x240/8C7853/FFFFFF?text=Apt4`;
            const apartment5Placeholder = `https://placehold.co/140x260/757575/FFFFFF?text=Apt5`;
            const apartment6Placeholder = `https://placehold.co/150x250/8C7853/FFFFFF?text=Apt6`;
            const apartment7Placeholder = `https://placehold.co/150x250/757575/FFFFFF?text=Apt7`;
            const apartment8Placeholder = `https://placehold.co/150x250/A0522D/FFFFFF?text=Apt8`;
            const apartment9Placeholder = `https://placehold.co/150x250/8C7853/FFFFFF?text=Apt9`;
            const apartment10Placeholder = `https://placehold.co/150x250/757575/FFFFFF?text=Apt10`;
            const apartment11Placeholder = `https://placehold.co/150x250/A0522D/FFFFFF?text=Apt11`;
            const courthousePlaceholder = `https://placehold.co/250x300/C0C0C0/000000?text=Courthouse`;
            const platformTexture1Placeholder = `https://placehold.co/120x40/696969/FFFFFF?text=P1`;
            const platformTexture2Placeholder = `https://placehold.co/120x40/909090/FFFFFF?text=P2`;

            const playerUrl = selectedCharacter === 'matt' ? mattImageUrl : sungImageUrl;
            const playerPlaceholder = selectedCharacter === 'matt' ? mattPlaceholder : sungPlaceholder;
            const lvl5Url = selectedCharacter === 'matt' ? mattLevel5Url : sungLevel5Url;
            const lvl10Url = selectedCharacter === 'matt' ? mattLevel10Url : sungLevel10Url;
            const lvl15Url = selectedCharacter === 'matt' ? mattLevel15Url : sungLevel15Url;
            const lvl25Url = level25Url;

            loadImage(playerUrl, 'playerImage', playerPlaceholder);
            loadImage(lvl5Url, 'playerImage5', playerPlaceholder);
            loadImage(lvl10Url, 'playerImage10', playerPlaceholder);
            loadImage(lvl15Url, 'playerImage15', playerPlaceholder);
            loadImage(lvl25Url, 'playerImage25', playerPlaceholder);
            tenantUrls.forEach((url, idx) => {
                loadImage(url, `tenant${idx + 1}`, tenantPlaceholder);
            });
            loadImage(judgeGavelUpImageUrl, 'judgeGavelUpImage', judgeGavelUpPlaceholder);
            loadImage(judgeGavelDownImageUrl, 'judgeGavelDownImage', judgeGavelDownPlaceholder);
            loadImage(backgroundUrl, 'background', backgroundPlaceholder);
            loadImage(apartment1Url, 'apartment1', apartment1Placeholder);
            loadImage(apartment2Url, 'apartment2', apartment2Placeholder);
            loadImage(apartment3Url, 'apartment3', apartment3Placeholder);
            loadImage(apartment4Url, 'apartment4', apartment4Placeholder);
            loadImage(apartment5Url, 'apartment5', apartment5Placeholder);
            loadImage(apartment6Url, 'apartment6', apartment6Placeholder);
            loadImage(apartment7Url, 'apartment7', apartment7Placeholder);
            loadImage(apartment8Url, 'apartment8', apartment8Placeholder);
            loadImage(apartment9Url, 'apartment9', apartment9Placeholder);
            loadImage(apartment10Url, 'apartment10', apartment10Placeholder);
            loadImage(apartment11Url, 'apartment11', apartment11Placeholder);
            loadImage(courthouseUrl, 'courthouse', courthousePlaceholder);
            loadImage(platformTexture1Url, 'platformTexture1', platformTexture1Placeholder);
            loadImage(platformTexture2Url, 'platformTexture2', platformTexture2Placeholder);
        }

        function createTenant(x, y, patrolDistance) {
            return {
                type: 'tenant', x, y: y - TENANT_HEIGHT,
                width: TENANT_WIDTH, height: TENANT_HEIGHT,
                img: null, dx: 1, speed: 1,
                patrolStart: x, patrolEnd: x + patrolDistance,
                isAlive: true,
                colorBody: '#3498db', colorPants: '#2980b9', colorFace: '#F5DEB3',
                lastDamageTime: -Infinity
            };
        }

        function getRandomTenantImage() {
            if (assets.tenantImages && assets.tenantImages.length) {
                const valid = assets.tenantImages.filter(img => img);
                if (valid.length) {
                    return valid[Math.floor(Math.random() * valid.length)];
                }
            }
            return null;
        }

        function createJudge(x, y) {
            return {
                type: 'judge', x, y: y - JUDGE_HEIGHT,
                width: JUDGE_WIDTH, height: JUDGE_HEIGHT,
                imgUp: null, imgDown: null,
                gavelUp: false, gavelTimer: 0, gavelCycle: 120,
                isAlive: true, robeColor: '#6a0dad', faceColor: '#E0B0FF',
                lastDamageTime: -Infinity
            };
        }
        
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
            // Draw ambulance and police sprites at the same size as their hitboxes
            p.displayWidth = p.width;
            p.displayHeight = p.height;
            p.anchorX = 0; // align top-left for accurate collisions
            p.anchorY = 0;
            p.y = GROUND_LEVEL - p.height; // bottom flush with ground
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
            addBuilding('apartment6', 160, 270);
            addBuilding('apartment7', 150, 260);
            addBuilding('apartment8', 155, 265);
            addBuilding('apartment9', 165, 275);
            addBuilding('apartment10', 145, 255);
            addBuilding('apartment11', 175, 285);
            addBuilding('apartment1', 165, 275);
            addBuilding('courthouse', 210, 300);
            addBuilding('apartment3', 155, 265);
            addBuilding('apartment2', 145, 255);
            addBuilding('apartment5', 135, 245);
            addBuilding('apartment4', 175, 285);
        }

        function generateSegment(startX) {
            const segPlatforms = [
                createPlatform(startX + 300, GROUND_LEVEL - 80, 80, 40, 'platformTexture1'),
                createPlatform(startX + 600, GROUND_LEVEL - 120, 80, 40, 'platformTexture2'),
                createPlatform(startX + 900, GROUND_LEVEL - 60, 80, 40, 'platformTexture1'),
                createPlatform(startX + 1300, GROUND_LEVEL - 100, 80, 40, 'platformTexture2'),
                createPlatform(startX + 1600, GROUND_LEVEL - 130, 80, 40, 'platformTexture1')
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
                if (enemy.type === 'tenant') {
                    enemy.img = getRandomTenantImage();
                    setScaledSpriteDimensions(enemy, enemy.img, TENANT_TARGET_HEIGHT);
                } else if (enemy.type === 'judge') {
                    enemy.imgUp = assets.judgeGavelUpImage;
                    enemy.imgDown = assets.judgeGavelDownImage;
                    setScaledSpriteDimensions(enemy, enemy.imgUp, JUDGE_TARGET_HEIGHT);
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
            assets.tenantImages = [
                assets.tenant1, assets.tenant2, assets.tenant3,
                assets.tenant4, assets.tenant5, assets.tenant6,
                assets.tenant7, assets.tenant8, assets.tenant9,
                assets.tenant10, assets.tenant11
            ];
            player.scale = 1;
            player.health = 1;
            player.invincible = false;
            updatePlayerImage();
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
            gameOver = false; gameWon = false; gameOverReason = ""; cameraX = 0;
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

            platforms.push(createPlatform(300, GROUND_LEVEL - 80, 80, 40, 'platformTexture1'));
            platforms.push(createPlatform(600, GROUND_LEVEL - 120, 80, 40, 'platformTexture2'));
            platforms.push(createPlatform(900, GROUND_LEVEL - 60, 80, 40, 'platformTexture1'));
            platforms.push(createPlatform(1300, GROUND_LEVEL - 100, 80, 40, 'platformTexture2'));
            platforms.push(createPlatform(1600, GROUND_LEVEL - 130, 80, 40, 'platformTexture1'));

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
                if (enemy.type === 'tenant') {
                    enemy.img = getRandomTenantImage();
                    setScaledSpriteDimensions(enemy, enemy.img, TENANT_TARGET_HEIGHT);
                } else if (enemy.type === 'judge') {
                    enemy.imgUp = assets.judgeGavelUpImage;
                    enemy.imgDown = assets.judgeGavelDownImage;
                    setScaledSpriteDimensions(enemy, enemy.imgUp, JUDGE_TARGET_HEIGHT);
                }
            });
            
            backgroundElements = [];
            bgNextX = 20;
            addDefaultBuildingSet();
        }

        function restartGame() { initGame(); if (!gameOver || player.isAlive) { lastTime = performance.now(); requestAnimationFrame(gameLoop); } }
        function setGameOver(reason) { player.isAlive = false; gameOver = true; gameOverReason = reason; let mtc = 'hardship'; if (reason.toLowerCase().includes('evicted') || reason.toLowerCase().includes('jop granted')) mtc = 'evicted'; addGameMessage(reason, player.x, player.y - 30, mtc); }

        function setGameWin() { player.isAlive = false; gameWon = true; }

        function updateHealthDisplay() {
            if (healthDisplay) healthDisplay.textContent = `Health: ${player.health}`;
        }

        function updateEvictionDisplay() {
            if (evictionDisplay) evictionDisplay.textContent = `Evictions: ${evictionCount}`;
        }

        function updatePlayerSize() {
            const prevHeight = player.height;
            player.scale = 1 + 0.07 * (player.health - 1);
            player.width = player.baseWidth * player.scale;
            player.height = player.baseHeight * player.scale;
            player.y -= player.height - prevHeight;
        }

        function updatePlayerImage() {
            if (player.health >= 25 && assets.playerImage25) player.img = assets.playerImage25;
            else if (player.health >= 15 && assets.playerImage15) player.img = assets.playerImage15;
            else if (player.health >= 10 && assets.playerImage10) player.img = assets.playerImage10;
            else if (player.health >= 5 && assets.playerImage5) player.img = assets.playerImage5;
            else player.img = assets.playerImage;
            setScaledSpriteDimensions(player, player.img, PLAYER_TARGET_HEIGHT);
        }

        function pauseWithGraphic(url, callback, extraClass = '') {
            if (!url) { if (callback) callback(); return; }
            if (gamePaused) { if (callback) callback(); return; }
            gamePaused = true;
            const img = document.createElement('img');
            img.src = url;
            img.className = 'power-up-graphic' + (extraClass ? ' ' + extraClass : '');
            gameContainer.appendChild(img);
            setTimeout(() => {
                if (gameContainer.contains(img)) gameContainer.removeChild(img);
                gamePaused = false;
                if (callback) callback();
            }, 2000);
        }

        function getPowerUpGraphic(newHealth) {
            switch (newHealth) {
                case 5: return POWER_GRAPHICS.up5;
                case 10: return POWER_GRAPHICS.up10;
                case 15: return POWER_GRAPHICS.up15;
                case 25: return POWER_GRAPHICS.up25;
                default: return null;
            }
        }

        function getPowerDownGraphic(prevHealth, newHealth) {
            if (prevHealth >= 25 && newHealth < 25) return POWER_GRAPHICS.down25;
            if (prevHealth >= 15 && newHealth < 15) return POWER_GRAPHICS.down15;
            if (prevHealth >= 10 && newHealth < 10) return POWER_GRAPHICS.down10;
            if (prevHealth >= 5 && newHealth < 5) return POWER_GRAPHICS.down5;
            return null;
        }

        function gainHealth() {
            if (player.health < player.maxHealth) {
                const prev = player.health;
                player.health++;
                const after = () => {
                    if (PROMOTION_THRESHOLDS.includes(player.health)) {
                        addGameMessage(PROMOTION_MESSAGES[player.health], player.x, player.y - 20, 'promotion');
                    }
                    updatePlayerImage();
                    updatePlayerSize();
                    updateHealthDisplay();
                    if (player.health === player.maxHealth) player.invincible = true;
                };
                const graphic = getPowerUpGraphic(player.health);
                if (graphic) pauseWithGraphic(graphic, after, 'level-up'); else after();
            }
        }

        function loseHealth(reason, typeClass) {
            if (player.invincible) return;
            if (player.health > 1) {
                const prev = player.health;
                player.health--;
                if (player.health < player.maxHealth) player.invincible = false;
                const after = () => {
                    if (PROMOTION_THRESHOLDS.some(t => prev >= t && player.health < t)) {
                        addGameMessage('DEMOTED', player.x, player.y - 20, 'demotion');
                    }
                    updatePlayerImage();
                    updatePlayerSize();
                    updateHealthDisplay();
                    addGameMessage(reason, player.x, player.y - 20, typeClass);
                };
                const graphic = getPowerDownGraphic(prev, player.health);
                if (graphic) pauseWithGraphic(graphic, after, 'demotion'); else after();
            } else {
                setGameOver(reason);
            }
        }
        function updatePlayer() { if (!player.isAlive) return; if (keys.left) player.dx = -player.speed; else if (keys.right) player.dx = player.speed; else player.dx = 0; player.x += player.dx; if (player.x < 0) player.x = 0; if (player.x + player.width > WORLD_WIDTH) player.x = WORLD_WIDTH - player.width; if (keys.up && player.isOnGround && !player.isJumping) { player.dy = -player.jumpPower; player.isJumping = true; player.isOnGround = false; } player.dy += GRAVITY; player.y += player.dy; player.isOnGround = false; platforms.forEach(platform => { if (player.x < platform.x + platform.width && player.x + player.width > platform.x && player.y < platform.y + platform.height && player.y + player.height > platform.y) { const prevPlayerBottom = player.y + player.height - player.dy; if (player.dy > 0 && prevPlayerBottom <= platform.y) { player.y = platform.y - player.height; player.dy = 0; player.isJumping = false; player.isOnGround = true; } else if (player.dy < 0 && (player.y - player.dy) >= (platform.y + platform.height)) { player.y = platform.y + platform.height; player.dy = 0; } else if (player.dx > 0 && (player.x + player.width - player.dx) <= platform.x) { player.x = platform.x - player.width; } else if (player.dx < 0 && (player.x - player.dx) >= (platform.x + platform.width)) { player.x = platform.x + platform.width; } } }); if (player.y + player.height > GAME_HEIGHT + 100) setGameOver("FELL INTO OBLIVION!"); }
        function updateEnemies() { enemies.forEach(enemy => { if (!enemy.isAlive) return; if (enemy.type === 'tenant') { enemy.x += enemy.dx * enemy.speed; if (enemy.x <= enemy.patrolStart || enemy.x + enemy.width >= enemy.patrolEnd) enemy.dx *= -1; let onPlatform = false; for (let platform of platforms) { if (enemy.x + enemy.width > platform.x && enemy.x < platform.x + platform.width && enemy.y + enemy.height >= platform.y && enemy.y + enemy.height <= platform.y + 10) { enemy.y = platform.y - enemy.height; onPlatform = true; break; } } } else if (enemy.type === 'judge') { enemy.gavelTimer++; if (enemy.gavelTimer >= enemy.gavelCycle) { enemy.gavelTimer = 0; enemy.gavelUp = !enemy.gavelUp; } } }); }
       function checkCollisions() {
           if (!player.isAlive) return;
            const now = performance.now();
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
                            const pool = player.health >= player.maxHealth ? tenantElimMessagesMax : tenantElimMessages;
                            const msg = pool[Math.floor(Math.random() * pool.length)];
                            addGameMessage(msg, enemy.x, enemy.y - 20, 'evicted');
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
                                const pool = player.health >= player.maxHealth ? judgeElimMessagesMax : judgeElimMessages;
                                const msg = pool[Math.floor(Math.random() * pool.length)];
                                addGameMessage(msg, enemy.x, enemy.y - 20, 'jop_granted');
                                player.dy = -player.jumpPower / 1.5;
                            } else {
                                const msg = judgeHitMessages[Math.floor(Math.random() * judgeHitMessages.length)];
                                if (!player.invincible && now - enemy.lastDamageTime > 1000) {
                                    loseHealth(msg, 'otsc_granted');
                                    enemy.lastDamageTime = now;
                                }
                            }
                        }
                    } else {
                        if (enemy.type === 'tenant') {
                            const msg = tenantHitMessages[Math.floor(Math.random() * tenantHitMessages.length)];
                            if (!player.invincible && now - enemy.lastDamageTime > 1000) {
                                loseHealth(msg, 'hardship');
                                enemy.lastDamageTime = now;
                            }
                            if (player.x + player.width / 2 < enemy.x + enemy.width / 2) {
                                player.x = enemy.x - player.width;
                            } else {
                                player.x = enemy.x + enemy.width;
                            }
                        } else if (enemy.type === 'judge') {
                            const msg = judgeHitMessages[Math.floor(Math.random() * judgeHitMessages.length)];
                            if (!player.invincible && now - enemy.lastDamageTime > 1000) {
                                loseHealth(msg, 'otsc_granted');
                                enemy.lastDamageTime = now;
                            }
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
            const drawX = pX - (player.anchorX || 0) * player.width;
            const drawY = pY - (player.anchorY || 0) * player.height;
            if (player.img && player.img.complete && player.img.naturalHeight !== 0) {
                ctx.drawImage(player.img, drawX, drawY, player.width, player.height);
            } else {
                const vW = player.width; const vH = player.height; const headRadius = vW / 2.5; ctx.fillStyle = '#2c3e50'; ctx.fillRect(drawX + vW * 0.15, drawY + vH * 0.6, vW * 0.3, vH * 0.4); ctx.fillRect(drawX + vW * 0.55, drawY + vH * 0.6, vW * 0.3, vH * 0.4); ctx.fillRect(drawX, drawY + vH * 0.2, vW, vH * 0.5); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(drawX + vW / 2, drawY + vH * 0.22); ctx.lineTo(drawX + vW * 0.4, drawY + vH * 0.45); ctx.lineTo(drawX + vW * 0.6, drawY + vH * 0.45); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFDBAC'; ctx.beginPath(); ctx.arc(drawX + vW / 2, drawY + headRadius + vH*0.02, headRadius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#333333'; ctx.beginPath(); ctx.arc(drawX + vW / 2, drawY + headRadius - headRadius*0.1 + vH*0.02, headRadius * 0.9, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText("S", drawX + vW / 2, drawY + vH * 0.45);
            } 
        }

        function drawEnemies() { 
            enemies.forEach(enemy => { 
                if (!enemy.isAlive) return; 
                const eX = enemy.x - cameraX;
                const eY = enemy.y;
                const dX = eX - (enemy.anchorX || 0) * enemy.width;
                const dY = eY - (enemy.anchorY || 0) * enemy.height;
                
                let currentEnemyImage = null;
                if (enemy.type === 'judge') {
                    currentEnemyImage = enemy.gavelUp ? enemy.imgUp : enemy.imgDown;
                } else { 
                    currentEnemyImage = enemy.img;
                }

                if (currentEnemyImage && currentEnemyImage.complete && currentEnemyImage.naturalHeight !== 0) {
                    ctx.drawImage(currentEnemyImage, dX, dY, enemy.width, enemy.height);
                } else {
                    const vW = enemy.width; const vH = enemy.height;
                    if (enemy.type === 'tenant') { 
                        const headRadius = vW / 3; ctx.fillStyle = enemy.colorPants; ctx.fillRect(dX + vW * 0.1, dY + vH * 0.55, vW * 0.35, vH * 0.45); ctx.fillRect(dX + vW * 0.55, dY + vH * 0.55, vW * 0.35, vH * 0.45); ctx.fillStyle = enemy.colorBody; ctx.fillRect(dX, dY + vH * 0.2, vW, vH * 0.4); ctx.fillStyle = enemy.colorFace; ctx.beginPath(); ctx.arc(dX + vW / 2, dY + headRadius, headRadius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText("T", dX + vW / 2, dY + vH * 0.45);
                    } else if (enemy.type === 'judge') {
                        ctx.fillStyle = enemy.robeColor; ctx.beginPath(); ctx.moveTo(dX, dY + vH); ctx.lineTo(dX, dY + vH * 0.15); ctx.quadraticCurveTo(dX + vW / 2, dY, dX + vW, dY + vH * 0.15); ctx.lineTo(dX + vW, dY + vH); ctx.closePath(); ctx.fill(); const headRadius = vW / 3.5; ctx.fillStyle = enemy.faceColor; ctx.beginPath(); ctx.arc(dX + vW / 2, dY + headRadius + vH * 0.05, headRadius, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#A0522D'; const gavelHandleX = dX + vW / 2 - GAVEL_WIDTH / 8; const gavelHandleY = enemy.gavelUp ? dY - GAVEL_HEIGHT * 1.2 : dY + vH * 0.1; ctx.fillRect(gavelHandleX, gavelHandleY, GAVEL_WIDTH / 4, GAVEL_HEIGHT * 1.5); ctx.fillStyle = '#8B4513'; const gavelHeadX = dX + vW / 2 - GAVEL_WIDTH / 2; const gavelHeadY = enemy.gavelUp ? dY - GAVEL_HEIGHT * 1.8 : dY + vH * 0.1 - GAVEL_HEIGHT * 0.6; ctx.fillRect(gavelHeadX, gavelHeadY, GAVEL_WIDTH, GAVEL_HEIGHT); ctx.fillStyle = '#FFF'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText("J", dX + vW / 2, dY + vH * 0.5);
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
            if (assets.background && assets.background.complete && assets.background.naturalHeight !== 0) {
                const bgParallaxFactor = 0.05;
                const bgImgWidth = assets.background.naturalWidth;
                const bgImgHeight = GAME_HEIGHT;

                let bgStartX = (-cameraX * bgParallaxFactor) % bgImgWidth;
                if (bgStartX > 0) {
                    bgStartX -= bgImgWidth;
                }

                for (let i = 0; (bgStartX + i * bgImgWidth) < GAME_WIDTH; i++) {
                    ctx.drawImage(assets.background, bgStartX + i * bgImgWidth, 0, bgImgWidth, bgImgHeight);
                }
            } else {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
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
        function drawWinMessage() {
            if (gameWon) {
                let msgContainer = gameContainer.querySelector('.game_win_message_container');
                if (!msgContainer) {
                    msgContainer = document.createElement('div');
                    msgContainer.className = 'game_over_message_container game_win_message_container';
                    msgContainer.innerHTML = `
                        <div class="title">CONGRATULATIONS!</div>
                        <img src="${GAME_WIN_GRAPHIC_URL}" alt="Victory" class="victory-graphic">
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
                        <div class="title">FIRED!</div>
                        <img src="${GAME_OVER_GRAPHIC_URL}" alt="Game Over" class="game-over-graphic">
                        <div class="game-over-reason" style="font-size: 0.7em; color: #FF6347; margin-bottom: 10px;">Housing is a human right!</div>
                        <div class="restart-text">Press 'R' to Restart</div>
                    `;
                    gameContainer.appendChild(msgContainer);
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
            if (gamePaused) {
                ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                drawBackground();
                drawPlatforms();
                updateCamera();
                drawPlayer();
                drawEnemies();
                drawWinMessage();
                drawGameOverMessage();
                requestAnimationFrame(gameLoop);
                return;
            }
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

window.addEventListener('DOMContentLoaded', function() {
    var charButtons = document.querySelectorAll('.character-option');
    Array.prototype.forEach.call(charButtons, function(btn) {
        btn.addEventListener('click', function() {
            selectedCharacter = this.dataset.char;
            if (characterSelect) characterSelect.style.display = 'none';
            loadAllAssets();
        });
    });
    // Initialize optional mobile controls and responsive scaling
    setupMobileControls();
    setupResponsiveCanvas();
});
