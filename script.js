const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
const scoreEl = document.querySelector('#scoreEl');

// canvas dimensions
canvas.width = 1024;
canvas.height = 576;

/* -------------------------------------------------------------------------- */
/* ---------------------------- class definitions --------------------------- */
/* -------------------------------------------------------------------------- */

class Player {
    constructor() {
        this.velocity = { 
            x: 0, 
            y: 0 
        };
        // Account for rotation
        this.rotation = 0;

        //player opacity
        this.opacity = 1;

        const image = new Image();
        image.src = 'img/spaceship.png';
        image.onload = () => {
            const scale = 0.15;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.position = { 
                x: canvas.width / 2 - this.width / 2,
                y: canvas.height - this.height - 20 
            };
        }
    }

    draw() {
        // c.fillStyle = 'red';
        // c.fillRect(this.position.x, this.position.y, this.width, this.height);

        // Account for rotation
        c.save();
        c.globalAlpha = this.opacity;
        c.translate(
            player.position.x + player.width / 2, 
            player.position.y + player.height / 2
        ); 
        c.rotate(this.rotation);
        c.translate(
            -player.position.x - player.width / 2, 
            -player.position.y - player.height / 2
        );
        // End of rotation code

        c.drawImage(
            this.image, 
            this.position.x, 
            this.position.y, 
            this.width, 
            this.height
        );
        // necessary for rotation
        c.restore();
    }

    //update method
    update() {
        if (this.image) {
            this.draw();
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
        }
    }
}

class Projectile {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = 4;
    }
    draw() {
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = 'red';
        c.fill();
        c.closePath();
    }
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Particle {
    constructor({position, velocity, radius, color, fades}) {
        this.position = position;
        this.velocity = velocity;
        this.radius = radius;
        this.color = color;
        this.opacity = 1;
        this.fades = fades;
    }
    draw() {
        c.save();
        c.globalAlpha = this.opacity;
        c.beginPath()
        c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.closePath();
        c.restore()
    }
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.fades) {
            this.opacity -= 0.01;
        }
        
    }
}

class InvaderProjectile {
    constructor({position, velocity}) {
        this.position = position;
        this.velocity = velocity;
        this.width = 8;
        this.height = 12;
    }
    draw() {
        c.fillStyle = 'white'
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
    update() {
        this.draw();
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
    }
}

class Invader {
    constructor({position}) {
        this.velocity = { 
            x: 0, 
            y: 0 
        };
        
        const image = new Image();
        image.src = 'img/invader.png';
        image.onload = () => {
            const scale = 1;
            this.image = image;
            this.width = image.width * scale;
            this.height = image.height * scale;
            this.position = { 
                x: position.x,
                y: position.y  
            };
        }
    }

    // draw method
    draw() {
        c.drawImage(
            this.image, 
            this.position.x, 
            this.position.y, 
            this.width, 
            this.height
        );
    }

    //update method
    update({velocity}) {
        if (this.image) {
            this.draw();
            this.position.x += velocity.x;
            this.position.y += velocity.y;
        }
    }
    // Invaders shoot method
    shoot(invaderprojectiles) {
        invaderprojectiles.push(
            new InvaderProjectile({
                position : {
                    x: this.position.x + this.width / 2 ,
                    y: this.position.y + this.height 
                }, 
                velocity: {
                    x: 0,
                    y: 5
                }
            })
        );
    }
}

class Grid {
    constructor() {
        this.position = {
            x:0, 
            y:0
        } 
        
        this.velocity = {
            x: 3,
            y: 0
        }

        // Populating the grid of invaaders
        this.invaders = [];
        const rows = 2 + Math.floor(Math.random() * 5);
        const columns = 5 + Math.floor(Math.random() * 5);
        // il 30 deriva dal fatto che so che l'immagine dell'invader è 30 x 30
        this.width = columns * 30;
        for (let x = 0; x < columns; x++) {
            for (let y = 0; y < rows; y++) {
                this.invaders.push(
                    new Invader({ 
                        position: {
                            x: x * 30,
                            y: y * 30
                        }
                    })
                )
            }
        }
        //console.log(this.invaders)
    }
    update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.y = 0;

        if ((this.position.x + this.width >= canvas.width) || (this.position.x <= 0)) {
            this.velocity.x = - this.velocity.x
            this.velocity.y = 30;
        } 
    };
}
/* -------------------------------------------------------------------------- */
/* ------------------------------ actual script ----------------------------- */
/* -------------------------------------------------------------------------- */

//Instantiate a player object
const player = new Player();
const projectiles = [];
const grids = [];
const invaderProjectiles = [];
const particles = [];


// Monitoring keys pressed
const keys = {
    a: {
        pressed : false
    }, 
    d: {
        pressed : false
    },
    w: {
        pressed : false
    },
    s: {
        pressed : false
    },
    space: {
        pressed : false
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------- animation ------------------------------- */
/* -------------------------------------------------------------------------- */
let frames = 0;
let randomInterval = Math.floor(Math.random() * 500) + 1000;
let score = 0;
let  game = {
    over: false,
    active: true
}

// star background
for (let i = 0; i < 100; i++) {    
    particles.push(new Particle({ 
        position: {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        },

        velocity: {
            x: 0,
            y: 0.4
        },

        radius: Math.random() * 2,
        color: "yellow",
        fades: 0
        })
    )
}

// create particles
function createParticles({object, color, fades}) {
    for (let i = 0; i < 15; i++) {    
        particles.push(new Particle({ 
            position: {
                x: object.position.x + object.width / 2,
                y: object.position.y + object.height / 2
            },
            velocity: {
                x: (Math.random() - 0.5) * 5,
                y: (Math.random() - 0.5) * 5
            },
            radius: Math.random() * 3,
            color: color || '#BAA0DE',
            fades: fades
            })
        )
    }
}
// animation
function animate() {
    if (!game.active) return
    requestAnimationFrame(animate);
    c.fillStyle = 'black';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.update();

    // reset the stars background position
    particles.forEach( (particle, particleIndex) => {
        if (particle.position.y - particle.radius >= canvas.height){
            particle.position.x = Math.random() * canvas.width;
            particle.position.y = -particle.radius
        }
        if (particle.opacity <= 0) {
            setTimeout(() => {
                particles.splice(particleIndex, 1);
            }, 0)
        } else {
            particle.update();
        }
    })

    // animate the invaders projectiles 
    invaderProjectiles.forEach((invaderProjectile, invaderProjIndex) => {
        if (invaderProjectile.position.y + invaderProjectile.height >= canvas.height) {
            setTimeout(() => {
                invaderProjectiles.splice(invaderProjIndex, 1)
            }, 0)
        } else {
            invaderProjectile.update();
        }
        if ((invaderProjectile.position.y + invaderProjectile.height >= player.position.y) && 
            (invaderProjectile.position.x + invaderProjectile.width >= player.position.x) &&
            (invaderProjectile.position.x <= player.position.x + player.width) &&
            (invaderProjectile.position.y + invaderProjectile.height <= player.position.y + player.height)) {
                setTimeout(() => {
                    invaderProjectiles.splice(invaderProjIndex, 1)
                    player.opacity = 0;
                    game.over = true
                }, 0)

                // stop the game if player is hitted
                setTimeout(() => {
                    game.active = false;
                }, 2000)
            
                // create the explosion of the player
                createParticles({
                    object: player,
                    color: 'white',
                    fades: 1
                });
                console.log('You lose');
            }
    })

    // manage projectile depletion 
    projectiles.forEach((projectile, index) => {
        if (projectile.position.y + projectile.radius <= 0){
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        } else {
            projectile.update()
        }
    })

    // manage grid of enemies
    grids.forEach((grid, gridIndex) => {
        grid.update();

         // spawning projectiles. Temporization of enemies fire
        if (frames % 100 === 0 && grid.invaders.length > 0) {
            grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(invaderProjectiles);
        }

        // Collision detection
        grid.invaders.forEach((invader, invaderIndex) => {
            invader.update({velocity: grid.velocity});

            // projectailes hit enemyies
            projectiles.forEach((projectile, projectileIndex) => {
                if ((projectile.position.y - projectile.radius <= invader.position.y + invader.height) && 
                    (projectile.position.x + projectile.radius >= invader.position.x) && 
                    (projectile.position.x - projectile.radius <= invader.position.x + invader.width) &&
                    (projectile.position.y + projectile.radius >= invader.position.y)) {
                    
                    // This functon avoids flickering of projectiles and invaders   
                    setTimeout(() => {
                        const invaderFound = grid.invaders.find((invader2) => invader2 === invader);
                        const projectileFound = projectiles.find((projectile2) => projectile2 === projectile);
                        // remove invader and projectile
                        if ((invaderFound && projectileFound)) {
                            //score managing
                            score += 100
                            scoreEl.innerHTML = score;

                            // Explosion simulation
                            createParticles({
                                object: invader,
                                fades: 1
                            });
                            grid.invaders.splice(invaderIndex, 1);
                            projectiles.splice(projectileIndex, 1);

                            if (grid.invaders.length > 0) {
                                const firstIvader = grid.invaders[0];
                                const lastIvader = grid.invaders[grid.invaders.length - 1];
                                grid.width = lastIvader.position.x - firstIvader.position.x + lastIvader.width;
                                grid.position.x = firstIvader.position.x 
                            } else {
                                grids.splice(gridIndex, 1);
                            }
                        } 
                    }, 0)
                }
            })
        })
    });

    // keyPressed and velocity
    if (keys.a.pressed && player.position.x >= 0) {
        player.velocity.x = -5;
        player.rotation = -0.15;
    } else if (keys.d.pressed && player.position.x + player.width <= canvas.width) {
        player.velocity.x = 5;
        player.rotation = 0.15;
    } else {
        player.velocity.x = 0;
        player.rotation = 0;
    }

    if (keys.w.pressed && player.position.y >= 0) {
        player.velocity.y = -3;
    } else if (keys.s.pressed && player.position.y + player.height <= canvas.height) {
        player.velocity.y = 3;
    } else {
        player.velocity.y = 0;
    }
    // spawning enemies, timing for new enemy wave
    if ((frames % randomInterval === 0) || (grids.length === 0)) {
        grids.push(new Grid());
        randomInterval = Math.floor(Math.random() * 500) + 400;
        frames = 0;
    }
    frames++;
}
animate()

// Event listener for keydown
window.addEventListener('keydown', ({key}) => {
    if (game.over) {
        return
    } else {

    
        switch(key) {
            case 'a':
                keys.a.pressed = true;
                break;
            case 'd':
                keys.d.pressed = true;
                break;
            case 'w':
                keys.w.pressed = true;
                break;
            case 's':
                keys.s.pressed = true;
                break;
            case ' ':
                keys.space.pressed = true;
                // Adding projectiles when hitting spacebar
                projectiles.push(new Projectile({
                    position: {
                        x: player.position.x + player.width / 2,
                        y: player.position.y
                    }, 
                    velocity: {
                        x: 0,
                        y: -7       // velocity of the projectile and direction
                    }
                }))
                //console.log(projectiles);
                break;
        }
    }
})
// Event listener for keyup
window.addEventListener('keyup', ({key}) => {
    switch(key) {
        case 'a':
            keys.a.pressed = false;
            break;
        case 'd':
            keys.d.pressed = false;
            break;
        case 'w':
            keys.w.pressed = false;
            break;
        case 's':
            keys.s.pressed = false;
            break;
        case ' ':
            keys.space.pressed = false;
            break;
    }
})

/* -------------------------------------------------------------------------- */
/* ----------------------------- Virtual Player ----------------------------- */
/* -------------------------------------------------------------------------- */

// // Timer
// let startTime = Date.now();

// let interval = setInterval(() => {
//     let elapsedTime = Date.now() - startTime;
//     console.log(elapsedTime / 1000);
// }, 1000);