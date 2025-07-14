class ChatView extends Multisynq.View {
  constructor(model) {
    super(model);
    this.model = model;

    // UI Elements
    this.container = document.getElementById("chat");
    this.input = document.getElementById("msg-input");
    this.button = document.getElementById("send-btn");

    this.button.onclick = () => this.sendMessage();
    this.input.onkeypress = (e) => {
      if (e.key === "Enter") this.sendMessage();
    };

    // Subscriptions
    this.subscribe("chat", "refreshUsers", this.updateUserList);
    this.subscribe("chat", "refreshMessages", this.updateMessages);

    this.updateUserList();
    this.updateMessages();
  }

  sendMessage() {
    const text = this.input.value.trim();
    if (!text) return;
    this.input.value = "";
    this.publish("chat", "message", {
      text,
      time: new Date().toISOString(),
      viewId: this.viewId,
      name: this.model.views.get(this.viewId),
    });
  }

  updateUserList = () => {
    const list = document.getElementById("users");
    list.innerHTML = "";
    for (const [_, name] of this.model.views) {
      const li = document.createElement("li");
      li.textContent = name;
      list.appendChild(li);
    }
  };

  updateMessages = () => {
    const box = document.getElementById("messages");
    box.innerHTML = "";
    for (const msg of this.model.history) {
      const bubble = document.createElement("div");
      bubble.className = "bubble";
      bubble.innerHTML = `<strong>${msg.name}</strong>: ${msg.text}`;
      box.appendChild(bubble);
      bubble.classList.add("fade-in");
    }
    box.scrollTop = box.scrollHeight;
  };
}
