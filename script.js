// ======================
// CHAT MODEL (Multisynq.Model)
// ======================
class ChatModel extends Multisynq.Model {
    init() {
        // User management
        this.views = new Map(); // viewId → username
        this.participants = 0;
        
        // Message history
        this.history = [];
        this.inactivity_timeout_ms = 20 * 60 * 1000; // 20 minutes
        this.lastPostTime = null;
        
        // System event subscriptions
        this.subscribe(this.sessionId, "view-join", this.viewJoin);
        this.subscribe(this.sessionId, "view-exit", this.viewExit);
        
        // User input event subscriptions
        this.subscribe("input", "newPost", this.newPost);
        this.subscribe("input", "setUsername", this.setUsername);
    }
    
    viewJoin(viewId) {
        // New user joins
        if (!this.views.has(viewId)) {
            this.views.set(viewId, `Guest${viewId.slice(0, 4)}`);
        }
        this.participants++;
        this.publish("viewInfo", "refresh");
    }
    
    viewExit(viewId) {
        // User leaves
        this.participants--;
        this.publish("viewInfo", "refresh");
    }
    
    setUsername(data) {
        // Set username for a view
        const { viewId, username } = data;
        if (username && username.trim() !== '') {
            this.views.set(viewId, username.trim());
            this.publish("viewInfo", "refresh");
            
            // Add system message
            this.addToHistory({
                viewId: 'system',
                html: `<i>${this.views.get(viewId)} joined the chat</i>`
            });
        }
    }
    
    newPost(data) {
        // New message posted
        const { viewId, text } = data;
        const username = this.views.get(viewId);
        
        if (username && text.trim() !== '') {
            const chatLine = `<b>${username}:</b> ${this.escape(text.trim())}`;
            this.addToHistory({ viewId, html: chatLine });
            this.lastPostTime = this.now();
        }
    }
    
    addToHistory(item) {
        // Add to history with size limit
        this.history.push(item);
        if (this.history.length > 100) this.history.shift();
        this.publish("history", "refresh");
    }
    
    escape(html) {
        // Basic HTML escaping
        return html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// ======================
// CHAT VIEW (Multisynq.View)
// ======================
class ChatView extends Multisynq.View {
    constructor(model) {
        super(model);
        this.model = model;
        
        // DOM elements
        this.sessionBadge = document.getElementById('sessionBadge');
        this.userCount = document.getElementById('userCount');
        this.chatHistory = document.getElementById('chatHistory');
        this.usernameInput = document.getElementById('usernameInput');
        this.setUsernameBtn = document.getElementById('setUsername');
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        
        // Set up UI event handlers
        this.setUsernameBtn.onclick = () => this.setUsername();
        this.sendButton.onclick = () => this.sendMessage();
        this.messageInput.onkeypress = (e) => {
            if (e.key === 'Enter') this.sendMessage();
        };
        
        // Subscribe to model updates
        this.subscribe("history", "refresh", this.refreshHistory);
        this.subscribe("viewInfo", "refresh", this.refreshViewInfo);
        
        // Initialize display
        this.refreshViewInfo();
        this.refreshHistory();
        
        // Update session badge
        this.updateSessionBadge();
    }
    
    setUsername() {
        const username = this.usernameInput.value;
        if (username.trim() !== '') {
            this.publish("input", "setUsername", {
                viewId: this.viewId,
                username
            });
            this.usernameInput.disabled = true;
            this.setUsernameBtn.disabled = true;
            this.messageInput.disabled = false;
            this.sendButton.disabled = false;
            this.messageInput.focus();
        }
    }
    
    sendMessage() {
        const text = this.messageInput.value;
        if (text.trim() !== '') {
            this.publish("input", "newPost", {
                viewId: this.viewId,
                text
            });
            this.messageInput.value = '';
        }
    }
    
    refreshViewInfo() {
        this.userCount.textContent = `${this.model.participants} user${this.model.participants !== 1 ? 's' : ''} online`;
    }
    
    refreshHistory() {
        this.chatHistory.innerHTML = this.model.history
            .map(item => `<div class="message">${item.html}</div>`)
            .join('');
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
    
    updateSessionBadge() {
        const sessionCode = this.sessionId.slice(0, 6).toUpperCase();
        const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C'];
        const color = colors[sessionCode.charCodeAt(0) % colors.length];
        
        this.sessionBadge.innerHTML = `
            <div style="background:${color};width:16px;height:16px;border-radius:50%;"></div>
            <div>Session: ${sessionCode}</div>
            <div class="qr-icon">QR</div>
        `;
    }
}

// ======================
// INITIALIZE MULTISYNQ
// ======================
document.addEventListener('DOMContentLoaded', () => {
    // Create root model
    const rootModel = new ChatModel();
    
    // Start Multisynq session
    const session = new Multisynq.Session({
        model: rootModel,
        autoJoin: true
    });
    
    // When session is ready, create view
    session.on('ready', () => {
        new ChatView(rootModel);
    });
});