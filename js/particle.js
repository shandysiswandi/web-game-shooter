class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill()
    }

    update() {
        this.draw();

        this.velocity.x *= 0.99
        this.velocity.y *= 0.99

        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;

        this.alpha -= 0.01;
    }
}
