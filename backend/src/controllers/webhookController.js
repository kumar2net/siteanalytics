const webhookService = require('../services/webhookService');
const analyticsService = require('../services/analyticsService');

class WebhookController {
  // Handle analytics webhook
  async handleAnalyticsWebhook(req, res) {
    try {
      const { event_type, data, source } = req.body;
      
      // Log the webhook
      console.log(`[Webhook] Received ${event_type} from ${source}`);
      
      // Process different event types
      switch (event_type) {
        case 'page_view':
          await analyticsService.trackPageVisit(data);
          break;
        case 'event':
          await analyticsService.trackPageVisit({
            ...data,
            event_name: data.event_name,
            event_data: data.event_data
          });
          break;
        case 'session_start':
          await analyticsService.trackPageVisit({
            ...data,
            event_name: 'session_start',
            event_data: { session_type: 'new' }
          });
          break;
        default:
          console.warn(`[Webhook] Unknown event type: ${event_type}`);
      }
      
      // Notify registered webhooks
      await webhookService.notifySubscribers(event_type, data, source);
      
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        event_type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in handleAnalyticsWebhook:', error);
      res.status(500).json({
        error: {
          message: 'Failed to process webhook',
          details: error.message
        }
      });
    }
  }

  // Handle notification webhook
  async handleNotificationWebhook(req, res) {
    try {
      const { notification_type, message, data } = req.body;
      
      console.log(`[Notification] ${notification_type}: ${message}`);
      
      // Process notifications
      await webhookService.processNotification(notification_type, message, data);
      
      res.status(200).json({
        success: true,
        message: 'Notification processed successfully'
      });
    } catch (error) {
      console.error('Error in handleNotificationWebhook:', error);
      res.status(500).json({
        error: {
          message: 'Failed to process notification',
          details: error.message
        }
      });
    }
  }

  // Health check for webhooks
  async healthCheck(req, res) {
    try {
      const status = await webhookService.getHealthStatus();
      
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        details: status
      });
    } catch (error) {
      console.error('Error in webhook health check:', error);
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        error: error.message
      });
    }
  }

  // Register a new webhook
  async registerWebhook(req, res) {
    try {
      const { url, events, secret, description } = req.body;
      
      if (!url || !events) {
        return res.status(400).json({
          error: {
            message: 'url and events are required'
          }
        });
      }
      
      const webhook = await webhookService.registerWebhook({
        url,
        events: Array.isArray(events) ? events : [events],
        secret,
        description
      });
      
      res.status(201).json({
        success: true,
        data: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          status: 'active'
        }
      });
    } catch (error) {
      console.error('Error in registerWebhook:', error);
      res.status(500).json({
        error: {
          message: 'Failed to register webhook',
          details: error.message
        }
      });
    }
  }

  // List all registered webhooks
  async listWebhooks(req, res) {
    try {
      const webhooks = await webhookService.listWebhooks();
      
      res.json({
        success: true,
        data: {
          webhooks,
          count: webhooks.length
        }
      });
    } catch (error) {
      console.error('Error in listWebhooks:', error);
      res.status(500).json({
        error: {
          message: 'Failed to list webhooks',
          details: error.message
        }
      });
    }
  }

  // Unregister a webhook
  async unregisterWebhook(req, res) {
    try {
      const { id } = req.params;
      
      await webhookService.unregisterWebhook(id);
      
      res.json({
        success: true,
        message: 'Webhook unregistered successfully'
      });
    } catch (error) {
      console.error('Error in unregisterWebhook:', error);
      res.status(500).json({
        error: {
          message: 'Failed to unregister webhook',
          details: error.message
        }
      });
    }
  }
}

module.exports = new WebhookController(); 