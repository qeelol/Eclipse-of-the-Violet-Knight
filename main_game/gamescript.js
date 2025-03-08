// load the game before showing the webpage
window.addEventListener('DOMContentLoaded', function() {    
    const canvas = document.getElementById('canvas1'); // set canvas 
    const ctx = canvas.getContext('2d'); // call getContext function to access unique draw functions

    const game = new Game(canvas); // create a new game

    // Base dimensions for scaling
    const BASE_WIDTH = canvas.width = 1920;
    const BASE_HEIGHT = canvas.height = 1080;
    
    function resizeCanvas() { // function to dynamically resize the canvas, using ratio of old and new.
        const previousWidth = canvas.width;
        const previousHeight = canvas.height;
    
        canvas.width = 1250;
        canvas.height = 669;
    
        game.width = canvas.width;
        game.height = canvas.height;
        game.scaleX = canvas.width / BASE_WIDTH;
        game.scaleY = canvas.height / BASE_HEIGHT;
    
        // Update player position
        const relativePlayerX = game.player.x / previousWidth;
        const relativePlayerY = game.player.y / previousHeight;
        game.player.x = canvas.width * relativePlayerX;
        game.player.y = canvas.height * relativePlayerY;
    
        // Update enemy position
        if (game.wave.traceHitBox) {
            game.wave.enemies.forEach(enemy => {
                const relativeEnemyX = enemy.x / previousWidth;
                const relativeEnemyY = enemy.y / previousHeight;
                enemy.x = canvas.width * relativeEnemyX;
                enemy.y = canvas.height * relativeEnemyY;
            })
        }// Update boss and its projectiles positions
        if (game.wave.bossWave) {
            game.wave.enemies[0].projectiles.forEach(projectile => {
                const relativeProjectileX = projectile.x / previousWidth;
                const relativeProjectileY = projectile.y / previousHeight;
                projectile.x = canvas.width * relativeProjectileX;
                projectile.y = canvas.height * relativeProjectileY;
            })
        }
    
        // Update background layers position
        game.layers.forEach(layer => {
            const relativeLayerX = layer.x / previousWidth;
            layer.width = layer.baseWidth * game.scaleX;
            layer.height = layer.baseHeight * game.scaleY;
            layer.x = relativeLayerX * canvas.width; // Adjust position based on new width
        });
    }

    // Resize the canvas when the window is resized
    window.addEventListener('resize', resizeCanvas);

    // Fullscreen change event listener
    document.addEventListener('fullscreenchange', resizeCanvas);

    // Initial canvas size
    resizeCanvas();

    // Handle visibility change to pause/resume the game
    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            cancelAnimationFrame(animationId);
            game.resetKeys();
        } else if (document.visibilityState === 'visible'){
            lastTime = performance.now(); // get the time elapsed since 
            animate(lastTime); // restart animation.
        }
    }

    let lastTime = 0;
    let animationId;  // To store the requestAnimationFrame ID

    function animate(timeStamp) { // function to call animation loop
        if (!game.gameOverFlag) {
            const deltaTime = timeStamp - lastTime; // stores how much time has passed after each frame
            lastTime = timeStamp; // because timeStamp is always increasing, assign  its value to lastTime
            game.render(ctx, deltaTime); // run class Game's render function to activate all classes and relevant mechanics.
            animationId = requestAnimationFrame(animate); // store the animation loop and call animate function infinitely.
        }
    }
    
    if (!game.gameOverFlag) { // to fix a logic error where death animation plays again when document is hidden.
        document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    const fullscreenButton = document.getElementById('fullscreen-btn'); // button to toggle fullscreen
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (canvas.requestFullscreen) {
                canvas.requestFullscreen();
            } else if (canvas.mozRequestFullScreen) { // Firefox
                canvas.mozRequestFullScreen();
            } else if (canvas.webkitRequestFullscreen) { // Chrome, Safari and Opera
                canvas.webkitRequestFullscreen();
            } else if (canvas.msRequestFullscreen) { // IE/Edge
                canvas.msRequestFullscreen();
            }
            fullscreenButton.textContent = 'Exit Fullscreen';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) { // Firefox
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { // IE/Edge
                document.msExitFullscreen();
            }
            fullscreenButton.textContent = 'Go Fullscreen';
        }
    }
    fullscreenButton.addEventListener('click', toggleFullscreen);

    // set audio
    const audioContext = new window.AudioContext(); // create a new AudioContext object.
    let source = null; 
    let currentSong = '../../asset/audio/cave_theme_1.wav';

    function playSong(url) { // purely for background music only, there's a separate class for sound effects.
        if (source) { // if a song is currently playing, stop it.
            source.stop();
        }
        fetch(url) // retrieve the specified audio file
        // promise is an object which represents the eventual completion or failure of an operation, .then and .catach.
            .then(response => response.arrayBuffer()) // create a Promise with .arrayBuffer storing binary data of audio file
            .then(data => audioContext.decodeAudioData(data)) // decodes data from .arrayBuffer into AudioBuffer object which now allows webKit API to play audio
            .then(buffer => {
                source = audioContext.createBufferSource(); // creates AudioBufferSourceNode which plays the audio
                source.buffer = buffer; // assigns dcoded audio data (buffer) to the AudioBufferSourceNode's buffer, telling it which audio data to use and play
                source.connect(audioContext.destination); // connects audio to endpoint device, speakers etc
                source.start(); // play the audio
                source.loop = true; // loop the audio
                source.playbackRate.value = 1; // set to speed 1
            })
            .catch(error => console.error('Error loading or decoding audio:', error)); // if there is an error, end the promise and log the error.
    }
      
    playSong('../../asset/audio/cave_theme_1.wav'); // play first bgm.

    window.addEventListener('keydown', () => { // as while True would lag the computer, keeping track of keydown is the easiest way.
        if (game.wave.bossWave && currentSong != '../../asset/audio/dungeon_theme_2.wav') { // so same track is not played more than once
            currentSong = '../../asset/audio/dungeon_theme_2.wav'; 
            playSong('../../asset/audio/dungeon_theme_2.wav');
        }
    })

    // call animate loop for the first time
    animate(0);
});

class sfx {
    constructor(url, vol, speed) {
        // setup is basically about the same as above
        this.audioContext = new window.AudioContext();
        this.url = url;

        fetch(this.url) 
            .then(response => response.arrayBuffer())
            .then(data => this.audioContext.decodeAudioData(data))
            .then(buffer => {
                this.source = this.audioContext.createBufferSource();
                this.source.buffer = buffer;
                this.gainNode = this.audioContext.createGain(); // create audioGainNode which allows changing of volume
                this.gainNode.gain.value = vol; // change the volume
                this.source.connect(this.gainNode);
                this.gainNode.connect(this.audioContext.destination)
                this.source.start();
                this.source.playbackRate.value = speed;
            })
            .catch(error => console.error(`Error loading sound`, error));
    }
}

class Player {
    constructor(game) {
        this.game = game; // so player can access game and context when needed
        this.baseWidth = 200;
        this.baseHeight = 127.73;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.x = this.game.width + this.width * 1.5 + 200;
        this.y = this.game.height - this.height;

        this.frameX = 0;
        this.frameY = 0;
        this.speed = 0;

        // idle
        this.idleState = true;

        // movement
        this.movingLeft = false;
        this.movingRight = false;

        // dashing
        this.dashing = false;
        this.dashed = false;
        this.dashFrameCount = 3; // amount of frames for the move, same for all (blank)FrameCount.
        this.maxDashFrames = 4;  // to make animation look smooth, same for all max(blank)Frames.
        this.lastDashTime = 0;
        this.dashCooldown = 1000;
        this.dashSpeed = 0;

        // jump and fall
        this.jump = false;
        this.fall = false;
        this.fallSpeed =  0.0466393503137688645; // lmao, basically this is to create the curve effect
        this.jumpSpeed = 2;
        this.baseJumpSpeed = 15;

        // landing
        this.landFrameCount = 0;
        this.landMaxFrame = 3;
        this.landFlag = false;

        // attacks
        this.attacking = false;
        this.attackFrameCount = 2;
        this.maxAttackFrames = 5; 
        this.attackCooldown = 500; 
        this.lastAttackTime = 0;
        this.validHits = 1;
        this.damage = 1;
        // different attack direction
        this.upAttack = false;
        this.downAttack = false;

        // heals
        this.heal = false;
        this.healFrameCount = 0;
        this.maxHealFrames = 7;
        this.potions = 3;
        this.maxPotions = 7;
        this.healAmount = 75;
        this.healCooldown = 300; 
        this.lastHealTime = 0;

        // flip direction
        this.flip = false;

        // hp
        this.hitpoint = 100;
        this.maxHitpoint = 100;
        this.playerDamaged = false;
        this.hurtFrameCount = 0;
        this.maxHurtFrames = 4
        this.dead = false;

        // hitbox logic
        this.clearAttackHitBox = false;

        this.spriteSet = document.getElementById('female_knight_full');
    }

    draw(context) {
        this.hitBox = {
            x: this.x + (100 * this.game.scaleX),
            y: this.y - (80 * this.game.scaleY),
            width: this.width * 0.5,
            height: this.height * 1.5
        } // calculate coordinates of hitbox to be passed to checkCollision
        // context.strokeRect(Math.floor(this.x + (100 * this.game.scaleX)), Math.floor(this.y - (80 * this.game.scaleY)), Math.floor(this.width * 0.5), Math.floor(this.height * 1.5))
        if (this.attacking && !this.clearAttackHitBox) { // so attackHitBox is only created WHEN player is attacking and cleared when player is NOT attacking
            if (this.upAttack && !this.downAttack) { // attackHitBox for upAttack
                this.attackHitBox = {
                    x: Math.floor(this.x + (50 * this.game.scaleX)), 
                    y: Math.floor(this.y - (110 * this.game.scaleY)), 
                    width: Math.floor(this.width), 
                    height: Math.floor(this.height * 0.8)
                }
                // context.strokeRect(Math.floor(this.x + (50 * this.game.scaleX)), 
                // Math.floor(this.y - (110 * this.game.scaleY)), 
                // Math.floor(this.width), 
                // Math.floor(this.height * 0.8))
            }
            else if (this.downAttack && !this.upAttack) { // attackHitBox for downAttack
                this.attackHitBox = {
                    x: Math.floor(this.x + (50 * this.game.scaleX)), 
                    y: Math.floor(this.y + (50 * this.game.scaleY)), 
                    width: Math.floor(this.width), 
                    height: Math.floor(this.height * 0.8)
                }
                // context.strokeRect(Math.floor(this.x + (50 * this.game.scaleX)), 
                // Math.floor(this.y + (50 * this.game.scaleY)), 
                // Math.floor(this.width), 
                // Math.floor(this.height * 0.8))
            }else { 
                if (!this.flip) { // attackHitBox for rightAttack
                    this.attackHitBox = {
                        x: Math.floor(this.x + (100 * this.game.scaleX)), 
                        y: Math.floor(this.y - (50 * this.game.scaleY)), 
                        width: Math.floor(this.width), 
                        height: Math.floor(this.height * 0.8)
                    }
                    // context.strokeRect(Math.floor(this.x + (100 * this.game.scaleX)), 
                    // Math.floor(this.y - (50 * this.game.scaleY)), 
                    // Math.floor(this.width), 
                    // Math.floor(this.height * 0.8))
                } else { // attackHitBox for leftAttack
                    this.attackHitBox = {
                            x: Math.floor(this.x + (0 * this.game.scaleX)), 
                            y: Math.floor(this.y - (50 * this.game.scaleY)), 
                            width: Math.floor(this.width), 
                            height: Math.floor(this.height * 0.8)
                        }
                    // context.strokeRect(Math.floor(this.x + (0 * this.game.scaleX)), 
                    // Math.floor(this.y - (50 * this.game.scaleY)), 
                    // Math.floor(this.width), 
                    // Math.floor(this.height * 0.8))
                }
            }
                
        }
        // Flip canvas horizontally if flip is true
        if (this.flip) { // facing left
            context.save(); // save THIS context so other images are not affected
            context.scale(-1, 1); // FLIP the player
            context.drawImage( // .drawImage draws an image, couldn't have seen that coming. In this context it accepts 9 arguments.
                this.spriteSet,  // target Image
                this.baseWidth * this.frameX, // horizontal position of image to be cropped out
                this.frameY * this.baseHeight, // vertical position of image to be cropped out
                this.baseWidth, // width of image to be cropped out
                this.baseHeight, // height of image to be cropped out
                -this.x - this.width * 1.5, // horizontal position of image relative to canvas
                this.y - this.height * 0.67, // vertical position of image relative to canvas
                this.width * 1.5, // width of image relative to canvas, in this case I want to make the sprite larger
                this.height * 1.5 // height of image relative to canvas
            );            
            context.restore(); // restore only THIS context so other images are not affected
        } else { // facing right
            context.drawImage(
                this.spriteSet, 
                this.baseWidth * this.frameX, 
                this.frameY * this.baseHeight, 
                this.baseWidth, 
                this.baseHeight, 
                this.x, 
                this.y - this.height * 0.67, 
                this.width * 1.5, 
                this.height * 1.5
            );
        }
    }

    update() {
        // Update dimensions based on scaling factors
        this.width = this.baseWidth * this.game.scaleX;
        this.height = this.baseHeight * this.game.scaleY;
        this.enemy = this.game.wave.enemies;
        if (!this.game.wave.bossWave) { // if no boss, camera follows player. Else, static
            this.speed = 0;
            this.dashSpeed = 0;
        } else {
            this.speed = 12;
            this.dashSpeed = 30;
        }
        // Handle jump and fall
        if (this.jump) {
            this.resetMove()
            this.frameY = 28; // set which row of sprite to use
            if (!this.fall) {  // jumping animation
                if (this.game.spriteUpdate) {
                    this.frameX < 5 ? this.frameX++ : this.frameX = 5; // this.frameX increases, jumping to next sprite.
                    this.resetDash() // if not activated, there's a bug where dash is triggered until player lands.
                    // at a cost, dashtime is severely reduced when jumping.
                }
                if (this.y >= this.game.height * 0.3) { // reduce the y of player to create jump effect.
                    this.y -= this.baseJumpSpeed * (this.jumpSpeed -= this.fallSpeed) * this.game.scaleY; // fallspeed acts like gravity to create curve
                } else {
                    this.fall = true; // this will stop jump and start fall
                }
            } else { // falling animation
                if (this.game.spriteUpdate) {
                    this.frameX >= 0 ? this.frameX-- : this.frameX = 5; // frameX decreases creating falling illusion.
                    this.resetDash() // same reason as above
                }
                if (this.y < this.game.height - this.height * 0.67 && !this.landFlag) { // increase y until ground, this.landFlag to prevent infinite landing animation bug
                    this.y += this.baseJumpSpeed * (this.fallSpeed += 0.06) * this.game.scaleY; // fallSpeed increases exponentially, creating a curve
                // handle landing
                } else {
                    this.frameY = 24
                    this.landFlag = true;
                    this.game.spriteInterval = 10; // make animation very fast, else it'll cause unnecessary delay.
                    this.y = this.game.height - this.height; // due to error in spritesheet, there needs to be an offset so animation plays at correct position
                    if (this.game.spriteUpdate) {
                        if (this.landFrameCount < this.landMaxFrame) { // ensures all frames are played
                            this.frameX = this.landFrameCount; 
                            this.landFrameCount++;
                        } else {
                            this.reset() // reset the player
                        }
                    }
                }
            }
        }

        // Handle horizontal movement
        if (this.game.keys.indexOf('KeyD') > -1 && !this.heal || this.movingRight) { // player shouldn't move when healing
            this.movingRight = true;
            this.movingLeft = false;
            this.idleState = false;
            this.flip = false; // Face right
            this.x += this.speed * this.game.scaleX;
            if (this.game.spriteUpdate && !this.jump && !this.fall && !this.attacking && !this.dashing) { // run animation
                this.frameY = 15;
                this.frameX < 6 ? this.frameX++ : this.frameX = 0;
            }
        } else if (this.game.keys.indexOf('KeyA') > -1 && !this.heal || this.movingLeft) {
            this.movingLeft = true;
            this.movingRight = false;
            this.idleState = false;
            this.flip = true; // Face left
            this.x -= this.speed * this.game.scaleX;
            if (this.game.spriteUpdate && !this.jump && !this.fall && !this.attacking && !this.dashing) {
                this.frameY = 15;
                this.frameX < 6 ? this.frameX++ : this.frameX = 0;
            }
        }
        // handle dashing
        if (this.game.keys.indexOf('AltLeft') > -1 && !this.dashed) {
            this.idleState = false;
            if (this.canDash()) { // make sure dash cooldown is up
                this.dashing = true;
            }
            if (this.dashing) {
                this.frameY = 3;
                this.game.spriteInterval = 100;
                if (this.game.spriteUpdate) {
                    if (this.dashFrameCount < this.maxDashFrames) {
                        this.frameX = this.dashFrameCount;
                        this.dashFrameCount++;
                    } else {
                        // Reset dash animation state after completing the dash
                        this.dashed = true;
                        this.dashing = false;
                        if (!this.jump && !this.fall) {this.reset()};
                    }
                }
                if(!this.flip) {
                    this.x += this.dashSpeed * this.game.scaleX
                }
                else if (this.flip) {
                    this.x -= this.dashSpeed * this.game.scaleX
                }        
                this.lastDashTime = Date.now(); // return current time so it can be checked by canDash 
            }
        }

        // Horizontal movement boundaries
        if (this.x < 0 - this.width * 0.4) {
            this.x = 0 - this.width * 0.4; // player cannot move past left wall
        } else if (this.x > this.game.width - this.width) {
            this.x = this.game.width - this.width; // same here except right wall
        }

        // Handle idle animation
        if (!this.jump && !this.fall && this.idleState && !this.attacking && !this.dashing && !this.dead) {
            this.frameY = 30;
            this.y = this.game.height - this.height;
            this.resetMove();
            if (this.game.spriteUpdate) {
                this.frameX < 3 ? this.frameX++ : this.frameX = 0;
            }
        }
        
        // Handle attack animation
        if (this.attacking && !this.dead) {
            this.clearAttackHitBox = false; // activate attackHitBox
            this.game.spriteInterval = 60;
            this.frameY = 10;
            this.lastHealTime = Date.now(); // delay the heal 
            // change if downattack true
            if (this.upAttack && !this.downAttack) {
                this.frameY = 12;
            }
            // change if upattack true
            else if (this.downAttack && !this.upAttack) {
                this.frameY = 13;
            };
            if (this.game.spriteUpdate) {
                if (this.attackFrameCount < this.maxAttackFrames) {
                    this.frameX = this.attackFrameCount;
                    this.attackFrameCount++;
                    this.lastAttackTime = Date.now(); // set attack to cooldown so not triggered when spamming.
                    this.lastDashTime = Date.now() - 200; // else player can abuse dash while attacking.
                } else {
                    // Reset attack animation state after completing the attack
                    this.attacking = false;
                    this.resetHitBox();
                    if (!this.jump && !this.fall) {this.reset()};
                }
            };
            if (this.game.wave.traceHitBox) { // flag to ensure error does not occur when enemy.hitBox does not exist.
                this.enemy.forEach(enemy => {
                    if (this.game.checkCollision(this.attackHitBox, enemy.hitBox) && this.validHits > 0){
                        enemy.hitpoint -= this.damage; // reduce target enemy's hp
                        enemy.damaged = true; // play hurt animation of enemy, very buggy though.
                        this.validHits--; // reduce valid hits so only hits one enemy once.
                    } if (!this.attacking) {
                        this.validHitsReset(); // once attack ends, reset validHits.
                    }
                })
            }
            
        }
        // Handle heal animation
        if (this.heal && !this.dead && !this.jump && !this.fall && this.potions > 0) {
            this.game.spriteInterval = 60;
            this.frameY = 2;
            this.resetMove(); // player stops moving else animation seems awkward.
            if (this.game.spriteUpdate) {
                if (this.healFrameCount < this.maxHealFrames) {
                    this.frameX = this.healFrameCount;
                    this.healFrameCount++;
                    this.lastHealTime = Date.now(); // put here, else heal is triggered infinitely when spamming
                } else {
                    // Reset heal animation state after completing the animation, reduce potion number and heal player
                    this.potions--;
                    this.hitpoint += this.healAmount;
                    if (this.hitpoint > this.maxHitpoint) {
                        this.hitpoint = this.maxHitpoint;
                    };
                    this.heal = false;
                    this.healFrameCount = 0;
                    if (!this.jump && !this.fall) {this.reset()} // so player can move
                }
            }
        }
        // Handle hurt animation
        if (this.playerDamaged && !this.dead && !this.jump && !this.fall) {
            this.idleState = false;
            this.frameY = 32;
            this.game.spriteInterval = 20
            if (this.game.spriteUpdate) {
                if (this.hurtFrameCount < this.maxHurtFrames) {
                    this.frameX = this.hurtFrameCount;
                    this.hurtFrameCount++;
                } else {
                    this.reset()
                }
            }
        }
        if (this.dead) {
            this.idleState = false;
            this.playerDamaged = false;
            this.game.spriteInterval = 140;
            this.frameY = 14
            if (this.game.spriteUpdate) {
                this.frameX < 5 ? this.frameX++ : this.frameX = 5;
                if (this.frameX === 5) {
                    this.game.gameOverFlag = true; // so game ends.
                }
            }
            
        }
    }

    resetJump() {
        this.jump = false;
        this.fall = false;
        this.fallSpeed =  0.0466393503137688645;
        this.jumpSpeed = 2
        this.landFrameCount = 0;
        this.landFlag = false;
    }

    resetAttack() {
        this.downAttack = false;
        this.upAttack = false;
        this.attacking = false;
        this.attackFrameCount = 2;
    }

    resetDash() {
        this.dashed = true;
        this.dashing = false;
        this.dashFrameCount = 3;
    }

    resetMove() {
        this.movingRight = false;
        this.movingLeft = false;
    }

    resetHitBox() {
        this.attackHitBox = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        this.clearAttackHitBox = true;
    }

    resetHurt() {
        this.hurtFrameCount = 0;
    }

    reset() {
        this.frameX = 0;
        this.idleState = true;
        this.playerDamaged = false;
        this.resetJump();
        this.resetAttack();
        this.resetDash();
        this.resetHitBox();
        this.resetMove();
        this.resetHurt()
        this.game.spriteInterval = 100;
    }

    // these set cooldowns, where the current time when function is called minus the last(blank)Time must be greater than the milliseconds specified in cooldown.
    canAttack() {
        // Check if enough time has passed since the last attack
        return Date.now() - this.lastAttackTime >= this.attackCooldown;
    }

    canHeal() {
        return Date.now() - this.lastHealTime >= this.healCooldown;
    }

    canDash() {
        this.dashed = false;
        return Date.now() - this.lastDashTime >= this.dashCooldown;
    }

    validHitsReset() {
        this.validHits = 1;
    }
}

class Background {
    constructor(game, layer, speedModifier, baseWidth, baseHeight) { // baseWidth and baseHeight to cater to different dimensions
        this.game = game;
        this.baseWidth = baseWidth;
        this.baseHeight = baseHeight;
        this.width = this.baseWidth * this.game.scaleX;
        this.height = this.baseHeight * this.game.scaleY;
        this.x = 0;
        this.y = 0;
        
        this.layer = layer;
        this.speedModifier = speedModifier; // determines how fast each layer moves
        this.speed = 15 * this.speedModifier; // speed when player runs
        this.dashSpeed = 300 * this.speedModifier; // speed when player dashes

        this.dashFrames = 0; 
        this.dashTotalFrames = 10; 

        this.end = 1;
        this.maxEnd = 11;
    }

    draw(context) {
        context.drawImage(this.layer, this.x, this.y, this.width, this.height); // dx, dy, dwidth, dheight.
        context.drawImage(this.layer, this.x + this.width - this.speed, this.y, this.width, this.height);
        context.drawImage(this.layer, this.x - this.width + this.speed, this.y, this.width, this.height);
    }

    update() {
        // Update dimensions based on scaling factors
        this.width = this.baseWidth * this.game.scaleX;
        this.height = this.baseHeight * this.game.scaleY;
        // Check background position
        if (this.x >= this.width) {
            this.x = 0 + this.speed;
            if (this.end >= 0){ // logic for class Wave where wave won't trigger until player moves right.
                this.end--;
            }
            else {
                this.end = 0;
            }
                
        }
        else if (this.x <= -this.width) {
            this.x = 0 - this.speed;
            if (this.end < this.maxEnd){
                this.end++;
            }
            else {
                this.end = 0;
            }
        }

        // Player movement = background movement
        if (this.game.player.movingRight && !this.game.player.movingLeft) {
            this.x = Math.floor(this.x - this.speed * this.game.scaleX);
        } else if (this.game.player.movingLeft && !this.game.player.movingRight) {
            this.x = Math.floor(this.x + this.speed * this.game.scaleX);
        }

        // Handle dashing
        if (this.game.player.dashing && this.dashFrames === 0) {
            this.dashFrames = this.dashTotalFrames;
        }

        if (this.dashFrames > 0) {
            this.dash();
            this.dashFrames--;
        }
    }

    dash() { // logic to slow down the speed of bg when dashing
        if (!this.game.player.flip) {
            this.x = Math.floor(this.x - (this.dashSpeed / this.dashTotalFrames) * this.game.scaleX); 
        } else {
            this.x = Math.floor(this.x + (this.dashSpeed / this.dashTotalFrames) * this.game.scaleX);
        }
    }

    resize(scaleX, scaleY) {
        // Adjust position proportionally based on the new scale factors
        this.x *= scaleX / this.game.scaleX;
        this.y *= scaleY / this.game.scaleY;
        
        // Update dimensions based on new scaling factors
        this.width = this.baseWidth * scaleX;
        this.height = this.baseHeight * scaleY;
    }
}

class Enemy {
    constructor(game) {
        this.game = game;

        this.player = this.game.player;
        this.playerReached = false; // flag to trigger attack logic

        this.flip = true;

        this.markedForDeletion = false; // flag to trigger deletion from array to remove it, else it still exists in the game and will follow the player
    }
    draw(context) {
        this.hitBox = {
            x: Math.floor(this.x + (this.offSetX1 * this.game.scaleX)), 
            y: Math.floor(this.y + (this.offSetY1 * this.game.scaleY)), 
            width: Math.floor(this.width + (this.offSetWidth1 * this.game.scaleX)), 
            height: Math.floor(this.height + (this.offSetHeight1 * this.game.scaleY))
        }
        // context.strokeRect(Math.floor(this.x + (this.offSetX1 * this.game.scaleX)), 
        // Math.floor(this.y + (this.offSetY1 * this.game.scaleY)), 
        // Math.floor(this.width + (this.offSetWidth1 * this.game.scaleX)), 
        // Math.floor(this.height + (this.offSetHeight1 * this.game.scaleY)))
        if (this.flip) {
            context.save()
            context.scale(-1, 1)
            context.drawImage(
                this.image,
                this.frameX * this.baseWidth,
                this.frameY * this.baseHeight,
                this.baseWidth,
                this.baseHeight,
                -this.x - this.width * this.scaling,
                this.y,
                this.width * this.scaling,
                this.height * this.scaling
            )
            context.restore();
            if (this.attacking && !this.clearAttackHitBox) {
                this.attackHitBox = {
                    x: Math.floor(this.x - (this.offSetX4 * this.game.scaleX)),
                    y: Math.floor(this.y + (this.offSetY4 * this.game.scaleY)),
                    width: Math.floor(this.width + (this.offSetWidth4 * this.game.scaleX)),
                    height: Math.floor(this.height + (this.offSetHeight4 * this.game.scaleY))
                }
                // context.strokeRect(Math.floor(this.x - (this.offSetX4 * this.game.scaleX)),
                // Math.floor(this.y + (this.offSetY4 * this.game.scaleY)),
                // Math.floor(this.width + (this.offSetWidth4 * this.game.scaleX)),
                // Math.floor(this.height + (this.offSetHeight4 * this.game.scaleY)))
            }
            
        } else {
            context.drawImage(
                this.image, 
                this.frameX * this.baseWidth, 
                this.frameY * this.baseHeight, 
                this.baseWidth,
                this.baseHeight, 
                this.x, 
                this.y, 
                this.width * this.scaling, 
                this.height * this.scaling
            )
            if (this.attacking && !this.clearAttackHitBox) {
                this.attackHitBox = {
                    x: Math.floor(this.x + (this.offSetX3 * this.game.scaleX)),
                    y: Math.floor(this.y + (this.offSetY3 * this.game.scaleY)),
                    width: Math.floor(this.width + (this.offSetWidth3 * this.game.scaleX)),
                    height: Math.floor(this.height + (this.offSetHeight3 * this.game.scaleY))
                }
                // context.strokeRect(Math.floor(this.x + (this.offSetX3 * this.game.scaleX)),
                // Math.floor(this.y + (this.offSetY3 * this.game.scaleY)),
                // Math.floor(this.width + (this.offSetWidth3 * this.game.scaleX)),
                // Math.floor(this.height + (this.offSetHeight3 * this.game.scaleY)))
            }
        }
    }
    update(context) {
        // update base dimensions according to window size
        this.width = this.baseWidth * this.game.scaleX;
        this.height = this.baseHeight * this.game.scaleY;

        // trigger running ANIMATION ONLY
        if (!this.playerReached || this.cannotMove) {
            this.frameY;
            this.animation(); // wish I had this idea beforehand, oh well. Anyways, it triggers the animation.
        };

        // trigger relevant animations when cannot move.
        if (!this.cannotMove) {
            
            // trigger running logic
            if (!this.playerReached && !this.player.dashing) {
                this.idleState = false; // make sure it's only running.
                if (!this.flip) { // when enemy is facing right
                    // Check if player is within range, what in the world is this mess.
                    // I'm not sure how this works, but for some reason enemy just flips infinitely when player is too close, but this next line solves that problem.
                    if (this.x >= Math.floor(this.player.x * this.offSet1 - this.width * this.attackRange) &&
                        this.x <= Math.floor(this.player.x * this.offSet1 - this.width) && !this.player.dashing) {
                            this.playerReached = true;
                            this.idleState = true;
                    } else {
                        if (this.x < Math.floor(this.player.x * this.offSet1 - this.width * this.attackRange - this.speed)) {
                            this.flip = false;
                            this.x = Math.floor(this.x + this.speed * this.game.scaleX);
                        } else if (this.x > Math.floor(this.player.x * this.offSet1 - this.width * this.attackRange + this.speed)) {
                            this.flip = true;
                            this.x = Math.floor(this.x - this.speed * this.game.scaleX);
                        } else {
                            this.playerReached = true;
                            this.idleState = true;
                        }
                    }
                } else { // when enemy is facing left, i hate these offsets.
                    // Check if player is within range
                    if (this.x >= Math.floor(this.player.x * this.offSet2 - this.width)  &&
                        this.x <= Math.floor(this.player.x * this.offSet2 + this.width * this.attackRange) && !this.player.dashing) {
                        // Move enemy back if player is within range
                        this.playerReached = true;
                        this.idleState = true;
                    } else {
                        if (this.x < Math.floor(this.player.x * this.offSet2 + this.width * this.attackRange - this.speed)) {
                            this.flip = false;
                            this.x = Math.floor(this.x + this.speed * this.game.scaleX);
                        } else if (this.x > Math.floor(this.player.x * this.offSet2 + this.width * this.attackRange + this.speed)) {
                            this.flip = true;
                            this.x = Math.floor(this.x - this.speed * this.game.scaleX);
                        } else {
                            this.playerReached = true;
                            this.idleState = true;
                        }
                    }
                }            
            };

            // handle idlestate animation
            if (this.idleState && !this.canAttack()) {
                this.animation()
            };

            // handle attack animation when plyaer is in range
            if (this.playerReached) {
                if (this.canAttack()) { // make sure cooldown is up
                    this.game.spriteInterval = 60;
                    this.animation();
                    if (this.frameX === this.maxFrames) {
                        new sfx('../../asset/audio/enemy_slash.mp3', 1, 2); // create new sfx.
                        this.lastAttackTime = Date.now() // return cooldown.
                        this.frameX = 0;
                    } if (this.attackTime1 < this.frameX){
                        this.attacking = true; // for other logic.
                    }
                }
                else if (!this.canAttack() && this.frameX === 0) { // reset playerReached when canAttack not true, else enemy will stay in place.
                    this.playerReached = false;
                    this.attacking = false;
                    this.resetInterval(); // set spriteInterval to normal
                };
                if (this.game.checkCollision(this.attackHitBox, this.player.hitBox)){ // check if enemy hit player or not.
                    if (this.validHits > 0) {
                        this.player.hitpoint -= this.damage;
                        this.player.playerDamaged = true;
                        this.validHits--;
                    }
                } else {
                    this.validHitsReset(); // reset validhits.
                }
            };
        }

        // create illusion that enemy is moving along with bg, else it will follow player making it seem very weird.
        if (this.player.movingLeft && !this.game.wave.bossWave && !this.player.dashing) {
            this.x += 15 * this.game.scaleX;
        } else if (this.player.movingRight && !this.game.wave.bossWave && !this.player.dashing) {
            this.x -= 15 * this.game.scaleX;
        };
        // create same illusion when dashing player
        if (this.player.dashing && !this.game.wave.bossWave) {
            if (!this.player.flip) {
                this.x -= 40 * this.game.scaleX;
            } else {
                this.x += 40 * this.game.scaleX;
            }
        };

        // handle hurt animation
        if (this.damaged) {
            this.cannotMove = true;
            if (this.frameX === this.maxFrames) {
                this.reset()
                this.cannotMove = false;
                this.damaged = false;
            }
        }
        // handle death animation
        if (this.dead) {
            this.cannotMove = true;
            if (this.frameX >= this.maxFrames) {
                this.markedForDeletion = true;
            }
        }
    }
    animation() {
        if (this.game.spriteUpdate) {
            this.frameX < this.maxFrames ? this.frameX++ : this.frameX = 0;
        }       
    }
    reset() {
        this.idleState = false;
        this.playerReached = false;
    }
    resetInterval() {
        this.game.spriteInterval = 100;
    }
    resetAttackHitBox() {
        this.clearAttackHitBox = true;
        this.attackHitBox = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }
    canAttack() {
        return Date.now() - this.lastAttackTime >= this.attackCooldown;
    }
}

class Nightborne extends Enemy {
    constructor(game) {
        super(game); // to gain access to everything in super class.

        this.image = document.getElementById('nightborne');

        // dimension and position
        
        this.x = 5000 * this.game.scaleX;
        this.y = 610 * this.game.scaleY;
        this.baseWidth = 80;
        this.baseHeight = 80;
        this.scaling = 7;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.attackRange = 5;

        // OFFSETS, holy hell.
        this.offSet1 = 1; // offset in draw()
        this.offSet2 = 0.7; 
        this.offSetX1 = 210 // if !this.flip
        this.offSetY1 = 250
        this.offSetWidth1 = 90
        this.offSetHeight1 = 100;
        this.offSetX2 = -350 // if this.flip
        this.offSetY2 = 250
        this.offSetWidth2 = 90
        this.offSetHeight2 = 100;
        this.offSetX3 = this.offSetX1; // if !this.flip and this.attacking 
        this.offSetY3 = 50;
        this.offSetWidth3 = 270;
        this.offSetHeight3 = 300;
        this.offSetX4 = -27; // if this.flip and this.attacking
        this.offSetY4 = this.offSetY3;
        this.offSetWidth4 = this.offSetWidth3;
        this.offSetHeight4 = this.offSetHeight3;

        // hitbox
        this.hitBox = super.hitBox // since hitbox in super already takes into consideration its extensions' dimensions.
        this.attackHitBox = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
        this.clearAttackHitBox = false; // allow creation of attackHitBox
        this.hitpoint = 3; // how much health nightborne has, since player only does 1 damage anyways 

        // movement
        this.speed = 1;

        // frames
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrames = 0;

        // attacking
        this.lastAttackTime = 0;
        this.attackCooldown = 1500;
        this.attackTime1 = 8;
        this.damage = 20;
        this.validHits = 1;

        // idle
        this.idleState = false;

        // death
        this.audioPlayFlag = true;
    }

    draw(context) { // call super.draw because no additional logic needs to be done here.
        super.draw(context)
    }

    update() {
        super.update() // call super.update because base logic is all there.
        
        // set frames of running
        if (this.player.idleState || this.game.player.movingRight || this.game.player.movingLeft) {
            this.frameY = 1;
            this.maxFrames = 5;
        }

        // set frames of attack and produce attackhitbox
        if (this.playerReached && this.canAttack()) {
            this.clearAttackHitBox = false;
            this.frameY = 2;
            this.maxFrames = 11;
        }
        // when player still in enemy range but enemy can't attack, reset attackhitbox so it is not triggered.
        if (this.idleState && !this.canAttack()) {
            super.resetAttackHitBox()
            this.frameY = 0;
            this.maxFrames = 8;
        }
        // set frames of huhrt
        if (this.damaged) {
            this.frameY = 3;
            this.maxFrames = 4
        }
        // set frames of death
        if (this.hitpoint <= 0) {
            this.dead = true;
            this.game.spriteInterval = 60;
            this.frameY = 4;
            this.maxFrames = 21
        }
        // trigger audio play during death explosion.
        if (this.dead && this.frameX === this.maxFrames - 10 && this.audioPlayFlag) {
            new sfx('../../asset/audio/nightborne_death.mp3', 0.5, 2);
            this.audioPlayFlag = false;
        }
    }
    
    reset() { // trigger super.reset since all logic is there.
        super.reset();
    }

    validHitsReset() { // reset validHits, reason there isn't one in super because I want it to be different for some future enemies.
        this.validHits = 1;
    }
}

class Skeleton extends Enemy {
    constructor(game) { // about the same with nightborne.
        super(game);

        this.image = document.getElementById('skeleton');

        // dimension and position
        this.x = 5000 * this.game.scaleX;
        this.y = 550 * this.game.scaleY
        this.baseWidth = 150;
        this.baseHeight = 150;
        this.scaling = 5;
        this.width = this.baseWidth;
        this.height = this.baseHeight;
        this.attackRange = 2.5;

        // Here we go again, offsets.
        this.offSet1 = 0.75; // offset in draw()
        this.offSet2 = 0.7;
        this.offSetX1 = 260 // if !this.flip
        this.offSetY1 = 250
        this.offSetWidth1 = 50
        this.offSetHeight1 = 100;
        this.offSetX3 = 258; // if !this.flip and this.attacking 
        this.offSetY3 = 200;
        this.offSetWidth3 = 312;
        this.offSetHeight3 = 135;
        this.offSetX4 = 0; // if this.flip and this.attacking
        this.offSetY4 = this.offSetY3;
        this.offSetWidth4 = this.offSetWidth3;
        this.offSetHeight4 = this.offSetHeight3;

        // hitbox
        this.hitBox = super.hitBox
        this.attackHitBox = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
        this.clearAttackHitBox = false;
        this.hitpoint = 3;

        // movement
        this.speed = 1;

        // frames
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrames = 0;

        // attacking
        this.lastAttackTime = 0;
        this.attackCooldown = 1500;
        this.attackTime1 = 5;
        this.damage = 10;
        this.validHits = 1;

        // idle
        this.idleState = false;

        // death
        this.audioPlayFlag = true;
    }

    draw(context) {
        super.draw(context)
    }

    update() {
        super.update();

        // run frames
        if (this.player.idleState || this.game.player.movingRight || this.game.player.movingLeft) {
            this.frameY = 1;
            this.maxFrames = 3;
        }

        // attack frames
        if (this.playerReached && this.canAttack()) {
            this.clearAttackHitBox = false;
            this.frameY = 2;
            this.maxFrames = 7;
        }

        // idlestate frames
        if (this.idleState && !this.canAttack()) {
            super.resetAttackHitBox()
            this.game.spriteInterval = 200;
            this.frameY = 0;
            this.maxFrames = 3;
        }

        // hurt frames
        if (this.damaged && !this.dead) {
            this.frameY = 5;
            this.maxFrames = 3
        }

        // death frames
        if (this.hitpoint <= 0) {
            this.dead = true;
            this.frameY = 4;
            this.maxFrames = 7;
        }

        // trigger death sound
        if (this.dead && this.audioPlayFlag) {
            new sfx('../../asset/audio/skeleton_death.mp3', 0.8, 2);
            this.audioPlayFlag = false;
        }
    }
    
    reset() {
        super.reset()
    }

    validHitsReset() {
        this.validHits = 1;
    }
}

class Boss_Golem extends Enemy {
    constructor(game) {
        super(game);

        this.image = document.getElementById('golem');
        this.bar = document.getElementById('bossbar'); // easier to put these here than game.
        this.health = document.getElementById('bosshealth');
        
        // dimension and position
        this.x = 3000 * this.game.scaleX;
        this.y = 400 * this.game.scaleY;
        this.baseWidth = 100;
        this.baseHeight = 100;
        this.scaling = 8;
        this.width = this.baseWidth;
        this.height = this.baseHeight;

        // peace and love.
        this.offSet1 = 0.75; // offset in draw()
        this.offSet2 = 0.7;
        this.offSetX1 = 260; // if !this.flip
        this.offSetY1 = 220;
        this.offSetWidth1 = 200;
        this.offSetHeight1 = 300;
        this.offSetX3 = 150; // if !this.flip and this.attacking 
        this.offSetY3 = 200;
        this.offSetWidth3 = 300;
        this.offSetHeight3 = 300;
        this.offSetX4 = -230; // if this.flip and this.attacking
        this.offSetY4 = this.offSetY3;
        this.offSetWidth4 = 210;
        this.offSetHeight4 = this.offSetHeight3;

        // hitbox
        this.hitBox = super.hitBox;
        this.attackHitBox = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        this.clearAttackHitBox = false;
        this.hitpoint = 10;
        this.bossDefeated = false;

        // movement
        this.speed = 6;
        this.angle = 0;
        this.angleSpeed = 0.03;

        // frames
        this.frameX = 0;
        this.frameY = 0;
        this.maxFrames = 0;

        // attacking
        this.lastAttackTime = 0;
        this.attackCooldown = 4000;
        this.attackTime1 = 5;
        this.damage = 25;
        this.validHits = 4; // punish player for camping golem
        this.projectiles = []; // push projectiles into this.
        this.maxProjectiles = 4; // max projectiles to create
        this.maxLaser = 1; // max lasers to create 
        this.laserHits = 50;
        this.launch = false;
        this.attackCount = 1;
        this.moveBoundFlag = true; // change position of golem, move left or right.
        this.newAttackPosition = true;
        this.selectAttack = true;
        this.laserAudioFlag = true;
        
        // idle
        this.idleState = false;
        this.floatTrigger = true; // basically the idle state which triggers sine wave movement
    }

    draw(context) {
        super.draw(context); // base drawing can be done by super.

        if (!this.bossDefeated) { // draw relevant assets.
            // draw health
            context.drawImage(
                this.health, 
                526 * this.game.scaleX, 
                65 * this.game.scaleY, 
                this.hitpoint * 17.5 * this.game.scaleX, 
                30 * this.game.scaleY
            );
            //draw  bar
            context.drawImage(
                this.bar, 
                460 * this.game.scaleX, 
                50 * this.game.scaleY, 
                1000 * this.game.scaleX, 
                80 * this.game.scaleY
            );
        }
        // draw projectiles
        this.projectiles.forEach(projectile => projectile.draw(context));
    }

    update(context) { // golem will have unique pattern, same as all bosses (if possible and actually have time T_T), update: I did not have time.
        this.width = this.baseWidth * this.game.scaleX;
        this.height = this.baseHeight * this.game.scaleY;
        if (this.x > this.game.width - this.width * this.scaling * 0.67 && !this.bossDefeated) { // make the golem move to the left initially
            this.x -= 5 * this.game.scaleX;
        } else { // so golem attacks only after this
            this.initialReached = true;
        }

        // logic to trigger where boss moves, make it seem more interesting..I hope.
        if (this.attackCount % 2 === 0 && !this.bossDefeated) {
            if (this.moveBoundFlag) {  // randomiser where golem will move to left or right every 2 attacks (1 initially)
                this.position = Math.floor(Math.random() * 2)
                this.moveBoundFlag = false; // so this.position is not triggered consecutively
            }
            if (this.position < 1) { // move to right
                this.flip = true;
                this.x < this.game.width - this.width * this.scaling * 0.67 ? 
                this.x += 15 * this.game.scaleX : 
                this.x = this.game.width - this.width * this.scaling * 0.67;
            } else { // move to left
                this.flip = false;
                this.x > 0 - this.width * this.scaling * 0.3 ? 
                this.x -= 15 * this.game.scaleX : 
                this.x = 0 - this.width * this.scaling * 0.3;
            }
        }

        // triggers float animation utilising sine wave
        if (this.floatTrigger) { 
            this.floatAnimation();
        }

        // if cannot move do not play these animations (remove this.cannotMove in damaged)
        if (!this.cannotMove) { 

            // logic to determine attack type.
            if (this.selectAttack) {
                this.attackType = Math.floor(Math.random() * 100);
                this.selectAttack = false; // so not triggered consecutively.
                if (this.hitpoint < 15) { // increase the chance of laser to 60%, make it tougher
                    this.attackType += 30
                }
            }

            // if cannot attack, do not create attack hit box and trigger idle
            if (this.idleState && !this.canAttack()) { 
                super.resetAttackHitBox();
                this.game.spriteInterval = 100;
                this.frameY = 1;
                this.maxFrames = 7;
                this.floatTrigger = true;
                this.animation()
            };

            if (this.hitpoint > 30) { // so attack 1 still plays regardless when hitpoint is above 30.
                this.attackType = 60;
            }

            // if can attack, attack
            if (this.canAttack()) { 
                // create projectiles (70% chance except when boss health is low.)
                if (this.attackType < 70 && this.initialReached) {
                    this.clearAttackHitBox = false;
                    this.frameY = 2;
                    this.maxFrames = 8;
                    this.floatTrigger = false;
                    this.game.spriteInterval = 60;

                    // run initial animation but stop at maxFrames
                    if (this.game.spriteUpdate) {
                        this.frameX < this.maxFrames ? this.frameX++ : this.frameX = this.maxFrames;
                    }

                    // allow projectiles to be launched, first condition
                    if (this.frameX === this.maxFrames) {
                        // Check if the number of projectiles is less than the maximum allowed projectiles
                        if (this.projectiles.length < this.maxProjectiles) {
                            // Generate a new target y-coordinate only if flag is true
                            if (this.newAttackPosition) {
                                this.targetY = Math.floor((Math.random() * 500 + 200) * this.game.scaleY);
                                this.newAttackPosition = false;
                            }
                    
                            // Move the object towards the target y-coordinate (dy)
                            if (this.y < this.targetY - 5 * this.game.scaleY) {
                                this.y += 5 * this.game.scaleY; // Moving up, scaled correctly
                            } else if (this.y > this.targetY + 5 * this.game.scaleY) {
                                this.y -= 5 * this.game.scaleY; // Moving down, scaled correctly
                            } else {
                                this.y = this.targetY; // When the y-coordinate is within the small range of the target, snap to target and shoot
                                this.shoot(); // trigger shoot logic
                                this.newAttackPosition = true; // Reset the flag for the next movement
                                new sfx('../../asset/audio/boss_projectile.mp3', 0.3, 2); // play sound
                            }
                        } else {
                            // If maximum projectiles are reached, reset frameX and prepare for the next attack cycle
                            this.lastAttackTime = Date.now();
                            this.frameX = 0;
                            this.attackCount++;
                            this.y = 400 * this.game.scaleY;
                            this.selectAttack = true;
                            this.moveBoundFlag = true;
                        }
                    }
                    
                    // If the attack animation has reached a certain frame, set attacking to true
                    if (this.attackTime1 < this.frameX) {
                        this.attacking = true;
                    } 
                } 
                // laser attack only triggered when hitpoint is less than 30, 30% chance except when boss hp is low. My favourite section
                else if (this.attackType >= 70 && this.initialReached && this.hitpoint <= 30) {
                    this.clearAttackHitBox = false;
                    this.frameY = 5;
                    this.maxFrames = 15;
                    this.floatTrigger = false;
                    this.game.spriteInterval = 100;
    
                    // play original animation but stay at maxframes.
                    if (this.game.spriteUpdate) {
                        this.frameX < this.maxFrames ? this.frameX++ : this.frameX = this.maxFrames;
                    }
    
                    // logic to move the golem to target Y when firing laser, else it'd be impossible to dodge.
                    if (this.y > (550 + 5) * this.game.scaleY) { // not used but might as well put it here just in case
                        this.y--;
                    } else if (this.y < (550 - 5) * this.game.scaleY) { // move down
                        this.y++;
                        if (this.laserAudioFlag) { // play laser based on y boundaries, else it'd be off-sync
                            if (this.y < (380 - 5) * this.game.scaleY) {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.0);
                            } else if (this.y < (401.25 - 5) * this.game.scaleY) {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.02);
                            } else if (this.y < (422.5 - 5) * this.game.scaleY) {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.04);
                            } else if (this.y < (443.75 - 5) * this.game.scaleY) {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.1);
                            } else if (this.y < (465 - 5) * this.game.scaleY) {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.12);
                            } else if (this.y < (486.25 - 5) * this.game.scaleY) {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.14);
                            } else if (this.y < (507.5 - 5) * this.game.scaleY) {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.16);
                            } else if (this.y < (528.75 - 5) * this.game.scaleY) {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.18);
                            } else {
                                new sfx('../../asset/audio/boss_laser.mp3', 0.5, 4.2);
                            }
                            this.laserAudioFlag = false;
                        }
                    } else { // logic when target Y reached
                        this.y = 550 * this.game.scaleY
                        this.laserHits--;
    
                        // ensure only one laser is created
                        if (this.projectiles.length < this.maxLaser) {
                            // fire laser when following are true
                            if (this.frameX === this.maxFrames && this.laserHits > 0) {
                                this.laser()
                            } else if (this.laserHits <= 0) { // reset everything otherwisem
                                this.lastAttackTime = Date.now();
                                this.frameX = 0;
                                this.attackCount++;
                                this.y = 400 * this.game.scaleY;
                                this.laserHits = 50;
                                this.moveBoundFlag = true;
                                this.selectAttack = true;
                                this.laserAudioFlag = true;
                            }
                        }
                }
                } 
            }
            // otherwise, do not create a projectile
            else {
                this.idleState = true;
                this.launch = false;
                this.attacking = false;
                this.resetInterval()
            };

            // create an attackHitBox so player cannot camp next to golem
            if (this.game.checkCollision(this.attackHitBox, this.player.hitBox)){
                if (this.validHits > 0) {
                    this.player.hitpoint -= this.damage;
                    this.player.playerDamaged = true;
                    this.validHits--;
                }
            } else {
                this.validHitsReset();
            } 
        } 
        // handle death
        if (this.hitpoint <= 0 && !this.bossDefeated) {
            this.floatTrigger = false; // so boss does not float
            this.cannotMove = true;
            
            if (this.y > (300 + 5) * this.game.scaleY) {
                this.y -= 5 * this.game.scaleY;
            }
            else if (this.y < (300 - 5) * this.game.scaleY) {
                this.y += 5 * this.game.scaleY
            }
            else { // if boss reached target Y, play death animation
                this.y = 300 * this.game.scaleY
                this.frameY = 7;
                this.maxFrames = 13;
                if (this.game.spriteUpdate) {
                    this.game.spriteInterval = 200;
                    if (this.frameX < this.maxFrames) {
                        this.frameX++
                    } else {
                        this.frameX = this.maxFrames
                        this.game.spriteInterval = 100
                        this.bossDefeated = true; // trigger victory.
                    }
                }
                // move player after boss dies
                if (this.player.x < this.game.width * 0.5 - this.player.width * 0.67 - (10 * this.game.scaleX)) {
                    this.player.movingRight = true;
                } else if (this.player.x > this.game.width * 0.5 - this.player.width * 0.67 + (10 * this.game.scaleX)) {
                    this.player.movingLeft = true;
                } else {
                    this.player.x = this.game.width * 0.5 - this.player.width * 0.67
                    this.game.wave.bossWave = false;
                    this.game.wave.mapClear = true;
                    this.game.victoryFlag = true;
                    this.player.reset()
                    this.game.resetKeys()
                }
            }
        } 

        // create illusion where boss stays still after death
        if (this.player.movingLeft && this.bossDefeated && !this.player.dashing) {
            this.x += 15 * this.game.scaleX;
        }
        else if (this.player.movingRight && this.bossDefeated && !this.player.dashing) {
            this.x -= 15 * this.game.scaleX;
        };

        // when boss dies, let it seem stationary while player continues moving.
        // won't have much use since after death user will be redirected back to home.
        if (this.player.dashing && this.bossDefeated) { 
            if (!this.flip) {
                if (!this.player.flip) {
                    this.x -= 40 * this.game.scaleX;
                } else {
                    this.x += 40 * this.game.scaleX;
                }
            } else {
                if (!this.player.flip) {
                    this.x -= 40 * this.game.scaleX;
                } else {
                    this.x += 40 * this.game.scaleX;
                }
            }
        };
        
        // delete the boss.
        if (this.bossDefeated && this.game.layer1.end === 0) {
            this.markedForDeletion = true;
        }
        
        // update each projectile and delete if hit player or reached end
        this.projectiles.forEach(projectile => projectile.update(this.hitpoint));
        this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion); 
    }

    floatAnimation() {
        this.y += Math.sin(this.angle) * this.game.scaleY;
        this.angle += this.angleSpeed; // as angle increases, sine changes.
    }

    // reset (probably not needed for this but I'll just leave it here)
    reset() {
        super.reset();
    }

    // reset valid hits
    validHitsReset() {
        this.validHits = 1;
    }

    // create the projectiles
    shoot() {
        const direction = this.flip ? -1 : 1; // set how the projectiles will be drawn
        const x = this.x
        const y = this.y
        this.projectiles.push(new Projectile_Golem(this.game, x, y, direction)); // set where the projectiles will be drawn
    }

    // create the laser
    laser() { // same logic with projectiles
        const direction = this.flip ? -1 : 1;
        const x = this.x
        const y = this.y
        this.projectiles.push(new Laser_Golem(this.game, x, y, direction));
    }
}

class Projectile_Golem extends Boss_Golem {
    constructor(game, x, y, direction) {
        super(game);
        this.image = document.getElementById('golem_projectile')
        this.x = x;
        this.y = y;
        this.speed = 7;  // Speed of the projectile
        this.direction = direction;
        this.markedForDeletion = false;

        this.offSetX1 = 50; // if this.flip
        this.offSetY1 = 250;
        this.offSetWidth1 = 180;
        this.offSetX2 = 500; // if !this.flip
        this.offSetY2 = this.offSetY1;
        this.offSetWidth2 = 150;

        this.validHits = 1;
        this.damage = 10;
        this.attackHitBox = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
    }

    draw(context) {
        if (this.direction === -1) {
            context.save()
            context.scale(-1, 1)
            context.drawImage(
                this.image,
                this.frameX * this.baseWidth,
                this.frameY * this.baseHeight,
                this.baseWidth,
                this.baseHeight,
                -this.x - this.width * this.scaling,
                this.y,
                this.width * this.scaling,
                this.height * this.scaling
            )
            context.restore();
            if (!this.markedForDeletion) {
                this.attackHitBox = {
                    x: this.x + (this.offSetX1 * this.game.scaleX), 
                    y: this.y + (this.offSetY1 * this.game.scaleY), 
                    width: this.width + (this.offSetWidth1 * this.game.scaleX),
                    height: this.height
                }
            }
            // context.strokeRect(
            //     this.x + (this.offSetX1 * this.game.scaleX), 
            //     this.y + (this.offSetY1 * this.game.scaleY), 
            //     this.width + (this.offSetWidth1 * this.game.scaleX), 
            //     this.height
            // )
        } else {
            context.drawImage(
                this.image, 
                this.frameX * this.baseWidth, 
                this.frameY * this.baseHeight, 
                this.baseWidth,
                this.baseHeight, 
                this.x, 
                this.y, 
                this.width * this.scaling, 
                this.height * this.scaling
            )
            if (!this.markedForDeletion) {
                this.attackHitBox = {
                    x: this.x + (this.offSetX2 * this.game.scaleX),
                    y: this.y + (this.offSetY2 * this.game.scaleY), 
                    width: this.width + (this.offSetWidth2 * this.game.scaleX), 
                    height: this.height
                }
                
            }
            // context.strokeRect(
            //     this.x + (this.offSetX2 * this.game.scaleX),
            //     this.y + (this.offSetY2 * this.game.scaleY), 
            //     this.width + (this.offSetWidth2 * this.game.scaleX), 
            //     this.height
            // )
        }
    }
    // update but store golem's hitpoint to increase damage and speed accordingly.
    update(hitpoint) {
        this.hitpoint = hitpoint;
        if (this.hitpoint < 15) { // increase damage and speed when hitpoint < 15
            this.damage = 15
            this.speed = 10
        }
        // update dimensions
        this.width = this.baseWidth * this.game.scaleX;
        this.height = this.baseHeight * this.game.scaleY;

        // move the projectile according to direction.
        this.x += this.speed * this.direction * this.game.scaleX

        // boundaries to delete projectiles so golem can shoot again.
        if (this.x > this.game.width - this.width || this.x < 0 - this.width * 3) {
            this.markedForDeletion = true;
        }
        // check whether it hit player or not and delete when true.
        if (!this.markedForDeletion) {
            if (this.game.checkCollision(this.attackHitBox, this.player.hitBox)) {
                this.player.hitpoint -= this.damage;
                this.markedForDeletion = true;
            }
        }
    }
}

class Laser_Golem extends Boss_Golem {
    constructor(game, x, y, direction) {
        super(game);
        this.image = document.getElementById('golem_laser')
        this.x = x;
        this.y = y;
        this.baseWidth = 300;
        this.baseHeight = 100;
        this.width = this.baseWidth * this.game.scaleX;
        this.height = this.baseHeight * this.game.scaleY;
        this.speed = 7;  // Speed of the projectile
        this.direction = direction;
        this.markedForDeletion = false;

        this.frameX = 0;
        this.frameY = 8;
        this.maxFrames = 14;

        this.offSetX1 = 1377; // if this.flip
        this.offSetY1 = 150;
        this.offSetHeight1 = 200;
        this.offSetX2 = 235; // if !this.flip
        this.offSetY2 = this.offSetY1;
        this.offSetHeight2 = this.offSetHeight1

        this.validHits = 50;
        this.damage = 1.5;
        this.attackHitBox = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        }
    }

    draw(context) {
        if (this.direction === -1) {
            context.save()
            context.scale(-1, 1)
            context.drawImage(
                this.image,
                this.frameX * this.baseWidth,
                this.frameY * this.baseHeight,
                this.baseWidth,
                this.baseHeight,
                -this.x - this.width * 2.6,
                this.y - (200 * this.game.scaleY),
                this.width * this.scaling,
                this.height * 15
            )
            context.restore();
            if (!this.markedForDeletion) {
                this.attackHitBox = {
                    x: this.x - (this.offSetX1 * this.game.scaleX), 
                    y: this.y + (this.offSetY1 * this.game.scaleY), 
                    width: this.game.width,
                    height: this.height + (this.offSetHeight1 * this.game.scaleY)
                }
            }
            // context.strokeRect(
            //     this.x - (this.offSetX1 * this.game.scaleX), 
            //     this.y + (this.offSetY1 * this.game.scaleY), 
            //     this.game.width, 
            //     this.height + (this.offSetHeight1 * this.game.scaleY)
            // )
        } else {
            context.drawImage(
                this.image, 
                this.frameX * this.baseWidth, 
                this.frameY * this.baseHeight, 
                this.baseWidth,
                this.baseHeight, 
                this.x, 
                this.y - (200 * this.game.scaleY), 
                this.width * this.scaling, 
                this.height * 15
            )
            if (!this.markedForDeletion) {
                this.attackHitBox = {
                    x: this.x + (this.offSetX2 * this.game.scaleX),
                    y: this.y + (this.offSetY2 * this.game.scaleY), 
                    width: this.game.width, 
                    height: this.height + (this.offSetHeight2 * this.game.scaleY)
                }
                
            }
            // context.strokeRect(
            //     this.x + (this.offSetX2 * this.game.scaleX),
            //     this.y + (this.offSetY2 * this.game.scaleY), 
            //     this.game.width, 
            //     this.height + (this.offSetHeight2 * this.game.scaleY)
            // )
        }
    }

    update(hitpoint) { // similar logic with projectiles
        this.hitpoint = hitpoint;
        if (this.hitpoint < 15) {
            this.damage = 1.75
        }
        this.width = this.baseWidth * this.game.scaleX;
        this.height = this.baseHeight * this.game.scaleY;
        this.frameY < this.maxFrames ? this.frameY++ : this.frameY = 10

        // laser collision logic
        if (!this.markedForDeletion) {
            this.validHits--; 
            if (this.game.checkCollision(this.attackHitBox, this.player.hitBox) && this.validHits > 0) {
                this.player.hitpoint -= this.damage; // basically just hit player multiple times
            } else if (this.validHits <= 0) {
                this.markedForDeletion = true;
            }
        }
    }
}

class Wave {
    constructor(game) {
        this.game = game;
        this.background = this.game.layer1
        this.player = this.game.player;
        this.traceHitBox = false; // flag to start traceHitBox, else program crashes because it cannot find enemy hitbox

        this.enemies = []; // array to push enemies into

        this.wave = 3; // count current wave number
        this.nextWaveTrigger = false; // trigger next wave
        this.bossWave = false; // trigger boss
        this.mapClear = false; // trigger map clear, not used.
        this.setMapFlag = true; // set map flag
        this.mapNumber = 0; 
    }
    render(context) {
        if (this.background.end % 2 === 0 && !this.traceHitBox) { // trigger new wave at odd background.end intervals.
            this.traceHitBox = true;
            if (this.wave % 3 === 0 && this.wave > 0) { // trigger boss every 3 waves
                this.bossWave = true;
            }
            if (this.player.potions < this.player.maxPotions) { // every wave, add 1 potion
                this.player.potions++;
            }
            
            this.wave++; // increase wave number
            this.create(); // create new wave
        };
        if (this.mapClear && this.background.end === 0) { // create new map, not used now.
            this.wave = 0; 
            if (this.setMapFlag) {
                this.mapNumber++;
                this.game.setMapNumber(this.mapNumber);
                this.setMapFlag = false;
            }
        } else {
            this.setMapFlag = true; // reset flag when new map has been created, not used now.
        }

        // if no enemies, set tracehitbox to false to avoid errors when checking collision in player
        if (this.enemies.length < 1) {
            this.traceHitBox = false;
        }

        // in the array, create all the enemies
        this.enemies.forEach(enemy => {
            enemy.draw(context);
            enemy.update(context);
        })

        // remove enemies with markedfordeletion true
        this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion)
    }

    // function to add new enemies, set randomiser
    create() {
        let enemy; // initialise variable to store enemy
        for (let x = 0; x < this.wave; x++) {
            if (!this.bossWave) { // spawn regular mobs if not boss wave
                if (Math.floor(Math.random() * 2 < 1)) {
                    enemy = new Nightborne(this.game);
                } else {
                    enemy = new Skeleton(this.game);
                }
                // randomly set the x position and speed of enemy after the first to make it 'interesting'   
                enemy.x += (x * (enemy.width + (Math.random() * 100 + 100)) * this.game.scaleX);
                enemy.speed = Math.random() * 4 + 5;
            } else { // if boss wave, spawn boss
                enemy = new Boss_Golem(this.game);
                x = this.wave + 1; // break this loop.
            }    
            this.enemies.push(enemy); // add new enemy
        } 
    }
}

// controls how the game works, renders stuff.
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.player = new Player(this); // create new player
        this.setMapNumber(0); // set map number to 0 first to create first set of background, not used now.

        this.wave = new Wave(this); // create a new wave object once.

        this.keys = []; // store keys during keydown
        this.mouse1 = false; // track leftmouseclick.

        this.spriteUpdate = false; // if after deltaTime + spriteTimer > spriteInterval, play the next frame.
        this.spriteTimer = 0;
        this.spriteInterval = 100; // delay the animation loop

        this.gameOverFlag = false; // game over
        this.victoryFlag = false; // victory

        // Keyboard listener
        window.addEventListener('keydown', (e) => {
            e.preventDefault();

            // Keep track of keys pressed
            if (this.keys.indexOf(e.code) === -1 && !this.player.cannotMove) {this.keys.push(e.code)}; 

            // Handle dash with left alt
            if (e.code === 'AltLeft' && !this.dashed) {this.player.canDash()};

            // Handle jump with space
            if (e.code === 'Space' && !this.player.jump && !this.player.fall) {this.player.jump = true};
        });

        window.addEventListener('keyup', (e) => {
            // Delete keys when let go
            const index = this.keys.indexOf(e.code);
            if (index > -1) {
                this.keys.splice(index, 1);
            }

            // Only reset if not jumping or falling
            if (!this.player.jump && !this.player.fall && !this.player.attacking) {
                this.player.reset();
            }
        });

        canvas.addEventListener('click', (e) => {
            // Attack is only triggered when cooldown expires
            if (this.player.canAttack()) {
                this.player.attacking = true;
                new sfx('../../asset/audio/hero_slash.mp3', 0.5, 1);
                // trigger up attack
                if (this.keys.indexOf('KeyW') > -1) {
                    this.player.upAttack = true;
                }
                // trigger down attack
                else if (this.keys.indexOf('KeyS') > -1) {
                    this.player.downAttack = true;
                }
            }
        });

        // Handle heal with right click
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.player.canHeal() && this.player.potions > 0) {
                new sfx('../../asset/audio/hero_heal.mp3', 2.5, 1.2);
                this.player.heal = true;
                this.player.healFrameCount = 0;
            }
        });
    }

    LayerSwitch() { // WILL NOT USE ANYMORE DUE TO LACK OF TIME, ONLY CASE 0 WILL BE USED BUT MAY BE UPDATED IN FUTURE
        switch (this.mapNumber) {
            case 0: 
                this.layer1 = new Background(this, document.getElementById('topLayer1'), 1.0, 384 * 7, 162 * 8);
                this.layer2 = new Background(this, document.getElementById('light1'), 0.8, 384 * 7, 162 * 8);
                this.layer3 = new Background(this, document.getElementById('middleLayer1'), 0.6, 384 * 7, 162 * 8);
                this.layer4 = new Background(this, document.getElementById('bottomLayer1'), 0.4, 384 * 7, 162 * 8);
                this.layer5 = new Background(this, document.getElementById('sky1'), 0.2, 384 * 7, 162 * 8);
                this.layer6 = new Background(this, document.getElementById('sky1'), 0.2, 384 * 7, 162 * 8);
                break;
            case 1: 
                this.layer1 = new Background(this, document.getElementById('topLayer2'), 1.0, 620 * 3, 360 * 3);
                this.layer2 = new Background(this, document.getElementById('fog2'), 0.8, 620 * 3, 360 * 3);
                this.layer3 = new Background(this, document.getElementById('middleLayer2'), 0.6, 620 * 3, 360 * 3);
                this.layer4 = new Background(this, document.getElementById('light2'), 0.4, 620 * 3, 360 * 3);
                this.layer5 = new Background(this, document.getElementById('tree2'), 0.2, 620 * 3, 360 * 3);
                this.layer6 = new Background(this, document.getElementById('bottomLayer2'), 0.1, 620 * 3, 360 * 3);
                break;
        }
        this.layers = [this.layer6, this.layer5, this.layer4, this.layer3, this.layer2, this.layer1];
    }

    setMapNumber(newMapNumber) { // virtually useless because 1 map is used, but keep it here for future updates
        this.mapNumber = newMapNumber;
        this.LayerSwitch();
    }

    render(context, deltaTime) {

        // stagger frames logic
        if (this.spriteTimer > this.spriteInterval) {
            this.spriteUpdate = true; // create the new frame
            this.spriteTimer = 0; // reset spriteTimer
        } else {
            this.spriteUpdate = false; // do not create the new frame
            this.spriteTimer += deltaTime; // add deltaTime over multiple iterations, delaying the animation loop.
        }

        // background logic
        this.layers.forEach(object => {
            object.draw(context); // draw them
            if (!this.wave.bossWave) { // only run update when not boss wave to make it stay still.
                object.update();
            }
        });

        // run wave rendering logic to track waves and enemies
        this.wave.render(context);

        // draw and update the player continuously.
        this.player.draw(context);
        this.player.update();

        // draw the miscellaneous images.
        this.drawStatusText(context);

        // not sure why I put it here, but oh well
        if (this.player.hitpoint <= 0) {
            this.player.dead = true;
        }

        // trigger gameover after player death animation finishes
        if (this.gameOverFlag) {
            this.gameOver(context);
        }
        // trigger victory after golem death animation finishes
        if (this.victoryFlag) {
            this.victory(context);
        }
    }

    drawStatusText(context) {
        // insert misc. images
        this.images = [
            {
                name: "bar",
                image: document.getElementById('bar'),
                x: 70,
                y: 30,
                width: 86 * 4,
                height: 18 * 4
            },
            {
                name: "healthbar",
                image: document.getElementById('healthbar'),
                x: 70,
                y: 30,
                width: Math.max(this.player.hitpoint * 3.2, 0), // make sure health doesn't go to less than 0
                height: 18 * 4
            },
            {
                name: "heart",
                image: document.getElementById('heart'),
                x: 15,
                y: 15,
                width: 86 * 4,
                height: 18 * 4
            },
        ];
        // change the number of potions displayed accordingly
        for (let x = 0; x < this.player.potions; x++) {
            this.images.push({
                name: "heal",
                image: document.getElementById('heals'),
                x: 20 + (280 / 5) * x,
                y: 100,
                width: 280 / 5,
                height: 360 / 5
            });
        }

        this.images.forEach(index => {
            context.drawImage(
                index.image,
                index.x * this.scaleX,
                index.y * this.scaleY,
                index.width * this.scaleX,
                index.height * this.scaleY
            );
        });
    }

    // collision detection between 2 rectangles
    checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }

    // function to reset keys
    resetKeys() {
        this.keys = [];
        this.player.reset();
    }

    gameOver(context) {
        context.drawImage(
            document.getElementById('gameover'),
            0,
            -30 * this.scaleY, 
            1920 * this.scaleX, 
            1200 * this.scaleY
        );
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyR' && this.gameOver) { // refresh the game
                window.location.reload(true);
            }
            if (e.code === 'Escape' && this.gameOver) { // go back to home page
                window.location.href='http://localhost:3000';
            }
        })
    }
    victory(context) {
        context.drawImage(
            document.getElementById('victory'),
            0,
            -30 * this.scaleY, 
            1920 * this.scaleX, 
            1200 * this.scaleY
        );
        setTimeout(() => {
            window.location.href = 'http://localhost:3000'; // redirect to home after 1 sec, plus delay from spriteInterval.
        }, 1000);
    }
}
