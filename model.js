class ChatModel extends Multisynq.Model {
  init() {
    this.views = new Map(); // viewId -> nickname
    this.history = [];
    this.subscribe(this.sessionId, "view-join", this.onJoin);
    this.subscribe(this.sessionId, "view-exit", this.onExit);
    this.subscribe("chat", "message", this.onMessage);
  }

  onJoin(viewId) {
    if (!this.views.has(viewId)) {
      const name = this.randomName();
      this.views.set(viewId, name);
    }
    this.publish("chat", "refreshUsers");
  }

  onExit(viewId) {
    this.views.delete(viewId);
    this.publish("chat", "refreshUsers");
  }

  onMessage(data) {
    this.history.push(data);
    if (this.history.length > 100) this.history.shift();
    this.publish("chat", "refreshMessages");
  }

  randomName() {
    const names = ["Astro", "Nova", "Comet", "Void", "Pixel", "Zen", "Luxe"];
    return names[Math.floor(this.random() * names.length)];
  }
}

ChatModel.register("ChatModel");
