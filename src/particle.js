function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 10 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        particlesContainer.appendChild(particle);
        
        animateParticle(particle);
    }
}

function animateParticle(particle) {
    const duration = Math.random() * 10 + 10;
    const keyframes = [
        { transform: `translate(0, 0)`, opacity: 0 },
        { transform: `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`, opacity: 0.8 },
        { transform: `translate(${Math.random() * 200 - 100}px, ${Math.random() * 200 - 100}px)`, opacity: 0 }
    ];
    
    particle.animate(keyframes, {
        duration: duration * 1000,
        iterations: Infinity,
        easing: 'ease-in-out'
    });
}

createParticles();