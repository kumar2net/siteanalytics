const crypto = require('crypto');
const axios = require('axios');

class WebhookService {
  constructor() {
    this.webhooks = new Map();
    this.notificationQueue = [];
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  // Register a new webhook
  async registerWebhook(webhookData) {
    const id = crypto.randomUUID();
    const webhook = {
      id,
      url: webhookData.url,
      events: webhookData.events,
      secret: webhookData.secret,
      description: webhookData.description,
      status: 'active',
      created_at: new Date(),
      last_triggered: null,
      failure_count: 0
    };

    this.webhooks.set(id, webhook);
    
    // Test the webhook
    await this.testWebhook(webhook);
    
    return webhook;
  }

  // Unregister a webhook
  async unregisterWebhook(id) {
    if (!this.webhooks.has(id)) {
      throw new Error('Webhook not found');
    }
    
    this.webhooks.delete(id);
    return true;
  }

  // List all webhooks
  async listWebhooks() {
    return Array.from(this.webhooks.values());
  }

  // Test a webhook
  async testWebhook(webhook) {
    try {
      const testPayload = {
        event_type: 'test',
        data: {
          message: 'Webhook test successful',
          timestamp: new Date().toISOString()
        },
        source: 'analytics-system'
      };

      await this.sendWebhook(webhook, testPayload);
      
      // Update last triggered
      webhook.last_triggered = new Date();
      webhook.failure_count = 0;
      
      console.log(`[Webhook] Test successful for ${webhook.url}`);
    } catch (error) {
      console.error(`[Webhook] Test failed for ${webhook.url}:`, error.message);
      webhook.failure_count++;
    }
  }

  // Send webhook notification
  async sendWebhook(webhook, payload) {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'SiteAnalytics-Webhook/1.0'
    };

    // Add signature if secret is provided
    if (webhook.secret) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      headers['X-Webhook-Signature'] = signature;
    }

    const response = await axios.post(webhook.url, payload, {
      headers,
      timeout: 10000 // 10 second timeout
    });

    return response.data;
  }

  // Notify subscribers of an event
  async notifySubscribers(eventType, data, source) {
    const payload = {
      event_type: eventType,
      data,
      source,
      timestamp: new Date().toISOString()
    };

    const promises = [];

    for (const [id, webhook] of this.webhooks) {
      // Check if webhook is subscribed to this event type
      if (webhook.events.includes(eventType) || webhook.events.includes('*')) {
        promises.push(this.sendWebhookWithRetry(webhook, payload));
      }
    }

    // Send all webhooks concurrently
    await Promise.allSettled(promises);
  }

  // Send webhook with retry logic
  async sendWebhookWithRetry(webhook, payload, retryCount = 0) {
    try {
      await this.sendWebhook(webhook, payload);
      
      // Update success metrics
      webhook.last_triggered = new Date();
      webhook.failure_count = 0;
      
      console.log(`[Webhook] Successfully sent to ${webhook.url}`);
    } catch (error) {
      console.error(`[Webhook] Failed to send to ${webhook.url}:`, error.message);
      
      webhook.failure_count++;
      
      // Retry if we haven't exceeded max retries
      if (retryCount < this.maxRetries) {
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount))
        );
        return this.sendWebhookWithRetry(webhook, payload, retryCount + 1);
      } else {
        // Mark webhook as failed if too many failures
        if (webhook.failure_count >= 5) {
          webhook.status = 'failed';
          console.error(`[Webhook] Marked ${webhook.url} as failed due to repeated failures`);
        }
      }
    }
  }

  // Process notifications
  async processNotification(notificationType, message, data) {
    const notification = {
      type: notificationType,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    // Add to queue
    this.notificationQueue.push(notification);

    // Process based on notification type
    switch (notificationType) {
      case 'high_traffic':
        await this.handleHighTrafficNotification(notification);
        break;
      case 'error_rate':
        await this.handleErrorRateNotification(notification);
        break;
      case 'new_visitor':
        await this.handleNewVisitorNotification(notification);
        break;
      default:
        console.log(`[Notification] ${notificationType}: ${message}`);
    }

    // Keep queue size manageable
    if (this.notificationQueue.length > 100) {
      this.notificationQueue = this.notificationQueue.slice(-50);
    }
  }

  // Handle high traffic notification
  async handleHighTrafficNotification(notification) {
    console.log(`[High Traffic] ${notification.message}`);
    
    // Could send to Slack, email, etc.
    await this.notifySubscribers('high_traffic', notification.data, 'analytics-system');
  }

  // Handle error rate notification
  async handleErrorRateNotification(notification) {
    console.log(`[Error Rate] ${notification.message}`);
    
    await this.notifySubscribers('error_rate', notification.data, 'analytics-system');
  }

  // Handle new visitor notification
  async handleNewVisitorNotification(notification) {
    console.log(`[New Visitor] ${notification.message}`);
    
    await this.notifySubscribers('new_visitor', notification.data, 'analytics-system');
  }

  // Get health status
  async getHealthStatus() {
    const activeWebhooks = Array.from(this.webhooks.values()).filter(w => w.status === 'active');
    const failedWebhooks = Array.from(this.webhooks.values()).filter(w => w.status === 'failed');

    return {
      total_webhooks: this.webhooks.size,
      active_webhooks: activeWebhooks.length,
      failed_webhooks: failedWebhooks.length,
      notification_queue_size: this.notificationQueue.length,
      last_notification: this.notificationQueue[this.notificationQueue.length - 1] || null
    };
  }

  // Get webhook statistics
  async getWebhookStats() {
    const stats = {
      total: this.webhooks.size,
      by_status: {},
      by_event: {},
      recent_activity: []
    };

    for (const webhook of this.webhooks.values()) {
      // Count by status
      stats.by_status[webhook.status] = (stats.by_status[webhook.status] || 0) + 1;
      
      // Count by event types
      for (const event of webhook.events) {
        stats.by_event[event] = (stats.by_event[event] || 0) + 1;
      }
      
      // Recent activity
      if (webhook.last_triggered) {
        stats.recent_activity.push({
          id: webhook.id,
          url: webhook.url,
          last_triggered: webhook.last_triggered,
          failure_count: webhook.failure_count
        });
      }
    }

    // Sort recent activity by last triggered
    stats.recent_activity.sort((a, b) => new Date(b.last_triggered) - new Date(a.last_triggered));

    return stats;
  }
}

module.exports = new WebhookService(); 