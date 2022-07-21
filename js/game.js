/////////////////////////////
/// Canvas
/////////////////////////////
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth
canvas.height = innerHeight

/////////////////////////////
/// Global Variable
/////////////////////////////
const scoreNode = document.getElementById('score');
const modal = document.getElementById('modal');
const startBtn = document.getElementById('btn');

let scoreId;
let everyFrameId;
let spawnEnemyIntervalId;
let projectileTimeoutId;

const game = {
    score: 0,
    isEndGame: true,
    // 
    player: { x: innerWidth / 2, y: innerHeight / 2, size: 10, color: 'white' },
    // 
    projectile: { radius: 5, color: 'white', speed: 5 },
    projectiles: [],
    // 
    enemy: { speed: 1, delay: 1000, color: `hsl(${Math.random() * 360},50%, 50%)` },
    enemies: [],
    // 
    particle: { radius: 2, length: 10 },
    particles: [],
    // 
    audio: {
        paticleGun: new Audio('audio/gun.wav'),
        enemyExplosion: new Audio('audio/explosion.wav'),
    },
    // 
    image: {
        background: new Image()
    }
};

/////////////////////////////
/// Initial func
/////////////////////////////
function init() {
    game.audio.paticleGun.volume = 0.5;
    game.audio.enemyExplosion.volume = 1;

    game.image.background.src = 'image/galaxy.jpeg';

    game.player = { x: innerWidth / 2, y: innerHeight / 2, size: 10, color: 'white' };

    game.projectile = { radius: 5, color: 'white', speed: 5 };
    game.projectiles = [];

    game.enemy = { speed: 1, delay: 1000 };
    game.enemies = [];

    game.particle = { radius: 2, length: 10 };
    game.particles = [];

    game.score = 0;
    game.isEndGame = false;

    scoreId = undefined;
    everyFrameId = undefined;
    spawnEnemyIntervalId = undefined;
    projectileTimeoutId = undefined;
}

/////////////////////////////
/// Every frame
/////////////////////////////
function everyFrame() {
    everyFrameId = requestAnimationFrame(everyFrame)

    // ctx.drawImage(game.image.background, 0, 0, innerWidth, innerHeight);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    new Player(game.player.x, game.player.y, game.player.size, game.player.color).draw();

    game.particles.forEach((particle, idx) => {
        if (particle.alpha <= 0) game.particles.splice(idx, 1);
        else particle.update();
    });

    game.projectiles.forEach((projectile, index) => {
        projectile.update()

        // remove projectile if end game
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > innerWidth ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > innerHeight
        ) projectileTimeoutId = setTimeout(() => game.projectiles.splice(index, 1), 0);
    });

    game.enemies.forEach((enemy, ei) => {
        enemy.update();

        // collision player and enemy
        const distance = Math.hypot(game.player.x - enemy.x, game.player.y - enemy.y);
        if (distance - enemy.radius - game.player.size < 1) {
            // set best score 


            clearTimeout(scoreId);
            clearTimeout(projectileTimeoutId);
            clearInterval(spawnEnemyIntervalId);
            cancelAnimationFrame(everyFrameId);

            if (localStorage.getItem("best") < game.score) {
                localStorage.setItem("best", game.score);
            }

            modal.style.display = 'flex';
            scoreNode.innerText = game.score;
            game.isEndGame = true;
        }

        // when collision projectile and enemy
        game.projectiles.forEach((projectile, pi) => {
            const distance = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if (distance - enemy.radius - projectile.radius < 1) {

                // particles explode
                for (let i = 1; i < enemy.radius + game.particle.length; i++) {
                    game.particles.push(
                        new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color,
                            { x: (Math.random() - 0.5) * (Math.random() * 5), y: (Math.random() - 0.5) * (Math.random() * 5) }
                        )
                    );
                }

                // score
                game.score++;

                // enemy shrink or gone
                if (enemy.radius - game.player.size > game.player.size) {
                    gsap.to(enemy, { radius: enemy.radius - game.player.size })
                    gsap.to(enemy, { color: `hsl(${Math.random() * 360},50%, 50%)` })
                    projectileTimeoutId = setTimeout(() => game.projectiles.splice(pi, 1), 0)
                } else {
                    projectileTimeoutId = setTimeout(() => {
                        game.enemies.splice(ei, 1);
                        game.projectiles.splice(pi, 1);
                    }, 0);
                }

                // sound explode
                playAudio(game.audio.enemyExplosion);
            }
        });
    });

    scoreId = setTimeout(() => {
        ctx.font = "30px Comic Sans MS";

        ctx.fillStyle = "aqua";
        ctx.fillText("Score: " + game.score, 50, 50);

        ctx.fillStyle = "gold";
        ctx.fillText("Best: " + localStorage.getItem("best"), 50, 100);
    }, 0);
}

/////////////////////////////
/// Spawn Enemy
/////////////////////////////
function spawnEnemy() {
    spawnEnemyIntervalId = setInterval(() => {
        const min = game.projectile.radius + 1;
        const radius = Math.random() * (50 - min) + min;
        let x, y;

        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - radius : innerWidth + radius;
            y = Math.random() * innerHeight;
        } else {
            x = Math.random() * innerWidth;
            y = Math.random() < 0.5 ? 0 - radius : innerHeight + radius;
        }

        const angle = Math.atan2(innerHeight / 2 - y, innerWidth / 2 - x);
        const color = `hsl(${Math.random() * 360},50%, 50%)`;

        game.enemies.push(new Enemy(x, y, radius, color, { x: Math.cos(angle) * game.enemy.speed, y: Math.sin(angle) * game.enemy.speed }));
    }, game.enemy.delay);
}

/////////////////////////////
/// Play Audio
/////////////////////////////
function playAudio(audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.play();
}

// 
function playerBoom() {
    // clear prev shoot
    game.projectiles.splice(0, game.projectiles.length);

    if (!game.isEndGame) playAudio(game.audio.paticleGun);

    for (let i = 1; i <= 30; i++) {
        const radian = (Math.PI * 2) / 30;
        game.projectiles.push(
            new Projectile(innerWidth / 2, innerHeight / 2, game.projectile.radius, game.projectile.color,
                { x: Math.cos(radian * i) * 10, y: Math.sin(radian * i) * 10 },
            )
        );
    }
}

/////////////////////////////
/// HTML Events
/////////////////////////////
addEventListener('click', (e) => {
    if (!game.isEndGame) {
        playAudio(game.audio.paticleGun);
    }

    const angle = Math.atan2(e.clientY - innerHeight / 2, e.clientX - innerWidth / 2);
    game.projectiles.push(new Projectile(innerWidth / 2, innerHeight / 2, game.projectile.radius, game.projectile.color, { x: Math.cos(angle) * game.projectile.speed, y: Math.sin(angle) * game.projectile.speed }));
});

startBtn.addEventListener('click', (e) => {
    init();

    everyFrame();

    spawnEnemy();

    modal.style.display = 'none';
});

addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        playerBoom();
    }
});