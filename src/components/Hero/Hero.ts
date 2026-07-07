import './Hero.css';

export function Hero(container: HTMLElement): void {
    container.innerHTML = `
        <section class="hero">
            <div class="hero-container">
                <h1 class="hero-title">Real-time Collaborative Block Editor</h1>
                <p class="hero-subtitle">
                    Edit documents simultaneously with multiple users using Syncfusion Block Editor and Yjs-powered real-time sync.
                </p>
            </div>
        </section>
    `;
}
