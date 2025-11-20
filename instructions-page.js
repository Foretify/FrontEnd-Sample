// Instructions Page Module
class InstructionsPage {
    constructor() {
        this.pageId = 'instructions';
    }

    async init() {
        await this.loadInstructions();
    }

    async loadInstructions() {
        try {
            const response = await fetch('instructions.txt');
            const text = await response.text();
            this.parseAndDisplayInstructions(text);
        } catch (error) {
            console.error('Error loading instructions:', error);
            document.getElementById('instructionsContent').innerHTML = 
                '<p style="color: red;">Failed to load instructions.</p>';
        }
    }

    parseAndDisplayInstructions(text) {
        const sections = text.split(/SECTION_\w+/).filter(s => s.trim());
        const sectionTitles = text.match(/SECTION_\w+/g) || [];
        
        let html = '';
        
        sections.forEach((content, index) => {
            const lines = content.trim().split('\n');
            const title = lines[0].trim();
            const body = lines.slice(1).join('\n').trim();
            
            html += `
                <div class="instruction-section">
                    <h2>${title}</h2>
                    <div class="section-content">
                        ${this.formatInstructionContent(body)}
                    </div>
                </div>
            `;
        });
        
        document.getElementById('instructionsContent').innerHTML = html;
    }

    formatInstructionContent(content) {
        // Convert plain text to formatted HTML
        const paragraphs = content.split('\n\n');
        return paragraphs.map(para => {
            const lines = para.split('\n');
            if (lines.length > 1 && lines[0].trim().endsWith(':')) {
                // Format as a list section with header
                return `<p><strong>${lines[0]}</strong></p><p>${lines.slice(1).join('<br>')}</p>`;
            } else {
                return `<p>${para.replace(/\n/g, '<br>')}</p>`;
            }
        }).join('');
    }

    onPageShow() {
        // Called when page becomes active
    }

    onPageHide() {
        // Called when page becomes inactive
    }
}
