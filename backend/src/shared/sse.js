class SSEManager {
  constructor() {
    this.adminClients = new Set();
    this.generalClients = new Set();
    this.customerClients = new Map(); // orderNumber -> Set of clients

    // Heartbeat ping ทุก 25 วินาที ป้องกัน Cloudflare / Nginx ตัดการเชื่อมต่อ (Idle Timeout)
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);
    if (this.heartbeatTimer.unref) {
      this.heartbeatTimer.unref();
    }
  }

  sendHeartbeat() {
    const pingPayload = ': ping\n\n';
    for (const res of this.adminClients) {
      try { res.write(pingPayload); } catch (_) {}
    }
    for (const res of this.generalClients) {
      try { res.write(pingPayload); } catch (_) {}
    }
    for (const clients of this.customerClients.values()) {
      for (const res of clients) {
        try { res.write(pingPayload); } catch (_) {}
      }
    }
  }

  addAdminClient(res) {
    this.adminClients.add(res);
    res.on('close', () => {
      this.adminClients.delete(res);
    });
  }

  addGeneralClient(res) {
    this.generalClients.add(res);
    res.on('close', () => {
      this.generalClients.delete(res);
    });
  }

  addCustomerClient(orderNumber, res) {
    if (!this.customerClients.has(orderNumber)) {
      this.customerClients.set(orderNumber, new Set());
    }
    this.customerClients.get(orderNumber).add(res);
    
    res.on('close', () => {
      const clients = this.customerClients.get(orderNumber);
      if (clients) {
        clients.delete(res);
        if (clients.size === 0) {
          this.customerClients.delete(orderNumber);
        }
      }
    });
  }

  emitToAdmin(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.adminClients) {
      res.write(payload);
    }
  }

  emitToCustomer(orderNumber, event, data) {
    const clients = this.customerClients.get(orderNumber);
    if (clients) {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      for (const res of clients) {
        res.write(payload);
      }
    }
  }

  broadcast(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.adminClients) {
      res.write(payload);
    }
    for (const res of this.generalClients) {
      res.write(payload);
    }
    for (const clients of this.customerClients.values()) {
      for (const res of clients) {
        res.write(payload);
      }
    }
  }
}

export const sseManager = new SSEManager();
